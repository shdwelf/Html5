#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT, prepareDependencies, javaTool, walk, DEPENDENCIES } from './deps.mjs';
import { buildCatalog, mimeFor, sha256, SOURCE_DATE } from './catalog.mjs';
import { toMediaWiki, toTiddlers } from './exchange.mjs';
import { BROWSER_STORAGE_FILTER, DEFAULT_NATIVE_PREVIEW_BYTES } from './tiddlywiki/config.mjs';
import { buildDocs } from '../wikiinajar/md2wiki.mjs';
import { zipSync } from '../../vendor/fflate/index.mjs';

const args=process.argv.slice(2), repos=[{id:'Html5',root:ROOT}];
let fixture=false, noJava=false, twPreviewBytes=DEFAULT_NATIVE_PREVIEW_BYTES;
for(let i=0;i<args.length;i++) {
  if(args[i]==='--repo') {const value=args[++i],at=value?.indexOf('=');if(!value||at<1)throw new Error('Use --repo name=/absolute/checkout');repos.push({id:value.slice(0,at),root:path.resolve(value.slice(at+1))});}
  else if(args[i]==='--fixture')fixture=true;
  else if(args[i]==='--no-java')noJava=true;
  else if(args[i]==='--tw-preview-bytes') {twPreviewBytes=Number(args[++i]);if(!Number.isSafeInteger(twPreviewBytes)||twPreviewBytes<512||twPreviewBytes>96*1024)throw new Error('--tw-preview-bytes must be 512..98304');}
  else throw new Error('Usage: node tools/wiki-workspace/build.mjs [--repo id=/path] [--fixture] [--no-java] [--tw-preview-bytes 4096]');
}
if(new Set(repos.map(r=>r.id)).size!==repos.length)throw new Error('Duplicate repository ids');
if(fixture)repos[0].files=['README.md','src/lib/vaultfile.ts','wikiinajar.html','tools/wikiinajar/test/fixtures/boy.djvu','tools/wiki-workspace/README.md'];
const out=path.join(ROOT,'dist',fixture?'wiki-fixture':'wiki');
const work=path.join(ROOT,'build',fixture?'wiki-fixture':'wiki');
// Both paths are fixed children of this repository, never caller-supplied deletion targets.
rmSync(work,{recursive:true,force:true});rmSync(out,{recursive:true,force:true});
mkdirSync(work,{recursive:true});mkdirSync(out,{recursive:true});
const classes=path.join(work,'classes'),web=path.join(work,'web');mkdirSync(classes);mkdirSync(web);
const write=(name,body)=>{const dest=path.join(web,name);mkdirSync(path.dirname(dest),{recursive:true});writeFileSync(dest,body);};
console.log('Collecting source snapshot; private paths and generated caches are excluded…');
const {catalog,pages,blobs}=buildCatalog(repos);
console.log(`${catalog.totals.pages} pages; ${catalog.totals.excluded} exclusions; ${blobs.size} unique blobs (${catalog.totals.bytes.toLocaleString()} source bytes)`);
write('repository.json',JSON.stringify(catalog));
write('reader-index.tsv',pages.map(p=>p.id+'\t'+p.title).join('\n')+'\n');
for(const page of pages)write(`pages/${page.id}.txt`,page.body);
for(const [hash,entry] of blobs) {
  const target=path.join(web,'vault',hash);mkdirSync(path.dirname(target),{recursive:true});copyFileSync(entry.absolute,target);
  if(sha256(readFileSync(target))!==hash)throw new Error('Source changed while building: '+entry.absolute);
}
cpSync(path.join(ROOT,'tools/wiki-workspace/web'),path.join(web,'library'),{recursive:true});
// A separate legacy-style UI, not a rename of the old 0.8 JVM implementation.
write('wiki/index.html',readFileSync(path.join(ROOT,'wikiinajar.html')));
write('wiki/webxdc.js',readFileSync(path.join(ROOT,'webxdc.js')));
write('wiki/icon.png',readFileSync(path.join(ROOT,'icon.png')));
cpSync(path.join(ROOT,'tools/wikiinajar/public/skins/default/djvu-rs'),path.join(web,'wiki/djvu-rs'),{recursive:true});
write('wiki/media/djvu-smoke.djvu',readFileSync(path.join(ROOT,'tools/wikiinajar/test/fixtures/boy.djvu')));
write('wiki/media/demo.png',readFileSync(path.join(ROOT,'icon.png')));
const docs=buildDocs(pages.filter(p=>/\.md$/i.test(p.path)&&p.text&&!p.truncated).map(p=>({source:p.repo+'/'+p.path,markdown:p.body})));
write('wiki/docs.json',JSON.stringify({format:'wikiinajar-docs',version:1,count:docs.length,pages:docs}));
const mw=toMediaWiki(pages.map(p=>({...p,updated:SOURCE_DATE})));
write('exports/mediawiki.xml',mw.xml);
write('exports/conversion-report.json',JSON.stringify({snapshot:catalog.snapshot,pages:pages.length,mapping:mw.mapping,warnings:mw.warnings,libraryPreviewBytes:96*1024,nativePreviewBytes:twPreviewBytes,
  scope:'One preview page per eligible regular file. All exact source bytes are in JAR vault/. TiddlyWiki HTML/XDC contain previews and the catalog, not the complete binary vault.',
  excluded:catalog.excluded},null,2));
