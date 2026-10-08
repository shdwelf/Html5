/*
 * Generic static report for an authorized, benign Ghidra Program.
 *
 * The script reads Ghidra's program database and writes report files only. It
 * never starts, emulates, patches, or otherwise executes the analyzed input.
 */
//@category Html5

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

public class GenericProgramReport extends GhidraScript {

    private static final int MAX_STRINGS = 10000;
    private static final int MAX_INSTRUCTIONS = 200000;
    private static final int MAX_DECOMPILES = 48;
    private static final int DECOMPILE_TIMEOUT_SECONDS = 30;

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 1) {
            throw new IllegalArgumentException("usage: GenericProgramReport.java <output-directory>");
        }
        File outputDir = new File(args[0]);
        if (!outputDir.isDirectory() && !outputDir.mkdirs()) {
            throw new IOException("cannot create output directory " + outputDir);
        }

        String stem = safeName(currentProgram.getName());
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
        root.add("imports", externalSymbols());

        int stringCount = writeStrings(new File(outputDir, stem + ".strings.txt"));
        long instructionCount = writeAssembly(new File(outputDir, stem + ".asm"));
        JsonArray decompilations = writeDecompilations(new File(outputDir, stem + ".c"));
        root.addProperty("definedStrings", stringCount);
        root.addProperty("instructions", instructionCount);
        root.addProperty("functions", currentProgram.getFunctionManager().getFunctionCount());
        root.add("decompilations", decompilations);

        try (Writer writer = new OutputStreamWriter(
                new FileOutputStream(new File(outputDir, stem + ".ghidra.json")), StandardCharsets.UTF_8)) {
            new GsonBuilder().setPrettyPrinting().create().toJson(root, writer);
            writer.write("\n");
        }
        println("GENERIC_REPORT " + new File(outputDir, stem + ".ghidra.json").getAbsolutePath());
    }

    private JsonArray memoryBlocks() {
        JsonArray rows = new JsonArray();
        for (MemoryBlock block : currentProgram.getMemory().getBlocks()) {
            JsonObject row = new JsonObject();
            row.addProperty("name", block.getName());
            row.addProperty("start", block.getStart().toString());
            row.addProperty("end", block.getEnd().toString());
            row.addProperty("bytes", block.getSize());
            row.addProperty("read", block.isRead());
            row.addProperty("write", block.isWrite());
            row.addProperty("execute", block.isExecute());
            row.addProperty("initialized", block.isInitialized());
            rows.add(row);
        }
        return rows;
    }

    private JsonArray externalSymbols() {
        JsonArray rows = new JsonArray();
        SymbolIterator iterator = currentProgram.getSymbolTable().getExternalSymbols();
        while (iterator.hasNext() && !monitor.isCancelled()) {
            Symbol symbol = iterator.next();
            if (symbol.getSymbolType() != SymbolType.FUNCTION && symbol.getSymbolType() != SymbolType.LABEL) continue;
            JsonObject row = new JsonObject();
            row.addProperty("name", symbol.getName());
            Namespace parent = symbol.getParentNamespace();
            row.addProperty("library", parent == null ? "" : parent.getName());
            row.addProperty("address", symbol.getAddress().toString());
            rows.add(row);
        }
        return rows;
    }

    private int writeStrings(File file) throws IOException {
        int count = 0;
        try (PrintWriter out = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            DataIterator iterator = currentProgram.getListing().getDefinedData(true);
            while (iterator.hasNext() && count < MAX_STRINGS && !monitor.isCancelled()) {
                Data data = iterator.next();
                if (!data.hasStringValue() || data.getValue() == null) continue;
                String text = String.valueOf(data.getValue()).replace("\r", "\\r").replace("\n", "\\n");
                out.println(data.getAddress() + "\t" + text);
                count++;
            }
        }
        return count;
    }

    private long writeAssembly(File file) throws IOException {
        long count = 0;
        try (PrintWriter out = new PrintWriter(new OutputStreamWriter(new FileOutputStream(file), StandardCharsets.UTF_8))) {
            out.println("; Ghidra " + Application.getApplicationVersion());
            out.println("; Static disassembly only — the input was never executed");
            out.println("; Program: " + currentProgram.getName());
            out.println("; SHA-256: " + nullToEmpty(currentProgram.getExecutableSHA256()));
            out.println("; Language: " + currentProgram.getLanguageID());
            out.println();
            InstructionIterator instructions = currentProgram.getListing().getInstructions(true);
            while (instructions.hasNext() && count < MAX_INSTRUCTIONS && !monitor.isCancelled()) {
                Instruction instruction = instructions.next();
                String bytes;
                try {
                    bytes = toHex(instruction.getBytes());
                } catch (MemoryAccessException exception) {
                    bytes = "??";
                }
                out.printf("%-18s %-30s %s%n", instruction.getAddress(), bytes, instruction.toString());
                count++;
            }
            if (instructions.hasNext()) out.println("; truncated at " + MAX_INSTRUCTIONS + " instructions");
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
                out.println("/* Decompiler refused program: " + decompiler.getLastMessage() + " */");
                return rows;
            }

            FunctionIterator functions = currentProgram.getFunctionManager().getFunctionsNoStubs(true);
            int count = 0;
            while (functions.hasNext() && count < MAX_DECOMPILES && !monitor.isCancelled()) {
                Function function = functions.next();
                if (function.isExternal()) continue;
                DecompileResults result = decompiler.decompileFunction(function, DECOMPILE_TIMEOUT_SECONDS, monitor);
                boolean completed = result != null && result.decompileCompleted() && result.getDecompiledFunction() != null;
                JsonObject row = new JsonObject();
                row.addProperty("name", function.getName(true));
                row.addProperty("address", function.getEntryPoint().toString());
                row.addProperty("completed", completed);
                row.addProperty("message", result == null ? "no result" : nullToEmpty(result.getErrorMessage()));
                rows.add(row);
                out.println("/* " + function.getName(true) + " @ " + function.getEntryPoint() + " completed=" + completed + " */");
                if (completed) out.println(result.getDecompiledFunction().getC());
                out.println();
                count++;
            }
        } finally {
            decompiler.dispose();
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
