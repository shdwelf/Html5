<?php
/**
 * Z39.50 HTML5 terminal and YAZ adapter.
 *
 * Requirements: PHP 8+, PECL YAZ (and the YAZ toolkit).
 * Run: php -S 127.0.0.1:8080 tools/z3950-terminal.php
 *
 * This is deliberately allow-listed. Do not turn an arbitrary-host form into
 * an open proxy. The browser UI talks to this same file; Z39.50 itself is
 * performed server-side because browsers cannot open TCP/210.
 */
declare(strict_types=1);

$servers = [
    [
        'id' => 'ucsb-cylinder', 'name' => 'UCSB Davidson Library · Cylinder Audio Archive', 'host' => 'cylinders.library.ucsb.edu',
        'port' => 443, 'database' => 'ALMA SRU / Cylinder Archive', 'syntax' => 'MARCXML',
        'region' => 'US', 'protocol' => 'SRU', 'archive' => 'https://cylinders.library.ucsb.edu/',
        'source' => 'https://cylinders.library.ucsb.edu/alma.php',
        'note' => 'Special Collections archive: 22,000+ cylinder titles and 650+ vernacular wax cylinders. Former Aleph Z39.50 was retired; current backend is Alma SRU.'
    ],
    [
        'id' => 'loc', 'name' => 'Library of Congress', 'host' => 'lx2.loc.gov',
        'port' => 210, 'database' => 'LCDB', 'syntax' => 'usmarc',
        'region' => 'US', 'source' => 'https://www.loc.gov/z3950/lcserver.html',
        'note' => 'Public; UTF-8 LC catalog; current official target.'
    ],
    [
        'id' => 'yale', 'name' => 'Yale University Library', 'host' => 'z3950.library.yale.edu',
        'port' => 7090, 'database' => 'Voyager', 'syntax' => 'usmarc',
        'region' => 'US', 'source' => 'https://kohasupport.com/knowledge-base/z3950-server-directory/',
        'note' => 'Directory-listed academic and rare-book target; verify access policy.'
    ],
    [
        'id' => 'mit', 'name' => 'MIT Libraries', 'host' => 'library.mit.edu',
        'port' => 9909, 'database' => 'MITILS', 'syntax' => 'usmarc',
        'region' => 'US', 'source' => 'https://kohasupport.com/knowledge-base/z3950-server-directory/',
        'note' => 'Directory-listed technical and scientific collections.'
    ],
    [
        'id' => 'purdue', 'name' => 'Purdue University Libraries', 'host' => 'na03.alma.exlibrisgroup.com',
        'port' => 1921, 'database' => '01PURDUE_PUWL', 'syntax' => 'usmarc',
        'region' => 'US', 'source' => 'https://answers.lib.purdue.edu/erm/faq/328412',
        'note' => 'Provider documents Purdue credentials; do not guess or store credentials.'
    ],
    [
        'id' => 'dnb', 'name' => 'Deutsche Nationalbibliothek', 'host' => 'z3950.dnb.de',
        'port' => 210, 'database' => 'dnb', 'syntax' => 'usmarc',
        'region' => 'DE', 'source' => 'https://kohasupport.com/knowledge-base/z3950-server-directory/',
        'note' => 'Directory-listed; verify target policy before production use.'
    ],
    [
        'id' => 'bnf', 'name' => 'Bibliothèque nationale de France', 'host' => 'z3950.bnf.fr',
        'port' => 2100, 'database' => 'BNF-SECO', 'syntax' => 'unimarc',
        'region' => 'FR', 'source' => 'https://kohasupport.com/knowledge-base/z3950-server-directory/',
        'note' => 'Directory-listed French target; UNIMARC.'
    ],
    [
        'id' => 'csic', 'name' => 'CSIC Library & Archive Network', 'host' => 'eu00.alma.exlibrisgroup.com',
        'port' => 210, 'database' => '34CSIC_INST', 'syntax' => 'usmarc',
        'region' => 'ES', 'source' => 'https://bibliotecas.csic.es/en/servidor-z3950',
        'note' => 'Official CSIC page states no authentication is required.'
    ],
    [
        'id' => 'oclc', 'name' => 'OCLC WorldCat', 'host' => 'zcat.oclc.org',
        'port' => 210, 'database' => 'OLUCWorldCat', 'syntax' => 'usmarc',
        'region' => 'INT', 'source' => 'https://help.oclc.org/Metadata_Services/Z3950_Cataloging/Get_started/Configuration_guide_for_OCLC_Z39.50_Cataloging',
        'note' => 'Production target; OCLC authorization is required.'
    ],
];

