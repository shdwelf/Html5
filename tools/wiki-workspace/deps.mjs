import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DEPENDENCIES = [
  {id:'tjws',repo:'drogatkin/TJWS2',commit:'33920d0e429d3271796b3fd2d838cd0a47208846',
    sha256:'2b455129478d015e97761342e44cb62b5cc8f7f2c5d63b154a92afbb7e715bcd',directory:'TJWS2-33920d0e429d3271796b3fd2d838cd0a47208846'},
  {id:'servlet-api',repo:'xcf007/tomcat4',commit:'dbed311153d1d97d7c92534d173c853130b08fb4',
    sha256:'e11c6c02030596c81fcfb9803a4b9439081fce121108bce53e341685aec75800',directory:'tomcat4-dbed311153d1d97d7c92534d173c853130b08fb4'}
];

export async function prepareDependencies() {
  const cache = path.join(ROOT,'.cache/wiki-deps'); mkdirSync(cache,{recursive:true});
  const result = {};
  for (const dep of DEPENDENCIES) {
    const archive = path.join(cache,dep.id+'.tar.gz');
    if (!existsSync(archive)) {
      console.log(`Fetching pinned ${dep.repo}@${dep.commit} (source only)`);
      // curl uses the host trust store (including managed sandbox CAs); never disable TLS checks.
      const bytes = execFileSync('curl', ['--fail','--silent','--show-error','--location','--max-time','90',
        `https://codeload.github.com/${dep.repo}/tar.gz/${dep.commit}`], {maxBuffer:64*1024*1024});
      if (createHash('sha256').update(bytes).digest('hex') !== dep.sha256) throw new Error(`Checksum mismatch: ${dep.id}`);
      writeFileSync(archive,bytes);
    }
    if (createHash('sha256').update(readFileSync(archive)).digest('hex') !== dep.sha256) throw new Error(`Cached checksum mismatch: ${dep.id}`);
    // Recreate only this fixed dependency directory: extra injected source files must not survive.
    rmSync(path.join(cache,dep.directory), {recursive:true,force:true});
    if (dep.id === 'servlet-api') {
      execFileSync('tar',['xzf',archive,'-C',cache,'--wildcards',`${dep.directory}/apache-tomcat-4.1.40-src/servletapi/*`]);
    } else execFileSync('tar',['xzf',archive,'-C',cache]);
    result[dep.id] = path.join(cache,dep.directory);
  }
  return result;
}
export function javaTool(name) {
  if (process.env.JAVA_HOME) {
    const executable = path.join(process.env.JAVA_HOME,'bin',name);
    if (!existsSync(executable)) throw new Error(`JAVA_HOME has no ${name}`);
    return executable;
  }
  const recovered = path.join(ROOT,'.relay/jdk/extracted');
  if (existsSync(recovered)) for (const dir of readdirSync(recovered).sort()) {
    const executable = path.join(recovered,dir,'bin',name);
    if (existsSync(executable)) return executable;
  }
  return name;
}
export function walk(directory) {
  return readdirSync(directory,{withFileTypes:true}).sort((a,b) => a.name.localeCompare(b.name)).flatMap(e =>
    e.isDirectory() ? walk(path.join(directory,e.name)) : e.isFile() ? [path.join(directory,e.name)] : []);
}
