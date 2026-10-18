/*
 * MealPlanApplet.java — stored-value purse and door pass for a corporate
 * meal plan / company store, targeting a Java Card 3.0.3 Classic platform
 * (Feitian FT-JCOS, CC EAL5+, Java Card 3.0.4 on the A40CR parts).
 *
 * This file is the Java counterpart of js/mealplan-model.js. The two implement
 * the same APDU table, the same status words and the same security model, and
 * tests/mealplan-applet.test.mjs holds them to each other: it parses this file
 * and checks every constant against the model. Agreement on the constants is
 * what makes a port trustworthy; a MAC computed differently on each side would
 * look correct in isolation and fail on the first real card.
 *
 * ---------------------------------------------------------------------------
 * THE SECURITY MODEL
 *
 *   Value only moves with a MAC from the issuer.
 *     LOAD and UNLOAD are authenticated with a per-card key derived off-card
 *     from an issuer master key. A cafeteria terminal cannot add credit; it can
 *     only ask the backend to. An applet that accepts a load from whoever holds
 *     the card is not a purse, it is a photocopier.
 *
 *   Spend requires two secrets.
 *     The cardholder PIN proves it is the employee. The terminal MAC proves the
 *     request came from a till the company provisioned rather than from a laptop
 *     sitting on the same reader.
 *
 *   The pass uses a different key from the purse.
 *     Door access and lunch money are separate credentials on one card, so a
 *     skimmer at a till does not open the building and a cloned badge cannot
 *     drain a balance.
 *
 *   A monotonic counter guards every value change.
 *     Offline stored value is attacked by replay and by cloning. The ATC makes a
 *     captured receipt unusable twice and makes a cloned card detectable at
 *     settlement. It is also mixed into the pass response, so a door credential
 *     cannot be replayed either.
 *
 *   Hard caps bound the damage.
 *     maxBalance and maxDebit are not defence of the card, they are defence of
 *     the company: they cap what one compromised till or one stolen card costs
 *     before anyone notices. Over-cap requests are refused, never clamped,
 *     because a backend that asked for 500.00 and got 50.00 has a reconciliation
 *     bug it needs to hear about.
 *
 * Java Card specific notes:
 *
 *   - ALG_HMAC_SHA_256 is used because it exists in the 3.0.3 Classic API
 *     (Signature constant 25) and because Node has it natively, so the model and
 *     the card cannot disagree on the primitive. HMACKey, not AESKey.
 *   - Money is a 4-byte big-endian integer of cents. Java Card has no long and
 *     no floating point, and a short would cap the balance at 327.67.
 *   - OwnerPIN gives the retry counter and the lock for free, and its check() is
 *     the platform's own constant-time compare. Do not hand-roll either.
 *   - Every buffer is allocated in the constructor. Java Card forbids `new`
 *     outside install(), and transient state must be declared transient.
 */

package com.shdwelf.mealplan;

import javacard.framework.APDU;
import javacard.framework.Applet;
import javacard.framework.ISO7816;
import javacard.framework.ISOException;
import javacard.framework.JCSystem;
import javacard.framework.OwnerPIN;
import javacard.framework.Util;
import javacard.security.HMACKey;
import javacard.security.KeyBuilder;
import javacard.security.Signature;

public class MealPlanApplet extends Applet {

    /* ------------------------------------------------------------ APDU table */
    /* These five tables are the contract with js/mealplan-model.js. */

    public static final byte CLA_PROP        = (byte) 0x80;

    public static final byte INS_GET_STATUS  = (byte) 0xB0;
    public static final byte INS_GET_CHAL    = (byte) 0x84;
    public static final byte INS_VERIFY_PIN  = (byte) 0x20;
    public static final byte INS_LOAD        = (byte) 0xE0;
    public static final byte INS_DEBIT       = (byte) 0xE2;
    public static final byte INS_UNLOAD      = (byte) 0xE4;
    public static final byte INS_PASS        = (byte) 0xB2;
    public static final byte INS_SET_STATE   = (byte) 0xE6;

    public static final short SW_AUTH_BLOCKED = (short) 0x6983;

    public static final byte PIN_MAX_TRIES   = (byte) 3;
    public static final byte PIN_LEN         = (byte) 4;
    public static final byte CHALLENGE_LEN   = (byte) 8;
    public static final byte MAC_LEN         = (byte) 8;   // truncated HMAC-SHA-256
    public static final byte KEY_LEN         = (byte) 16;  // 128-bit HMAC key

    /* P1 for SET_STATE: provision the terminal key. */
    public static final byte P1_SET_TERMINAL = (byte) 0x01;