function json_response(mixed $payload, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}
function server_by_id(array $servers, string $id): array {
    foreach ($servers as $server) if ($server['id'] === $id) return $server;
    json_response(['error' => 'Unknown or disallowed server.'], 404);
}
function yaz_error_text(mixed $id): string {
    $error = function_exists('yaz_error') ? (string)yaz_error($id) : '';
    if ($error === '' && function_exists('yaz_errno')) $error = 'YAZ error '.yaz_errno($id);
    if (function_exists('yaz_addinfo')) {
        $extra = (string)yaz_addinfo($id);
        if ($extra !== '') $error .= ' ('.$extra.')';
    }
    return $error !== '' ? $error : 'Unknown YAZ error';
}
function z_search(array $server, string $term, string $field = 'title', int $start = 1, int $count = 10): array {
    if (!extension_loaded('yaz')) throw new RuntimeException('PHP YAZ extension is not installed. Install PECL YAZ and the YAZ toolkit.');
    $term = trim($term);
    if ($term === '' || strlen($term) > 160) throw new InvalidArgumentException('Search term must be 1–160 characters.');
    $use = ['title' => 4, 'author' => 1, 'any' => 1016][$field] ?? 4;
    $url = $server['host'].':'.$server['port'].'/'.$server['database'];
    $id = yaz_connect($url, ['persistent' => false, 'piggyback' => false, 'charset' => 'UTF-8']);
    if (!$id) throw new RuntimeException('Could not allocate a YAZ connection.');
    try {
        yaz_syntax($id, $server['syntax']);
        yaz_element($id, 'F');
        $rpn = '@attr 1='.$use.' "'.str_replace(['\\', '"'], ['\\\\', '\\"'], $term).'"';
        if (!yaz_search($id, 'rpn', $rpn)) throw new RuntimeException('Could not queue search: '.yaz_error_text($id));
        yaz_wait();
        if ($error = yaz_error($id)) throw new RuntimeException((string)$error.' '.(string)yaz_addinfo($id));
        $hits = (int)yaz_hits($id);
        $start = max(1, $start); $count = min(20, max(1, $count));
        if ($hits > 0) {
            yaz_range($id, $start, $count);
            yaz_present($id);
            yaz_wait();
            if ($error = yaz_error($id)) throw new RuntimeException((string)$error.' '.(string)yaz_addinfo($id));
        }
        $records = [];
        for ($i = 1; $i <= min($count, $hits); $i++) {
            $record = yaz_record($id, $i, 'array');
            if ($record !== false && $record !== null) $records[] = $record;
        }
        return ['server' => $server, 'hits' => $hits, 'start' => $start, 'records' => $records];
    } finally { yaz_close($id); }
}
function tcp_check(array $server): array {
    $started = microtime(true); $errno = 0; $errstr = '';
    $protocol = $server['protocol'] ?? 'Z39.50';
    $socket = @fsockopen($server['host'], $server['port'], $errno, $errstr, 4.0);
    $ms = (int)round((microtime(true) - $started) * 1000);
    if ($socket) { fclose($socket); return ['ok' => true, 'latency_ms' => $ms, 'message' => $protocol.' transport reachable']; }
    return ['ok' => false, 'latency_ms' => $ms, 'message' => $errstr ?: 'connection failed', 'errno' => $errno];
}

