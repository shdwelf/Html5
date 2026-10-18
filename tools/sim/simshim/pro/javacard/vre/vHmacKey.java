package pro.javacard.vre;

/*
 * vHmacKey.java -- the HMAC key implementation lib/vjcre.jar does not ship.
 *
 * See vSignature.java for why any of this exists. In short: the free Java Card
 * simulator in Feitian's AppletPlayground declares the whole Java Card security
 * API and implements none of it, so a purse applet whose only defence is an HMAC
 * cannot be exercised at all. This and its two companions supply the missing
 * HMAC pieces by shadowing the stub classes, placed earlier on the classpath.
 *
 * Nothing here knows about the meal-plan applet. It is a generic HMAC key: a
 * byte array with a block size, a set/clear pair, and a JCE view of itself.
 */
public class vHmacKey extends vKey implements javacard.security.HMACKey {

    /** Java Card reports key sizes in bits; this is the block size in bits. */
    private static final short BLOCK_BYTES = 64;

    private final byte[] key = new byte[BLOCK_BYTES];
    private short len = 0;
    private boolean initialised = false;

    /** @param type one of KeyBuilder.TYPE_HMAC_TRANSIENT_RESET / _DESELECT / TYPE_HMAC */
    public vHmacKey(byte type) {
        this.type = type;
        this.length = (short) (BLOCK_BYTES * 8);
    }

    public void setKey(byte[] keyData, short keyOff, short keyLen)
            throws javacard.security.CryptoException {
        if (keyData == null) throw new NullPointerException();
        // HMAC accepts any key length up to the hash block size. Longer keys are
        // hashed down to it by the construction itself, but Java Card asks the
        // caller to stay inside the block, so this rejects rather than reduces.
        if (keyLen <= 0 || keyLen > BLOCK_BYTES || keyOff < 0
                || (short) (keyOff + keyLen) > (short) keyData.length) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.ILLEGAL_VALUE);
        }
        for (short i = 0; i < BLOCK_BYTES; i++) key[i] = 0;
        System.arraycopy(keyData, keyOff, key, 0, keyLen);
        len = keyLen;
        initialised = true;
    }

    public byte getKey(byte[] out, short outOff) {
        if (!initialised) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.UNINITIALIZED_KEY);
        }
        System.arraycopy(key, 0, out, outOff, len);
        return (byte) len;
    }

    public void clearKey() {
        for (short i = 0; i < BLOCK_BYTES; i++) key[i] = 0;
        len = 0;
        initialised = false;
    }

    public boolean isInitialized() {
        return initialised;
    }

    /** Size of the key actually set, in bits, as Java Card defines getSize(). */
    public short getSize() {
        return (short) (len * 8);
    }

    public byte getType() {
        return type;
    }

    /** Raw key bytes, for the Signature implementation to wrap in a JCE key. */
    byte[] rawKey() {
        byte[] out = new byte[len];
        System.arraycopy(key, 0, out, 0, len);
        return out;
    }

    protected java.security.Key jce() {
        if (!initialised) {
            javacard.security.CryptoException.throwIt(javacard.security.CryptoException.UNINITIALIZED_KEY);
        }
        return new javax.crypto.spec.SecretKeySpec(rawKey(), "HMAC");
    }
}