const tiddlers=toTiddlers(pages.map(p=>({...p,updated:SOURCE_DATE})));
write('exports/tiddlers.json',JSON.stringify(tiddlers));

// Build the real pinned TiddlyWiki engine, not a lookalike HTML page.
const twRoot=path.join(work,'tiddlywiki');mkdirSync(path.join(twRoot,'tiddlers'),{recursive:true});
writeFileSync(path.join(twRoot,'tiddlywiki.info'),JSON.stringify({description:'Repository wiki',plugins:['tiddlywiki/browser-storage'],themes:['tiddlywiki/vanilla','tiddlywiki/snowwhite'],build:{index:['--rendertiddler','$:/core/save/all','tiddlywiki.html','text/plain']}}));
const home={title:'Repository Home',type:'text/vnd.tiddlywiki',tags:'Guide',text:
  '! Repository wiki\n'+pages.length+' source pages · snapshot '+catalog.snapshot.slice(0,16)+'\n\nThis is TiddlyWiki 5.4.1. Source tiddlers are deliberately `text/plain`: importing a repository does not execute its scripts. Edit and save normally. Browser storage keeps local changes; download a saved HTML or export JSON as backup.\n\n* [[Edition guide]]\n* [[Repository index]]\n* [[Repository bibliography]]\n* [[DjVu demo]]\n\nThe self-contained JAR editions hold every eligible file’s exact bytes in a content-addressed vault. This HTML/XDC edition contains source previews, metadata and cross-references, not the full binary vault. Native previews are capped at '+twPreviewBytes+' bytes and explicitly marked if shortened.\n\n\'\'Chat updates\'\'\n\n{{$:/status/RepositorySync}}\n\n\'\'Read a source page\'\'\n\n<$list filter="[tag[Repository]sort[title]limit[20]]"><div><$link><$view field="source-path"/></$link></div></$list>'};
