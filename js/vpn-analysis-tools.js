// Offline format triage and command templates. This module never uploads,
// executes, disassembles or decrypts the selected file. Actual native Ghidra
// results have a separate hash/run receipt. JDK distributions are runtimes,
// not interchangeable decompilers.
export const HEADER_LIMIT = 65536;
export const FILE_LIMIT = 64 * 1024 * 1024;
const FORMATS = new Set(['native', 'dotnet', 'java', 'unknown']);
const RUNTIMES = { temurin: 'TEMURIN_21_HOME', zulu: 'ZULU_21_HOME', openjdk: 'OPENJDK_21_HOME' };

export function classifyAnalysisHeader(input, fileBytes = input?.byteLength) {
  if (!(input instanceof Uint8Array) || !Number.isSafeInteger(fileBytes) || fileBytes < input.byteLength || fileBytes < 1 || fileBytes > FILE_LIMIT || input.byteLength > HEADER_LIMIT) throw new TypeError('Choose a nonempty file of at most 64 MiB; only its first 64 KiB are read.');
  const bytes = input, view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = (format, description) => ({ format, description, headerBytesRead: bytes.length, fileBytes, executed: false, uploaded: false, decompiled: false, decrypted: false });
  if (bytes.length >= 16 && view.getUint32(0, false) === 0x7f454c46) {
    if (![1, 2].includes(bytes[4]) || ![1, 2].includes(bytes[5]) || bytes[6] !== 1 || bytes.length < (bytes[4] === 2 ? 64 : 52)) return result('unknown', 'Malformed or truncated ELF header; no tool is selected automatically.');
    return result('native', `ELF${bytes[4] === 2 ? 64 : 32} ${bytes[5] === 1 ? 'little' : 'big'}-endian native candidate — use Ghidra, not ILSpy.`);
  }
  if (bytes.length >= 10 && view.getUint32(0, false) === 0xcafebabe && view.getUint16(6, false) >= 45 && view.getUint16(6, false) <= 100 && view.getUint16(8, false) > 0) return result('java', 'Java class candidate — javap disassembly; Java source decompilation is a different tool.');
  if (bytes.length >= 64 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
    const pe = view.getUint32(0x3c, true);
    if (pe < 64 || pe + 24 > bytes.length || view.getUint32(pe, true) !== 0x4550) return result('unknown', 'MZ image; a PE header is absent or outside the 64 KiB read. DOS MZ is not automatically .NET.');
    const optionalSize = view.getUint16(pe + 20, true), optional = pe + 24;
    if (optionalSize < 2 || optional + optionalSize > bytes.length) return result('unknown', 'Truncated or out-of-bound PE optional header.');
    const magic = view.getUint16(optional, true), directory = magic === 0x10b ? 96 : magic === 0x20b ? 112 : 0;
    if (!directory || optionalSize < directory) return result('unknown', 'Unsupported PE optional-header format.');
    const directories = view.getUint32(optional + directory - 4, true);
    const cli = optional + directory + 14 * 8;
    if (directories >= 15 && optionalSize >= directory + 15 * 8 && view.getUint32(cli, true) && view.getUint32(cli + 4, true) >= 72) return result('dotnet', 'PE with a CLI directory — managed .NET candidate for ILSpy; metadata/runtime validity is not established by this header check.');
    return result('native', 'Native PE candidate — use Ghidra; an .exe/.dll suffix alone does not mean .NET.');
  }
  return result('unknown', 'Unrecognized bounded header. It may be text, an archive or other data; this does not establish encryption.');
}

