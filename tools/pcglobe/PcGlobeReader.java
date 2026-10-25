import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * PcGlobeReader - dependency-free reader for the PC Globe (1990) country
 * database files recovered in backlog round 43 (S4, PC Globe -> Java
 * experiment, stage 3).
 *
 * Usage: java PcGlobeReader <mediaDir> <outDir>
 *   mediaDir contains NAMES.DAT, COUNTRY1.DAT, COUNTRY2.DAT, DATABASE.DAT
 *   (hash-pinned under .xfer/pcglobe/); outDir receives countries.json and
 *   countries.txt.
 *
 * File layouts, as established by the round-43 static probes and verified
 * against every record (see docs/backlog-execution-round-44-2026-10-24.md):
 *
 * COUNTRY1.DAT / COUNTRY2.DAT / DATABASE.DAT
 *   A little-endian u32 offset table opens the file; entries increase
 *   monotonically and the last entry equals the file size (an end
 *   sentinel), so the table yields N-1 records. In COUNTRY1/2 each record
 *   is: [binary map/stat payload, not decoded] [u8 label-token count]
 *   [label tokens]. A label token either starts with a byte whose high bit
 *   is set - the byte is the token's first character OR 0x80 - or is a
 *   plain ASCII continuation token; tokens are NUL-terminated. A
 *   continuation token appends to the previous feature name with a space
 *   ("North" + "Albanian Alps"); a high-bit token starts a new feature.
 *   DATABASE.DAT records instead carry plain NUL-terminated ASCII labels
 *   (resource/product vocabulary) after their binary payload.
 *
 * NAMES.DAT
 *   A binary prefix (3,015 bytes, not decoded) precedes runs of
 *   NUL-terminated printable strings. The first run of 100+ strings is the
 *   216-entry country name list (current names with former/alternate
 *   names adjacent); later runs are the 1,268-entry place list and the
 *   146-entry currency list. The name list is reported verbatim; no
 *   name<->record mapping is asserted beyond record order, because the
 *   list is alphabetical by display name while records are ordered by
 *   canonical name (e.g. record 83 is North Korea, whose display name
 *   sorts under N). The 177 records (83 + 94) align with the name list
 *   order wherever no inversion intervenes - verified on a named sample.
 *
 * Anything not decoded is reported (byte counts), never guessed.
 */
public final class PcGlobeReader {

    private PcGlobeReader() {
    }

    private static final class LabelSection {
        int start; // offset of first token
        int countByteOffset; // offset of the u8 token count
        List<String> tokens;
        List<String> features;
    }

    private static final class Record {
        String file;
        int index;
        int offset;
        int length;
        int undecodedPayloadBytes; // record bytes before the decoded label section
        int labelTokenCount = -1;
        List<String> labels = new ArrayList<>(); // DATABASE plain labels
        List<String> features = new ArrayList<>(); // COUNTRY composed features
    }

    private static final class NameRun {
        int offset;
        List<String> strings = new ArrayList<>();
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            System.err.println("usage: PcGlobeReader <mediaDir> <outDir>");
            System.exit(2);
        }
        Path media = Path.of(args[0]);
        Path outDir = Path.of(args[1]);
        Files.createDirectories(outDir);

        byte[] namesDat = Files.readAllBytes(media.resolve("NAMES.DAT"));
        byte[] country1 = Files.readAllBytes(media.resolve("COUNTRY1.DAT"));
        byte[] country2 = Files.readAllBytes(media.resolve("COUNTRY2.DAT"));
        byte[] database = Files.readAllBytes(media.resolve("DATABASE.DAT"));

        List<NameRun> runs = findStringRuns(namesDat);
        NameRun countryNames = null;
        for (NameRun r : runs) {
            if (r.strings.size() >= 100) {
                countryNames = r;
                break;
            }
        }
        if (countryNames == null) {
            throw new IllegalStateException("NAMES.DAT: country name run not found");
        }

        List<Record> c1 = readCountryFile("COUNTRY1.DAT", country1);
        List<Record> c2 = readCountryFile("COUNTRY2.DAT", country2);
        List<Record> db = readDatabaseFile("DATABASE.DAT", database);

        List<Record> allCountries = new ArrayList<>(c1);
        allCountries.addAll(c2);

        String json = buildJson(namesDat, country1, country2, database,
                runs, countryNames, allCountries, db);
        String txt = buildTxt(namesDat, runs, countryNames, allCountries, db);
        Files.writeString(outDir.resolve("countries.json"), json, StandardCharsets.UTF_8);
        Files.writeString(outDir.resolve("countries.txt"), txt, StandardCharsets.UTF_8);

