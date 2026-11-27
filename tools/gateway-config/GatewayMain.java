import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.arena.gateway.GatewayConfig;

/** Offline plan CLI. No provider lookup, keys, connection or runnable configuration. */
public final class GatewayMain {
    private GatewayMain() { }
    private static boolean flag(String[] args, int index) {
        if (args.length <= index) return false;
        if (!"true".equals(args[index]) && !"false".equals(args[index])) throw new IllegalArgumentException("Boolean arguments must be true or false.");
        return Boolean.parseBoolean(args[index]);
    }
    public static void main(String[] args) throws Exception {
        if (args.length < 1 || args.length > 9) throw new IllegalArgumentException("usage: GatewayMain <outDir|--json> [mode] [bridges] [i2p] [lan] [provider] [stable|beta] [resolver] [packages,csv]");
        List<String> exceptions = args.length > 8 && !args[8].isEmpty() ? Arrays.asList(args[8].split(",", -1)) : Collections.<String>emptyList();
        GatewayConfig config = new GatewayConfig(args.length > 1 ? args[1] : "combined", args.length > 5 ? args[5] : "proton-wireguard", args.length > 6 ? args[6] : "stable", flag(args, 2), flag(args, 3), flag(args, 4), args.length > 7 ? args[7] : "cloudflare", exceptions);
        if ("--json".equals(args[0])) { System.out.print(config.toJson()); return; }
        Path out = Paths.get(args[0]); Files.createDirectories(out);
        write(out, "profile.json", config.toJson());
        write(out, "openvpn.plan.txt", config.openVpnDirectives());
        write(out, "wireguard.plan.txt", config.wireguardPlan());
        write(out, "tor.plan.txt", config.torrc());
        write(out, "dnscrypt.plan.txt", config.dnscryptToml());
        System.out.println(GatewayConfig.PLAN_WARNING);
    }
    private static void write(Path out, String name, String value) throws Exception {
        Files.write(out.resolve(name), value.getBytes(StandardCharsets.UTF_8));
    }
}