const pathById=new Map(pages.map(p=>[p.id,p.repo+'/'+p.path]));
const extra=[home,
  {title:'Repository bibliography',type:'text/plain',text:catalog.bibliography.map(b=>b.url+'\n  Referenced by: '+b.pages.map(id=>pathById.get(id)).join(', ')+'\n  Status: '+b.status).join('\n\n')},
  {title:'$:/html5/SourceMetadata',tags:'$:/tags/ViewTemplate',text:'<$list filter="[all[current]has[source-id]]"><hr/><div><strong>Source path:</strong> <$view field="source-path"/></div><div><strong>SHA-256:</strong> <$view field="source-sha256"/></div><div><strong>Preview truncated:</strong> <$view field="source-truncated"/></div><h3>Linked source pages</h3><$list filter="[all[current]get[source-link-titles]enlist-input[]]"><div><$link/></div></$list><h3>Referenced by</h3><$list filter="[all[current]get[source-backlink-titles]enlist-input[]]"><div><$link/></div></$list><h3>Reference URLs (not automatically verified)</h3><$codeblock code={{!!source-references}}/></$list>'},
  {title:'Repository index',text:'! All source pages\n<$list filter="[tag[Repository]sort[title]]"><div><$link><$view field="title"/></$link></div></$list>'},
  {title:'Edition guide',text:'! Editions and provenance\n\n* wiki.in.a.jar: classic browser wiki hosted by ACME/TJWS.\n* more.wiki.in.a.jar: repository library, revisions and encrypted vault exchange.\n* tiddlywiki.in.a.jar: this native TiddlyWiki as the landing page.\n* tiddlywiki.xdc: offline text previews with conservative plain-text chat updates.\n\nThese are new 2026 repository editions, not the historic More Wiki 0.9.9 release. The historical patch remains in tools/wikiinajar/. JavaCardOS is a separate constrained applet target, not a JVM web server.\n\nThe companion conversion report lists excluded private paths and MediaWiki dialect caveats. No cloud sites have been changed.'},
  {title:'DjVu demo',text:'! Offline DjVu decoder\n\nThe bundled sample is rendered by djvu-rs WebAssembly, not by the JVM.\n\n<iframe src="djvu-demo.html" title="DjVu sample viewer" width="100%" height="520" style="border:1px solid #ccc;"></iframe>\n\nSource: tools/wikiinajar/test/fixtures/ATTRIBUTION.md.'},
  {title:'$:/SiteTitle',text:'Repository Wiki'}, {title:'$:/SiteSubtitle',text:'Source • references • revisions'},
  {title:'$:/DefaultTiddlers',text:'[[Repository Home]]'},
  {title:'$:/config/BrowserStorage/Enabled',text:'yes'},
  {title:'$:/config/BrowserStorage/SaveFilter',text:BROWSER_STORAGE_FILTER},
  {title:'$:/status/RepositorySync',text:'Local edition. In a Webxdc host, plain-text changes up to 24 KB sync; concurrent edits become Conflict/… copies.'},
  {title:'$:/plugins/html5/repository-webxdc/startup.js',type:'application/javascript','module-type':'startup',text:readFileSync(path.join(ROOT,'tools/wiki-workspace/tiddlywiki/webxdc.js'),'utf8')}
];
const nativeTiddlers=[...toTiddlers(pages.map(p=>({...p,updated:SOURCE_DATE})),{maxSourceBytes:twPreviewBytes}),...extra];
if(nativeTiddlers.some(t=>Object.values(t).some(v=>typeof v!=='string')))throw new Error('Native TiddlyWiki boot fields must all be strings');
writeFileSync(path.join(twRoot,'tiddlers/repository.json'),JSON.stringify(nativeTiddlers));
execFileSync(process.execPath,[path.join(ROOT,'node_modules/tiddlywiki/tiddlywiki.js'),twRoot,'--output',web,'--build','index'],{stdio:'inherit',maxBuffer:32*1024*1024});
write('djvu-demo.html',readFileSync(path.join(ROOT,'tools/wiki-workspace/tiddlywiki/djvu-demo.html')));
write('webxdc.js','/* The Webxdc chat host supplies its API here. Ordinary browsers are local-only. */\n');
write('icon.png',readFileSync(path.join(ROOT,'icon.png')));
const xdcFiles={'index.html':[Buffer.from(readFileSync(path.join(web,'tiddlywiki.html'),'utf8').replace('<head>','<head>\n<script src="webxdc.js"></script>')),{mtime:new Date(SOURCE_DATE)}],
  'manifest.toml':[Buffer.from('name = "Repository TiddlyWiki"\nsource_code_url = "https://github.com/shdwelf/Html5"\n'),{mtime:new Date(SOURCE_DATE)}]};
// Enough for offline DjVu demonstration; arbitrary repository binaries remain in the full JAR vault.
for(const name of ['djvu-demo.html','webxdc.js','icon.png','repository.json','exports/conversion-report.json','wiki/media/djvu-smoke.djvu',
  ...walk(path.join(web,'wiki/djvu-rs')).map(f=>path.relative(web,f).split(path.sep).join('/'))])xdcFiles[name]=[readFileSync(path.join(web,name)),{mtime:new Date(SOURCE_DATE)}];
writeFileSync(path.join(out,'tiddlywiki.xdc'),zipSync(xdcFiles,{level:9,mtime:new Date(SOURCE_DATE)}));
copyFileSync(path.join(web,'tiddlywiki.html'),path.join(out,'tiddlywiki.html'));
for(const name of ['repository.json','exports/mediawiki.xml','exports/tiddlers.json','exports/conversion-report.json'])copyFileSync(path.join(web,name),path.join(out,path.basename(name)));

