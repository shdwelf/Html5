/*
 * MealPlanSim.java -- headless APDU bridge into the Java Card simulator.
 *
 * This is the missing half of the meal-plan verification. tests/mealplan-applet
 * .test.mjs compares the Java against js/mealplan-model.js on their constants;
 * that proves the two agree about what an APDU table looks like, but it cannot
 * prove they agree about what happens when you send one. Two implementations of
 * HMAC over the same bytes in a different order agree on every constant and
 * disagree on every MAC.
 *
 * So this program is the card and the Node driver is the issuer and the
 * terminal. tools/run_mealplan_sim.mjs computes the MACs using js/mealplan-model
 * .js, sends real APDUs down this bridge, and asserts on the responses the
 * converted applet actually produces. If the two sides disagree about anything
 * observable, it shows up here rather than on a real card in a cafeteria.
 *
 * The simulator is pro.javacard.vre.VRE, the Java Card Virtual Runtime
 * Environment from javacard.pro (jcardsim lineage), shipped in the Feitian
 * AppletPlayground repository as lib/vjcre.jar. It runs applets headlessly with
 * no smartcardio terminal and no X server, which is what makes it usable here.
 *
 * Protocol: one hex-encoded APDU per line on stdin, one hex-encoded response per
 * line on stdout. Blank lines and lines starting with '#' are ignored. A line
 * beginning with 'ERR' reports a simulator fault instead of a response, which is
 * deliberately distinguishable from a status word -- a thrown exception is not a
 * 6F00, and conflating the two would let a crash pass as a card answer.
 *
 * Usage: MealPlanSim <packageAID> <appletAID> <appData>
 *   All three hex, no separators. appData is the 44-byte provisioning block.
 */

import java.io.BufferedReader;
import java.io.BufferedOutputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;

import javacard.framework.AID;
import pro.javacard.vre.VRE;

import com.shdwelf.mealplan.MealPlanApplet;

public class MealPlanSim {

    private static final char[] DIGITS = "0123456789ABCDEF".toCharArray();

    static byte[] unhex(String s) {
        s = s.replaceAll("[^0-9A-Fa-f]", "");
        if ((s.length() & 1) != 0) throw new IllegalArgumentException("odd-length hex");
        byte[] out = new byte[s.length() / 2];
        for (int i = 0; i < out.length; i++) {
            out[i] = (byte) Integer.parseInt(s.substring(i * 2, i * 2 + 2), 16);
        }
        return out;
    }

    static String hex(byte[] b) {
        StringBuilder sb = new StringBuilder(b.length * 2);
        for (int i = 0; i < b.length; i++) {
            sb.append(DIGITS[(b[i] >> 4) & 0x0F]).append(DIGITS[b[i] & 0x0F]);
        }
        return sb.toString();
    }

    /**
     * Build a GlobalPlatform INSTALL FOR INSTALL parameter block:
     *   aidLen || instance AID || ctlLen || ctl || dataLen || appData
     *
     * This is the array the card manager hands to Applet.install(). It is also
     * the array that exposed a real bug: the first version of personalise()
     * assumed appData began at offset+1, which is where the AID is. It only
     * "worked" because the length check still passed.
     */
    static byte[] gpInstallArray(byte[] aid, byte[] appData) {
        byte[] b = new byte[1 + aid.length + 1 + 1 + appData.length];
        int i = 0;
        b[i++] = (byte) aid.length;
        System.arraycopy(aid, 0, b, i, aid.length);
        i += aid.length;
        b[i++] = 0;                      // no privileged control info
        b[i++] = (byte) appData.length;
        System.arraycopy(appData, 0, b, i, appData.length);
        return b;
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 3) {
            System.err.println("usage: MealPlanSim <packageAID> <appletAID> <appData>");
            System.exit(2);
        }

        PrintStream out = new PrintStream(new BufferedOutputStream(System.out), false, "UTF-8");
        byte[] pkgAid = unhex(args[0]);
        byte[] appAid = unhex(args[1]);
        byte[] appData = unhex(args[2]);

        // VRE's static initialiser registers a provider named "BC". The class on
        // this classpath is a JDK-backed shim, not BouncyCastle; see
        // tools/sim/bcshim/org/bouncycastle/jce/provider/BouncyCastleProvider.java.
        VRE vre = VRE.getInstance();

        // load() makes the package's classes known to the runtime and sets the
        // package context that register() needs. install(AID, boolean) would
        // then call Applet.install() with an array of its own making, carrying
        // no provisioning data at all, so the applet is installed directly.
        vre.load(MealPlanApplet.class, new AID(pkgAid, (short) 0, (byte) pkgAid.length));

        byte[] b = gpInstallArray(appAid, appData);
        try {
            // VRE's public install(AID, boolean) builds its own parameter block
            // out of the AID alone, carrying no provisioning data. And calling
            // MealPlanApplet.install() directly leaves VRE.currentApplet unset,
            // which is the key Applet.register() files the instance under -- so
            // it registers under a null AID and nothing can select it.
            //
            // Setting currentApplet first is what the card manager does around
            // INSTALL FOR INSTALL on real hardware. The applet stays unmodified;
            // this is the simulator's gap, not the applet's.
            java.lang.reflect.Field f = VRE.class.getDeclaredField("currentApplet");
            f.setAccessible(true);
            f.set(vre, new AID(appAid, (short) 0, (byte) appAid.length));
            MealPlanApplet.install(b, (short) 0, (byte) b.length);
        } catch (Throwable t) {
            Throwable c = (t instanceof java.lang.reflect.InvocationTargetException
                    && t.getCause() != null) ? t.getCause() : t;
            out.println("ERR install " + c.getClass().getSimpleName()
                    + (c.getMessage() == null ? "" : ": " + c.getMessage()));
            out.flush();
            c.printStackTrace(System.err);
            return;
        }

        // No default-applet marking step: VRE.install(AID, boolean) is the
        // GlobalPlatform entry point and re-derives a package Class from its own
        // registry, which is not the map Applet.register() just filed the
        // instance under. The instance is registered under its AID, which is all
        // SELECT needs.
        out.println("OK INSTALL " + appAid.length + "+" + appData.length
                + " crypto=" + (org.bouncycastle.jce.provider.BouncyCastleProvider.instantiated
                        ? "jdk-shim(" + org.bouncycastle.jce.provider.BouncyCastleProvider.importedServices + ")"
                        : "unresolved"));
        out.flush();

        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, "UTF-8"));
        String line;
        while ((line = in.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("#")) continue;
            try {
                byte[] resp = vre.transmit(unhex(line));
                out.println(hex(resp));
            } catch (Throwable t) {
                out.println("ERR transmit " + t.getClass().getSimpleName()
                        + (t.getMessage() == null ? "" : ": " + t.getMessage()));
            }
            out.flush();
        }
    }
}