        System.out.printf(Locale.ROOT,
                "NAMES.DAT: %d string runs, country names=%d at 0x%x%n",
                runs.size(), countryNames.strings.size(), countryNames.offset);
        System.out.printf(Locale.ROOT, "COUNTRY records: %d + %d = %d%n",
                c1.size(), c2.size(), allCountries.size());
        System.out.printf(Locale.ROOT, "DATABASE records: %d%n", db.size());
    }

    // ------------------------------------------------------------------
    // Offset-table files (COUNTRY1/2, DATABASE)
    // ------------------------------------------------------------------

    private static List<Integer> readOffsetTable(byte[] d) {
        List<Integer> offs = new ArrayList<>();
        long prev = -1;
        for (int i = 0; i + 4 <= d.length; i += 4) {
            long v = u32le(d, i);
            if (v > d.length || v < prev) {
                break;
            }
            offs.add((int) v);
            prev = v;
        }
        if (offs.size() < 2 || offs.get(offs.size() - 1) != d.length) {
            throw new IllegalStateException("offset table does not end at file size");
        }
        return offs;
    }

    private static List<Record> readCountryFile(String file, byte[] d) {
        List<Integer> offs = readOffsetTable(d);
        List<Record> out = new ArrayList<>();
        for (int i = 0; i + 1 < offs.size(); i++) {
            int s = offs.get(i);
            int e = offs.get(i + 1);
            Record r = new Record();
            r.file = file;
            r.index = i;
            r.offset = s;
            r.length = e - s;
            LabelSection sec = findLabelSection(d, s, e);
            if (sec == null) {
                r.undecodedPayloadBytes = r.length;
            } else {
                r.undecodedPayloadBytes = sec.countByteOffset - s;
                r.labelTokenCount = sec.tokens.size();
                r.features = sec.features;
            }
            out.add(r);
        }
        return out;
    }

    private static List<Record> readDatabaseFile(String file, byte[] d) {
        List<Integer> offs = readOffsetTable(d);
        List<Record> out = new ArrayList<>();
        for (int i = 0; i + 1 < offs.size(); i++) {
            int s = offs.get(i);
            int e = offs.get(i + 1);
            Record r = new Record();
            r.file = file;
            r.index = i;
            r.offset = s;
            r.length = e - s;
            r.labels = printableLabels(d, s, e);
            // Binary payload size is not separable from the label area with
            // the evidence available; report the whole record as carrying
            // undecoded binary fields beside the extracted labels.
            r.undecodedPayloadBytes = r.length;
            out.add(r);
        }
        return out;
    }

    // ------------------------------------------------------------------
    // COUNTRY label sections: [u8 count][tokens..] ending at record end
    // ------------------------------------------------------------------

    private static LabelSection findLabelSection(byte[] d, int s, int e) {
        for (int p = s + 2; p < e; p++) {
            int b = d[p] & 0xff;
            if (b < 0x80 || !isLetter(b & 0x7f)) {
                continue;
            }
            int count = d[p - 1] & 0xff;
            if (count < 1 || count > 64) {
                continue;
            }
            List<String> tokens = parseTokens(d, p, e);
            if (tokens != null && tokens.size() == count) {
                LabelSection sec = new LabelSection();
                sec.start = p;
                sec.countByteOffset = p - 1;
                sec.tokens = tokens;
                sec.features = composeFeatures(d, p, e);
                return sec;
            }
        }
        return null;
    }

    /** Parses tokens from p; returns them iff they consume exactly to e. */
    private static List<String> parseTokens(byte[] d, int p, int e) {
        List<String> toks = new ArrayList<>();
        int i = p;
        while (i < e) {
            int b = d[i] & 0xff;
            if (b >= 0x80) {
                if (!isLetter(b & 0x7f)) {
                    return null;
                }
                int j = i + 1;
                while (j < e && d[j] >= 32 && d[j] < 127) {
                    j++;
                }
                if (j >= e || d[j] != 0) {
                    return null;
                }
                toks.add((char) (b & 0x7f) + new String(d, i + 1, j - i - 1, StandardCharsets.US_ASCII));
                i = j + 1;
            } else if (b >= 32 && b < 127) {
                int j = i;
                while (j < e && d[j] >= 32 && d[j] < 127) {
                    j++;
                }
                if (j >= e || d[j] != 0) {
                    return null;
                }
                toks.add(new String(d, i, j - i, StandardCharsets.US_ASCII));
                i = j + 1;
            } else {
                return null;
            }
        }
        return toks;
    }

    /** High-bit token = new feature; plain token = continuation (+space). */
    private static List<String> composeFeatures(byte[] d, int p, int e) {
        List<String> feats = new ArrayList<>();
        int i = p;
        while (i < e) {
            int b = d[i] & 0xff;
            if (b >= 0x80) {
                int j = i + 1;
                while (j < e && d[j] != 0) {
                    j++;
                }
                feats.add((char) (b & 0x7f) + new String(d, i + 1, j - i - 1, StandardCharsets.US_ASCII));
                i = j + 1;
            } else {
                int j = i;
                while (j < e && d[j] != 0) {
                    j++;
                }
                String cont = new String(d, i, j - i, StandardCharsets.US_ASCII);
                if (feats.isEmpty()) {
                    feats.add(cont);
                } else {
                    feats.set(feats.size() - 1, feats.get(feats.size() - 1) + " " + cont);
                }
                i = j + 1;
            }
        }
        return feats;
    }

    // ------------------------------------------------------------------
    // DATABASE plain labels and NAMES string runs
    // ------------------------------------------------------------------

    private static List<String> printableLabels(byte[] d, int s, int e) {
        List<String> out = new ArrayList<>();
        int i = s;
        while (i < e) {
            if (isLabelChar(d[i] & 0xff)) {
                int j = i;
                while (j < e && isLabelChar(d[j] & 0xff)) {
                    j++;
                }
                String t = new String(d, i, j - i, StandardCharsets.US_ASCII).trim();
                if (t.length() >= 3 && startsWithLetter(t)) {
                    out.add(t);
                }
                i = j;
            } else {
                i++;
            }
        }
        return out;
    }

    private static List<NameRun> findStringRuns(byte[] d) {
        List<NameRun> runs = new ArrayList<>();
        NameRun cur = null;
        int pos = 0;
        while (pos < d.length) {
            int end = pos;
            while (end < d.length && d[end] != 0) {
                end++;
            }
            boolean ok = end - pos >= 2 && end - pos <= 48;
            for (int k = pos; ok && k < end; k++) {
                if (d[k] < 32 || d[k] >= 127) {
                    ok = false;
                }
            }
            if (ok) {
                if (cur == null) {
                    cur = new NameRun();
                    cur.offset = pos;
                }
                cur.strings.add(new String(d, pos, end - pos, StandardCharsets.US_ASCII));
            } else {
                if (cur != null && cur.strings.size() >= 20) {
                    runs.add(cur);
                }
                cur = null;
            }
            pos = end + 1;
        }
        if (cur != null && cur.strings.size() >= 20) {
            runs.add(cur);
        }
        return runs;
    }

    // ------------------------------------------------------------------
    // Output
    // ------------------------------------------------------------------

    private static String buildJson(byte[] namesDat, byte[] c1, byte[] c2, byte[] db,
            List<NameRun> runs, NameRun countryNames,
            List<Record> countries, List<Record> dbRecords) throws Exception {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"generator\": \"tools/pcglobe/PcGlobeReader.java (stage 3, round 44)\",\n");
        sb.append("  \"sources\": {\n");
        appendSource(sb, "NAMES.DAT", namesDat, true);
        appendSource(sb, "COUNTRY1.DAT", c1, true);
        appendSource(sb, "COUNTRY2.DAT", c2, true);
        appendSource(sb, "DATABASE.DAT", db, false);
        sb.append("  },\n");
        sb.append("  \"namesDat\": {\n");
        sb.append("    \"undecodedPrefixBytes\": ").append(countryNames.offset).append(",\n");
        sb.append("    \"stringRuns\": [");
        for (int i = 0; i < runs.size(); i++) {
            NameRun r = runs.get(i);
            if (i > 0) {
                sb.append(", ");
            }
            sb.append("{\"offset\": ").append(r.offset)
                    .append(", \"count\": ").append(r.strings.size())
                    .append(", \"first\": ").append(jsonStr(r.strings.get(0)))
                    .append(", \"last\": ").append(jsonStr(r.strings.get(r.strings.size() - 1)))
                    .append("}");
        }
        sb.append("],\n");
        sb.append("    \"countryNameCount\": ").append(countryNames.strings.size()).append(",\n");
        sb.append("    \"countryNames\": [");
        for (int i = 0; i < countryNames.strings.size(); i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(jsonStr(countryNames.strings.get(i)));
        }
        sb.append("]\n  },\n");
        sb.append("  \"countryRecordCount\": ").append(countries.size()).append(",\n");
        sb.append("  \"countries\": [");
        for (int i = 0; i < countries.size(); i++) {
            Record r = countries.get(i);
            if (i > 0) {
                sb.append(",");
            }
            sb.append("\n    {\"file\": ").append(jsonStr(r.file))
                    .append(", \"index\": ").append(r.index)
                    .append(", \"offset\": ").append(r.offset)
                    .append(", \"length\": ").append(r.length)
                    .append(", \"undecodedPayloadBytes\": ").append(r.undecodedPayloadBytes)
                    .append(", \"labelTokenCount\": ").append(r.labelTokenCount)
                    .append(", \"features\": [");
            for (int k = 0; k < r.features.size(); k++) {
                if (k > 0) {
                    sb.append(", ");
                }
                sb.append(jsonStr(r.features.get(k)));
            }
            sb.append("]}");
        }
        sb.append("\n  ],\n");
        sb.append("  \"databaseRecordCount\": ").append(dbRecords.size()).append(",\n");
        sb.append("  \"database\": [");
        for (int i = 0; i < dbRecords.size(); i++) {
            Record r = dbRecords.get(i);
            if (i > 0) {
                sb.append(",");
            }
            sb.append("\n    {\"index\": ").append(r.index)
                    .append(", \"offset\": ").append(r.offset)
                    .append(", \"length\": ").append(r.length)
                    .append(", \"labels\": [");
            for (int k = 0; k < r.labels.size(); k++) {
                if (k > 0) {
                    sb.append(", ");
                }
                sb.append(jsonStr(r.labels.get(k)));
            }
            sb.append("]}");
        }
        sb.append("\n  ]\n}\n");
        return sb.toString();
    }

    private static void appendSource(StringBuilder sb, String name, byte[] d, boolean comma) throws Exception {
        sb.append("    ").append(jsonStr(name)).append(": {\"bytes\": ").append(d.length)
                .append(", \"sha256\": ").append(jsonStr(sha256(d))).append("}")
                .append(comma ? ",\n" : "\n");
    }

    private static String buildTxt(byte[] namesDat, List<NameRun> runs, NameRun countryNames,
            List<Record> countries, List<Record> dbRecords) {
        StringBuilder sb = new StringBuilder();
        sb.append("PC Globe (1990) country database - Java reader dump (stage 3)\n");
        sb.append("Sources: NAMES.DAT, COUNTRY1.DAT, COUNTRY2.DAT, DATABASE.DAT (.xfer/pcglobe, hash-pinned)\n\n");
        sb.append("NAMES.DAT: ").append(countryNames.offset).append(" undecoded prefix bytes; ")
                .append(runs.size()).append(" string runs; country names = ")
                .append(countryNames.strings.size()).append("\n");
        for (NameRun r : runs) {
            sb.append(String.format(Locale.ROOT, "  run @0x%05x count=%d first=%s last=%s%n",
                    r.offset, r.strings.size(), r.strings.get(0), r.strings.get(r.strings.size() - 1)));
        }
        sb.append("\nCountry records (").append(countries.size())
                .append("): binary payload reported undecoded; features decoded from label tokens.\n");
        for (Record r : countries) {
            sb.append(String.format(Locale.ROOT, "[%s #%d @0x%05x len=%d payload=%d tokens=%d] %s%n",
                    r.file, r.index, r.offset, r.length, r.undecodedPayloadBytes,
                    r.labelTokenCount, String.join("; ", r.features)));
        }
        sb.append("\nDATABASE.DAT records (").append(dbRecords.size())
                .append("): plain labels extracted; binary statistic fields undecoded.\n");
        for (Record r : dbRecords) {
            sb.append(String.format(Locale.ROOT, "[#%d @0x%05x len=%d] %s%n",
                    r.index, r.offset, r.length, String.join("; ", r.labels)));
        }
        return sb.toString();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static long u32le(byte[] d, int i) {
        return (d[i] & 0xffL) | ((d[i + 1] & 0xffL) << 8)
                | ((d[i + 2] & 0xffL) << 16) | ((d[i + 3] & 0xffL) << 24);
    }

    private static boolean isLetter(int c) {
        return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
    }

    private static boolean isLabelChar(int c) {
        // Letters and label punctuation only: digits are excluded so binary
        // statistic fields do not leak digit-bearing noise runs ("iH2")
        // into the extracted vocabulary.
        return isLetter(c) || c == ' ' || c == '&'
                || c == '.' || c == ',' || c == '\'' || c == '-' || c == '/';
    }

    private static boolean startsWithLetter(String t) {
        return !t.isEmpty() && isLetter(t.charAt(0));
    }

    private static String sha256(byte[] d) throws NoSuchAlgorithmException {
        byte[] h = MessageDigest.getInstance("SHA-256").digest(d);
        StringBuilder sb = new StringBuilder();
        for (byte b : h) {
            sb.append(String.format(Locale.ROOT, "%02x", b));
        }
        return sb.toString();
    }

    private static String jsonStr(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') {
                sb.append('\\').append(c);
            } else if (c < 0x20) {
                sb.append(String.format(Locale.ROOT, "\\u%04x", (int) c));
            } else {
                sb.append(c);
            }
        }
        return sb.append('"').toString();
    }
}