$api = $_GET['api'] ?? '';
if ($api === 'servers') json_response(['servers' => $servers, 'generated_at' => gmdate('c')]);
if ($api === 'random') json_response(['server' => $servers[random_int(0, count($servers) - 1)]]);
if ($api === 'check') json_response(['server' => ($s = server_by_id($servers, (string)($_GET['server'] ?? ''))), 'check' => tcp_check($s)]);
if ($api === 'search') {
    try { json_response(z_search(server_by_id($servers, (string)($_POST['server'] ?? '')), (string)($_POST['term'] ?? ''), (string)($_POST['field'] ?? 'title'))); }
    catch (Throwable $e) { json_response(['error' => $e->getMessage()], 422); }
}
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Z39.50 Terminal</title>
<style>
/* CSS Zen Garden-inspired: the content is semantic and the presentation is replaceable. */
:root{--ink:#dce7e4;--dim:#8ba29e;--bg:#07100f;--panel:#0d1b18;--line:#25433b;--mint:#77f2c2;--amber:#ffd166;--red:#ff718d}*{box-sizing:border-box}body{margin:0;background:linear-gradient(135deg,#07100f,#0d201d 55%,#122b25);color:var(--ink);font:14px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.terminal{max-width:1160px;margin:auto;padding:28px 20px 55px}.mast{border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:18px}.eyebrow{color:var(--mint);letter-spacing:.17em;font-size:11px}.mast h1{font:800 clamp(31px,6vw,68px)/.95 Georgia,serif;letter-spacing:-.06em;margin:12px 0;color:#f5fff9}.mast p{color:var(--dim);max-width:760px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.pane{border:1px solid var(--line);background:#091613dd;border-radius:5px;padding:17px;box-shadow:7px 7px 0 #0003}.pane h2{font:700 19px Georgia,serif;margin:0 0 10px;color:var(--amber)}.server{border-top:1px dashed var(--line);padding:10px 0;display:grid;grid-template-columns:1fr auto;gap:5px}.server:first-child{border-top:0}.server small{color:var(--dim);grid-column:1/-1}.server button,button{font:inherit;color:var(--ink);background:#142d27;border:1px solid #386456;border-radius:3px;padding:7px 10px;cursor:pointer}.server button:hover,button:hover{color:#06100d;background:var(--mint)}.server.selected{outline:1px solid var(--mint);background:#102821}.tag{color:var(--mint)}.status{color:var(--dim);font-size:12px}.ok{color:var(--mint)}.bad{color:var(--red)}.controls{display:grid;grid-template-columns:1fr 120px auto;gap:8px;margin:13px 0}input,select{background:#06100e;color:var(--ink);border:1px solid var(--line);padding:9px;border-radius:3px;font:inherit;width:100%}.dice{font-size:22px;border-color:var(--amber)}pre{min-height:105px;max-height:270px;overflow:auto;white-space:pre-wrap;background:#040908;color:#a7c8bd;padding:12px;border-left:3px solid var(--mint);font-size:12px}.record{border-top:1px solid var(--line);padding:10px 0}.record b{color:var(--mint)}a{color:var(--mint)}.full{grid-column:1/-1}.foot{color:var(--dim);font-size:11px;margin-top:15px}@media(max-width:760px){.grid{display:block}.pane{margin-bottom:15px}.controls{grid-template-columns:1fr}.server{grid-template-columns:1fr}.server button{justify-self:start}}
</style></head><body><main class="terminal"><header class="mast"><div class="eyebrow">ORIGIN → TARGET / HTML5 TERMINAL</div><h1>Z39.50 / diceware catalog</h1><p>Discoverable server directory, native YAZ search adapter, TCP health checks, and a single die for choosing where the next query goes.</p></header><div class="grid"><section class="pane"><h2>01 / targets</h2><p class="status">Allow-listed records gathered from provider documentation and catalog directories. “Reachable” means TCP only; it does not guarantee Search or Present.</p><div id="servers">Loading directory…</div><button class="dice" id="roll" title="Choose a random server">⚄ Roll the target die</button></section><section class="pane"><h2>02 / search terminal</h2><p class="status">PHP YAZ executes Z39.50 server-side. Browser-only static hosting cannot open port 210.</p><form id="search"><div class="controls"><input name="term" value="neural networks" maxlength="160" placeholder="search term"><select name="field"><option value="title">title</option><option value="author">author</option><option value="any">any Bib-1</option></select><button>Transmit</button></div></form><pre id="console">Awaiting target selection…</pre><div id="records"></div></section><section class="pane full"><h2>03 / investigation notes</h2><p><span class="tag">Initialize</span> negotiates the association. <span class="tag">Search</span> sends a Bib-1 RPN query. <span class="tag">Present</span> retrieves records in the configured syntax. The YAZ PHP extension exposes these operations through <code>yaz_connect</code>, <code>yaz_search</code>, <code>yaz_wait</code>, <code>yaz_present</code>, and <code>yaz_record</code>.</p><p class="status">Current evidence: Library of Congress <code>lx2.loc.gov:210/LCDB</code> and OCLC <code>zcat.oclc.org:210/OLUCWorldCat</code> were TCP-checked from this workspace on 2026-09-28. Other targets are discoverable candidates and should be checked before use.</p><p class="status">Sources: <a href="https://www.loc.gov/z3950/lcserver.html">LOC configuration</a> · <a href="https://www.loc.gov/z3950/agency/resources/testport.html">LOC testing hosts</a> · <a href="https://bibliotecas.csic.es/en/servidor-z3950">CSIC server</a> · <a href="https://help.oclc.org/Metadata_Services/Z3950_Cataloging/Get_started/Configuration_guide_for_OCLC_Z39.50_Cataloging">OCLC guide</a> · <a href="https://www.php.net/manual/en/ref.yaz.php">PHP YAZ reference</a></p></section></div><footer class="foot">No credentials are stored. OCLC and other authenticated targets require authorized access. Respect provider terms, rate limits, and catalog policies.</footer></main>
<script>
let selected=null;const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){const data=await fetch('?api=servers').then(r=>r.json());$('#servers').innerHTML=data.servers.map(s=>`<div class="server" id="srv-${s.id}"><div><b>${esc(s.name)}</b> <span class="tag">${esc(s.region)} · ${esc(s.protocol||'Z39.50')}</span><small>${esc(s.host)}:${s.port}/${esc(s.database)} · ${esc(s.note)}</small><span class="status" id="stat-${s.id}">not checked</span></div><button data-id="${s.id}">check</button></div>`).join('');document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>check(b.dataset.id));}
async function check(id){const r=await fetch('?api=check&server='+encodeURIComponent(id)).then(x=>x.json()),st=$('#stat-'+id);st.textContent=r.check.ok?'● '+r.check.message+' ('+r.check.latency_ms+'ms)':'× '+r.check.message;st.className='status '+(r.check.ok?'ok':'bad');select(id);}
function select(id){document.querySelectorAll('.server').forEach(x=>x.classList.remove('selected'));$('#srv-'+id)?.classList.add('selected');selected=id;$('#console').textContent='Target locked: '+id+'\nReady to transmit.';}
$('#roll').onclick=async()=>{const r=await fetch('?api=random').then(x=>x.json());select(r.server.id);$('#console').textContent='🎲 Rolled: '+r.server.name+'\n'+r.server.host+':'+r.server.port+'/'+r.server.database+'\nUse “check” or transmit a query.'};
$('#search').onsubmit=async e=>{e.preventDefault();if(!selected){$('#console').textContent='No target. Roll the die first.';return}$('#console').textContent='Opening Z-association…\nSending RPN query…';const body=new URLSearchParams(new FormData(e.target));body.set('server',selected);const r=await fetch('?api=search',{method:'POST',body}).then(x=>x.json());if(r.error){$('#console').textContent='ERROR: '+r.error;$('#records').innerHTML='';return}$('#console').textContent='Search complete\nTarget: '+r.server.name+'\nHits: '+r.hits+'\nRecords returned: '+r.records.length;$('#records').innerHTML=r.records.map((x,i)=>`<div class="record"><b>record ${i+1}</b><pre>${esc(JSON.stringify(x,null,2))}</pre></div>`).join('')||'<p class="status">No records returned.</p>'};load();
</script></body></html>
