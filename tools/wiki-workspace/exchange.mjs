import { createHash } from 'node:crypto';
import { SOURCE_DATE, sha256 } from './catalog.mjs';

export function xmlEscape(value) {
  // XML 1.0 excludes NUL and most C0 controls, including inside CDATA.
  return String(value).toWellFormed().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '\uFFFD')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function date(value) { const d = new Date(value || SOURCE_DATE); return Number.isNaN(d.getTime()) ? SOURCE_DATE : d.toISOString(); }
const twDate = value => date(value).replace(/[-:TZ.]/g,'');

/** Accept the existing browser's exported JSON; never execute imported tiddler modules. */
export function readExchange(value) {
  if (!value || value.format !== 'wikiinajar-jar' || value.version !== 1 || !value.pages || Array.isArray(value.pages)) {
    throw new Error('Expected wikiinajar-jar version 1 JSON (Export jar in the browser wiki)');
  }
  return Object.entries(value.pages).filter(([,p]) => p && !p.deleted).map(([title,p]) => {
    if (typeof p.body !== 'string' || !title.trim() || title.length > 4096) throw new Error('Invalid page title or body');
    const history = (Array.isArray(p.history) ? p.history : []).filter(h => h && typeof h.body === 'string').map(h => ({body:h.body,updated:date(h.updated)}));
    history.sort((a,b) => a.updated.localeCompare(b.updated));
    return {title,body:p.body,updated:date(p.updated),history,sourceType:'wikiinajar'};
  }).sort((a,b) => a.title.localeCompare(b.title));
}

// The two wiki dialects differ. Preserve arbitrary source exactly as text/plain.
// A TiddlyWiki tiddler's text is NEVER automatically treated as a module/plugin.
export function toTiddlers(pages, {maxSourceBytes=Infinity}={}) {
  const used = new Set();
  const titleById = new Map(pages.filter(p => p.id).map(p => [p.id,p.title]));
  const twList = ids => (ids || []).map(id => titleById.get(id)).filter(Boolean).map(t => '[['+t.replace(/\]\]/g, '%5D%5D')+']]').join(' ');
  return pages.map(p => {
    let title = p.title.startsWith('$:/') ? 'Imported/'+p.title : p.title;
    if (used.has(title)) title += ' '+sha256(p.title).slice(0,12);
    used.add(title);
    const clipped=!!p.path && Buffer.byteLength(p.body)>maxSourceBytes;
    const text=clipped?Buffer.from(p.body).subarray(0,maxSourceBytes).toString('utf8').replace(/\uFFFD$/, '')+'\n\n[Native TiddlyWiki preview truncated. Exact source bytes are in the accompanying JAR vault.]\n':p.body;
    const fields = {title,type:'text/plain',text,created:twDate(p.history?.[0]?.updated || p.updated),modified:twDate(p.updated),
      tags:'Repository', 'original-title':p.title};
    if (p.path) Object.assign(fields, {'source-path':p.path,'source-repository':p.repo,'source-sha256':p.sha256,'source-bytes':String(p.size),
      'source-truncated':String(p.truncated||clipped),'source-id':p.id,'source-links':JSON.stringify(p.links), 'source-backlinks':JSON.stringify(p.backlinks),
      'source-link-titles':twList(p.links), 'source-backlink-titles':twList(p.backlinks), 'source-references':(p.references || []).join('\n')});
    if (p.history?.length) fields['wikiinajar-history'] = JSON.stringify(p.history);
    return fields;
  });
}

/** Safe Main-namespace titles, preserving the original in the returned mapping. */
export function mediaWikiTitles(pages) {
  const used = new Set();
  return pages.map(p => {
    let title = p.title.replace(/[\u0000-\u001f\u007f%#<>\[\]{}|:]/g,'_').replace(/_/g,' ').replace(/\s+/g,' ').trim();
    if (!title) title = 'Untitled';
    // Import into the Main namespace only; no hidden File/MediaWiki/User side effects.
    title = 'Repository/'+title;
    const chars=Array.from(title);
    while (Buffer.byteLength(chars.join('')) > 220) chars.pop();
    title=chars.join('');
    if (title !== 'Repository/'+p.title || used.has(title)) title += ' '+sha256(p.title).slice(0,16);
    if (used.has(title)) throw new Error('Duplicate page title');
    used.add(title); return {original:p.title,title};
  });
}
function mwBody(p, body, titleMap) {
  if (p.sourceType === 'wikiinajar') {
    return body.replace(/\[\[(https?:\/\/[^|\]\s]+)\|([^\]]*)\]\]/g,'[$1 $2]')
      .replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g,(original,target,label)=>{
        const cleaned=target.replace(/^wiki:/i,'');
        const [page,...anchor]=cleaned.split('#'),mapped=titleMap.get(page);
        return mapped?'[['+mapped+(anchor.length?'#'+anchor.join('#'):'')+'|'+(label??page)+']]':original;
      });
  }
  // Source pages are displayed literally, not interpreted as templates or categories.
  return '<pre>'+body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre>';
}
export function toMediaWiki(pages) {
  const mapping = mediaWikiTitles(pages);
  const titleMap=new Map(mapping.map(p=>[p.original,p.title]));
  let revisionId = 0;
  const chunks = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<mediawiki xmlns="http://www.mediawiki.org/xml/export-0.11/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.mediawiki.org/xml/export-0.11/ https://www.mediawiki.org/xml/export-0.11.xsd" version="0.11" xml:lang="en">',
    '<siteinfo><sitename>Repository Wiki</sitename><dbname>repositorywiki</dbname><base>https://example.invalid/wiki/</base><generator>Html5 wiki-workspace 1</generator><case>case-sensitive</case><namespaces><namespace key="0" case="case-sensitive" /></namespaces></siteinfo>'];
  pages.forEach((p,i) => {
    chunks.push(`<page><title>${xmlEscape(mapping[i].title)}</title><ns>0</ns><id>${i+1}</id>`);
    for (const rev of [...(p.history || []),{body:p.body,updated:p.updated}]) {
      const body = mwBody(p, rev.body, titleMap).toWellFormed().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'\uFFFD');
      const sha1 = BigInt('0x'+createHash('sha1').update(body).digest('hex')).toString(36).padStart(31,'0');
      chunks.push(`<revision><id>${++revisionId}</id><timestamp>${date(rev.updated).replace(/\.\d{3}Z$/,'Z')}</timestamp><contributor><username>Repository import</username></contributor><comment>Original title: ${xmlEscape(p.title)}</comment><origin>${revisionId}</origin><model>wikitext</model><format>text/x-wiki</format><text bytes="${Buffer.byteLength(body)}" xml:space="preserve">${xmlEscape(body)}</text><sha1>${sha1}</sha1></revision>`);
    }
    chunks.push('</page>');
  });
  chunks.push('</mediawiki>');
  return {xml:chunks.join('\n')+'\n',mapping,warnings:[
    'Local import file only. Nothing was uploaded to Wikipedia, Wikimedia or Tiddlyhost.',
    'All titles use Repository/ in namespace 0; known internal page links are remapped. Review unresolved/dialect-specific links.',
    'Wiki-in-a-Jar image/DjVu/tag namespaces and contacts require a separate MediaWiki migration; media bytes are not in XML.',
    'TiddlyWiki source tiddlers use text/plain intentionally; this is not a lossless conversion between wiki renderers.'
  ]};
}
