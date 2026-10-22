package pro.javacard.vre;

/*
 * vSignature.java -- a real HMAC implementation for the Java Card simulator.
 *
 * WHY THIS FILE EXISTS. lib/vjcre.jar, the off-card simulator Feitian ships in
 * AppletPlayground, declares the full javacard.security API and implements none
 * of it. The shipped pro.javacard.vre.vSignature is this, in its entirety:
 *
 *     public void init(Key k, byte mode)                    { }
 *     public short getLength()                              { return 0; }
 *     public byte getAlgorithm()                            { return 0; }
 *     public void update(byte[] b, short o, short l)        { }
 *     public short sign(byte[] in, short o, short l,
 *                       byte[] sig, short s)                { return 0; }
 *     public boolean verify(byte[] in, short o, short l,
 *                           byte[] sig, short s, short n)   { return false; }
 *
 * Every method body is empty. Signature.getInstance() builds one of these for
 * any algorithm byte without complaint, so an applet that protects stored value
 * with an HMAC installs cleanly, runs, and then rejects every authenticated
 * command -- not because the MAC was wrong but because the simulator never
 * computed one. A purse applet cannot be tested against that, and the failure
 * mode is silent: it looks like a security control working.
 *
 * WHAT THIS IS. A generic Java Card Signature backed by javax.crypto.Mac,
 * selected from a table of algorithm constants. It is deliberately table-driven
 * rather than special-cased: there is no meal-plan logic, no knowledge of which
 * bytes the applet feeds it, and no way to tune it toward a passing result. It
 * implements HMAC for the six algorithm constants the API defines and throws
 * CryptoException for everything else, because a shim that quietly returned
 * zeros for an algorithm it does not implement would recreate the original bug.
 *
 * It is loaded ahead of the jar's copy by classpath order. Nothing in the CAP or
 * the applet source changes; the applet calls the documented Java Card API and
 * this is what answers.
 *
 * The point of all of it: the MAC produced here comes out of the JDK, and the
 * MAC it is compared against in tests/mealplan-applet-sim.test.mjs comes out of
 * Node's crypto. If the applet initialised with the wrong key, or fed the amount
 * before the ATC, or truncated to the wrong width, the two would disagree and
 * the test would fail. Agreement across two independent HMAC implementations is
 * the evidence that MealPlanApplet.java and js/mealplan-model.js mean the same
 * thing by "MAC".
 */
public class vSignature extends javacard.security.Signature {

    private final byte algorithm;
    private final String jceName;
    private final short macLength;
    private javax.crypto.Mac mac;
    private byte mode;

    public vSignature(byte algorithm) {
        this.algorithm = algorithm;
        switch (algorithm) {
            case javacard.security.Signature.ALG_HMAC_SHA1:
                jceName = "HmacSHA1";       macLength = 20; break;
            case javacard.security.Signature.ALG_HMAC_SHA_256:
                jceName = "HmacSHA256";     macLength = 32; break;
            case javacard.security.Signature.ALG_HMAC_SHA_384:
                jceName = "HmacSHA384";     macLength = 48; break;
            case javacard.security.Signature.ALG_HMAC_SHA_512:
                jceName = "HmacSHA512";     macLength = 64; break;
            case javacard.security.Signature.ALG_HMAC_MD5:
                jceName = "HmacMD5";        macLength = 16; break;
            case javacard.security.Signature.ALG_HMAC_RIPEMD160:
                jceName = "HmacRIPEMD160";  macLength = 20; break;
            default:
                // Not a silent no-op. See the header comment.
                System.err.println("[simshim] Signature: algorithm " + algorithm + " not implemented");
                throw new IllegalArgumentException("algorithm " + algorithm);
        }
    }

    public void init(javacard.security.Key theKey, byte theMode)
            throws javacard.security.CryptoException {
        if (theKey == null || !theKey.isInitialized()) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.UNINITIALIZED_KEY);
        }
        if (theMode != javacard.security.Signature.MODE_SIGN
                && theMode != javacard.security.Signature.MODE_VERIFY) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.ILLEGAL_VALUE);
        }
        if (!(theKey instanceof vHmacKey)) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.ILLEGAL_VALUE);
        }
        try {
            mac = javax.crypto.Mac.getInstance(jceName);
            // jce() is protected; same package, so the cast is what unlocks it.
            mac.init(((vKey) theKey).jce());
        } catch (Exception e) {
            throw new IllegalStateException("JCE " + jceName + " unavailable", e);
        }
        mode = theMode;
    }

    public void init(javacard.security.Key theKey, byte theMode,
                     byte[] algorithmParam, short algorithmParamOffset, short algorithmParamLength)
            throws javacard.security.CryptoException {
        // HMAC takes no algorithm parameters. Accepting a non-empty parameter
        // block would hide a caller's mistake, so only an empty one is allowed.
        if (algorithmParamLength != 0) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.ILLEGAL_VALUE);
        }
        init(theKey, theMode);
    }

    public short getLength() throws javacard.security.CryptoException {
        return macLength;
    }

    public byte getAlgorithm() {
        return algorithm;
    }

    public void update(byte[] inBuff, short inOffset, short inLength)
            throws javacard.security.CryptoException {
        if (mac == null) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.UNINITIALIZED_KEY);
        }
        mac.update(inBuff, inOffset, inLength);
    }

    public short sign(byte[] inBuff, short inOffset, short inLength,
                      byte[] sigBuff, short sigOffset) throws javacard.security.CryptoException {
        if (mode != javacard.security.Signature.MODE_SIGN) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.ILLEGAL_USE);
        }
        byte[] full = mac.doFinal(slice(inBuff, inOffset, inLength));
        System.arraycopy(full, 0, sigBuff, sigOffset, full.length);
        return (short) full.length;
    }

    public boolean verify(byte[] inBuff, short inOffset, short inLength,
                          byte[] sigBuff, short sigOffset, short sigLength)
            throws javacard.security.CryptoException {
        if (mode != javacard.security.Signature.MODE_VERIFY) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.ILLEGAL_USE);
        }
        byte[] full = mac.doFinal(slice(inBuff, inOffset, inLength));
        /*
         * sigLength is the length of the tag actually presented, which for a
         * truncated MAC is shorter than the algorithm's output -- that is the
         * whole reason the parameter exists. Comparing the first sigLength bytes
         * is the documented behaviour; requiring sigLength to equal the full
         * output would make truncated verification impossible, and this shim
         * originally did exactly that, which is why the applet's SET_STATE (the
         * one handler that calls verify() directly rather than signing and
         * comparing by hand) failed while LOAD and DEBIT worked.
         */
        if (sigLength < 0 || sigLength > full.length) return false;
        int diff = 0;
        for (short i = 0; i < sigLength; i++) diff |= full[i] ^ sigBuff[(short) (sigOffset + i)];
        return diff == 0;
    }

    private static byte[] slice(byte[] buf, short off, short len) {
        byte[] out = new byte[len];
        System.arraycopy(buf, off, out, 0, len);
        return out;
    }
}
