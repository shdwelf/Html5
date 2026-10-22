package org.bouncycastle.jce.provider;

import java.security.Provider;
import java.security.Security;
import java.util.Map;

/*
 * BouncyCastleProvider -- NOT BouncyCastle. Read this before trusting any run.
 *
 * The Java Card simulator in lib/vjcre.jar ends its static initialiser with:
 *
 *     if (Security.getProvider("BC") == null) {
 *         Security.addProvider(new BouncyCastleProvider());
 *     }
 *
 * Registering a provider under the name "BC" first does not help: the JVM
 * verifier resolves the `new` in that bytecode when it verifies VRE's
 * constructor, so the class has to exist on the classpath whether or not the
 * branch is ever taken. Shipping the real bcprov tree for one HMAC is not worth
 * it, so this class occupies the name instead.
 *
 * It is a working JCE provider, not an empty decoy. Its constructor copies every
 * algorithm property from the providers already installed, implementation class
 * names and aliases included, so a lookup for "HmacSHA256" resolves to the same
 * SunJCE code that Mac.getInstance("HmacSHA256") reaches normally. When
 * jcardsim instantiates this and registers it as "BC", its HMAC really is the
 * JDK's HMAC.
 *
 * The substitution is safe for HMAC-SHA-256 because the construction has exactly
 * one correct answer for a given key and message. It would not be safe for
 * anything with implementation-defined padding or encoding. A genuinely
 * BouncyCastle-only algorithm would be absent and would throw, not silently
 * differ.
 *
 * And it does not matter much either way, because the MAC this produces is
 * checked against the MAC Node computes in js/mealplan-model.js. Agreement
 * between two independent HMAC implementations over the same bytes is the
 * evidence that the applet and the model agree. This class is plumbing; the
 * cross-check is the proof.
 *
 * The package name is BouncyCastle's by necessity -- the verifier wants that
 * exact fully qualified name. It is a test-harness shim under tools/sim, it is
 * never on the applet's compile classpath, and nothing in a CAP references it.
 */
public class BouncyCastleProvider extends Provider {

    private static final long serialVersionUID = 1L;

    /** How many algorithm properties were carried across from the JDK. */
    public static int importedServices = -1;

    /** True once jcardsim has actually instantiated this class. */
    public static volatile boolean instantiated = false;

    public BouncyCastleProvider() {
        super("BC", 1.0d, "JDK algorithms re-published under the name jcardsim expects");
        instantiated = true;
        int n = 0;
        for (Provider p : Security.getProviders()) {
            if ("BC".equals(p.getName())) continue;
            for (Map.Entry<Object, Object> e : p.entrySet()) {
                // Provider extends Properties, so the legacy string map is the
                // readable form of its service table; getServices() is built
                // from it, and it carries the Alg.Alias entries as well.
                if (!(e.getKey() instanceof String)) continue;
                if (containsKey(e.getKey())) continue;      // first provider wins
                put(e.getKey(), e.getValue());
                n++;
            }
        }
        importedServices = n;
        System.err.println("[bcshim] BouncyCastleProvider is a JDK-backed shim, "
                + n + " algorithms imported; this is not BouncyCastle");
    }
}