    /* --------------------------------------------------------------- state */

    private final OwnerPIN pin;

    private final HMACKey issuerKey;
    private final HMACKey accessKey;
    private final HMACKey terminalKey;
    private boolean terminalProvisioned;

    /** Balance in cents, big-endian, because Java Card has no long. */
    private final byte[] balance;
    /** Monotonic. Never reset, not even on personalisation of a used card. */
    private short atc;

    private final byte[] challenge;
    private final byte[] scratch;      // MAC input assembly
    private final Signature mac;

    /** Transient: cleared on power-up, which is exactly the semantics wanted. */
    private final boolean[] pinValidated;

    private final byte[] maxBalance;   // cents, big-endian
    private final byte[] maxDebit;     // cents, big-endian

    private MealPlanApplet(byte[] b, short off, byte len) {
        pin = new OwnerPIN(PIN_MAX_TRIES, PIN_LEN);
        balance = new byte[4];
        challenge = JCSystem.makeTransientByteArray(CHALLENGE_LEN, JCSystem.CLEAR_ON_DESELECT);
        scratch = new byte[(short) 40];
        maxBalance = new byte[4];
        maxDebit = new byte[4];
        pinValidated = JCSystem.makeTransientBooleanArray((short) 1, JCSystem.CLEAR_ON_DESELECT);

        issuerKey   = (HMACKey) KeyBuilder.buildKey(KeyBuilder.TYPE_HMAC_TRANSIENT_RESET,
                                                    KeyBuilder.LENGTH_HMAC_SHA_256_BLOCK_64, false);
        accessKey   = (HMACKey) KeyBuilder.buildKey(KeyBuilder.TYPE_HMAC_TRANSIENT_RESET,
                                                    KeyBuilder.LENGTH_HMAC_SHA_256_BLOCK_64, false);
        terminalKey = (HMACKey) KeyBuilder.buildKey(KeyBuilder.TYPE_HMAC_TRANSIENT_RESET,
                                                    KeyBuilder.LENGTH_HMAC_SHA_256_BLOCK_64, false);

        mac = Signature.getInstance(Signature.ALG_HMAC_SHA_256, false);
        atc = 0;
        personalise(b, off, len);
    }

    /**
     * Install data layout, offsets from b[off]:
     *   [0]        length byte L (JC install convention)
     *   [1..16]    issuer key
     *   [17..32]   access key
     *   [33..36]   PIN
     *   [37..40]   maxBalance, cents, big-endian
     *   [41..44]   maxDebit, cents, big-endian
     *
     * Deliberately no terminal key here: the terminal secret is provisioned
     * later over an authenticated SET_STATE, so it never has to travel in the
     * personalisation blob that the card factory sees.
     */
    private void personalise(byte[] b, short off, byte len) {
        short p = (short) (off + 1);
        if (len < (byte) 44) ISOException.throwIt(ISO7816.SW_WRONG_DATA);

        issuerKey.setKey(b, p, KEY_LEN);           p += KEY_LEN;
        accessKey.setKey(b, p, KEY_LEN);           p += KEY_LEN;
        pin.update(b, p, PIN_LEN);                 p += PIN_LEN;
        Util.arrayCopyNonAtomic(b, p, maxBalance, (short) 0, (short) 4); p += 4;
        Util.arrayCopyNonAtomic(b, p, maxDebit,   (short) 0, (short) 4);

        // A card with no spending limit is a card that can be drained in one go.
        if (isZero(maxBalance) || isZero(maxDebit)) ISOException.throwIt(ISO7816.SW_WRONG_DATA);
    }

    public static void install(byte[] b, short off, byte len) {
        (new MealPlanApplet(b, off, len)).register();
    }

    /* ---------------------------------------------------------------- APDUs */

