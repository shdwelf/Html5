/*
 * Bounded native Ghidra/FindCrypt evidence for owner-authorized ISO binaries.
 * No emulation, sample execution, credential use, patching or decryption.
 * Only counts, fixed signature labels, addresses and decompilation hashes leave
 * the runner. Arbitrary strings, operands, C source and key material do not.
 */
//@category Html5
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import com.google.gson.*;
import ghidra.app.decompiler.*;
import ghidra.app.util.headless.HeadlessScript;
import ghidra.framework.Application;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.Memory;
import ghidra.program.model.symbol.*;

public class KodachiCryptoReport extends HeadlessScript {
    private static final int MAX_INSTRUCTIONS = 500000;
    private static final int MAX_HITS_PER_PATTERN = 32;
    private static final int MAX_LOADED_BYTES = 64 * 1024 * 1024;
    private static final String[] LITERALS = {"r00t0r", "r00tor", "r00t", "r@@t00", "Security4All", "auth-user-pass", "vpn-credentials.json"};
    private static final String[] CATEGORIES = {"aes", "chacha", "rsa", "sha256", "sha512", "hmac", "pbkdf", "argon2", "scrypt", "evp_", "encrypt", "decrypt", "tls", "ssl"};
    private final LinkedHashMap<String, Function> candidates = new LinkedHashMap<>();
    private final Map<String, String> selection = new HashMap<>();
    private final List<Address> sliceStarts = new ArrayList<>();
    private final List<byte[]> sliceBytes = new ArrayList<>();

    private int snapshotLoadedMemory() throws Exception {
        // Ghidra's address-at-a-time findBytes is very expensive for 126 full
        // scans of statically linked Rust/OpenSSL. Read initialized loaded
        // ranges once, then scan bounded byte buffers without per-byte DB I/O.
        Memory memory = currentProgram.getMemory();
        AddressRangeIterator ranges = memory.getLoadedAndInitializedAddressSet().getAddressRanges();
        int total = 0;
        while (ranges.hasNext()) {
            monitor.checkCanceled();
            AddressRange range = ranges.next();
            long size = range.getLength();
            if (size <= 0 || size > MAX_LOADED_BYTES - total) throw new IOException("Loaded-memory byte bound exceeded");
            byte[] bytes = new byte[(int) size];
            if (memory.getBytes(range.getMinAddress(), bytes) != bytes.length) throw new IOException("Loaded-memory snapshot is incomplete");
            total += bytes.length; sliceStarts.add(range.getMinAddress()); sliceBytes.add(bytes);
        }
        return total;
    }

    private List<Address> findLoadedMatches(byte[] needle) throws Exception {
        if (needle.length == 0) throw new IOException("Empty pattern is not accepted");
        int[] skip = new int[256]; Arrays.fill(skip, needle.length);
        for (int i = 0; i < needle.length - 1; i++) skip[needle[i] & 255] = needle.length - 1 - i;
        List<Address> hits = new ArrayList<>();
        for (int b = 0; b < sliceBytes.size(); b++) {
            monitor.checkCanceled();
            byte[] bytes = sliceBytes.get(b); int offset = 0, iterations = 0;
            while (offset <= bytes.length - needle.length) {
                if ((iterations++ & 16383) == 0) monitor.checkCanceled();
                int j = needle.length - 1;
                while (j >= 0 && bytes[offset + j] == needle[j]) j--;
                if (j < 0) {
                    hits.add(sliceStarts.get(b).add(offset));
                    if (hits.size() == MAX_HITS_PER_PATTERN) return hits;
                    offset++; // Preserve overlapping matches; no substring-as-token claim.
                } else offset += skip[bytes[offset + needle.length - 1] & 255];
            }
        }
        return hits;
    }

    private void candidate(Function f, String reason) {
        if (f == null || f.isExternal() || f.getBody().getNumAddresses() > 100000 || candidates.size() >= 32) return;
        String address = f.getEntryPoint().toString();
        candidates.putIfAbsent(address, f);
        selection.putIfAbsent(address, reason);
    }

