package org.html5.card;

import javacard.framework.APDU;
import javacard.framework.Applet;
import javacard.framework.ISO7816;
import javacard.framework.ISOException;
import javacard.framework.JCSystem;
import javacard.framework.OwnerPIN;
import javacard.framework.Util;

/** JavaCard Classic source prototype; NOT a CAP file or a complete vault filesystem.
 * Stores only a 32-byte snapshot digest. No seed phrases, HTTP server, WASM or qcow2.
 * Installation application data: digest[32] | PIN length[1] | PIN[8..16].
 * Example experimental instance AID: F048544D4C3501 (not a registered production AID).
 */
public final class VaultDigestApplet extends Applet {
    private final byte[] root;
    private final OwnerPIN pin;

    private VaultDigestApplet(byte[] params, short offset, byte length) {
        short n=(short)(length & 0xff);
        if(n<41 || n>49) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        byte pinLength=params[(short)(offset+32)];
        if(pinLength<8 || pinLength>16 || n!=(short)(33+pinLength)) ISOException.throwIt(ISO7816.SW_WRONG_DATA);
        root=new byte[32];
        Util.arrayCopyNonAtomic(params,offset,root,(short)0,(short)32);
        pin=new OwnerPIN((byte)3,(byte)16);
        pin.update(params,(short)(offset+33),pinLength);
        register();
    }
    // Check a length-prefixed field before advancing a short cursor or reading again.
    private static short skipField(byte[] params,short cursor,short end) {
        if(cursor>=end) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        short count=(short)(params[cursor++]&0xff);
        if(count>(short)(end-cursor)) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        return (short)(cursor+count);
    }
    public static void install(byte[] params,short offset,byte length) {
        short n=(short)(length&0xff);
        if(params==null || offset<0 || n<3 || offset>params.length
                || n>params.length-offset || n>32767-offset) {
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        }
        short end=(short)(offset+n);
        short cursor=skipField(params,offset,end); // instance AID
        cursor=skipField(params,cursor,end);       // opaque control information
        if(cursor>=end) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        byte appLength=params[cursor++];
        if((short)(end-cursor)!=(short)(appLength&0xff)) ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        new VaultDigestApplet(params,cursor,appLength);
    }
    @Override public boolean select() { pin.reset(); return true; }
    @Override public void deselect() { pin.reset(); }
    private void reject(short status) { pin.reset(); ISOException.throwIt(status); }
    private short receive(APDU apdu,short maximum) {
        short count=apdu.setIncomingAndReceive(),length=apdu.getIncomingLength();
        if(length<0 || length>maximum || count<0 || count>length) reject(ISO7816.SW_WRONG_LENGTH);
        while(count<length) {
            short n=apdu.receiveBytes((short)(ISO7816.OFFSET_CDATA+count));
            if(n<=0 || n>(short)(length-count)) reject(ISO7816.SW_WRONG_LENGTH);
            count=(short)(count+n);
        }
        if(count!=length) reject(ISO7816.SW_WRONG_LENGTH);
        return count;
    }
    @Override public void process(APDU apdu) {
        if(selectingApplet())return;
        byte[] buf=apdu.getBuffer();
        if(buf[ISO7816.OFFSET_CLA]!=(byte)0x80) reject(ISO7816.SW_CLA_NOT_SUPPORTED);
        if(buf[ISO7816.OFFSET_P1]!=0 || buf[ISO7816.OFFSET_P2]!=0) reject(ISO7816.SW_INCORRECT_P1P2);
        switch(buf[ISO7816.OFFSET_INS]) {
            case (byte)0x10: // READ ROOT, public integrity anchor, not a secret
                Util.arrayCopyNonAtomic(root,(short)0,buf,(short)0,(short)32);
                apdu.setOutgoingAndSend((short)0,(short)32);return;
            case (byte)0x20: // VERIFY PIN: even malformed attempts revoke any earlier grant
                pin.reset();
                short n=receive(apdu,(short)16);
                if(n<8) reject(ISO7816.SW_WRONG_LENGTH);
                if(!pin.check(buf,ISO7816.OFFSET_CDATA,(byte)n)) reject((short)(0x63C0|pin.getTriesRemaining()));
                return;
            case (byte)0x30: // SET ROOT: consume one grant before receiving or starting a transaction
                boolean authorized=pin.isValidated();
                pin.reset();
                if(!authorized) reject(ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED);
                if(receive(apdu,(short)32)!=32) reject(ISO7816.SW_WRONG_LENGTH);
                JCSystem.beginTransaction();
                try {
                    Util.arrayCopy(buf,ISO7816.OFFSET_CDATA,root,(short)0,(short)32);
                    JCSystem.commitTransaction();
                } catch(RuntimeException failure) {
                    // Abort only a transaction started above; beginTransaction failures occur outside this block.
                    if(JCSystem.getTransactionDepth()!=0) JCSystem.abortTransaction();
                    throw failure;
                }
                return;
            default: reject(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }
}
