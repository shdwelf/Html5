package javacard.framework;

/*
 * Util.java -- shadows the simulator's Util, which prints on every compare.
 *
 * The shipped javacard.framework.Util.arrayCompare begins:
 *
 *     System.out.println(Misc.encodeHexString(a));
 *     System.out.println(Misc.encodeHexString(b));
 *     System.out.println("CMP" + aOff + bOff + len);
 *
 * Three unconditional printlns, on stdout, with no debug flag guarding them --
 * left in a shipped library. The comparison itself is correct; the noise is not
 * harmless, because this harness talks to the simulator over stdout, one hex
 * response per line. The first of those dumps is the APDU buffer rendered as
 * hex, which is exactly what a response looks like, so it was read as one and
 * every answer after the first arrayCompare was off by a line. The symptom was a
 * LOAD that appeared to return 32767 bytes and then a status word that was
 * really the previous challenge.
 *
 * This version does the same work without the printing. The semantics are kept
 * as they were: equality is byte-for-byte, and ordering treats the bytes as
 * unsigned, which is what the original did once it found a difference.
 */
public final class Util {

    private Util() { }

    public static short arrayCopy(byte[] src, short srcOff, byte[] dest, short destOff, short len)
            throws ArrayIndexOutOfBoundsException, NullPointerException, TransactionException {
        return arrayCopyNonAtomic(src, srcOff, dest, destOff, len);
    }

    public static short arrayCopyNonAtomic(byte[] src, short srcOff, byte[] dest, short destOff,
                                           short len)
            throws ArrayIndexOutOfBoundsException, NullPointerException {
        System.arraycopy(src, srcOff, dest, destOff, len);
        return (short) (destOff + len);
    }

    public static short arrayFillNonAtomic(byte[] b, short off, short len, byte value)
            throws ArrayIndexOutOfBoundsException, NullPointerException {
        for (short i = 0; i < len; i++) b[(short) (off + i)] = value;
        return (short) (off + len);
    }

    /**
     * 0 if equal, negative if src &lt; dest, positive if src &gt; dest, compared
     * byte by byte with the bytes treated as unsigned once a difference is found.
     */
    public static byte arrayCompare(byte[] src, short srcOff, byte[] dest, short destOff, short len)
            throws ArrayIndexOutOfBoundsException, NullPointerException {
        if (srcOff < 0 || destOff < 0 || len < 0) throw new ArrayIndexOutOfBoundsException();
        for (short i = 0; i < len; i++) {
            int x = src[(short) (srcOff + i)] & 0xFF;
            int y = dest[(short) (destOff + i)] & 0xFF;
            if (x != y) return (byte) (x > y ? 1 : -1);
        }
        return 0;
    }

    public static short makeShort(byte b1, byte b2) {
        return (short) (((b1 & 0xFF) << 8) | (b2 & 0xFF));
    }

    public static short getShort(byte[] b, short off)
            throws ArrayIndexOutOfBoundsException, NullPointerException {
        return makeShort(b[off], b[(short) (off + 1)]);
    }

    public static short setShort(byte[] b, short off, short value)
            throws TransactionException, ArrayIndexOutOfBoundsException, NullPointerException {
        b[off] = (byte) (value >> 8);
        b[(short) (off + 1)] = (byte) value;
        return (short) (off + 2);
    }
}
