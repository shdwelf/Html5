(() => {
  "use strict";
  const signatures = [
    ["ZIP", [0x50,0x4b,0x03,0x04]], ["GIF87a", [71,73,70,56,55,97]], ["GIF89a", [71,73,70,56,57,97]],
    ["PNG", [137,80,78,71,13,10,26,10]], ["BMP", [66,77]], ["PCX (possible)", [10,5,1,8]], ["MZ executable", [77,90]]
  ];
  const $ = (id) => document.getElementById(id);
  const hex = (n) => "0x" + n.toString(16).toUpperCase().padStart(8, "0");
  const read16 = (view, offset) => view.getUint16(offset, true);
  function entropy(bytes) { const bins = new Uint32Array(256); for (const b of bytes) bins[b]++; let e=0; for (const n of bins) if(n) { const p=n/bytes.length; e-=p*Math.log2(p); } return e; }
  function findAll(bytes, needle) { const hits=[]; for(let i=0;i<=bytes.length-needle.length;i++) { let ok=true; for(let j=0;j<needle.length;j++) if(bytes[i+j]!==needle[j]) {ok=false;break;} if(ok) {hits.push(i); if(hits.length===100) break;} } return hits; }
  function strings(bytes) { const found=[]; let run=[]; const flush=()=>{ if(run.length>=5) found.push(String.fromCharCode(...run)); run=[]; }; for(const b of bytes) { if(b>=32 && b<127) run.push(b); else flush(); } flush(); return found.slice(0,300); }
  $("binary").addEventListener("change", async (event) => {
    const file=event.target.files[0]; if(!file) return;
    $("analyzer-state").textContent="ANALYZING…";
    const bytes=new Uint8Array(await file.arrayBuffer()); const view=new DataView(bytes.buffer);
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("");
    $("summary").hidden=false; $("summary").textContent=`${file.name} · ${bytes.length.toLocaleString()} bytes · SHA-256 ${hash} · entropy ${entropy(bytes).toFixed(3)} bits/byte`;
    const isMZ=bytes[0]===77 && bytes[1]===90;
    $("mz").hidden=false;
    $("mz-output").textContent=isMZ && bytes.length>=28 ? [
      `Signature: MZ`, `Bytes in last page: ${read16(view,2)}`, `Pages: ${read16(view,4)}`,
      `Relocations: ${read16(view,6)}`, `Header paragraphs: ${read16(view,8)} (${read16(view,8)*16} bytes)`,
      `Initial SS:SP: ${hex(read16(view,14))}:${hex(read16(view,16))}`, `Initial CS:IP: ${hex(read16(view,22))}:${hex(read16(view,20))}`,
      `Relocation table: ${hex(read16(view,24))}`].join("\n") : "Not a complete DOS MZ executable header.";
    const hits=[]; for(const [name, needle] of signatures) { const positions=findAll(bytes,needle); if(positions.length) hits.push(`${name}: ${positions.map(hex).join(", ")}${positions.length===100?" (truncated)":""}`); }
    $("signatures").hidden=false; $("signature-output").textContent=hits.join("\n") || "No known signatures found.";
    $("strings").hidden=false; $("string-output").textContent=strings(bytes).join("\n") || "No printable runs found.";
    $("analyzer-state").textContent="LOCAL REPORT READY";
  });
})();
