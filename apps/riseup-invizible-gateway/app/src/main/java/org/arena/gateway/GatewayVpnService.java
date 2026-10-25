package org.arena.gateway;

import android.content.Intent;
import android.net.VpnService;
import android.util.Log;

/**
 * The single VpnService front-end of the combined app.
 *
 * Android permits exactly one active VPN, which is the architectural
 * reason a "Riseup VPN + InviZible" combination must be one service
 * orchestrating modes (provider tunnel / Tor+DNSCrypt / combined)
 * rather than two apps. This scaffold validates and stages the
 * unified profile from GatewayConfig and logs the TUN parameters it
 * *would* apply. It deliberately does NOT call Builder.establish():
 * with no tunnel engine bundled (OpenVPN/Tor/DNSCrypt binaries live
 * in the GPL upstreams), establishing a TUN would blackhole device
 * traffic while protecting nothing. A production fork wires the
 * engines behind this class and establishes the interface then.
 */
public class GatewayVpnService extends VpnService {

    public static final String EXTRA_MODE = "org.arena.gateway.MODE";
    private static final String TAG = "GatewayVpnService";

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String mode = intent != null ? intent.getStringExtra(EXTRA_MODE) : "combined";
        GatewayConfig config = new GatewayConfig(mode, false, false, false, "cloudflare");

        Builder builder = new Builder()
                .setSession("Riseup x InviZible Gateway (" + config.mode + ")")
                .addAddress("10.66.0.2", 24)
                .addRoute("0.0.0.0", 0)
                .setMtu(1400)
                .setBlocking(false);
        if (config.useDnscrypt()) {
            builder.addDnsServer("127.0.0.1");
        }
        // NOTE: builder.establish() is intentionally not called in this
        // scaffold (see class comment). The staged parameters above are
        // the exact profile the engine-backed build will apply.
        Log.i(TAG, "staged profile mode=" + config.mode
                + " dnsMode=" + config.dnsMode()
                + " warnings=" + config.warnings.size());
        stopSelf();
        return START_NOT_STICKY;
    }
}
