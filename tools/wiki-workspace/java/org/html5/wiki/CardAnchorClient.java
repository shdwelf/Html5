package org.html5.wiki;

import javax.smartcardio.*;
import java.util.List;

/** Explicit, read-only PC/SC host service for the JavaCard digest prototype.
 * Never invoked by the HTTP server. No PIN, private key or wallet data is logged.
 */
public final class CardAnchorClient {
    private static final byte[] AID={(byte)0xF0,0x48,0x54,0x4D,0x4C,0x35,0x01};
    public static CommandAPDU selectCommand() { return new CommandAPDU(0,0xA4,4,0,AID); }
    public static CommandAPDU readCommand() { return new CommandAPDU(0x80,0x10,0,0,32); }
    private static void check(ResponseAPDU response) throws CardException {
        if(response.getSW()!=0x9000) throw new CardException(String.format("Applet returned status %04X",response.getSW()));
    }
    public static void main(String[] args) throws Exception {
        if(args.length==0 || !(args[0].equals("--list") || (args[0].equals("--read") && args.length==2))) {
            System.err.println("Usage: java -cp more.wiki.in.a.jar org.html5.wiki.CardAnchorClient --list | --read TERMINAL_INDEX");
            System.exit(2);
        }
        List<CardTerminal> terminals;
        try { terminals=TerminalFactory.getDefault().terminals().list(); }
        catch(CardException e) { System.err.println("PC/SC unavailable; no card read was attempted.");System.exit(2);return; }
        if(args[0].equals("--list")) {
            if(terminals.isEmpty()) System.out.println("No smart-card readers available. Applet deployment is not configured.");
            for(int i=0;i<terminals.size();i++) System.out.println(i+": "+terminals.get(i).getName());
            return;
        }
        int index=Integer.parseInt(args[1]);
        if(index<0||index>=terminals.size()) throw new IllegalArgumentException("Unknown terminal index");
        Card card=terminals.get(index).connect("*");
        try {
            CardChannel channel=card.getBasicChannel();check(channel.transmit(selectCommand()));
            ResponseAPDU response=channel.transmit(readCommand());check(response);
            if(response.getData().length!=32) throw new CardException("Expected a 32-byte snapshot digest");
            StringBuilder digest=new StringBuilder();for(byte b:response.getData())digest.append(String.format("%02x",b&255));
            System.out.println("Card snapshot digest: "+digest);
        } finally { card.disconnect(false); }
    }
}
