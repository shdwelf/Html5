package org.html5.card.testing;

import com.licel.jcardsim.base.Simulator;
import javacard.framework.AID;
import javacard.framework.Applet;
import javacard.framework.APDU;
import javacard.framework.ISOException;
import javacard.framework.JCSystem;
import javacard.framework.Util;
import org.html5.card.VaultDigestApplet;
import javax.smartcardio.CommandAPDU;
import javax.smartcardio.ResponseAPDU;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** In-memory tests only. No TerminalFactory, physical card, CAP loader or network service. */
public final class VaultDigestSimulation {
    private static final byte[] AID_BYTES=hex("F048544D4C3501");
    // Synthetic test vector, NOT an applet default or a deployable/provisioning PIN.
    private static final byte[] TEST_PIN=hex("0011223344556677");
    private static final byte[] ORIGINAL=filled(32,(byte)0x41), UPDATED=filled(32,(byte)0x62);
    private static final List<String> results=new ArrayList<String>();
    private static int failures;
    private interface Check { void run() throws Exception; }

    private static byte[] hex(String value) {
        byte[] out=new byte[value.length()/2];
        for(int i=0;i<out.length;i++)out[i]=(byte)Integer.parseInt(value.substring(i*2,i*2+2),16);
        return out;
    }
    private static byte[] filled(int n,byte value) { byte[] b=new byte[n];Arrays.fill(b,value);return b; }
    private static void require(boolean condition,String message) { if(!condition)throw new AssertionError(message); }
    private static void equal(byte[] a,byte[] b) { require(Arrays.equals(a,b),"Unexpected response data"); }
    private static void sw(ResponseAPDU result,int expected) {
        require(result.getSW()==expected,String.format("Expected SW %04X, got %04X",expected,result.getSW()));
        if(expected!=0x9000)require(result.getData().length==0,"Error response leaked data");
    }
    private static String quote(String value) {
        return "\""+value.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r")+"\"";
    }
    private static void run(String scope,String name,Check check) {
        String error=null;
        try { check.run(); } catch(Throwable t) { failures++;error=t.getClass().getSimpleName()+": "+t.getMessage(); }
        results.add("{\"scope\":"+quote(scope)+",\"name\":"+quote(name)+",\"passed\":"+(error==null)+(error==null?"":",\"error\":"+quote(error))+"}");
        System.out.println((error==null?"PASS ":"FAIL ")+scope+" / "+name+(error==null?"":" / "+error));
    }
    private static byte[] installData(byte[] pin,int prefix,int controls) {
        int appLength=33+pin.length;
        byte[] params=new byte[prefix+1+AID_BYTES.length+1+controls+1+appLength+3];
        int p=prefix;params[p++]=(byte)AID_BYTES.length;
        System.arraycopy(AID_BYTES,0,params,p,AID_BYTES.length);p+=AID_BYTES.length;
        params[p++]=(byte)controls;Arrays.fill(params,p,p+controls,(byte)0x5a);p+=controls;
        params[p++]=(byte)appLength;
        System.arraycopy(ORIGINAL,0,params,p,32);p+=32;
        params[p++]=(byte)pin.length;System.arraycopy(pin,0,params,p,pin.length);
        return params;
    }
    private static void installRejected(byte[] params,short offset,byte length,int status) {
        try { VaultDigestApplet.install(params,offset,length);throw new AssertionError("Malformed installation accepted"); }
        catch(ISOException e) { require((e.getReason()&0xffff)==status,"Wrong install rejection status"); }
    }
    private static final class Fixture {
        final Simulator sim=new Simulator();final AID aid=new AID(AID_BYTES,(short)0,(byte)AID_BYTES.length);final byte[] pin;
        Fixture() { this(TEST_PIN,0,0); }
        Fixture(byte[] value,int prefix,int controls) {
            pin=value.clone();sim.resetRuntime();
            if(JCSystem.getTransactionDepth()!=0)JCSystem.abortTransaction();
            byte[] params=installData(pin,prefix,controls);
            sim.installApplet(aid,VaultDigestApplet.class,params,(short)prefix,(byte)(params.length-prefix-3));
            require(sim.selectApplet(aid),"Applet selection failed");
        }
        ResponseAPDU command(CommandAPDU cmd) { return new ResponseAPDU(sim.transmitCommand(cmd.getBytes())); }
        ResponseAPDU read() { return command(new CommandAPDU(0x80,0x10,0,0,32)); }
        ResponseAPDU verify(byte[] candidate) { return command(new CommandAPDU(0x80,0x20,0,0,candidate)); }
        ResponseAPDU write(byte[] value) { return command(new CommandAPDU(0x80,0x30,0,0,value)); }
        void authenticate() { sw(verify(pin),0x9000); }
        void unchanged() { ResponseAPDU r=read();sw(r,0x9000);equal(r.getData(),ORIGINAL); }
    }

