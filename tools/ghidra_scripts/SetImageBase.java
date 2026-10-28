/*
 * Optionally relocate a raw firmware image before analysis.
 *
 * Used as an analyzeHeadless -preScript with one argument: the desired
 * image base as hex (0x...) or decimal. The Evolution OS workflow only
 * passes it when a base address was explicitly staged; the script itself
 * never guesses. Evidence for a base comes from the image's own vector
 * table (tools/evolution-os/romz_probe.py records initial SP / reset PC).
 * Static only: it edits the program database's base address, nothing is
 * executed, emulated or patched in the input file.
 */
//@category Html5

import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;

public class SetImageBase extends GhidraScript {

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 1) {
            throw new IllegalArgumentException("usage: SetImageBase.java <base-address>");
        }
        String text = args[0].trim().toLowerCase();
        long offset = text.startsWith("0x")
            ? Long.parseUnsignedLong(text.substring(2), 16)
            : Long.parseUnsignedLong(text);
        Address base = currentProgram.getAddressFactory()
            .getDefaultAddressSpace().getAddress(offset);
        currentProgram.setImageBase(base, false);
        println("IMAGE_BASE set to " + base + " for " + currentProgram.getName());
    }
}
