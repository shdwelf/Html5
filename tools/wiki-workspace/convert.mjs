#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readExchange, toMediaWiki, toTiddlers } from './exchange.mjs';
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node tools/wiki-workspace/convert.mjs exported-jar.json output-directory');
  process.exit(2);
}
const pages = readExchange(JSON.parse(readFileSync(input,'utf8')));
const {xml,mapping,warnings} = toMediaWiki(pages);
mkdirSync(output,{recursive:true});
writeFileSync(path.join(output,'tiddlers.json'),JSON.stringify(toTiddlers(pages),null,2)+'\n');
writeFileSync(path.join(output,'mediawiki.xml'),xml);
writeFileSync(path.join(output,'conversion-report.json'),JSON.stringify({pages:pages.length,mapping,warnings},null,2)+'\n');
console.log(`Converted ${pages.length} pages (including saved revisions). Review conversion-report.json before importing.`);
