package org.arena.gateway;

import android.content.Intent;
import android.net.VpnService;

/** Unregistered defensive stub. No consent, TUN, sockets, routes, daemon or logs. */
public final class GatewayVpnService extends VpnService {
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        stopSelf();
        return START_NOT_STICKY;
    }
}
