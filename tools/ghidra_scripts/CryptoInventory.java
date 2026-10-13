/*
 * Crypto / capability inventory for a native binary, from Ghidra's database.
 * Static only: counts functions, imports and defined strings, and lists
 * crypto-named ones. Never executes, emulates or patches the input.
 */
//@category Html5

import java.io.*;
import java.util.*;

import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.*;

public class CryptoInventory extends GhidraScript {

    private static final String[] TOKENS = {
        "encrypt", "decrypt", "cipher", "aes", " des", "des_", "rsa", "ecdh",
        "sha1", "sha256", "sha512", "md5", "hmac", "ssl", "tls", "crypto",
        "evp_", "rand_", "x509", "pkcs", "tor_", "onion"
    };

    private boolean cryptoNamed(String name) {
        String n = " " + name.toLowerCase() + " ";
        for (String t : TOKENS) {
            if (n.contains(t)) return true;
        }
        return false;
    }

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        PrintWriter out = args.length == 1
            ? new PrintWriter(new FileWriter(new File(args[0]), true))
            : new PrintWriter(System.out, true);
        try {
            Program p = currentProgram;
            out.println("GHIDRA-REPORT program=" + p.getName()
                + " language=" + p.getLanguageID()
                + " sha256=" + p.getExecutableSHA256());

            int fnTotal = 0;
            List<String> fnCrypto = new ArrayList<>();
            for (Function f : p.getFunctionManager().getFunctions(true)) {
                fnTotal++;
                if (cryptoNamed(f.getName()) && fnCrypto.size() < 60) {
                    fnCrypto.add(f.getName());
                }
            }
            out.println("GHIDRA-REPORT functions_total=" + fnTotal
                + " functions_crypto_named=" + fnCrypto.size());
            for (String n : fnCrypto) out.println("GHIDRA-FN " + n);

            int extTotal = 0;
            List<String> extCrypto = new ArrayList<>();
            SymbolTable st = p.getSymbolTable();
            for (Symbol s : st.getExternalSymbols()) {
                extTotal++;
                if (cryptoNamed(s.getName()) && extCrypto.size() < 60) {
                    extCrypto.add(s.getName());
                }
            }
            out.println("GHIDRA-REPORT external_symbols=" + extTotal
                + " external_crypto_named=" + extCrypto.size());
            for (String n : extCrypto) out.println("GHIDRA-IMPORT " + n);

            int strTotal = 0, strHttp = 0, strCrypto = 0;
            List<String> strHits = new ArrayList<>();
            DataIterator it = p.getListing().getDefinedData(true);
            while (it.hasNext()) {
                Data d = it.next();
                Object v = d.getValue();
                if (v instanceof String) {
                    strTotal++;
                    String s = (String) v;
                    String low = s.toLowerCase();
                    if (low.contains("http")) strHttp++;
                    if (cryptoNamed(s)) {
                        strCrypto++;
                        if (strHits.size() < 40 && s.length() < 160) strHits.add(s);
                    }
                }
            }
            out.println("GHIDRA-REPORT defined_strings=" + strTotal
                + " strings_http=" + strHttp + " strings_crypto=" + strCrypto);
            for (String s : strHits) out.println("GHIDRA-STR " + s.replaceAll("\\s+", " "));
        } finally {
            out.flush();
            if (args.length == 1) out.close();
        }
    }
}
