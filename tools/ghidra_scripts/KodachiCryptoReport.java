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
    private static final String[] LITERALS = {"r00t0r", "r00tor", "r00t", "r@@t00", "Security4All", "auth-user-pass", "vpn-credentials.json"};
    private static final String[] CATEGORIES = {"aes", "chacha", "rsa", "sha256", "sha512", "hmac", "pbkdf", "argon2", "scrypt", "evp_", "encrypt", "decrypt", "tls", "ssl"};
    private final LinkedHashMap<String, Function> candidates = new LinkedHashMap<>();
    private final Map<String, String> selection = new HashMap<>();

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
        Memory memory = currentProgram.getMemory();
        for (String literal : LITERALS) {
            Address from = currentProgram.getMinAddress();
            byte[] needle = literal.getBytes(StandardCharsets.UTF_8);
            int count = 0, xrefs = 0;
            JsonArray addresses = new JsonArray();
            while (from != null && count < MAX_HITS_PER_PATTERN) {
                monitor.checkCanceled();
                Address found = memory.findBytes(from, needle, null, true, monitor);
                if (found == null) break;
                count++;
                if (addresses.size() < 3) addresses.add(found.toString());
                ReferenceIterator references = currentProgram.getReferenceManager().getReferencesTo(found);
                int refsForHit = 0;
                while (references.hasNext() && refsForHit++ < 32) {
                    Reference ref = references.next(); xrefs++;
                    candidate(currentProgram.getFunctionManager().getFunctionContaining(ref.getFromAddress()), "fixed-literal-reference");
                }
                from = found.next();
            }
            JsonObject row = new JsonObject();
            row.addProperty("literal", literal); row.addProperty("loadedMemorySubstringMatchesUpTo32", count);
            row.addProperty("matchCapReached", count == MAX_HITS_PER_PATTERN); row.addProperty("referencesVisited", xrefs);
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
            byte[] needle = HexFormat.of().parseHex(parts[1]);
            if (needle.length == 0) throw new IOException("Empty signature is not accepted");
            Address from = currentProgram.getMinAddress();
            int count = 0; JsonArray addresses = new JsonArray();
            while (from != null && count < MAX_HITS_PER_PATTERN) {
                Address found = currentProgram.getMemory().findBytes(from, needle, null, true, monitor);
                if (found == null) break;
                count++; if (addresses.size() < 3) addresses.add(found.toString()); from = found.next();
            }
            if (count > 0) {
                JsonObject row = new JsonObject(); row.addProperty("label", parts[0]); row.addProperty("matchesUpTo32", count);
                row.addProperty("matchCapReached", count == MAX_HITS_PER_PATTERN); row.add("firstAddresses", addresses); rows.add(row);
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
        JsonObject root = new JsonObject();
        root.addProperty("schema", 1); root.addProperty("ghidraVersion", Application.getApplicationVersion());
        root.addProperty("inputSha256", currentProgram.getExecutableSHA256());
        root.addProperty("format", currentProgram.getExecutableFormat());
        root.addProperty("language", currentProgram.getLanguageID().getIdAsString());
        root.addProperty("autoAnalysisTimedOut", analysisTimeoutOccurred());
        root.addProperty("functionsDefined", currentProgram.getFunctionManager().getFunctionCount());
        AddressIterator entryPoints = currentProgram.getSymbolTable().getExternalEntryPointIterator();
        while (entryPoints.hasNext()) candidate(currentProgram.getFunctionManager().getFunctionAt(entryPoints.next()), "entry-point");
        root.add("cryptoSymbolCategoryCounts", categoryCounts());
        root.add("fixedLiteralReferences", literalReferences());
        if (candidates.isEmpty()) {
            FunctionIterator functions = currentProgram.getFunctionManager().getFunctions(true);
            if (functions.hasNext()) candidate(functions.next(), "first-defined-function");
        }
        InstructionIterator instructions = currentProgram.getListing().getInstructions(true); int total = 0;
        while (instructions.hasNext() && total < MAX_INSTRUCTIONS) { instructions.next(); total++; if (total % 4096 == 0) monitor.checkCanceled(); }
        root.addProperty("instructionsVisitedUpTo500000", total); root.addProperty("instructionCapReached", instructions.hasNext());
        root.addProperty("findCryptSignatures", 126); root.add("findCryptMatches", findCrypt(Path.of(args[1])));
        root.add("boundedDecompilations", decompile());
        root.addProperty("scope", "Static loaded Ghidra memory and bounded functions only; no full-source recovery, runtime tracing or decryption. Signatures/symbol names need contextual review, not algorithm/key/password proof. Full-file UTF8/UTF16 literal counts are in the separate ISO scan.");
        root.addProperty("inputExecuted", false); root.addProperty("credentialsUsed", false); root.addProperty("decryptionPerformed", false);
        root.addProperty("arbitraryStringsOrSourcePublished", false); root.addProperty("privateKeysPublished", false);
        try (Writer writer = Files.newBufferedWriter(Path.of(args[0]), StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW)) {
            new GsonBuilder().setPrettyPrinting().create().toJson(root, writer); writer.write("\n");
        }
        println("KODACHI_NATIVE_REDACTED_REPORT_WRITTEN");
    }
}