    private JsonObject categoryCounts() throws Exception {
        JsonObject result = new JsonObject();
        int[] counts = new int[CATEGORIES.length];
        FunctionIterator functions = currentProgram.getFunctionManager().getFunctions(true);
        int visited = 0;
        while (functions.hasNext()) {
            if (++visited > 100000) throw new IOException("Function count bound exceeded");
            monitor.checkCanceled();
            Function f = functions.next();
            String name = f.getName().toLowerCase(Locale.ROOT);
            for (int i = 0; i < CATEGORIES.length; i++) {
                if (name.contains(CATEGORIES[i])) {
                    counts[i]++;
                    candidate(f, "crypto-symbol-category");
                }
            }
        }
        for (int i = 0; i < counts.length; i++) if (counts[i] > 0) result.addProperty(CATEGORIES[i], counts[i]);
        return result;
    }

    private JsonArray literalReferences() throws Exception {
        JsonArray rows = new JsonArray();
        for (String literal : LITERALS) {
            List<Address> hits = findLoadedMatches(literal.getBytes(StandardCharsets.UTF_8));
            int xrefs = 0; JsonArray addresses = new JsonArray();
            for (Address found : hits) {
                if (addresses.size() < 3) addresses.add(found.toString());
                ReferenceIterator references = currentProgram.getReferenceManager().getReferencesTo(found);
                int refsForHit = 0;
                while (references.hasNext() && refsForHit++ < 32) {
                    Reference ref = references.next(); xrefs++;
                    candidate(currentProgram.getFunctionManager().getFunctionContaining(ref.getFromAddress()), "fixed-literal-reference");
                }
            }
            JsonObject row = new JsonObject();
            row.addProperty("literal", literal); row.addProperty("loadedMemorySubstringMatchesUpTo32", hits.size());
            row.addProperty("matchCapReached", hits.size() == MAX_HITS_PER_PATTERN); row.addProperty("referencesVisited", xrefs);
            row.add("firstAddresses", addresses); row.addProperty("workingVpnCredentialProven", false); rows.add(row);
        }
        return rows;
    }

    private JsonArray findCrypt(Path path) throws Exception {
        JsonArray rows = new JsonArray();
        List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
        if (lines.size() != 126) throw new IOException("Pinned FindCrypt signature count changed");
        for (String line : lines) {
            monitor.checkCanceled();
            String[] parts = line.split("\t", -1);
            if (parts.length != 2 || parts[0].length() > 160 || parts[1].length() > 131072) throw new IOException("Invalid pinned signature row");
            List<Address> hits = findLoadedMatches(HexFormat.of().parseHex(parts[1]));
            if (!hits.isEmpty()) {
                JsonArray addresses = new JsonArray();
                for (Address found : hits) if (addresses.size() < 3) addresses.add(found.toString());
                JsonObject row = new JsonObject(); row.addProperty("label", parts[0]); row.addProperty("matchesUpTo32", hits.size());
                row.addProperty("matchCapReached", hits.size() == MAX_HITS_PER_PATTERN); row.add("firstAddresses", addresses); rows.add(row);
            }
        }
        return rows;
    }

