/*
 * Export labels created by TorgoTorgo/ghidra-findcrypt for a Sneakers input.
 *
 * Run only after Ghidra auto-analysis. This script reads the program database;
 * it never runs or modifies the analyzed bytes.
 */
//@category Html5

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import ghidra.app.script.GhidraScript;
import ghidra.framework.Application;
import ghidra.program.model.symbol.Symbol;
import ghidra.program.model.symbol.SymbolIterator;

public class SneakersFindCryptReport extends GhidraScript {

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length < 1 || args.length > 2) {
            throw new IllegalArgumentException("usage: SneakersFindCryptReport.java <output-directory> [input-tag]");
        }
        File outputDir = new File(args[0]);
        if (!outputDir.isDirectory() && !outputDir.mkdirs()) {
            throw new IOException("cannot create output directory " + outputDir);
        }
        String programName = currentProgram.getName().replaceAll("[^A-Za-z0-9._-]+", "_");
        String reportStem = args.length == 2 ? args[1].replaceAll("[^A-Za-z0-9._-]+", "_") : programName;
        File report = new File(outputDir, reportStem + ".findcrypt.md");
        List<Symbol> hits = new ArrayList<>();
        SymbolIterator symbols = currentProgram.getSymbolTable().getAllSymbols(true);
        while (symbols.hasNext() && !monitor.isCancelled()) {
            Symbol symbol = symbols.next();
            if (symbol.getName().startsWith("CRYPT_")) hits.add(symbol);
        }
        Collections.sort(hits, new Comparator<Symbol>() {
            @Override
            public int compare(Symbol left, Symbol right) {
                return left.getAddress().compareTo(right.getAddress());
            }
        });

        try (PrintWriter out = new PrintWriter(report, StandardCharsets.UTF_8.name())) {
            out.println("# Ghidra FindCrypt labels — static scan");
            out.println();
            out.println("- Ghidra: `" + Application.getApplicationVersion() + "`");
            out.println("- Program: `" + currentProgram.getName() + "`");
            out.println("- Loader format: `" + safe(currentProgram.getExecutableFormat()) + "`");
            out.println("- Language: `" + currentProgram.getLanguageID().getIdAsString() + "`");
            out.println("- SHA-256: `" + safe(currentProgram.getExecutableSHA256()) + "`");
            out.println("- FindCrypt labels: **" + hits.size() + "**");
            out.println();
            if (hits.isEmpty()) {
                out.println("No `CRYPT_` labels were created by the FindCrypt analyzer for the loaded program bytes.");
            } else {
                out.println("| Address | FindCrypt label |");
                out.println("|---|---|");
                for (Symbol hit : hits) {
                    out.println("| `" + hit.getAddress() + "` | `" + hit.getName() + "` |");
                }
            }
            out.println();
            out.println("This is a signature scan over the loaded bytes, not proof that a cryptographic algorithm is or is not used. A matched constant requires disassembly/xref review; a zero-hit result does not rule out custom, table-free, or unlisted transforms.");
        }
        println("FINDCRYPT_REPORT " + report.getAbsolutePath());
        println("FINDCRYPT_LABELS " + hits.size());
    }

    private static String safe(String value) {
        return value == null ? "" : value.replace("\r", " ").replace("\n", " ");
    }
}