    /** A characterization probe, not part of the production applet or a CAP. */
    public static final class LeProbe extends Applet {
        public static void install(byte[] p,short o,byte n) { new LeProbe().register(); }
        public void process(APDU apdu) {
            if(selectingApplet())return;
            short le=apdu.setOutgoing();apdu.setOutgoingLength((short)2);
            byte[] b=apdu.getBuffer();b[0]=(byte)(le>>8);b[1]=(byte)le;apdu.sendBytes((short)0,(short)2);
        }
    }
    public static void main(String[] args) throws Exception {
        run("applet","install/select/public digest",()->{Fixture f=new Fixture();f.unchanged();});
        run("applet","offset and opaque control-info installation",()->{Fixture f=new Fixture(filled(16,(byte)0x36),7,3);f.authenticate();f.unchanged();});
        run("install-parser","null buffer rejected with ISO status",()->installRejected(null,(short)0,(byte)51,0x6700));
        run("install-parser","negative offset rejected with ISO status",()->installRejected(new byte[60],(short)-1,(byte)51,0x6700));
        run("install-parser","array overrun rejected with ISO status",()->installRejected(new byte[]{7,0,0},(short)0,(byte)51,0x6700));
        run("install-parser","short offset arithmetic cannot wrap",()->{
            byte[] p=new byte[32767];p[32764]=(byte)255;installRejected(p,(short)32764,(byte)3,0x6700);
        });
        run("install-parser","missing or oversized container fields",()->{
            installRejected(new byte[0],(short)0,(byte)0,0x6700);
            installRejected(new byte[]{5,0,0},(short)0,(byte)3,0x6700);
            installRejected(new byte[]{0,5,0},(short)0,(byte)3,0x6700);
            installRejected(new byte[]{0,0,42},(short)0,(byte)3,0x6700);
        });
        run("install-parser","application length and PIN bounds",()->{
            byte[] p=installData(TEST_PIN,0,0);p[9]=40;installRejected(p,(short)0,(byte)(p.length-3),0x6700);
            p=installData(TEST_PIN,0,0);p[42]=7;installRejected(p,(short)0,(byte)(p.length-3),0x6a80);
            p=installData(TEST_PIN,0,0);p[42]=17;installRejected(p,(short)0,(byte)(p.length-3),0x6a80);
        });
        run("applet","all supported PIN lengths 8 through 16",()->{
            for(int n=8;n<=16;n++){Fixture f=new Fixture(filled(n,(byte)n),0,0);f.authenticate();sw(f.write(UPDATED),0x9000);}
        });
        run("applet","unauthorized update does not change digest",()->{Fixture f=new Fixture();sw(f.write(UPDATED),0x6982);f.unchanged();});
        run("applet","verified update changes all 32 bytes",()->{
            Fixture f=new Fixture();f.authenticate();sw(f.write(UPDATED),0x9000);ResponseAPDU r=f.read();sw(r,0x9000);equal(r.getData(),UPDATED);require(JCSystem.getTransactionDepth()==0,"Transaction left open");
        });
        run("applet","successful update consumes authorization",()->{Fixture f=new Fixture();f.authenticate();sw(f.write(UPDATED),0x9000);sw(f.write(ORIGINAL),0x6982);});
        run("applet","wrong PIN decrements tries and stays blocked",()->{
            Fixture f=new Fixture();byte[] wrong=f.pin.clone();wrong[0]^=1;
            sw(f.verify(wrong),0x63c2);sw(f.verify(wrong),0x63c1);sw(f.verify(wrong),0x63c0);sw(f.verify(f.pin),0x63c0);sw(f.write(UPDATED),0x6982);f.unchanged();
        });
        run("applet","correct PIN restores retry budget",()->{
            Fixture f=new Fixture();byte[] wrong=f.pin.clone();wrong[1]^=1;
            sw(f.verify(wrong),0x63c2);f.authenticate();sw(f.verify(wrong),0x63c2);sw(f.write(UPDATED),0x6982);
        });
        run("applet","valid-size wrong PIN length counts as an attempt",()->{Fixture f=new Fixture();sw(f.verify(filled(9,(byte)0)),0x63c2);});
        run("applet","malformed VERIFY revokes an earlier grant",()->{
            for(int n:new int[]{7,17}){Fixture f=new Fixture();f.authenticate();sw(f.verify(filled(n,(byte)0)),0x6700);sw(f.write(UPDATED),0x6982);f.unchanged();}
        });
        run("applet","malformed SET consumes an earlier grant",()->{
            for(int n:new int[]{31,33}){Fixture f=new Fixture();f.authenticate();sw(f.write(filled(n,(byte)0)),0x6700);sw(f.write(UPDATED),0x6982);f.unchanged();}
        });
        run("applet","unsupported CLA revokes authorization",()->{
            Fixture f=new Fixture();f.authenticate();sw(f.command(new CommandAPDU(0,0x10,0,0,32)),0x6e00);sw(f.write(UPDATED),0x6982);
        });
        run("applet","invalid P1/P2 revoke authorization",()->{
            for(int[] p:new int[][]{{1,0},{0,1}}){Fixture f=new Fixture();f.authenticate();sw(f.command(new CommandAPDU(0x80,0x10,p[0],p[1],32)),0x6a86);sw(f.write(UPDATED),0x6982);}
        });
        run("applet","unknown INS revokes authorization",()->{
            Fixture f=new Fixture();f.authenticate();sw(f.command(new CommandAPDU(0x80,0x7f,0,0)),0x6d00);sw(f.write(UPDATED),0x6982);
        });
        run("applet","reselection revokes authorization",()->{Fixture f=new Fixture();f.authenticate();require(f.sim.selectApplet(f.aid),"Reselect failed");sw(f.write(UPDATED),0x6982);f.unchanged();});
        run("applet","reset then selection revokes authorization",()->{Fixture f=new Fixture();f.authenticate();f.sim.reset();require(f.sim.selectApplet(f.aid),"Select after reset failed");sw(f.write(UPDATED),0x6982);f.unchanged();});
        run("applet","selection and reset do not unblock a failed PIN",()->{
            Fixture f=new Fixture();byte[] wrong=filled(8,(byte)0x7f);sw(f.verify(wrong),0x63c2);sw(f.verify(wrong),0x63c1);sw(f.verify(wrong),0x63c0);
            f.sim.reset();require(f.sim.selectApplet(f.aid),"Select failed");sw(f.verify(f.pin),0x63c0);sw(f.write(UPDATED),0x6982);
        });
        run("applet","public reads do not refill the retry budget",()->{Fixture f=new Fixture();byte[] wrong=filled(8,(byte)0x7f);sw(f.verify(wrong),0x63c2);f.unchanged();sw(f.verify(wrong),0x63c1);});
        run("applet","transaction-start failure consumes authorization",()->{
            Fixture f=new Fixture();f.authenticate();JCSystem.beginTransaction();
            try {require(f.write(UPDATED).getSW()!=0x9000,"Nested transaction unexpectedly succeeded");}
            finally {if(JCSystem.getTransactionDepth()!=0)JCSystem.abortTransaction();}
            sw(f.write(UPDATED),0x6982);f.unchanged();
        });
        run("host-framing","JDK rejects a truncated short APDU before simulation",()->{
            try {new CommandAPDU(hex("80200000080011"));throw new AssertionError("Truncated APDU accepted");}
            catch(IllegalArgumentException expected) { }
        });
        run("simulator-limit","abort does not roll back persistent array data",()->{
            new Fixture();byte[] target={1};JCSystem.beginTransaction();Util.arrayCopy(new byte[]{2},(short)0,target,(short)0,(short)1);JCSystem.abortTransaction();
            require(target[0]==2,"Pinned simulator behavior changed: re-review rollback assumptions");
        });
        run("simulator-limit","Le is reported as 256 even for a request of 1",()->{
            Simulator s=new Simulator();s.resetRuntime();AID a=new AID(hex("F048544D4C3502"),(short)0,(byte)7);s.installApplet(a,LeProbe.class);require(s.selectApplet(a),"Probe selection failed");
            ResponseAPDU r=new ResponseAPDU(s.transmitCommand(new CommandAPDU(0x80,1,0,0,1).getBytes()));sw(r,0x9000);equal(r.getData(),new byte[]{1,0});
        });
        String report="{\"format\":\"wiki-javacard-simulator-tests\",\"version\":1,\"simulator\":\"jCardSim 2.2.2\",\"apiLevel\":\"JavaCard Classic 2.2.2 implementation\",\"tests\":"+results.size()+",\"passed\":"+(results.size()-failures)+",\"failed\":"+failures+",\"cases\":["+String.join(",",results)+"],\"notValidated\":[\"CAP conversion or verification\",\"Oracle/card-vendor SDK conformance\",\"physical cards or secure provisioning\",\"fragmented T=0/T=1 transport\",\"Le enforcement\",\"EEPROM rollback or power-loss durability\",\"constant-time PIN or crypto security\"]}";
        if(args.length>0)Files.write(Paths.get(args[0]),(report+"\n").getBytes(StandardCharsets.UTF_8));
        System.out.println("Result: "+(results.size()-failures)+"/"+results.size()+" checks passed; no physical cards accessed.");
        if(failures!=0)System.exit(1);
    }
}
