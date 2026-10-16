// Wire-compatible with src/lib/vaultfile.ts. No new encryption scheme or wallet key access.
export const MAGIC = 'haiku-vault-v1.';
export const ITERATIONS = 120000;
const encoder = new TextEncoder();
export function toBase64(bytes) {
  let binary='';
  for(let i=0;i<bytes.length;i+=16384) binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  return btoa(binary);
}
export function fromBase64(value) {
  if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Invalid Base64');
  return Uint8Array.from(atob(value),c=>c.charCodeAt(0));
}
export const toBase64url = bytes => toBase64(bytes).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export function fromBase64url(value) {
  if(!/^[A-Za-z0-9_-]*$/.test(value)||value.length%4===1) throw new Error('Invalid unpadded Base64url');
  const decoded=fromBase64(value.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-value.length%4)%4));
  if(toBase64url(decoded)!==value) throw new Error('Non-canonical Base64url');
  return decoded;
}
async function key(password,salt,usage) {
  if(typeof password!=='string'||!password.length) throw new Error('Enter a separate vault passphrase; there is no default password.');
  if(!globalThis.crypto?.subtle) throw new Error('Vault encryption needs a secure context (HTTPS or loopback).');
  const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,[usage]);
}
export async function encryptVault(value,password) {
  const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(password,salt,'encrypt'),encoder.encode(JSON.stringify(value,null,2)));
  const packed=new Uint8Array(29+cipher.byteLength); packed[0]=1; packed.set(salt,1); packed.set(iv,17); packed.set(new Uint8Array(cipher),29);
  return MAGIC+toBase64(packed);
}
export async function decryptVault(value,password) {
  const input=String(value).trim();
  if(!input.startsWith(MAGIC)||input.length>16*1024*1024) throw new Error('Expected a haiku-vault-v1 file, at most 16 MiB.');
  const packed=fromBase64(input.slice(MAGIC.length));
  if(packed[0]!==1||packed.length<46) throw new Error('Invalid vault envelope');
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:packed.slice(17,29)},await key(password,packed.slice(1,17),'decrypt'),packed.slice(29));
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain));
}
export async function digest(bytes) {
  const hash=await crypto.subtle.digest('SHA-256',typeof bytes==='string'?encoder.encode(bytes):bytes);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function validateWorkspaceVault(value) {
  if(!value || value.format!=='repository-wiki-vault' || value.version!==1 || !Array.isArray(value.pages) || !Array.isArray(value.files)) {
    throw new Error('Decrypted successfully, but this is not a repository-wiki vault. Wallet/seed payloads are not imported into public wiki pages.');
  }
  for(const p of value.pages) if(typeof p.title!=='string'||typeof p.body!=='string'||!p.id?.match(/^[a-f0-9]{64}$/)) throw new Error('Invalid vault page');
  for(const f of value.files) {
    if(typeof f.name!=='string'||typeof f.base64!=='string'||!f.sha256?.match(/^[a-f0-9]{64}$/)) throw new Error('Invalid vault file');
    const bytes=fromBase64(f.base64);
    if(await digest(bytes)!==f.sha256) throw new Error('Vault attachment digest mismatch');
  }
  return value;
}