if(!noJava) {
  const deps=await prepareDependencies();
  const servletRoot=path.join(deps['servlet-api'],'apache-tomcat-4.1.40-src/servletapi');
  const tjwsRoot=path.join(deps.tjws,'1.x');
  const upstream=[...walk(path.join(servletRoot,'src/share/javax/servlet')),...walk(path.join(tjwsRoot,'src/Acme')),...walk(path.join(tjwsRoot,'compatibility/src'))].filter(f=>f.endsWith('.java'));
  const argfile=path.join(work,'upstream-sources.txt');writeFileSync(argfile,upstream.map(f=>JSON.stringify(f)).join('\n'));
  execFileSync(javaTool('javac'),['--release','8','-Xlint:-options','-encoding','UTF-8','-d',classes,'@'+argfile],{stdio:'inherit'});
  execFileSync(javaTool('javac'),['--release','11','-encoding','UTF-8','-classpath',classes,'-d',classes,...walk(path.join(ROOT,'tools/wiki-workspace/java')).filter(f=>f.endsWith('.java'))],{stdio:'inherit'});
  // Servlet ResourceBundles are required at runtime, not only .class files.
  for(const baseDir of [path.join(servletRoot,'src/share'),path.join(tjwsRoot,'src')])for(const source of walk(baseDir).filter(f=>f.endsWith('.properties')&&(f.includes('/javax/servlet/')||f.includes('/Acme/')))) {
    const dest=path.join(classes,path.relative(baseDir,source));mkdirSync(path.dirname(dest),{recursive:true});copyFileSync(source,dest);
  }
  mkdirSync(path.join(classes,'META-INF/licenses'),{recursive:true});
  copyFileSync(path.join(servletRoot,'LICENSE'),path.join(classes,'META-INF/licenses/servlet-LICENSE'));
  const notice=path.join(servletRoot,'NOTICE');if(existsSync(notice))copyFileSync(notice,path.join(classes,'META-INF/licenses/servlet-NOTICE'));
  writeFileSync(path.join(classes,'META-INF/licenses/ACME-LICENSE.txt'),readFileSync(path.join(tjwsRoot,'src/Acme/Serve/Serve.java'),'utf8').split('package Acme.Serve;')[0]);
  copyFileSync(path.join(ROOT,'tools/wiki-workspace/THIRD_PARTY_NOTICES.md'),path.join(classes,'META-INF/licenses/THIRD_PARTY_NOTICES.md'));
  writeFileSync(path.join(classes,'dependencies.json'),JSON.stringify(DEPENDENCIES,null,2));
  // Ship the exact dependency sources needed to reproduce the bundled bytecode.
  for(const source of upstream) {
    const relative=source.startsWith(servletRoot)?'servlet/'+path.relative(servletRoot,source):'tjws/'+path.relative(tjwsRoot,source);
    const dest=path.join(classes,'META-INF/sources',relative);mkdirSync(path.dirname(dest),{recursive:true});copyFileSync(source,dest);
  }
  const legacy=path.join(work,'legacy');mkdirSync(legacy);
  execFileSync(javaTool('javac'),['--release','8','-Xlint:-options','-encoding','UTF-8','-d',legacy,path.join(ROOT,'tools/wiki-workspace/legacy/WikiReaderApplet.java')],{stdio:'inherit'});
  const legacyEntries={};for(const file of walk(legacy))legacyEntries[path.relative(legacy,file).split(path.sep).join('/')]=[readFileSync(file),{mtime:new Date(SOURCE_DATE)}];
  const legacyJar=zipSync(legacyEntries,{level:9,mtime:new Date(SOURCE_DATE)});
  writeFileSync(path.join(out,'wiki-reader-applet.jar'),legacyJar);write('wiki-reader-applet.jar',legacyJar);
  write('legacy-applet.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>Historical Java 8 reader</title><h1>Java 8 applet compatibility reader</h1><p>Modern browsers do not support this. Use an isolated legacy appletviewer with the server on loopback; this is a read-only source viewer, not a JavaScript conversion.</p><applet code="WikiReaderApplet.class" archive="wiki-reader-applet.jar" width="960" height="620">Open the <a href="library/">modern repository library</a> instead.</applet></html>');
  const assets=walk(web).map(f=>{const rel=path.relative(web,f).split(path.sep).join('/'),bytes=readFileSync(f);return [rel,mimeFor(rel)+(mimeFor(rel).startsWith('text/')?'; charset=utf-8':''),bytes.length,sha256(bytes)].join('\t');});
  writeFileSync(path.join(classes,'assets.tsv'),assets.join('\n')+'\n');
  const media=new Map();for(const page of pages)if(/^image\/(?:png|jpeg|gif|webp|bmp|avif|vnd\.djvu)$/.test(page.mime))media.set(page.sha256,page.mime);
  writeFileSync(path.join(classes,'media.tsv'),[...media].map(p=>p.join('\t')).join('\n')+'\n');
  execFileSync('python3',[path.join(ROOT,'tools/wiki-workspace/pack.py'),classes,web,out],{stdio:'inherit'});
  // Readable disassembly is evidence of compiled JVM bytecode, not an invented C++ conversion.
  const bytecode=execFileSync(javaTool('javap'),['-classpath',classes,'-c','-p','-s','org.html5.wiki.WikiServer'],{encoding:'utf8',maxBuffer:16*1024*1024});
  writeFileSync(path.join(out,'WikiServer.javap.txt'),bytecode);

}
const artifacts=walk(out).filter(f=>/\.(jar|xdc|html|xml|json)$/.test(f)).map(file=>({file:path.basename(file),sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
writeFileSync(path.join(out,'SHA256SUMS'),artifacts.map(a=>a.sha256+'  '+a.file).join('\n')+'\n');
console.log(`Built ${out}\nSnapshot ${catalog.snapshot}\nReview conversion-report.json before sharing. No remote wiki has been modified.`);
