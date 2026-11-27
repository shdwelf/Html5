package org.arena.gateway;

import android.app.Activity;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;

/** Offline architecture preview. Never asks to replace the user's working VPN. */
public class MainActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this);
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) (20 * getResources().getDisplayMetrics().density); root.setPadding(pad, pad, pad, pad); scroll.addView(root);
        TextView title = new TextView(this); title.setText("Gateway Planner — NOT a VPN"); title.setTextSize(23); root.addView(title);
        TextView notice = new TextView(this); notice.setText(GatewayConfig.PLAN_WARNING + "\n\nThis build is offline and has no VPN permission entry point. Your existing VPN is not changed. Do not configure this planner as always-on.\n\nChoose one provider and one InviZible channel. I2P is a separate destination network. A shared interface does not create a tested packet path."); root.addView(notice);
        Spinner mode = picker(root, "Planned mode", new String[] {"combined", "vpn", "tor-dnscrypt"});
        Spinner provider = picker(root, "Alternative provider engine", new String[] {"proton-wireguard", "bitmask", "wireguard"});
        Spinner channel = picker(root, "InviZible alternative channel", new String[] {"stable", "beta"});
        CheckBox i2p = new CheckBox(this); i2p.setText("Include an I2P destination-network plan (not clearnet routing)"); root.addView(i2p);
        TextView output = new TextView(this); output.setTextIsSelectable(true); output.setTextSize(12);
        Button preview = new Button(this); preview.setText("Preview plan — does not connect"); root.addView(preview);
        preview.setOnClickListener(v -> {
            GatewayConfig plan = new GatewayConfig(mode.getSelectedItem().toString(), provider.getSelectedItem().toString(), channel.getSelectedItem().toString(), false, i2p.isChecked(), false, "cloudflare", java.util.Collections.emptyList());
            output.setText(plan.toJson()); output.announceForAccessibility("Plan generated. No connection or protection is active.");
        });
        TextView research = new TextView(this); research.setText("Research: docs/android-vpn-i2p-kodachi-research-2026-11-17.md in shdwelf/Html5. No private keys, provider accounts or configuration imports belong in this planner."); root.addView(research);
        root.addView(output); setContentView(scroll);
    }
    private Spinner picker(LinearLayout root, String label, String[] choices) {
        TextView text = new TextView(this); text.setText(label); root.addView(text);
        Spinner spinner = new Spinner(this); spinner.setContentDescription(label);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, choices);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item); spinner.setAdapter(adapter); root.addView(spinner); return spinner;
    }
}