    private JsonArray decompile() throws Exception {
        JsonArray rows = new JsonArray();
        DecompInterface engine = new DecompInterface();
        DecompileOptions options = new DecompileOptions(); options.grabFromProgram(currentProgram);
        engine.setOptions(options); engine.toggleCCode(true); engine.toggleSyntaxTree(false); engine.setSimplificationStyle("decompile");
        try {
            if (!engine.openProgram(currentProgram)) return rows;
            int count = 0;
            for (Map.Entry<String, Function> entry : candidates.entrySet()) {
                if (count++ >= 4) break;
                monitor.checkCanceled();
                DecompileResults r = engine.decompileFunction(entry.getValue(), 15, monitor);
                boolean completed = r != null && r.decompileCompleted() && r.getDecompiledFunction() != null;
                JsonObject row = new JsonObject(); row.addProperty("entry", entry.getKey());
                row.addProperty("selectedBy", selection.get(entry.getKey())); row.addProperty("completed", completed);
                if (completed) {
                    byte[] c = r.getDecompiledFunction().getC().getBytes(StandardCharsets.UTF_8);
                    row.addProperty("cBytesNotPublished", c.length);
                    row.addProperty("cSha256", HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(c)));
                }
                row.addProperty("cSourcePublished", false); rows.add(row);
            }
        } finally { engine.dispose(); }
        return rows;
    }

    @Override public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 2) throw new IllegalArgumentException("usage: KodachiCryptoReport.java <fresh-json> <pinned-signatures-tsv>");
        println("KODACHI_NATIVE_STAGE start");
        JsonObject root = new JsonObject();
        root.addProperty("schema", 1); root.addProperty("ghidraVersion", Application.getApplicationVersion());
        root.addProperty("inputSha256", currentProgram.getExecutableSHA256());
        root.addProperty("format", currentProgram.getExecutableFormat());
        root.addProperty("language", currentProgram.getLanguageID().getIdAsString());
        root.addProperty("autoAnalysisTimedOut", analysisTimeoutOccurred());
        root.addProperty("functionsDefined", currentProgram.getFunctionManager().getFunctionCount());
        root.addProperty("bufferedLoadedBytes", snapshotLoadedMemory());
        root.addProperty("loadedMemoryByteLimit", MAX_LOADED_BYTES);
        root.addProperty("patternSearch", "Buffered loaded-initialized Ghidra ranges, Boyer-Moore-Horspool; no cross-range or unloaded-data claim");
        println("KODACHI_NATIVE_STAGE memory-snapshot");
        AddressIterator entryPoints = currentProgram.getSymbolTable().getExternalEntryPointIterator();
        while (entryPoints.hasNext()) candidate(currentProgram.getFunctionManager().getFunctionAt(entryPoints.next()), "entry-point");
        root.add("cryptoSymbolCategoryCounts", categoryCounts());
        println("KODACHI_NATIVE_STAGE symbol-categories");
        root.add("fixedLiteralReferences", literalReferences());
        println("KODACHI_NATIVE_STAGE fixed-literals");
        if (candidates.isEmpty()) {
            FunctionIterator functions = currentProgram.getFunctionManager().getFunctions(true);
            if (functions.hasNext()) candidate(functions.next(), "first-defined-function");
        }
        InstructionIterator instructions = currentProgram.getListing().getInstructions(true); int total = 0;
        while (instructions.hasNext() && total < MAX_INSTRUCTIONS) { instructions.next(); total++; if (total % 4096 == 0) monitor.checkCanceled(); }
        root.addProperty("instructionsVisitedUpTo500000", total); root.addProperty("instructionCapReached", instructions.hasNext());
        println("KODACHI_NATIVE_STAGE instruction-count");
        root.addProperty("findCryptSignatures", 126); root.add("findCryptMatches", findCrypt(Path.of(args[1])));
        println("KODACHI_NATIVE_STAGE findcrypt");
        root.add("boundedDecompilations", decompile());
        println("KODACHI_NATIVE_STAGE decompile");
        root.addProperty("scope", "Static loaded Ghidra memory and bounded functions only; no full-source recovery, runtime tracing or decryption. Signatures/symbol names need contextual review, not algorithm/key/password proof. Full-file UTF8/UTF16 literal counts are in the separate ISO scan.");
        root.addProperty("inputExecuted", false); root.addProperty("credentialsUsed", false); root.addProperty("decryptionPerformed", false);
        root.addProperty("arbitraryStringsOrSourcePublished", false); root.addProperty("privateKeysPublished", false);
        try (Writer writer = Files.newBufferedWriter(Path.of(args[0]), StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW)) {
            new GsonBuilder().setPrettyPrinting().create().toJson(root, writer); writer.write("\n");
        }
        println("KODACHI_NATIVE_STAGE complete");
        println("KODACHI_NATIVE_REDACTED_REPORT_WRITTEN");
    }
}
