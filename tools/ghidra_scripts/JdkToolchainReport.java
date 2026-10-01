/*
 * Headless Ghidra probe: how does a native Win32 IDE discover and drive a JDK?
 *
 * JCreator is a Java IDE written in C++, so unlike every Java-based IDE its
 * coupling to the JDK is visible in native code: registry reads to find an
 * install, CreateProcess calls to run javac/java, and string tables full of
 * command-line flags. This script does not produce a generic program report —
 * it answers that one question with evidence, by bucketing every string in the
 * binary into a fixed probe set and then decompiling the functions that
 * reference the high-value buckets.
 *
 * Static analysis only: it reads Ghidra's program database and emits text and
 * JSON. It never invokes, emulates, or writes to the analyzed program.
 */
//@category Site-K

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

import com.google.gson.*;

import ghidra.app.decompiler.*;
import ghidra.app.script.GhidraScript;
import ghidra.framework.Application;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.mem.*;
import ghidra.program.model.symbol.*;

public class JdkToolchainReport extends GhidraScript {

    private static final int MAX_DECOMPILES = 40;
    private static final int DECOMPILE_TIMEOUT_SECONDS = 45;
    private static final int MAX_HITS_PER_CATEGORY = 120;

    /*
     * The probe set. Each category is a question about the JDK contract:
     *
     *   registry   does it read HKLM/HKCU Software\JavaSoft to find an install?
     *              The JDK's own launcher only ever read the *JRE* key; the
     *              "Java Development Kit" key was written by Sun's installer and
     *              appears nowhere in the OpenJDK tree, so a third-party reader
     *              is the primary source for it.
     *   tools      which JDK executables does it shell out to?
     *   jars       does it know about classes.zip (JDK 1.1) or tools.jar (1.2+)?
     *   flags      which javac/java command-line options does it construct?
     *   env        does it fall back to JAVA_HOME / CLASSPATH?
     *   jni        does it instead load jvm.dll in-process via the Invocation API?
     *   diagnostic does it parse javac's error output text?
     *   process    the Win32 plumbing used to run a tool and capture its output.
     */
    private static final String[][] PROBES = {
        {"registry", "software\\javasoft", "javasoft", "java development kit",
            "java runtime environment", "currentversion", "javahome", "microversion",
            "hkey_local_machine", "hkey_current_user"},
        {"tools", "javac", "javaw.exe", "java.exe", "javadoc", "appletviewer",
            "jdb.exe", "jar.exe", "rmic", "native2ascii", "javap", "javah", "jarsigner"},
        {"jars", "tools.jar", "rt.jar", "classes.zip", "dt.jar", "src.jar", "\\lib\\"},
        {"flags", "-classpath", "-sourcepath", "-bootclasspath", "-extdirs",
            "-deprecation", "-nowarn", "-encoding", "-verbose", "-target", "-source",
            "-nojit", "-cp "},
        {"env", "java_home", "classpath", "jdk_home", "path="},
        {"jni", "jvm.dll", "jni_createjavavm", "jni_getdefaultjavavminitargs",
            "jni_getcreatedjavavms", "javai.dll", "jvm.cfg", "hotspot", "symcjit"},
        // Deliberately specific: a bare "error:"/"warning:" also matches the
        // MSVC C runtime's own message table, which produced seven false
        // positives per installer stub on the first run.
        {"diagnostic", "cannot resolve symbol", "cannot find symbol",
            "javac:", "deprecated api", "unreported exception",
            "incompatible types", "class file", "package does not exist",
            "missing method body", "unchecked"},
        {"process", "createprocess", "createpipe", "peeknamedpipe", "cmd.exe",
            "/c ", "command.com"},
    };

