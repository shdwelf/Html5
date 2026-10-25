import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.arena.gateway.GatewayConfig;

/**
 * CLI front-end for the combined gateway configuration core.
 *
 *   java -jar gateway-config.jar <outDir> [mode] [bridges] [i2p] [lan]
 *
 * Writes profile.json, client.ovpn, torrc and dnscrypt-proxy.toml for
 * the requested mode (defaults: combined, no bridges, no i2p, no LAN).
 * Compiled from the same GatewayConfig.java the Android app uses.
 */
public final class GatewayMain {

    private GatewayMain() {
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 1) {
            System.err.println("usage: GatewayMain <outDir> [vpn|tor-dnscrypt|combined] [bridges] [i2p] [lan]");
            System.exit(2);
        }
        Path out = Path.of(args[0]);
        String mode = args.length > 1 ? args[1] : "combined";
        boolean bridges = args.length > 2 && Boolean.parseBoolean(args[2]);
        boolean i2p = args.length > 3 && Boolean.parseBoolean(args[3]);
        boolean lan = args.length > 4 && Boolean.parseBoolean(args[4]);

        GatewayConfig config = new GatewayConfig(mode, bridges, i2p, lan, "cloudflare");
        Files.createDirectories(out);
        Files.writeString(out.resolve("profile.json"), config.toJson(), StandardCharsets.UTF_8);
        Files.writeString(out.resolve("client.ovpn"), config.openVpnDirectives(), StandardCharsets.UTF_8);
        Files.writeString(out.resolve("torrc"), config.torrc(), StandardCharsets.UTF_8);
        Files.writeString(out.resolve("dnscrypt-proxy.toml"), config.dnscryptToml(), StandardCharsets.UTF_8);
        System.out.println("mode=" + config.mode + " warnings=" + config.warnings.size());
        for (String d : config.decisions) {
            System.out.println("decision: " + d);
        }
        for (String w : config.warnings) {
            System.out.println("warning: " + w);
        }
    }
}