export function analysisCommandPlan({ format = 'native', runtime = 'temurin', acquisition = 'offline' } = {}) {
  if (!FORMATS.has(format) || !Object.hasOwn(RUNTIMES, runtime) || !['offline', 'direct', 'proxy'].includes(acquisition)) throw new TypeError('Unsupported analysis setup.');
  const lines = ['# SETUP TEMPLATE ONLY — no commands, uploads, downloads or analysis run in this page.', '# Set trusted local paths explicitly. Never execute the input binary.'];
  if (acquisition === 'offline') lines.push('# Offline: use an already authorized, independently verified local copy.');
  else {
    lines.push('# Optional acquisition — trusted HTTPS source only; never put tokens/passwords in URLs.');
    if (acquisition === 'proxy') lines.push(': "${HTTPS_PROXY:?Set an explicitly approved HTTPS proxy first}"', 'case "$HTTPS_PROXY" in https://*) ;; *) echo "HTTPS proxy required" >&2; exit 1 ;; esac');
    lines.push(`curl --fail --location --proto '=https' --proto-redir '=https' ${acquisition === 'direct' ? "--noproxy '*'" : "--proxy \"$HTTPS_PROXY\" --noproxy ''"} --output "$LOCAL_COPY" "$VERIFIED_SOURCE_URL"`);
    lines.push('printf \'%s  %s\\n\' "$EXPECTED_SHA256" "$LOCAL_COPY" | sha256sum --check --strict');
    lines.push('# Stop if the exact expected size/hash/signature or independent key trust is missing.');
  }
  if (format === 'native') {
    lines.push('', '# Ghidra 12.1.4 native analysis uses a supported Java 21 JDK.', `export JAVA_HOME="$${RUNTIMES[runtime]}"`, '"$JAVA_HOME/bin/java" -version', '"$GHIDRA_HOME/support/analyzeHeadless" "$PROJECT_DIR" AuthorizedLocalReview \\', '  -import "$LOCAL_COPY" -analysisTimeoutPerFile 300 -max-cpu 2 -deleteProject', '# Ghidra/FindCrypt identify code, references and constants; a match is not a recovered key.', '# Decryption needs the actual scheme and authorized key/IV/nonce. No automatic decryption.');
  } else if (format === 'dotnet') {
    lines.push('', '# Managed .NET only: use a trusted installed ILSpy command-line tool and compatible .NET runtime.', '# Temurin/Zulu/OpenJDK do not replace that .NET runtime.', 'ilspycmd --project --outputdir "$REPORT_DIR" "$LOCAL_COPY"', '# This template does not install or run ILSpy here. Review output for secrets before publishing.');
  } else if (format === 'java') {
    lines.push('', `export JAVA_HOME="$${RUNTIMES[runtime]}"`, '"$JAVA_HOME/bin/javap" -c -p "$LOCAL_COPY"', '# javap prints bytecode; it is not a Java source decompiler and does not execute the class.');
  } else lines.push('', '# Unknown format: identify it before choosing a decompiler. Do not execute it to identify it.');
  lines.push('', '# Direct/proxy affects acquisition only — neither is a VPN connection or packet-protection claim.');
  return lines.join('\n') + '\n';
}

export function bindAnalysisTools(document) {
  const get = id => document.getElementById(id);
  const input = get('analysisFile'), status = get('analysisStatus');
  let generation = 0, detected = null;
  function render() {
    get('analysisRuntime').disabled = ['dotnet', 'unknown'].includes(get('analysisFormat').value);
    get('analysisPlan').textContent = analysisCommandPlan({ format: get('analysisFormat').value, runtime: get('analysisRuntime').value, acquisition: get('analysisAcquisition').value });
    get('analysisMismatch').textContent = detected && detected.format !== get('analysisFormat').value ? 'The selected tool family differs from the bounded header result. Nothing has been executed; resolve the format before running any external tool.' : '';
  }
  for (const id of ['analysisFormat', 'analysisRuntime', 'analysisAcquisition']) get(id).addEventListener('change', render);
  input.addEventListener('change', async () => {
    const current = ++generation, file = input.files?.[0]; detected = null;
    status.textContent = 'No local file selected. Templates only.'; render();
    if (!file) return;
    try {
      if (!file.size || file.size > FILE_LIMIT) throw new TypeError('Choose a nonempty file of at most 64 MiB.');
      const bytes = new Uint8Array(await file.slice(0, HEADER_LIMIT).arrayBuffer());
      if (current !== generation) return;
      detected = classifyAnalysisHeader(bytes, file.size);
      get('analysisFormat').value = detected.format;
      status.textContent = `${file.name.slice(0, 160)} — ${detected.description} Read ${detected.headerBytesRead} header bytes; no upload, execution, decompilation or decryption.`;
      render();
    } catch (error) { if (current === generation) { status.textContent = error.message; render(); } }
  });
  get('analysisClear').addEventListener('click', () => {
    generation++; input.value = ''; detected = null;
    status.textContent = 'Local selection cleared. No file content was retained or uploaded.'; render();
  });
  render();
}