    /** Imports worth calling out by name, mapped to why they matter. */
    private static final Map<String, String> NOTABLE_IMPORTS = new LinkedHashMap<>();
    static {
        NOTABLE_IMPORTS.put("RegOpenKeyExA", "opens a registry key — JDK discovery");
        NOTABLE_IMPORTS.put("RegOpenKeyExW", "opens a registry key — JDK discovery");
        NOTABLE_IMPORTS.put("RegQueryValueExA", "reads a registry value — JavaHome");
        NOTABLE_IMPORTS.put("RegQueryValueExW", "reads a registry value — JavaHome");
        NOTABLE_IMPORTS.put("RegEnumKeyExA", "enumerates installed versions");
        NOTABLE_IMPORTS.put("RegEnumKeyExW", "enumerates installed versions");
        NOTABLE_IMPORTS.put("CreateProcessA", "runs a JDK tool as a child process");
        NOTABLE_IMPORTS.put("CreateProcessW", "runs a JDK tool as a child process");
        NOTABLE_IMPORTS.put("CreatePipe", "captures javac stdout/stderr");
        NOTABLE_IMPORTS.put("PeekNamedPipe", "polls captured compiler output");
        NOTABLE_IMPORTS.put("GetEnvironmentVariableA", "JAVA_HOME / CLASSPATH fallback");
        NOTABLE_IMPORTS.put("GetEnvironmentVariableW", "JAVA_HOME / CLASSPATH fallback");
        NOTABLE_IMPORTS.put("LoadLibraryA", "could be loading jvm.dll in-process");
        NOTABLE_IMPORTS.put("LoadLibraryW", "could be loading jvm.dll in-process");
        NOTABLE_IMPORTS.put("GetProcAddress", "paired with LoadLibrary for JNI_CreateJavaVM");
        NOTABLE_IMPORTS.put("ShellExecuteA", "opens API documentation in a browser");
        NOTABLE_IMPORTS.put("ShellExecuteW", "opens API documentation in a browser");
    }

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 1) {
            throw new IllegalArgumentException("usage: JdkToolchainReport.java <output-directory>");
        }
        File outputDir = new File(args[0]);
        if (!outputDir.isDirectory() && !outputDir.mkdirs()) {
            throw new IOException("cannot create output directory " + outputDir);
        }

        String stem = safeName(currentProgram.getName());
        File jsonFile = new File(outputDir, stem + ".ghidra.json");
        File stringsFile = new File(outputDir, stem + ".strings.txt");
        File cFile = new File(outputDir, stem + ".c");

        JsonObject root = new JsonObject();
        root.addProperty("schemaVersion", 1);
        root.addProperty("program", currentProgram.getName());
        root.addProperty("ghidraVersion", Application.getApplicationVersion());
        root.addProperty("executableFormat", nullToEmpty(currentProgram.getExecutableFormat()));
        root.addProperty("md5", nullToEmpty(currentProgram.getExecutableMD5()));
        root.addProperty("sha256", nullToEmpty(currentProgram.getExecutableSHA256()));
        root.addProperty("language", currentProgram.getLanguageID().getIdAsString());
        root.addProperty("compiler",
            currentProgram.getCompilerSpec().getCompilerSpecID().getIdAsString());
        root.addProperty("imageBase", currentProgram.getImageBase().toString());
        root.addProperty("functions", currentProgram.getFunctionManager().getFunctionCount());

        root.add("memoryBlocks", memoryBlocks());
        root.add("imports", imports());

        // The probe. Collect hits first so decompilation can be aimed at them.
        Map<String, List<Hit>> hits = probeStrings();
        JsonObject probe = new JsonObject();
        JsonObject summary = new JsonObject();
        for (String[] spec : PROBES) {
            String category = spec[0];
            List<Hit> list = hits.getOrDefault(category, Collections.emptyList());
            summary.addProperty(category, list.size());
            JsonArray rows = new JsonArray();
            for (Hit hit : list) rows.add(hit.toJson());
            probe.add(category, rows);
        }
        root.add("probeSummary", summary);
        root.add("probe", probe);

        int stringCount = writeStrings(stringsFile);
        root.addProperty("definedStrings", stringCount);

        root.add("decompilations", writeDecompilations(cFile, hits));

        try (Writer writer = new OutputStreamWriter(new FileOutputStream(jsonFile),
                StandardCharsets.UTF_8)) {
            new GsonBuilder().setPrettyPrinting().create().toJson(root, writer);
            writer.write("\n");
        }
        println("JDK_REPORT " + jsonFile.getAbsolutePath());
        println("JDK_STRINGS " + stringsFile.getAbsolutePath());
        println("JDK_C " + cFile.getAbsolutePath());
        for (String[] spec : PROBES) {
            println("JDK_PROBE " + spec[0] + "="
                + hits.getOrDefault(spec[0], Collections.emptyList()).size());
        }
    }

    /** One matched string plus where it is referenced from. */
    private static final class Hit {
        String address;
        String text;
        String matched;
        final List<String[]> xrefs = new ArrayList<>();

        JsonObject toJson() {
            JsonObject row = new JsonObject();
            row.addProperty("address", address);
            row.addProperty("text", text);
            row.addProperty("matched", matched);
            JsonArray refs = new JsonArray();
            for (String[] pair : xrefs) {
                JsonObject ref = new JsonObject();
                ref.addProperty("from", pair[0]);
                ref.addProperty("function", pair[1]);
                refs.add(ref);
            }
            row.add("xrefs", refs);
            return row;
        }
    }

    private Map<String, List<Hit>> probeStrings() {
        Map<String, List<Hit>> found = new LinkedHashMap<>();
        for (String[] spec : PROBES) found.put(spec[0], new ArrayList<>());

        Listing listing = currentProgram.getListing();
        ReferenceManager references = currentProgram.getReferenceManager();
        FunctionManager functions = currentProgram.getFunctionManager();

        DataIterator iterator = listing.getDefinedData(true);
        while (iterator.hasNext() && !monitor.isCancelled()) {
            Data data = iterator.next();
            if (!data.hasStringValue() || data.getValue() == null) continue;
            String raw = String.valueOf(data.getValue());
            String text = raw.replace("\r", "\\r").replace("\n", "\\n");
            String lower = raw.toLowerCase(Locale.ROOT);

            for (String[] spec : PROBES) {
                String category = spec[0];
                List<Hit> bucket = found.get(category);
                if (bucket.size() >= MAX_HITS_PER_CATEGORY) continue;
                String matched = null;
                for (int i = 1; i < spec.length; i++) {
                    if (lower.contains(spec[i])) { matched = spec[i]; break; }
                }
                if (matched == null) continue;

                Hit hit = new Hit();
                hit.address = data.getAddress().toString();
                hit.text = text.length() > 400 ? text.substring(0, 400) + "…" : text;
                hit.matched = matched;
                ReferenceIterator refs = references.getReferencesTo(data.getAddress());
                while (refs.hasNext() && hit.xrefs.size() < 16) {
                    Address from = refs.next().getFromAddress();
                    Function fn = functions.getFunctionContaining(from);
                    hit.xrefs.add(new String[]{from.toString(), fn == null ? "" : fn.getName(true)});
                }
                bucket.add(hit);
            }
        }
        return found;
    }

    private JsonArray memoryBlocks() {
        JsonArray rows = new JsonArray();
        for (MemoryBlock block : currentProgram.getMemory().getBlocks()) {
            JsonObject row = new JsonObject();
            row.addProperty("name", block.getName());
            row.addProperty("start", block.getStart().toString());
            row.addProperty("bytes", block.getSize());
            row.addProperty("read", block.isRead());
            row.addProperty("write", block.isWrite());
            row.addProperty("execute", block.isExecute());
            rows.add(row);
        }
        return rows;
    }

    private JsonArray imports() {
        JsonArray rows = new JsonArray();
        SymbolIterator iterator = currentProgram.getSymbolTable().getExternalSymbols();
        ReferenceManager references = currentProgram.getReferenceManager();
        while (iterator.hasNext() && !monitor.isCancelled()) {
            Symbol symbol = iterator.next();
            if (symbol.getSymbolType() != SymbolType.FUNCTION
                && symbol.getSymbolType() != SymbolType.LABEL) continue;
            String name = symbol.getName();
            int count = 0;
            ReferenceIterator refs = references.getReferencesTo(symbol.getAddress());
            while (refs.hasNext()) { refs.next(); count++; }

            JsonObject row = new JsonObject();
            row.addProperty("name", name);
            Namespace parent = symbol.getParentNamespace();
            row.addProperty("library", parent == null ? "" : parent.getName());
            row.addProperty("address", symbol.getAddress().toString());
            row.addProperty("references", count);
            String why = NOTABLE_IMPORTS.get(name);
            if (why != null) row.addProperty("notable", why);
            rows.add(row);
        }
        return rows;
    }

    private int writeStrings(File file) throws IOException {
        int count = 0;
        try (PrintWriter out = new PrintWriter(new OutputStreamWriter(
                new FileOutputStream(file), StandardCharsets.UTF_8))) {
            DataIterator iterator = currentProgram.getListing().getDefinedData(true);
            while (iterator.hasNext() && !monitor.isCancelled()) {
                Data data = iterator.next();
                if (!data.hasStringValue()) continue;
                Object value = data.getValue();
                if (value == null) continue;
                out.println(data.getAddress() + "\t"
                    + String.valueOf(value).replace("\r", "\\r").replace("\n", "\\n"));
                count++;
            }
        }
        return count;
    }

    /**
     * Decompile the functions that actually touch the probe hits, highest value
     * category first, so the committed C is evidence rather than bulk.
     */
    private JsonArray writeDecompilations(File file, Map<String, List<Hit>> hits)
            throws IOException {
        JsonArray rows = new JsonArray();
        DecompInterface decompiler = new DecompInterface();
        DecompileOptions options = new DecompileOptions();
        options.grabFromProgram(currentProgram);
        decompiler.setOptions(options);
        decompiler.toggleCCode(true);
        decompiler.toggleSyntaxTree(true);
        decompiler.setSimplificationStyle("decompile");

        try (PrintWriter out = new PrintWriter(new OutputStreamWriter(
                new FileOutputStream(file), StandardCharsets.UTF_8))) {
            out.println("/* Ghidra " + Application.getApplicationVersion());
            out.println(" * Static decompiler output — the input was never executed");
            out.println(" * Program: " + currentProgram.getName());
            out.println(" * SHA-256: " + nullToEmpty(currentProgram.getExecutableSHA256()));
            out.println(" *");
            out.println(" * Selection is driven by the JDK probe: functions that reference");
            out.println(" * registry, tool-name, flag and process-creation strings first.");
            out.println(" */\n");

            if (!decompiler.openProgram(currentProgram)) {
                out.println("/* Decompiler refused the program: "
                    + decompiler.getLastMessage() + " */");
                return rows;
            }

            FunctionManager functionManager = currentProgram.getFunctionManager();
            LinkedHashMap<Function, String> targets = new LinkedHashMap<>();

            // Priority order: the categories that answer the research question.
            String[] order = {"registry", "jni", "tools", "jars", "flags",
                              "process", "env", "diagnostic"};
            for (String category : order) {
                for (Hit hit : hits.getOrDefault(category, Collections.emptyList())) {
                    for (String[] xref : hit.xrefs) {
                        if (targets.size() >= MAX_DECOMPILES) break;
                        Address from = currentProgram.getAddressFactory()
                            .getAddress(xref[0]);
                        if (from == null) continue;
                        addTarget(targets, functionManager.getFunctionContaining(from),
                            "references " + category + " string \"" + hit.matched
                            + "\" at " + hit.address);
                    }
                }
            }

            for (Map.Entry<Function, String> entry : targets.entrySet()) {
                Function function = entry.getKey();
                if (monitor.isCancelled()) break;
                DecompileResults result =
                    decompiler.decompileFunction(function, DECOMPILE_TIMEOUT_SECONDS, monitor);
                JsonObject row = new JsonObject();
                row.addProperty("function", function.getName(true));
                row.addProperty("address", function.getEntryPoint().toString());
                row.addProperty("reason", entry.getValue());
                boolean ok = result != null && result.decompileCompleted()
                    && result.getDecompiledFunction() != null;
                row.addProperty("decompiled", ok);
                rows.add(row);

                out.println("/* " + function.getName(true) + " @ "
                    + function.getEntryPoint() + "\n * " + entry.getValue() + " */");
                if (ok) {
                    out.println(result.getDecompiledFunction().getC());
                } else {
                    out.println("/* decompilation failed: "
                        + (result == null ? "no result" : result.getErrorMessage()) + " */");
                }
                out.println();
            }
        }
        finally {
            decompiler.dispose();
        }
        return rows;
    }

    private void addTarget(LinkedHashMap<Function, String> targets, Function function,
            String reason) {
        if (function == null || function.isThunk()) return;
        targets.putIfAbsent(function, reason);
    }

    private static String safeName(String value) {
        return value.replaceAll("[^A-Za-z0-9._-]+", "_");
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
