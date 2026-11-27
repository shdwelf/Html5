// Historical public Cydia static review only: no target execution or decryption.
// SPDX-License-Identifier: GPL-3.0-only
import ghidra.app.script.GhidraScript;
import ghidra.framework.Application;
import ghidra.app.decompiler.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.*;
import ghidra.util.task.ConsoleTaskMonitor;
import com.google.gson.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;

public class CydiaCryptoReview extends GhidraScript {
    private String hash(byte[] bytes) throws Exception {
        StringBuilder out = new StringBuilder();
        for (byte b : MessageDigest.getInstance("SHA-256").digest(bytes)) out.append(String.format("%02x", b & 255));
        return out.toString();
    }
    private void candidate(Function f, LinkedHashSet<Function> candidates) {
        if (f != null && !f.isExternal() && !f.isThunk() && f.getBody().getNumAddresses() >= 16 && candidates.size() < 4)
            candidates.add(f);
    }
    @Override public void run() throws Exception {
        if (getScriptArgs().length != 1) throw new IllegalArgumentException("One report path required");
        JsonObject result = new JsonObject();
        result.addProperty("schema", 1);
        result.addProperty("ghidraVersion", Application.getApplicationVersion());
        result.addProperty("inputSha256", currentProgram.getExecutableSHA256().toLowerCase(Locale.ROOT));
        result.addProperty("format", currentProgram.getExecutableFormat());
        result.addProperty("language", currentProgram.getLanguageID().toString());
        result.addProperty("imageBase", currentProgram.getImageBase().toString());
        long instructions = 0;
        InstructionIterator insns = currentProgram.getListing().getInstructions(true);
        while (insns.hasNext() && instructions < 1000000 && !monitor.isCancelled()) { insns.next(); instructions++; }
        result.addProperty("instructionsVisitedUpTo1000000", instructions);
        LinkedHashSet<Function> samples = new LinkedHashSet<>();
        Map<String, List<String>> fixedCategories = new LinkedHashMap<>();
        fixedCategories.put("symmetricAndDigestCrypto", Arrays.asList("CCCrypt", "CCCryptorCreate", "CCCryptorUpdate", "CC_SHA1", "CC_SHA256", "SHA1", "SHA256", "MD5"));
        fixedCategories.put("trustAndTls", Arrays.asList("SecTrustEvaluate", "SecTrustEvaluateWithError", "SecCertificateCreateWithData", "SSLSetSessionOption", "CFReadStreamSetProperty"));
        fixedCategories.put("networkAndHttp", Arrays.asList("CFHTTPMessageCreateRequest", "CFReadStreamCreateForHTTPRequest", "socket", "connect", "send", "recv"));
        fixedCategories.put("processAndPrivilege", Arrays.asList("getuid", "geteuid", "setuid", "setgid", "execve", "posix_spawn", "system"));
        JsonObject categories = new JsonObject();
        for (Map.Entry<String, List<String>> category : fixedCategories.entrySet()) {
            JsonArray matches = new JsonArray();
            for (String name : category.getValue()) {
                int count = 0; long refs = 0;
                for (String spelling : Arrays.asList(name, "_" + name)) {
                    SymbolIterator symbols = currentProgram.getSymbolTable().getSymbols(spelling);
                    while (symbols.hasNext() && count < 32) {
                        Symbol symbol = symbols.next(); count++;
                        ReferenceIterator references = currentProgram.getReferenceManager().getReferencesTo(symbol.getAddress());
                        while (references.hasNext() && refs < 10000 && !monitor.isCancelled()) {
                            Reference ref = references.next(); refs++;
                            candidate(currentProgram.getFunctionManager().getFunctionContaining(ref.getFromAddress()), samples);
                        }
                    }
                }
                if (count > 0) {
                    JsonObject row = new JsonObject(); row.addProperty("fixedSymbol", name);
                    row.addProperty("symbolsUpTo32", count); row.addProperty("referencesUpTo10000", refs); matches.add(row);
                }
            }
            categories.add(category.getKey(), matches);
        }
        result.add("fixedNamedApiCategories", categories);
        FunctionIterator functions = currentProgram.getFunctionManager().getFunctions(true);
        int functionCount = 0;
        while (functions.hasNext() && functionCount < 200000 && !monitor.isCancelled()) {
            Function f = functions.next(); functionCount++; candidate(f, samples);
        }
        result.addProperty("functionsDefinedUpTo200000", functionCount);
        JsonArray decompiled = new JsonArray();
        DecompInterface decompiler = new DecompInterface();
        try {
            if (!decompiler.openProgram(currentProgram)) throw new IllegalStateException("Decompiler could not open program");
            for (Function f : samples) {
                DecompileResults d = decompiler.decompileFunction(f, 30, new ConsoleTaskMonitor());
                JsonObject row = new JsonObject(); row.addProperty("address", f.getEntryPoint().toString());
                row.addProperty("functionBytes", f.getBody().getNumAddresses()); row.addProperty("completed", d.decompileCompleted());
                if (d.decompileCompleted() && d.getDecompiledFunction() != null) {
                    byte[] code = d.getDecompiledFunction().getC().getBytes(StandardCharsets.UTF_8);
                    row.addProperty("decompiledUtf8Bytes", code.length); row.addProperty("decompiledSha256", hash(code));
                }
                decompiled.add(row);
            }
        } finally { decompiler.dispose(); }
        result.add("boundedDecompilations", decompiled);
        result.addProperty("inputExecuted", false);
        result.addProperty("deviceDataDecrypted", false);
        result.addProperty("jailbreakVerified", false);
        result.addProperty("malwareFreeVerdict", false);
        result.addProperty("wholeProgramSecurityAudit", false);
        result.addProperty("arbitraryStringsOrDecompiledSourcePublished", false);
        result.addProperty("limitation", "Fixed-name API references and at most four sampled function decompilations, prioritizing references to named APIs. API absence does not establish absence of crypto, networking or dangerous behavior. No private keys, decrypted app data, exploit execution or current iOS compatibility result.");
        Files.writeString(Paths.get(getScriptArgs()[0]), new GsonBuilder().setPrettyPrinting().create().toJson(result) + "\n");
        println("CYDIA_STATIC_REVIEW_COMPLETE");
    }
}
