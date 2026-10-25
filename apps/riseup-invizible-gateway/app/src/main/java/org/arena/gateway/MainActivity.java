package org.arena.gateway;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Single-screen UI for the combined gateway scaffold: pick one of the
 * three modes, see the optimised profile the shared GatewayConfig core
 * builds for it, and stage it in GatewayVpnService. The native engines
 * (OpenVPN / Tor / DNSCrypt binaries from the GPL upstreams) are not
 * bundled in this scaffold, and the screen says so.
 */
public class MainActivity extends Activity {

    private static final int VPN_REQUEST = 42;

    private TextView summary;
    private String pendingMode = "combined";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) (16 * getResources().getDisplayMetrics().density);
        root.setPadding(pad, pad, pad, pad);

        TextView title = new TextView(this);
        title.setText("Riseup × InviZible Gateway (scaffold)");
        title.setTextSize(18);
        root.addView(title);

        TextView note = new TextView(this);
        note.setText("One VpnService, three configurations. The tunnel engines "
                + "(OpenVPN/Tor/DNSCrypt) are not bundled in this scaffold build; "
                + "staging a profile does not route traffic yet.");
        root.addView(note);

        summary = new TextView(this);
        root.addView(summary);

        for (final String mode : new String[] {"combined", "vpn", "tor-dnscrypt"}) {
            Button b = new Button(this);
            b.setText("Stage profile: " + mode);
            b.setOnClickListener(v -> stageProfile(mode));
            root.addView(b);
        }

        setContentView(root);
        showProfile("combined");
    }

    private void showProfile(String mode) {
        GatewayConfig config = new GatewayConfig(mode, false, false, false, "cloudflare");
        StringBuilder sb = new StringBuilder();
        sb.append("mode: ").append(config.mode).append('\n');
        for (String d : config.decisions) {
            sb.append("• ").append(d).append('\n');
        }
        for (String w : config.warnings) {
            sb.append("⚠ ").append(w).append('\n');
        }
        summary.setText(sb.toString());
    }

    private void stageProfile(String mode) {
        pendingMode = mode;
        showProfile(mode);
        Intent prepare = VpnService.prepare(this);
        if (prepare != null) {
            startActivityForResult(prepare, VPN_REQUEST);
        } else {
            onActivityResult(VPN_REQUEST, RESULT_OK, null);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == VPN_REQUEST && resultCode == RESULT_OK) {
            Intent service = new Intent(this, GatewayVpnService.class);
            service.putExtra(GatewayVpnService.EXTRA_MODE, pendingMode);
            startService(service);
        }
    }
}
