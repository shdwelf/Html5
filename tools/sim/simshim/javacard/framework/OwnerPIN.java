package javacard.framework;

/*
 * OwnerPIN.java -- shadows the non-functional OwnerPIN in lib/vjcre.jar.
 *
 * The shipped one sets every field to zero in its constructor and ignores both
 * arguments:
 *
 *     public OwnerPIN(byte tryLimit, byte maxPINSize) {
 *         remaining = 0;  limit = 0;  validated = false;  value = new byte[1];
 *     }
 *
 * so getTriesRemaining() reports 0 for a freshly created PIN and check() takes
 * its "counter exhausted" branch on the first call and returns false forever. A
 * cardholder PIN can never be verified. For this applet that is the whole spend
 * path: DEBIT needs the PIN as well as the terminal MAC, so with the stock
 * simulator every debit fails at the PIN check and the MAC logic behind it is
 * never reached. It also means the retry counter and the lock -- the reason an
 * OwnerPIN is used at all instead of a byte array -- have nothing to be tested
 * against.
 *
 * This is a spec-conformant replacement: a try counter that decrements, blocks at
 * zero and resets on success, an update() that re-arms it, and a constant-time
 * compare. It knows nothing about the meal-plan applet, the PIN length in use, or
 * what a correct answer is; it is handed the PIN bytes and compares them.
 *
 * The one thing it cannot reproduce is that a real card clears the validated flag
 * on deselect. That needs JCSystem transient-array plumbing the simulator
 * handles for the applet's own arrays but has no hook for inside OwnerPIN, so
 * this flag simply persists for the life of the JVM. Documented, not hidden.
 */
public class OwnerPIN implements PIN {

    private byte remaining;
    private final byte limit;
    private byte[] value;
    private boolean validated;

    public OwnerPIN(byte tryLimit, byte maxPINSize) throws PINException {
        if (tryLimit <= 0 || maxPINSize <= 0) {
            PINException.throwIt(PINException.ILLEGAL_VALUE);
        }
        limit = tryLimit;
        remaining = tryLimit;
        value = new byte[maxPINSize];
        validated = false;
    }

    public byte getTriesRemaining() {
        return remaining;
    }

    public boolean check(byte[] pin, short offset, byte length)
            throws ArrayIndexOutOfBoundsException, NullPointerException {
        validated = false;
        if (remaining == 0) return false;      // blocked; only resetAndUnblock clears it
        remaining--;

        // Constant-time and length-sensitive. A short guess must not short-circuit
        // into a partial match.
        int diff = length ^ value.length;
        for (short i = 0; i < value.length; i++) {
            byte guess = (i < length) ? pin[(short) (offset + i)] : 0;
            diff |= guess ^ value[i];
        }
        if (diff != 0) return false;

        validated = true;
        remaining = limit;                     // a correct PIN re-arms the counter
        return true;
    }

    public boolean isValidated() {
        return validated;
    }

    protected boolean getValidatedFlag() {
        return validated;
    }

    protected void setValidatedFlag(boolean v) {
        validated = v;
    }

    public void reset() {
        validated = false;
    }

    public void resetAndUnblock() {
        remaining = limit;
        validated = false;
    }

    public void update(byte[] pin, short offset, byte length) throws PINException {
        if (length > value.length || offset < 0 || length < 0
                || (short) (offset + length) > (short) pin.length) {
            PINException.throwIt(PINException.ILLEGAL_VALUE);
        }
        for (short i = 0; i < value.length; i++) value[i] = 0;
        System.arraycopy(pin, offset, value, 0, length);
        remaining = limit;                     // update() re-arms, per the spec
        validated = false;
    }
}
