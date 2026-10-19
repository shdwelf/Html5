/*
 * Ghidra-hosted scan using TorgoTorgo/ghidra-findcrypt's pinned signature DB.
 *
 * This reads the database's name/hex records, searches Ghidra memory with
 * Memory.findBytes, and writes a report. It does not execute, patch, or add
 * labels to the analyzed input. The raw BinaryLoader pass covers full files,
 * including DOS MZ overlays.
 */
//@category Html5

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;

import ghidra.app.script.GhidraScript;
import ghidra.framework.Application;
import ghidra.program.model.address.Address;
import ghidra.program.model.mem.Memory;
import ghidra.program.model.mem.MemoryBlock;

public class SneakersFindCryptReport extends GhidraScript {

    private static class Signature {
        final String name;
        final byte[] bytes;

        Signature(String name, byte[] bytes) {
            this.name = name;
            this.bytes = bytes;
        }
    }

    private static class Hit {
        final String name;
        final Address address;

        Hit(String name, Address address) {
            this.name = name;
            this.address = address;
        }
    }

    private static final int MAX_REPORTED_HITS = 1000;

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 3) {
            throw new IllegalArgumentException(
                "usage: SneakersFindCryptReport.java <output-directory> <input-tag> <name-hex-TSV>");
        }
        File outputDir = new File(args[0]);
        if (!outputDir.isDirectory() && !outputDir.mkdirs()) {
            throw new IOException("cannot create output directory " + outputDir);
        }
        String reportStem = args[1].replaceAll("[^A-Za-z0-9._-]+", "_");
        List<Signature> signatures = readSignatures(Path.of(args[2]));
        List<Hit> hits = new ArrayList<>();
        long totalMatches = 0;
        Memory memory = currentProgram.getMemory();

        for (Signature signature : signatures) {
            monitor.checkCanceled();
            Address searchFrom = currentProgram.getMinAddress();
            while (searchFrom != null && !monitor.isCancelled()) {
                Address found = memory.findBytes(searchFrom, signature.bytes, null, true, monitor);
                if (found == null) break;
                totalMatches++;
                if (hits.size() < MAX_REPORTED_HITS) hits.add(new Hit(signature.name, found));
                searchFrom = found.next();
            }
        }
        Collections.sort(hits, new Comparator<Hit>() {
            @Override
            public int compare(Hit left, Hit right) {
                int byAddress = left.address.compareTo(right.address);
                return byAddress != 0 ? byAddress : left.name.compareTo(right.name);
            }
        });

        File report = new File(outputDir, reportStem + ".findcrypt.md");
        try (PrintWriter out = new PrintWriter(report, StandardCharsets.UTF_8.name())) {
            out.println("# Ghidra FindCrypt signature scan — static only");
            out.println();
            out.println("- Ghidra: `" + Application.getApplicationVersion() + "`");
            out.println("- Program: `" + safe(currentProgram.getName()) + "`");
            out.println("- Loader format: `" + safe(currentProgram.getExecutableFormat()) + "`");
            out.println("- Language: `" + currentProgram.getLanguageID().getIdAsString() + "`");
            out.println("- SHA-256: `" + safe(currentProgram.getExecutableSHA256()) + "`");
            out.println("- FindCrypt database signatures: **" + signatures.size() + "**");
            out.println("- Matching signature occurrences: **" + totalMatches + "**");
            out.println("- Memory blocks scanned:");
            for (MemoryBlock block : memory.getBlocks()) {
                out.println("  - `" + block.getName() + "`: `" + block.getStart() + "`–`" + block.getEnd()
                    + "` (" + block.getSize() + " bytes)");
            }
            out.println();
            if (totalMatches == 0) {
                out.println("No FindCrypt database signatures matched the loaded bytes.");
            } else {
                out.println("| Address | FindCrypt database label |");
                out.println("|---|---|");
                for (Hit hit : hits) {
                    out.println("| `" + hit.address + "` | `CRYPT_" + hit.name + "` |");
                }
                if (totalMatches > hits.size()) {
                    out.println();
                    out.println("_Only the first " + hits.size() + " of " + totalMatches + " occurrences are listed._");
                }
            }
            out.println();
            out.println("This is a signature scan, not proof that a cryptographic algorithm is or is not used. A match needs disassembly/xref review; zero hits do not rule out custom, table-free, or unlisted transforms.");
        }
        println("FINDCRYPT_REPORT " + report.getAbsolutePath());
        println("FINDCRYPT_SIGNATURES " + signatures.size());
        println("FINDCRYPT_MATCHES " + totalMatches);
    }

    private static List<Signature> readSignatures(Path path) throws IOException {
        List<Signature> signatures = new ArrayList<>();
        HexFormat hex = HexFormat.of();
        for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
            if (line.isBlank()) continue;
            int separator = line.indexOf('\t');
            if (separator <= 0 || separator == line.length() - 1) {
                throw new IOException("invalid FindCrypt database TSV row");
            }
            String name = line.substring(0, separator);
            String encoded = line.substring(separator + 1).trim();
            signatures.add(new Signature(name, hex.parseHex(encoded)));
        }
        if (signatures.isEmpty()) throw new IOException("FindCrypt signature database is empty");
        return signatures;
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace("\r", " ").replace("\n", " ");
    }
}
