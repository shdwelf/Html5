# Internal catalog web server

`tools/z3950-server.mjs` is the browser-facing internal server for the inline catalog terminal. It converts the SRU portion of the PHP/browser split into a same-origin Node implementation:

```bash
npm run serve:catalog
# or
PORT=4180 npm run serve:catalog
```

It serves `apps/z3950-sru-gopher-terminal.html` at `/` and provides allow-listed endpoints:

- `GET /api/servers` — SRU target metadata
- `GET /api/sru?server=dnb&q=For%20Dummies` — bounded SRU proxy
- `GET /api/resources` — additional resource metadata
- `GET /api/fetch?resource=ucsb` — JSON envelope containing fetched page text and final URL
- `GET /api/proxy?resource=ucsb` — same-origin proxied page response
- `GET /go/ucsb` — allow-listed 302 redirect to the original URL

Resource fetches are restricted to the in-code allow-list and capped at 2 MB. This provides three alternatives for online use: open the provider directly, redirect through the local server, or fetch/proxy through the local server.

Only LOC and DNB SRU bases are accepted by the proxy. User input becomes a title query and is capped at 120 characters. Arbitrary URLs are rejected, which prevents turning the development server into an open proxy.

The static app automatically uses `/api/sru` when loaded over HTTP(S), avoiding browser CORS problems. When opened directly from a file or Webxdc, it falls back to the provider URL and explains that the browser may block the request.

This does not run PHP or emulate native Z39.50. The existing `tools/z3950-terminal.php` remains the PHP/YAZ path for native Z39.50 Search/Present. The Node server is a practical internal SRU server and serves the HTML5 terminal online without requiring PHP.
