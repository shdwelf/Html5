/*
 * Headless Ghidra exporter for the Dr Solomon's Virus Encyclopaedia disk.
 *
 * Static analysis only: this script reads Ghidra's program database and emits
 * text/JSON. It never invokes, emulates, or writes to the analyzed program.
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

public class EncyclopediaReport extends GhidraScript {

    private static final int MAX_DECOMPILES = 48;
    private static final int DECOMPILE_TIMEOUT_SECONDS = 30;

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 1) {
            throw new IllegalArgumentException("usage: EncyclopediaReport.java <output-directory>");
        }
        File outputDir = new File(args[0]);
        if (!outputDir.isDirectory() && !outputDir.mkdirs()) {
            throw new IOException("cannot create output directory " + outputDir);
        }

        String stem = safeName(currentProgram.getName());
        File jsonFile = new File(outputDir, stem + ".ghidra.json");
        File asmFile = new File(outputDir, stem + ".asm");
        File cFile = new File(outputDir, stem + ".c");
        File stringsFile = new File(outputDir, stem + ".strings.txt");

        JsonObject root = new JsonObject();
        root.addProperty("schemaVersion", 1);
        root.addProperty("program", currentProgram.getName());
        root.addProperty("ghidraVersion", Application.getApplicationVersion());
        root.addProperty("executableFormat", nullToEmpty(currentProgram.getExecutableFormat()));
        root.addProperty("executablePath", nullToEmpty(currentProgram.getExecutablePath()));
        root.addProperty("md5", nullToEmpty(currentProgram.getExecutableMD5()));
        root.addProperty("sha256", nullToEmpty(currentProgram.getExecutableSHA256()));
        root.addProperty("language", currentProgram.getLanguageID().getIdAsString());
        root.addProperty("compiler", currentProgram.getCompilerSpec().getCompilerSpecID().getIdAsString());
        root.addProperty("imageBase", currentProgram.getImageBase().toString());
        root.addProperty("minAddress", currentProgram.getMinAddress().toString());
        root.addProperty("maxAddress", currentProgram.getMaxAddress().toString());

        root.add("memoryBlocks", memoryBlocks());
        root.add("entryPoints", entryPoints());
        root.add("imports", externalSymbols());

        JsonObject counts = new JsonObject();
        counts.addProperty("functions", currentProgram.getFunctionManager().getFunctionCount());
        long instructions = writeAssembly(asmFile);
        counts.addProperty("instructions", instructions);
        int strings = writeStrings(stringsFile);
        counts.addProperty("definedStrings", strings);
        root.add("counts", counts);

        JsonArray decompiles = writeDecompilations(cFile);
        root.add("decompilations", decompiles);
        root.add("analysisBookmarks", analysisBookmarks());

        try (Writer writer = new OutputStreamWriter(new FileOutputStream(jsonFile), StandardCharsets.UTF_8)) {
            new GsonBuilder().setPrettyPrinting().create().toJson(root, writer);
            writer.write("\n");
        }
        println("ENCYCLOPEDIA_REPORT " + jsonFile.getAbsolutePath());
        println("ENCYCLOPEDIA_ASM " + asmFile.getAbsolutePath());
        println("ENCYCLOPEDIA_C " + cFile.getAbsolutePath());
    }

    private JsonArray memoryBlocks() {
        JsonArray rows = new JsonArray();
        Memory memory = currentProgram.getMemory();
        for (MemoryBlock block : memory.getBlocks()) {
            JsonObject row = new JsonObject();
            row.addProperty("name", block.getName());
            row.addProperty("start", block.getStart().toString());
            row.addProperty("end", block.getEnd().toString());
            row.addProperty("bytes", block.getSize());
            row.addProperty("read", block.isRead());
            row.addProperty("write", block.isWrite());
            row.addProperty("execute", block.isExecute());
            row.addProperty("initialized", block.isInitialized());
            Double entropy = entropy(block, memory);
            if (entropy != null) row.addProperty("entropy", entropy);
            rows.add(row);
        }
        return rows;
    }

    private Double entropy(MemoryBlock block, Memory memory) {
        if (!block.isInitialized() || block.getSize() <= 0) return null;
        long[] histogram = new long[256];
        byte[] buffer = new byte[8192];
        long readTotal = 0;
        long offset = 0;
        try {
            while (offset < block.getSize() && !monitor.isCancelled()) {
                int want = (int) Math.min(buffer.length, block.getSize() - offset);
                int got = memory.getBytes(block.getStart().add(offset), buffer, 0, want);
                if (got <= 0) break;
                for (int i = 0; i < got; i++) histogram[buffer[i] & 0xff]++;
                readTotal += got;
                offset += got;
            }
        }
        catch (MemoryAccessException | AddressOutOfBoundsException ex) {
            return null;
        }
        if (readTotal == 0) return null;
        double value = 0.0;
        for (long count : histogram) {
            if (count == 0) continue;
            double p = (double) count / readTotal;
            value -= p * (Math.log(p) / Math.log(2.0));
        }
        return Math.round(value * 10000.0) / 10000.0;
    }

    private JsonArray entryPoints() {
        JsonArray rows = new JsonArray();
        SymbolTable symbols = currentProgram.getSymbolTable();
        AddressIterator iterator = symbols.getExternalEntryPointIterator();
        while (iterator.hasNext()) {
            Address address = iterator.next();
            JsonObject row = new JsonObject();
            row.addProperty("address", address.toString());
            Symbol symbol = symbols.getPrimarySymbol(address);
            row.addProperty("name", symbol == null ? "" : symbol.getName(true));
            Function function = currentProgram.getFunctionManager().getFunctionAt(address);
            row.addProperty("function", function == null ? "" : function.getName(true));
            rows.add(row);
        }
        return rows;
    }

    private JsonArray externalSymbols() {
        JsonArray rows = new JsonArray();
        SymbolIterator iterator = currentProgram.getSymbolTable().getExternalSymbols();
        ReferenceManager references = currentProgram.getReferenceManager();
        while (iterator.hasNext() && !monitor.isCancelled()) {
            Symbol symbol = iterator.next();
            if (symbol.getSymbolType() != SymbolType.FUNCTION && symbol.getSymbolType() != SymbolType.LABEL) {
                continue;
            }
            JsonObject row = new JsonObject();
            row.addProperty("name", symbol.getName());
            Namespace parent = symbol.getParentNamespace();
            row.addProperty("library", parent == null ? "" : parent.getName());
            row.addProperty("address", symbol.getAddress().toString());
            int count = 0;
            ReferenceIterator refs = references.getReferencesTo(symbol.getAddress());
            while (refs.hasNext()) {
                refs.next();
                count++;
            }
            row.addProperty("references", count);
            rows.add(row);
        }
        return rows;
    }

    private long writeAssembly(File file) throws IOException {
        long count = 0;
        Listing listing = currentProgram.getListing();
        try (PrintWriter out = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            out.println("; Ghidra " + Application.getApplicationVersion());
            out.println("; Static disassembly only — the input was never executed");
            out.println("; Program: " + currentProgram.getName());
            out.println("; SHA-256: " + nullToEmpty(currentProgram.getExecutableSHA256()));
            out.println("; Language: " + currentProgram.getLanguageID());
            out.println();
            InstructionIterator iterator = listing.getInstructions(true);
            while (iterator.hasNext() && !monitor.isCancelled()) {
                Instruction instruction = iterator.next();
                String label = "";
                Symbol symbol = currentProgram.getSymbolTable().getPrimarySymbol(instruction.getAddress());
                if (symbol != null) label = symbol.getName(true) + ":";
                if (!label.isEmpty()) out.println(label);
                String bytes;
                try {
                    bytes = toHex(instruction.getBytes());
                }
                catch (MemoryAccessException ex) {
                    bytes = "??";
                }
                out.printf("%-18s %-30s %s%n", instruction.getAddress(), bytes, instruction.toString());
                count++;
            }
        }
        return count;
    }

    private int writeStrings(File file) throws IOException {
        int count = 0;
        try (PrintWriter out = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            DataIterator iterator = currentProgram.getListing().getDefinedData(true);
            while (iterator.hasNext() && !monitor.isCancelled()) {
                Data data = iterator.next();
                if (!data.hasStringValue()) continue;
                Object value = data.getValue();
                if (value == null) continue;
                String text = String.valueOf(value).replace("\r", "\\r").replace("\n", "\\n");
                out.println(data.getAddress() + "\t" + text);
                count++;
            }
        }
        return count;
    }

    private JsonArray writeDecompilations(File file) throws IOException {
        JsonArray rows = new JsonArray();
        DecompInterface decompiler = new DecompInterface();
        DecompileOptions options = new DecompileOptions();
        options.grabFromProgram(currentProgram);
        decompiler.setOptions(options);
        decompiler.toggleCCode(true);
        decompiler.toggleSyntaxTree(true);
        decompiler.setSimplificationStyle("decompile");

        try (PrintWriter out = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            out.println("/* Ghidra " + Application.getApplicationVersion());
            out.println(" * Static decompiler output — the input was never executed");
            out.println(" * Program: " + currentProgram.getName());
            out.println(" * SHA-256: " + nullToEmpty(currentProgram.getExecutableSHA256()));
            out.println(" */\n");

            if (!decompiler.openProgram(currentProgram)) {
                out.println("/* Decompiler refused the program: " + decompiler.getLastMessage() + " */");
                return rows;
            }

            LinkedHashSet<Function> targets = new LinkedHashSet<>();
            AddressIterator entries = currentProgram.getSymbolTable().getExternalEntryPointIterator();
            while (entries.hasNext()) {
                Address address = entries.next();
                Function f = currentProgram.getFunctionManager().getFunctionAt(address);
                if (f == null) f = currentProgram.getFunctionManager().getFunctionContaining(address);
                if (f != null && !f.isExternal()) targets.add(f);
            }
            FunctionIterator functions = currentProgram.getFunctionManager().getFunctionsNoStubs(true);
            while (functions.hasNext() && targets.size() < MAX_DECOMPILES) targets.add(functions.next());

            int index = 0;
            for (Function function : targets) {
                if (index++ >= MAX_DECOMPILES || monitor.isCancelled()) break;
                JsonObject row = new JsonObject();
                row.addProperty("name", function.getName(true));
                row.addProperty("address", function.getEntryPoint().toString());
                row.addProperty("bodyBytes", function.getBody().getNumAddresses());
                DecompileResults result = decompiler.decompileFunction(function, DECOMPILE_TIMEOUT_SECONDS, monitor);
                boolean completed = result.decompileCompleted() && result.getDecompiledFunction() != null;
                row.addProperty("completed", completed);
                row.addProperty("message", nullToEmpty(result.getErrorMessage()));
                rows.add(row);

                out.println("/* ------------------------------------------------------------");
                out.println(" * " + function.getName(true) + " @ " + function.getEntryPoint());
                out.println(" * body bytes: " + function.getBody().getNumAddresses());
                out.println(" * completed: " + completed);
                if (!completed) out.println(" * message: " + nullToEmpty(result.getErrorMessage()));
                out.println(" */");
                if (completed) out.println(result.getDecompiledFunction().getC());
                out.println();
            }
        }
        finally {
            decompiler.dispose();
        }
        return rows;
    }

    private JsonArray analysisBookmarks() {
        JsonArray rows = new JsonArray();
        Iterator<Bookmark> iterator = currentProgram.getBookmarkManager().getBookmarksIterator();
        int emitted = 0;
        while (iterator.hasNext() && emitted < 500 && !monitor.isCancelled()) {
            Bookmark bookmark = iterator.next();
            if (!BookmarkType.ERROR.equals(bookmark.getTypeString()) &&
                !BookmarkType.WARNING.equals(bookmark.getTypeString())) continue;
            JsonObject row = new JsonObject();
            row.addProperty("address", bookmark.getAddress().toString());
            row.addProperty("type", bookmark.getTypeString());
            row.addProperty("category", bookmark.getCategory());
            row.addProperty("comment", bookmark.getComment());
            rows.add(row);
            emitted++;
        }
        return rows;
    }

    private static String safeName(String value) {
        return value.replaceAll("[^A-Za-z0-9._-]+", "_");
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String toHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) builder.append(String.format("%02x", value & 0xff));
        return builder.toString();
    }
}