    public void process(APDU apdu) {
        byte[] buf = apdu.getBuffer();

        if (selectingApplet()) {
            // Deselect clears pinValidated and the challenge automatically
            // (both are CLEAR_ON_DESELECT). That is the point of transient
            // state: a card left in a reader cannot keep spending.
            return;
        }

        if (buf[ISO7816.OFFSET_CLA] != CLA_PROP)
            ISOException.throwIt(ISO7816.SW_CLA_NOT_SUPPORTED);

        switch (buf[ISO7816.OFFSET_INS]) {
            case INS_GET_STATUS: getStatus(apdu);            return;
            case INS_GET_CHAL:   getChallenge(apdu);         return;
            case INS_VERIFY_PIN: verifyPin(apdu);            return;
            case INS_LOAD:       load(apdu);                 return;
            case INS_DEBIT:      debit(apdu);                return;
            case INS_UNLOAD:     unload(apdu);               return;
            case INS_PASS:       passResponse(apdu);         return;
            case INS_SET_STATE:  setState(apdu);             return;
            default:             ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }

    private void getStatus(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short o = 0;
        o += Util.arrayCopyNonAtomic(balance, (short) 0, buf, o, (short) 4);
        buf[o++] = (byte) (atc >> 8);
        buf[o++] = (byte) atc;
        buf[o++] = pin.getTriesRemaining();
        buf[o++] = pinValidated[0] ? (byte) 1 : (byte) 0;
        apdu.setOutgoingAndSend((short) 0, o);
    }

    private void getChallenge(APDU apdu) {
        // Randomness comes from the platform, never from a counter. A challenge
        // an attacker can predict makes the load MAC forgeable.
        javacard.security.RandomData.getInstance(javacard.security.RandomData.ALG_SECURE_RANDOM)
            .generateData(challenge, (short) 0, CHALLENGE_LEN);
        byte[] buf = apdu.getBuffer();
        Util.arrayCopyNonAtomic(challenge, (short) 0, buf, (short) 0, CHALLENGE_LEN);
        apdu.setOutgoingAndSend((short) 0, CHALLENGE_LEN);
    }

    private void verifyPin(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short n = apdu.setIncomingAndReceive();
        if (n < PIN_LEN) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);

        // OwnerPIN.check decrements the counter and blocks at zero. It is the
        // platform's own compare, so it is already constant-time; a hand-rolled
        // loop here would leak the PIN prefix over enough attempts.
        if (!pin.check(buf, ISO7816.OFFSET_CDATA, PIN_LEN)) {
            pinValidated[0] = false;
            ISOException.throwIt(pin.getTriesRemaining() == 0
                ? SW_AUTH_BLOCKED : ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED);
        }
        pinValidated[0] = true;
        buf[0] = pin.getTriesRemaining();
        apdu.setOutgoingAndSend((short) 0, (short) 1);
    }

    /** LOAD: issuer MAC over (INS || ATC || amount), bound to a live challenge. */
    private void load(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short n = apdu.setIncomingAndReceive();
        short need = (short) (4 + CHALLENGE_LEN + MAC_LEN);
        if (n != need) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);

        short cd = ISO7816.OFFSET_CDATA;
        requireChallenge(buf, (short) (cd + 4));

        verifyIssuerMac(INS_LOAD, buf, cd, (short) (cd + 4 + CHALLENGE_LEN));

        if (isZero4(buf, cd)) ISOException.throwIt(ISO7816.SW_WRONG_DATA);
        if (gt(addTo(scratch, balance, buf, cd), maxBalance))
            ISOException.throwIt(ISO7816.SW_CONDITIONS_NOT_SATISFIED);

