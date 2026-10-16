/*\
title: $:/plugins/html5/repository-webxdc/startup.js
type: application/javascript
module-type: startup
\*/
/* Plain-text tiddler sync only. No executable system/plugin tiddlers cross the chat. */
'use strict';
exports.name='repository-webxdc';
exports.platforms=['browser'];
exports.after=['startup','browser-storage'];
exports.synchronous=true;
exports.startup=function(){
  var api=window.webxdc;
  if(!api||!api.sendUpdate||!api.setUpdateListener||api.selfAddr==='preview@local')return;
  var known=new Map(), suppress=new Map();
  function safeTitle(title){return typeof title==='string'&&title.length>0&&title.length<=1024&&!title.startsWith('$:/')&&!/[\u0000-\u001f]/.test(title);}
  function current(title){var t=$tw.wiki.getTiddler(title);return t?String(t.fields.text||''):null;}
  function note(message){$tw.wiki.addTiddler({title:'$:/status/RepositorySync',text:message});}
  $tw.wiki.each(function(t,title){if(safeTitle(title))known.set(title,String(t.fields.text||''));});
  $tw.wiki.addEventListener('change',function(changes){
    Object.keys(changes).forEach(function(title){
      if(!safeTitle(title))return;
      var text=current(title),base=known.has(title)?known.get(title):null;
      if(suppress.has(title)&&suppress.get(title)===text){suppress.delete(title);known.set(title,text);return;}
      if(text===base)return;
      var t=$tw.wiki.getTiddler(title);
      if(t&&t.fields.type&&t.fields.type!=='text/plain'&&t.fields.type!=='text/vnd.tiddlywiki'){note('Not shared: only plain text / wiki notes are supported.');return;}
      var payload={repositoryWiki:{version:1,title:title,text:text,base:base}};
      if(new TextEncoder().encode(JSON.stringify({payload:payload})).length>24000){note('Not shared: update exceeds 24 KB. Export this tiddler as a file instead.');return;}
      try{api.sendUpdate({payload:payload},'Wiki: '+title);known.set(title,text);}
      catch(e){note('Chat update failed; local edit kept. '+e.message);}
    });
  });
  api.setUpdateListener(function(update){
    var p=update&&update.payload&&update.payload.repositoryWiki;
    if(!p||p.version!==1||!safeTitle(p.title)||!(typeof p.text==='string'||p.text===null)||!(typeof p.base==='string'||p.base===null))return;
    if(new TextEncoder().encode(JSON.stringify(p)).length>24000)return;
    var local=current(p.title);
    if(local===p.text){known.set(p.title,local);return;}
    if(local!==p.base){
      // A stable chat serial keeps conflict copies idempotent across replay.
      var serial=Number(update.serial);if(!Number.isSafeInteger(serial)||serial<1)return;
      var conflict='Conflict/'+serial+'/'+p.title;
      var text=p.text===null?'Remote deletion requested; local page retained.':p.text;
      suppress.set(conflict,text);known.set(conflict,text);
      $tw.wiki.addTiddler({title:conflict,type:'text/plain',text:text,tags:['Conflict'],'conflict-for':p.title});
      note('Concurrent edit retained under '+conflict);return;
    }
    suppress.set(p.title,p.text);known.set(p.title,p.text);
    if(p.text===null)$tw.wiki.deleteTiddler(p.title);
    else $tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getTiddler(p.title),{title:p.title,type:'text/plain',text:p.text}));
  });
  note('Webxdc sync ready. Plain-text notes only; conflicts kept as separate tiddlers.');
};
