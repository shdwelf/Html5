package pro.javacard.vre;

/*
 * vKey.java -- shadows the stub in lib/vjcre.jar to add HMAC key support.
 *
 * The shipped vKey.buildKey() is a switch over cases 4 to 6 -- RSA public,
 * private, and private-CRT -- and throws CryptoException(ILLEGAL_VALUE) for
 * everything else. TYPE_HMAC is 21, so building any HMAC key at all fails at
 * install time, before the applet runs a single instruction. This replacement
 * keeps the RSA cases and adds the three HMAC types.
 *
 * It is loaded instead of the jar's copy by classpath order; the JVM resolves by
 * name and descriptor, so the RSA subclasses already inside the jar still link
 * against it. The two bigint helpers are reproduced for the same reason: those
 * classes call them, and a shadow that dropped them would fail to link the
 * moment anything touched an RSA key.
 */
public abstract class vKey implements javacard.security.Key {

    protected byte type;
    protected short length;

    public vKey() { }

    public short getSize() {
        return length;
    }

    public byte getType() {
        return type;
    }

    public static javacard.security.Key buildKey(byte type, short length)
            throws javacard.security.CryptoException {
        switch (type) {
            case javacard.security.KeyBuilder.TYPE_RSA_PUBLIC:
                return new vRSAPublicKey();
            case javacard.security.KeyBuilder.TYPE_RSA_PRIVATE:
                return new vRSAPrivateKey();
            case javacard.security.KeyBuilder.TYPE_RSA_CRT_PRIVATE:
                return new vRSAPrivateCrtKey();
            case javacard.security.KeyBuilder.TYPE_HMAC_TRANSIENT_RESET:
            case javacard.security.KeyBuilder.TYPE_HMAC_TRANSIENT_DESELECT:
            case javacard.security.KeyBuilder.TYPE_HMAC:
                return new vHmacKey(type);
            default:
                // Loudly, and named: a missing algorithm here should read as a
                // gap in the shim, not as an applet bug.
                System.err.println("[simshim] KeyBuilder: no implementation for key type " + type);
                javacard.security.CryptoException.throwIt(javacard.security.CryptoException.ILLEGAL_VALUE);
                return null;
        }
    }

    protected abstract java.security.Key jce();

    protected static short send_positive_bigint(byte[] buf, short off, java.math.BigInteger v) {
        byte[] b = v.toByteArray();
        short n = 0;
        for (short i = 0; i < b.length; i++) {
            if (n == 0 && b[i] == 0) continue;      // drop the sign-extension byte
            buf[(short) (off + n)] = b[i];
            n++;
        }
        return n;
    }

    protected static java.math.BigInteger get_positive_bigint(byte[] buf, short off, short len) {
        byte[] b = new byte[len + 1];                 // leading zero keeps it positive
        System.arraycopy(buf, off, b, 1, len);
        return new java.math.BigInteger(b);
    }
}