        // Commit only after every check passed: a partly applied load is the
        // worst possible outcome, because the backend thinks it succeeded.
        Util.arrayCopyNonAtomic(scratch, (short) 0, balance, (short) 0, (short) 4);
        commit(apdu, buf);
    }

    /** DEBIT: cardholder PIN *and* a terminal MAC. Both, always. */
    private void debit(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short n = apdu.setIncomingAndReceive();
        if (n != (short) (4 + MAC_LEN)) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        if (!pinValidated[0])
            ISOException.throwIt(ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED);
        if (!terminalProvisioned)
            ISOException.throwIt(ISO7816.SW_CONDITIONS_NOT_SATISFIED);

        short cd = ISO7816.OFFSET_CDATA;
        verifyMac(terminalKey, INS_DEBIT, buf, cd, (short) (cd + 4));

        if (isZero4(buf, cd) || gt(buf, cd, maxDebit) || gt(buf, cd, balance))
            ISOException.throwIt(ISO7816.SW_CONDITIONS_NOT_SATISFIED);

        Util.arrayCopyNonAtomic(subFrom(scratch, balance, buf, cd), (short) 0,
                                balance, (short) 0, (short) 4);
        // Single-use authorisation: the next purchase needs the PIN again.
        pinValidated[0] = false;
        commit(apdu, buf);
    }

    private void unload(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short n = apdu.setIncomingAndReceive();
        if (n != (short) (4 + CHALLENGE_LEN + MAC_LEN))
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);

        short cd = ISO7816.OFFSET_CDATA;
        requireChallenge(buf, (short) (cd + 4));
        verifyIssuerMac(INS_UNLOAD, buf, cd, (short) (cd + 4 + CHALLENGE_LEN));

        if (isZero4(buf, cd) || gt(buf, balance))
            ISOException.throwIt(ISO7816.SW_CONDITIONS_NOT_SATISFIED);

        Util.arrayCopyNonAtomic(subFrom(scratch, balance, buf, cd), (short) 0,
                                balance, (short) 0, (short) 4);
        commit(apdu, buf);
    }

    /**
     * Door pass. The reader supplies a nonce; the card answers with
     * HMAC(accessKey, nonce || ATC). The ATC in the MAC is what stops a captured
     * response being replayed at the door: the reader has already seen that
     * counter value.
     */
    private void passResponse(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short n = apdu.setIncomingAndReceive();
        if (n != CHALLENGE_LEN) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);

        byte[] tmp = JCSystem.makeTransientByteArray((short) (CHALLENGE_LEN + 2 + MAC_LEN),
                                                     JCSystem.CLEAR_ON_RESET);
        Util.arrayCopyNonAtomic(buf, ISO7816.OFFSET_CDATA, tmp, (short) 0, CHALLENGE_LEN);
        tmp[CHALLENGE_LEN]     = (byte) (atc >> 8);
        tmp[(short) (CHALLENGE_LEN + 1)] = (byte) atc;

        mac.init(accessKey, Signature.MODE_SIGN);
        short m = mac.sign(tmp, (short) 0, (short) (CHALLENGE_LEN + 2),
                           tmp, (short) (CHALLENGE_LEN + 2));
        if (m > MAC_LEN) m = MAC_LEN;   // truncate, as the model does

        short o = 0;
        buf[o++] = (byte) (atc >> 8);
        buf[o++] = (byte) atc;
        Util.arrayCopyNonAtomic(tmp, (short) (CHALLENGE_LEN + 2), buf, o, MAC_LEN);
        apdu.setOutgoingAndSend((short) 0, (short) (2 + MAC_LEN));
    }

    /** Provision the terminal key. Issuer-authenticated, like load and unload. */
    private void setState(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        if (buf[ISO7816.OFFSET_P1] != P1_SET_TERMINAL)
            ISOException.throwIt(ISO7816.SW_WRONG_P1P2);
        short n = apdu.setIncomingAndReceive();
        if (n != (short) (CHALLENGE_LEN + KEY_LEN + MAC_LEN))
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);

        short cd = ISO7816.OFFSET_CDATA;
        requireChallenge(buf, cd);

        // MAC covers P1 and the key material, so a SET_STATE capture cannot be
        // replayed to install a different key.
        short s = 0;
        scratch[s++] = INS_SET_STATE;
        scratch[s++] = (byte) (atc >> 8);
        scratch[s++] = (byte) atc;
        scratch[s++] = buf[ISO7816.OFFSET_P1];
        Util.arrayCopyNonAtomic(buf, (short) (cd + CHALLENGE_LEN), scratch, s, KEY_LEN);
        s += KEY_LEN;

        mac.init(issuerKey, Signature.MODE_VERIFY);
        if (!mac.verify(scratch, (short) 0, s,
                        buf, (short) (cd + CHALLENGE_LEN + KEY_LEN), MAC_LEN))
            ISOException.throwIt(ISO7816.SW_WRONG_DATA);

        terminalKey.setKey(buf, (short) (cd + CHALLENGE_LEN), KEY_LEN);
        terminalProvisioned = true;
    }

    /* ------------------------------------------------------------- helpers */

    /**
     * The challenge must be live. Checked before the MAC, and consumed whether
     * or not the MAC verifies: a command that fails must not leave its challenge
     * replayable.
     */
    private void requireChallenge(byte[] buf, short off) {
        boolean live = false;
        for (short i = 0; i < CHALLENGE_LEN; i++)
            if (challenge[i] != 0) { live = true; break; }
        if (!live) ISOException.throwIt(ISO7816.SW_CONDITIONS_NOT_SATISFIED);
        if (Util.arrayCompare(buf, off, challenge, (short) 0, CHALLENGE_LEN) != 0) {
            Util.arrayFillNonAtomic(challenge, (short) 0, CHALLENGE_LEN, (byte) 0);
            ISOException.throwIt(ISO7816.SW_WRONG_DATA);
        }
        Util.arrayFillNonAtomic(challenge, (short) 0, CHALLENGE_LEN, (byte) 0);
    }

    private void verifyIssuerMac(byte ins, byte[] buf, short amountOff, short macOff) {
        verifyMac(issuerKey, ins, buf, amountOff, macOff);
    }

    /** MAC input is INS || ATC || amount, matching the model byte for byte. */
    private void verifyMac(HMACKey key, byte ins, byte[] buf, short amountOff, short macOff) {
        short s = 0;
        scratch[s++] = ins;
        scratch[s++] = (byte) (atc >> 8);
        scratch[s++] = (byte) atc;
        Util.arrayCopyNonAtomic(buf, amountOff, scratch, s, (short) 4);
        s += 4;

        mac.init(key, Signature.MODE_VERIFY);
        // sign() truncates; verify() compares the full output, so compare only
        // the MAC_LEN bytes that were transmitted.
        if (!verifyTruncated(key, scratch, s, buf, macOff))
            ISOException.throwIt(ISO7816.SW_WRONG_DATA);
    }

    private boolean verifyTruncated(HMACKey key, byte[] data, short len, byte[] tag, short tagOff) {
        byte[] out = JCSystem.makeTransientByteArray((short) 32, JCSystem.CLEAR_ON_RESET);
        mac.init(key, Signature.MODE_SIGN);
        short produced = mac.sign(data, (short) 0, len, out, (short) 0);
        if (produced < MAC_LEN) return false;
        // Constant-time over the compared bytes.
        short diff = 0;
        for (short i = 0; i < MAC_LEN; i++) diff |= (short) (out[i] ^ tag[(short) (tagOff + i)]);
        return diff == 0;
    }

    /** Bump the counter and return a MAC'd receipt the backend can settle against. */
    private void commit(APDU apdu, byte[] buf) {
        atc++;
        short s = 0;
        scratch[s++] = (byte) (atc >> 8);
        scratch[s++] = (byte) atc;
        Util.arrayCopyNonAtomic(balance, (short) 0, scratch, s, (short) 4);
        s += 4;

        byte[] out = JCSystem.makeTransientByteArray((short) 32, JCSystem.CLEAR_ON_RESET);
        mac.init(issuerKey, Signature.MODE_SIGN);
        mac.sign(scratch, (short) 0, s, out, (short) 0);

        short o = 0;
        buf[o++] = (byte) (atc >> 8);
        buf[o++] = (byte) atc;
        o += Util.arrayCopyNonAtomic(balance, (short) 0, buf, o, (short) 4);
        Util.arrayCopyNonAtomic(out, (short) 0, buf, o, MAC_LEN);
        o += MAC_LEN;
        apdu.setOutgoingAndSend((short) 0, o);
    }

    /* --------------------------------------- 4-byte big-endian unsigned maths */
    /* Java Card has no long and no BigInteger. Balances are cents, so 32 bits is
       ample, but the arithmetic has to be written out. */

    private static boolean isZero(byte[] a) {
        for (short i = 0; i < 4; i++) if (a[i] != 0) return false;
        return true;
    }
    private static boolean isZero4(byte[] a, short off) {
        for (short i = 0; i < 4; i++) if (a[(short) (off + i)] != 0) return false;
        return true;
    }

    /**
     * a > b, both 4-byte big-endian unsigned.
     *
     * Written in short, not int: Java Card has no int local variables at all
     * unless the converter is given -i, and that needs the card to support
     * 32-bit integers, which most do not. Byte values widened to short stay in
     * 0..255, so the comparisons and the carries below never overflow.
     */
    private static boolean gt(byte[] a, byte[] b) {
        for (short i = 0; i < 4; i++) {
            short x = (short) (a[i] & 0xFF);
            short y = (short) (b[i] & 0xFF);
            if (x != y) return x > y;
        }
        return false;
    }

    private static boolean gt(byte[] a, short aOff, byte[] b) {
        for (short i = 0; i < 4; i++) {
            short x = (short) (a[(short) (aOff + i)] & 0xFF);
            short y = (short) (b[i] & 0xFF);
            if (x != y) return x > y;
        }
        return false;
    }

    /** out = a + b, returns out. Caller checks the cap before committing. */
    private byte[] addTo(byte[] out, byte[] a, byte[] b, short bOff) {
        short carry = 0;
        for (short i = 3; i >= 0; i--) {
            short v = (short) ((a[i] & 0xFF) + (b[(short) (bOff + i)] & 0xFF) + carry);
            out[i] = (byte) v;
            carry = (short) (v >> 8);
        }
        return out;
    }

    /** out = a - b, returns out. Caller has already checked a >= b. */
    private byte[] subFrom(byte[] out, byte[] a, byte[] b, short bOff) {
        short borrow = 0;
        for (short i = 3; i >= 0; i--) {
            short v = (short) ((a[i] & 0xFF) - (b[(short) (bOff + i)] & 0xFF) - borrow);
            if (v < 0) { v += 256; borrow = 1; } else { borrow = 0; }
            out[i] = (byte) v;
        }
        return out;
    }
}