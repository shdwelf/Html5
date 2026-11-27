// Fixed-input static review only; no execution, patching or arbitrary-string dump.
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

public class AndroidRootingReview extends GhidraScript {
    private String hash(byte[] bytes) throws Exception {
        StringBuilder out = new StringBuilder();
        for (byte b : MessageDigest.getInstance("SHA-256").digest(bytes)) out.append(String.format("%02x", b & 255));
        return out.toString();
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
        FunctionIterator functions = currentProgram.getFunctionManager().getFunctions(true);
        ArrayList<Function> samples = new ArrayList<>(); int functionCount = 0;
        while (functions.hasNext() && functionCount < 200000 && !monitor.isCancelled()) {
            Function f = functions.next(); functionCount++;
            if (!f.isExternal() && !f.isThunk() && f.getBody().getNumAddresses() >= 16 && samples.size() < 4) samples.add(f);
        }
        result.addProperty("functionsDefinedUpTo200000", functionCount);
        Map<String, List<String>> fixedCategories = new LinkedHashMap<>();
        fixedCategories.put("privilegeAndIdentity", Arrays.asList("getuid", "geteuid", "setuid", "setgid", "capset", "capget", "unshare", "setns"));
        fixedCategories.put("processAndExecution", Arrays.asList("execve", "execv", "execl", "fork", "vfork", "posix_spawn", "system"));
        fixedCategories.put("network", Arrays.asList("socket", "connect", "bind", "listen", "accept", "sendto", "recvfrom"));
        fixedCategories.put("filesystemAndBoot", Arrays.asList("open", "openat", "mount", "umount2", "rename", "unlink", "mknod", "ioctl"));
        JsonObject categories = new JsonObject();
        for (Map.Entry<String, List<String>> category : fixedCategories.entrySet()) {
            JsonArray matches = new JsonArray();
            for (String name : category.getValue()) {
                SymbolIterator syms = currentProgram.getSymbolTable().getSymbols(name);
                long refs = 0; int count = 0;
                while (syms.hasNext() && count++ < 32) {
                    Symbol symbol = syms.next();
                    for (Reference ref : symbol.getReferences()) if (++refs >= 10000) break;
                }
                if (count > 0) {
                    JsonObject m = new JsonObject(); m.addProperty("fixedSymbol", name); m.addProperty("symbolsUpTo32", Math.min(count, 32));
                    m.addProperty("referencesUpTo10000", Math.min(refs, 10000)); matches.add(m);
                }
            }
            categories.add(category.getKey(), matches);
        }
        result.add("fixedImportedApiCategories", categories);
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
        result.addProperty("firmwarePatchedOrFlashed", false);
        result.addProperty("deviceRootVerified", false);
        result.addProperty("malwareFreeOrSafeVerdict", false);
        result.addProperty("wholeProgramSecurityAudit", false);
        result.addProperty("arbitraryStringsOrDecompiledSourcePublished", false);
        result.addProperty("limitation", "Imported APIs and four sampled decompilations are static observations, not a proof of safety, exploitable firmware or working root. Automatic analysis is time-bounded by the runner.");
        Files.writeString(Paths.get(getScriptArgs()[0]), new GsonBuilder().setPrettyPrinting().create().toJson(result) + "\n");
        println("ANDROID_ROOT_REVIEW_COMPLETE");
    }
}
