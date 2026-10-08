/**
 * jvmdis.js — a Java class-file (and Java Card CAP-file) reader plus a Java
 * bytecode disassembler, written for the browser and for node with no
 * dependencies.
 *
 * Why this lives in a Lantronix/µClinux deep dive: the same question — "which
 * processor and which virtual machine is this blob for?" — is answered by the
 * magic number. A JVM class file starts CAFEBABE and carries a bytecode stream
 * that Ghidra can load with its `JVM:BE:32:default` language; a Java Card
 * package starts DECAFFED and carries the JCVM's 16-bit-subset dialect; a
 * ColdFire µClinux kernel image starts with the dBUG/U-Boot wrapper or a raw
 * 68k vector table. One triage tool, four magics.
 *
 * Opcode names/lengths follow the Java Virtual Machine Specification
 * (chapter 6, "The Java Virtual Machine Instruction Set"); component tags
 * follow the Java Card Runtime Environment / CAP file format.
 */

/* ------------------------------------------------------------------ reader */

class Reader {
  constructor(bytes, offset = 0) {
    this.b = bytes;
    this.i = offset;
  }
  get left() { return this.b.length - this.i; }
  u1() { return this.b[this.i++]; }
  u2() { this.i += 2; return (this.b[this.i - 2] << 8) | this.b[this.i - 1]; }
  u4() {
    this.i += 4;
    return ((this.b[this.i - 4] << 24) | (this.b[this.i - 3] << 16) |
      (this.b[this.i - 2] << 8) | this.b[this.i - 1]) >>> 0;
  }
  s1() { const v = this.u1(); return v < 0x80 ? v : v - 0x100; }
  s2() { const v = this.u2(); return v < 0x8000 ? v : v - 0x10000; }
  s4() { const v = this.u4(); return v > 0x7fffffff ? v - 0x100000000 : v; }
  bytes(n) { const out = this.b.slice(this.i, this.i + n); this.i += n; return out; }
}

const hex = (n, w = 2) => n.toString(16).padStart(w, '0').toUpperCase();

/* ------------------------------------------------------------- magic sniff */

export function sniff(bytes) {
  const u4 = (o) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  if (bytes.length < 4) return { kind: 'unknown', magic: null };
  const m = u4(0);
  if (m === 0xcafebabe) return { kind: 'class', magic: 'CAFEBABE' };
  if (m === 0xdecaffed) return { kind: 'cap', magic: 'DECAFFED' };
  if (m === 0xcafed00d || m === 0xcafed00e) return { kind: 'pack200', magic: hex(m, 8) };
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return { kind: 'zip', magic: 'PK' };
  if (m === 0x27051956) return { kind: 'uimage', magic: '27051956' };
  if (bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) return { kind: 'elf', magic: 'ELF' };
  return { kind: 'unknown', magic: hex(m, 8) };
}

/* ------------------------------------------------------------ constant pool */

const CP_TAGS = {
  1: 'Utf8', 3: 'Integer', 4: 'Float', 5: 'Long', 6: 'Double', 7: 'Class', 8: 'String',
  9: 'Fieldref', 10: 'Methodref', 11: 'InterfaceMethodref', 12: 'NameAndType',
  15: 'MethodHandle', 16: 'MethodType', 17: 'Dynamic', 18: 'InvokeDynamic',
  19: 'Module', 20: 'Package',
};

const CLASS_FLAGS = [
  [0x0001, 'ACC_PUBLIC'], [0x0010, 'ACC_FINAL'], [0x0020, 'ACC_SUPER'],
  [0x0200, 'ACC_INTERFACE'], [0x0400, 'ACC_ABSTRACT'], [0x1000, 'ACC_SYNTHETIC'],
  [0x2000, 'ACC_ANNOTATION'], [0x4000, 'ACC_ENUM'], [0x8000, 'ACC_MODULE'],
];

const MEMBER_FLAGS = [
  [0x0001, 'ACC_PUBLIC'], [0x0002, 'ACC_PRIVATE'], [0x0004, 'ACC_PROTECTED'],
  [0x0008, 'ACC_STATIC'], [0x0010, 'ACC_FINAL'], [0x0020, 'ACC_SYNCHRONIZED'],
  [0x0040, 'ACC_VOLATILE'], [0x0040, 'ACC_BRIDGE'], [0x0080, 'ACC_TRANSIENT'],
  [0x0080, 'ACC_VARARGS'], [0x0100, 'ACC_NATIVE'], [0x0200, 'ACC_INTERFACE'],
  [0x0400, 'ACC_ABSTRACT'], [0x0800, 'ACC_STRICT'], [0x1000, 'ACC_SYNTHETIC'],
  [0x2000, 'ACC_ANNOTATION'], [0x4000, 'ACC_ENUM'],
];

export function flags(value, table) {
  const out = [];
  for (const [bit, name] of table) if ((value & bit) && !out.includes(name)) out.push(name);
  return out;
}

function readConstantPool(r) {
  const count = r.u2();
  const pool = new Array(count).fill(null);
  for (let i = 1; i < count; i++) {
    const tag = r.u1();
    const entry = { index: i, tag, kind: CP_TAGS[tag] ?? `tag:${tag}` };
    switch (tag) {
      case 1: {
        const len = r.u2();
        entry.value = utf8(r.bytes(len));
        break;
      }
      case 3: entry.value = r.s4(); break;
      case 4: {
        const bits = r.u4();
        const buf = new ArrayBuffer(4);
        new DataView(buf).setUint32(0, bits);
        entry.value = new DataView(buf).getFloat32(0);
        break;
      }
      case 5: {
        const hi = r.u4(); const lo = r.u4();
        entry.value = (BigInt(hi) << 32n) | BigInt(lo);
        i++; pool[i] = { index: i, tag: 0, kind: '(long/double second slot)' };
        break;
      }
      case 6: {
        const hi = r.u4(); const lo = r.u4();
        const buf = new ArrayBuffer(8);
        new DataView(buf).setUint32(0, hi);
        new DataView(buf).setUint32(4, lo);
        entry.value = new DataView(buf).getFloat64(0);
        i++; pool[i] = { index: i, tag: 0, kind: '(long/double second slot)' };
        break;
      }
      case 7: entry.nameIndex = r.u2(); break;
      case 8: entry.stringIndex = r.u2(); break;
      case 9: case 10: case 11:
        entry.classIndex = r.u2(); entry.nameAndTypeIndex = r.u2(); break;
      case 12: entry.nameIndex = r.u2(); entry.descriptorIndex = r.u2(); break;
      case 15: entry.referenceKind = r.u1(); entry.referenceIndex = r.u2(); break;
      case 16: entry.descriptorIndex = r.u2(); break;
      case 17: case 18: entry.bootstrapMethodAttrIndex = r.u2(); entry.nameAndTypeIndex = r.u2(); break;
      case 19: case 20: entry.nameIndex = r.u2(); break;
      default: throw new Error(`unknown constant pool tag ${tag} at index ${i}`);
    }
    pool[i] = entry;
  }
  return pool;
}

/** Strict UTF-8 decoding as used by class files (NUL is C0 80, not 00). */
export function utf8(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i];
    if (b < 0x80) { out += String.fromCharCode(b); i += 1; }
    else if ((b & 0xe0) === 0xc0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f)); i += 2;
    } else if ((b & 0xf0) === 0xe0) {
      out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 3;
    } else { out += '\ufffd'; i += 1; }
  }
  return out;
}

/* ------------------------------------------------------------- instruction set */

/**
 * opcode → [mnemonic, format]. Formats:
 *   ''  no operand           'b' int8            'u' uint8
 *   's' int16                'U' uint16 (cp index)   'cu' uint8 cp index
 *   'o' int16 branch offset  'i' int32
 *   'ib' uint16 + uint8 (invokedynamic / invokeinterface / multianewarray)
 *   'TS' tableswitch         'LS' lookupswitch    'W' wide
 */
export const OPCODES = (() => {
  const t = new Array(256).fill(null);
  const set = (code, name, fmt = '') => { t[code] = { code, name, fmt }; };
  set(0x00, 'nop'); set(0x01, 'aconst_null');
  for (let k = 0; k <= 5; k++) set(0x02 + k, k === 0 ? 'iconst_m1' : `iconst_${k - 1}`);
  set(0x08, 'iconst_5');
  set(0x09, 'lconst_0'); set(0x0a, 'lconst_1');
  set(0x0b, 'fconst_0'); set(0x0c, 'fconst_1'); set(0x0d, 'fconst_2');
  set(0x0e, 'dconst_0'); set(0x0f, 'dconst_1');
  set(0x10, 'bipush', 'b'); set(0x11, 'sipush', 's');
  set(0x12, 'ldc', 'cu'); set(0x13, 'ldc_w', 'U'); set(0x14, 'ldc2_w', 'U');
  ['i', 'l', 'f', 'd', 'a'].forEach((p, n) => set(0x15 + n, `${p}load`, 'u'));
  ['i', 'l', 'f', 'd', 'a'].forEach((p) => {
    const base = { i: 0x1a, l: 0x1e, f: 0x22, d: 0x26, a: 0x2a }[p];
    for (let k = 0; k < 4; k++) set(base + k, `${p}load_${k}`);
  });
  ['i', 'l', 'f', 'd', 'a', 'b', 'c', 's'].forEach((p, n) => set(0x2e + n, `${p}aload`));
  ['i', 'l', 'f', 'd', 'a'].forEach((p, n) => set(0x36 + n, `${p}store`, 'u'));
  ['i', 'l', 'f', 'd', 'a'].forEach((p) => {
    const base = { i: 0x3b, l: 0x3f, f: 0x43, d: 0x47, a: 0x4b }[p];
    for (let k = 0; k < 4; k++) set(base + k, `${p}store_${k}`);
  });
  ['i', 'l', 'f', 'd', 'a', 'b', 'c', 's'].forEach((p, n) => set(0x4f + n, `${p}astore`));
  set(0x57, 'pop'); set(0x58, 'pop2'); set(0x59, 'dup'); set(0x5a, 'dup_x1');
  set(0x5b, 'dup_x2'); set(0x5c, 'dup2'); set(0x5d, 'dup2_x1'); set(0x5e, 'dup2_x2'); set(0x5f, 'swap');
  set(0x60, 'iadd'); set(0x61, 'ladd'); set(0x62, 'fadd'); set(0x63, 'dadd');
  set(0x64, 'isub'); set(0x65, 'lsub'); set(0x66, 'fsub'); set(0x67, 'dsub');
  set(0x68, 'imul'); set(0x69, 'lmul'); set(0x6a, 'fmul'); set(0x6b, 'dmul');
  set(0x6c, 'idiv'); set(0x6d, 'ldiv'); set(0x6e, 'fdiv'); set(0x6f, 'ddiv');
  set(0x70, 'irem'); set(0x71, 'lrem'); set(0x72, 'frem'); set(0x73, 'drem');
  set(0x74, 'ineg'); set(0x75, 'lneg'); set(0x76, 'fneg'); set(0x77, 'dneg');
  set(0x78, 'ishl'); set(0x79, 'lshl'); set(0x7a, 'ishr'); set(0x7b, 'lshr');
  set(0x7c, 'iushr'); set(0x7d, 'lushr'); set(0x7e, 'iand'); set(0x7f, 'land');
  set(0x80, 'ior'); set(0x81, 'lor'); set(0x82, 'ixor'); set(0x83, 'lxor');
  set(0x84, 'iinc', 'uu');
  set(0x85, 'i2l'); set(0x86, 'i2f'); set(0x87, 'i2d'); set(0x88, 'l2i'); set(0x89, 'l2f');
  set(0x8a, 'l2d'); set(0x8b, 'f2i'); set(0x8c, 'f2l'); set(0x8d, 'f2d'); set(0x8e, 'd2i');
  set(0x8f, 'd2l'); set(0x90, 'd2f'); set(0x91, 'i2b'); set(0x92, 'i2c'); set(0x93, 'i2s');
  set(0x94, 'lcmp'); set(0x95, 'fcmpl'); set(0x96, 'fcmpg'); set(0x97, 'dcmpl'); set(0x98, 'dcmpg');
  ['ifeq', 'ifne', 'iflt', 'ifge', 'ifgt', 'ifle', 'if_icmpeq', 'if_icmpne', 'if_icmplt',
    'if_icmpge', 'if_icmpgt', 'if_icmple', 'if_acmpeq', 'if_acmpne'].forEach((n, k) => set(0x99 + k, n, 'o'));
  set(0xa7, 'goto', 'o'); set(0xa8, 'jsr', 'o'); set(0xa9, 'ret', 'u');
  set(0xaa, 'tableswitch', 'TS'); set(0xab, 'lookupswitch', 'LS');
  set(0xac, 'ireturn'); set(0xad, 'lreturn'); set(0xae, 'freturn'); set(0xaf, 'dreturn');
  set(0xb0, 'areturn'); set(0xb1, 'return');
  set(0xb2, 'getstatic', 'U'); set(0xb3, 'putstatic', 'U');
  set(0xb4, 'getfield', 'U'); set(0xb5, 'putfield', 'U');
  set(0xb6, 'invokevirtual', 'U'); set(0xb7, 'invokespecial', 'U'); set(0xb8, 'invokestatic', 'U');
  set(0xb9, 'invokeinterface', 'ib'); set(0xba, 'invokedynamic', 'ib');
  set(0xbb, 'new', 'U'); set(0xbc, 'newarray', 'u'); set(0xbd, 'anewarray', 'U');
  set(0xbe, 'arraylength'); set(0xbf, 'athrow');
  set(0xc0, 'checkcast', 'U'); set(0xc1, 'instanceof', 'U');
  set(0xc2, 'monitorenter'); set(0xc3, 'monitorexit');
  set(0xc4, 'wide', 'W'); set(0xc5, 'multianewarray', 'ib');
  set(0xc6, 'ifnull', 'o'); set(0xc7, 'ifnonnull', 'o');
  set(0xc8, 'goto_w', 'i'); set(0xc9, 'jsr_w', 'i');
  set(0xca, 'breakpoint'); set(0xfe, 'impdep1'); set(0xff, 'impdep2');
  return t;
})();

const ATYPE = { 4: 'boolean', 5: 'char', 6: 'float', 7: 'double', 8: 'byte', 9: 'short', 10: 'int', 11: 'long' };

/**
 * Disassemble a Code attribute's bytecode.
 * Returns { instructions: [{pc, length, bytes, mnemonic, operands, text, target}], errors }.
 */
export function disassemble(code, pool) {
  const r = new Reader(code);
  const out = [];
  const errors = [];
  while (r.left > 0) {
    const pc = r.i;
    const op = r.u1();
    const spec = OPCODES[op];
    if (!spec) {
      errors.push(`0x${hex(op)} at pc=${pc}: not a valid JVM opcode`);
      out.push({ pc, length: 1, bytes: [op], mnemonic: `.byte 0x${hex(op)}`, operands: [], text: `.byte 0x${hex(op)}` });
      continue;
    }
    const operands = [];
    let text = spec.name;
    let target = null;
    const start = r.i;
    try {
      switch (spec.fmt) {
        case 'b': { const v = r.s1(); operands.push(v); text += ` ${v}`; break; }
        case 'u': { const v = r.u1(); operands.push(v); text += ` ${v}`; break; }
        case 'uu': {
          const idx = r.u1(); const k = r.s1();
          operands.push(idx, k); text += ` ${idx}, ${k}`; break;
        }
        case 's': { const v = r.s2(); operands.push(v); text += ` ${v}`; break; }
        case 'cu': {
          const v = r.u1(); operands.push(v);
          text += ` #${v}`;
          const resolved = describe(pool, v);
          if (resolved) text += ` // ${resolved}`;
          break;
        }
        case 'U': {
          const v = r.u2(); operands.push(v);
          text += ` #${v}`;
          const resolved = describe(pool, v);
          if (resolved) text += ` // ${resolved}`;
          break;
        }
        case 'o': {
          const off = r.s2();
          target = pc + off;
          operands.push(target);
          text += ` ${target}`;
          break;
        }
        case 'i': {
          const off = r.s4();
          target = pc + off;
          operands.push(target);
          text += ` ${target}`;
          break;
        }
        case 'ib': {
          const idx = r.u2(); r.u1(); r.u1();
          operands.push(idx);
          text += ` #${idx}`;
          const resolved = describe(pool, idx);
          if (resolved) text += ` // ${resolved}`;
          break;
        }
        case 'TS': {
          const pad = (4 - (r.i % 4)) % 4;
          r.bytes(pad);
          const def = r.s4(); const low = r.s4(); const high = r.s4();
          const jumps = [];
          for (let k = 0; k <= high - low; k++) jumps.push(pc + r.s4());
          operands.push({ low, high, def: pc + def, jumps });
          text = `tableswitch // low=${low} high=${high} default=${pc + def}`;
          target = pc + def;
          break;
        }
        case 'LS': {
          const pad = (4 - (r.i % 4)) % 4;
          r.bytes(pad);
          const def = r.s4(); const npairs = r.s4();
          const pairs = [];
          for (let k = 0; k < npairs; k++) { const m = r.s4(); const o = r.s4(); pairs.push([m, pc + o]); }
          operands.push({ def: pc + def, pairs });
          text = `lookupswitch // ${npairs} pairs, default=${pc + def}`;
          target = pc + def;
          break;
        }
        case 'W': {
          const sub = r.u1();
          const wide = OPCODES[sub];
          if (!wide) throw new Error(`wide: unknown opcode 0x${hex(sub)}`);
          if (wide.name === 'iinc') {
            const idx = r.u2(); const k = r.s2();
            operands.push(idx, k); text = `wide iinc ${idx}, ${k}`;
          } else {
            const idx = r.u2();
            operands.push(idx); text = `wide ${wide.name} ${idx}`;
          }
          break;
        }
        default: break;
      }
    } catch (e) {
      errors.push(`pc=${pc} ${spec.name}: ${e.message}`);
    }
    if (spec.name === 'newarray' && operands.length) {
      text = `newarray ${ATYPE[operands[0]] ?? operands[0]}`;
    }
    const length = r.i - pc;
    out.push({
      pc, length, bytes: Array.from(code.slice(pc - 0, r.i)), mnemonic: spec.name,
      operands, text, target, opcode: op, operandStart: start,
    });
  }
  return { instructions: out, errors };
}

/** Human-readable constant-pool reference for a cp index. */
export function describe(pool, index) {
  if (!pool) return '';
  const e = pool[index];
  if (!e) return '';
  // Utf8 entries carry .value; Class entries must be followed to their name.
  const utf = (i) => {
    const e = pool[i];
    if (!e) return `#${i}`;
    if (e.tag === 1) return e.value ?? `#${i}`;
    if (e.tag === 7) return pool[e.nameIndex]?.value ?? `#${i}`;
    return `#${i}`;
  };
  switch (e.tag) {
    case 1: return JSON.stringify(e.value);
    case 3: case 4: return String(e.value);
    case 5: return `${e.value}L`;
    case 6: return String(e.value);
    case 7: return `class ${utf(e.nameIndex)}`;
    case 8: return `String ${utf(e.stringIndex)}`;
    case 9: case 10: case 11: {
      const nt = pool[e.nameAndTypeIndex];
      return `${utf(e.classIndex)}.${utf(nt?.nameIndex)}:${utf(nt?.descriptorIndex)}`;
    }
    case 12: return `${utf(e.nameIndex)}:${utf(e.descriptorIndex)}`;
    case 15: return `MethodHandle kind=${e.referenceKind} #${e.referenceIndex}`;
    case 16: return `MethodType ${utf(e.descriptorIndex)}`;
    case 17: case 18: {
      const nt = pool[e.nameAndTypeIndex];
      return `#${e.bootstrapMethodAttrIndex} ${utf(nt?.nameIndex)}:${utf(nt?.descriptorIndex)}`;
    }
    case 19: case 20: return utf(e.nameIndex);
    default: return '';
  }
}

/* ------------------------------------------------------------- class parser */

export function parseClass(bytes) {
  const r = new Reader(bytes);
  const magic = r.u4();
  if (magic !== 0xcafebabe) throw new Error(`not a class file: magic 0x${hex(magic, 8)}`);
  const minor = r.u2();
  const major = r.u2();
  const pool = readConstantPool(r);
  const accessFlags = r.u2();
  const thisClass = r.u2();
  const superClass = r.u2();
  const utf = (i) => pool[i]?.value ?? null;
  const className = (i) => (i ? utf(pool[i]?.nameIndex) : null);

  const interfaces = [];
  const icount = r.u2();
  for (let k = 0; k < icount; k++) interfaces.push(className(r.u2()));

  const readMembers = (isField) => {
    const n = r.u2();
    const out = [];
    for (let k = 0; k < n; k++) {
      const af = r.u2();
      const name = utf(r.u2());
      const descriptor = utf(r.u2());
      const attrs = readAttributes(r, pool);
      out.push({ accessFlags: af, flags: flags(af, MEMBER_FLAGS), name, descriptor, attributes: attrs });
      void isField;
    }
    return out;
  };

  const fields = readMembers(true);
  const methods = readMembers(false);
  const attributes = readAttributes(r, pool);

  return {
    kind: 'class',
    magic: 'CAFEBABE',
    version: `${major}.${minor}`,
    major, minor,
    javaVersion: majorToJava(major),
    accessFlags, flags: flags(accessFlags, CLASS_FLAGS),
    thisClass: className(thisClass),
    superClass: className(superClass),
    interfaces, fields, methods, attributes, pool,
    constantPoolCount: pool.length - 1,
  };
}

export function majorToJava(major) {
  if (major < 45) return `pre-1.1 (${major})`;
  if (major <= 48) return `JDK 1.${major - 44}`;
  if (major >= 49) return `Java ${major - 44}`;
  return String(major);
}

/** Attributes, with Code parsed deep enough to disassemble. */
export function readAttributes(r, pool) {
  const n = r.u2();
  const out = [];
  for (let k = 0; k < n; k++) {
    const name = pool[r.u2()]?.value ?? '<unknown>';
    const length = r.u4();
    const start = r.i;
    const attr = { name, length };
    if (name === 'Code' && length >= 12) {
      attr.maxStack = r.u2();
      attr.maxLocals = r.u2();
      const codeLength = r.u4();
      attr.codeLength = codeLength;
      const code = r.bytes(codeLength);
      attr.code = code;
      const etn = r.u2();
      attr.exceptionTable = [];
      for (let e = 0; e < etn; e++) {
        attr.exceptionTable.push({ start: r.u2(), end: r.u2(), handler: r.u2(), catchType: r.u2() });
      }
      attr.attributes = readAttributes(r, pool);
      const dis = disassemble(code, pool);
      attr.instructions = dis.instructions;
      attr.disassemblyErrors = dis.errors;
    } else if (name === 'ConstantValue' && length >= 2) {
      const idx = r.u2();
      attr.value = describe(pool, idx);
    } else if (name === 'SourceFile' && length >= 2) {
      attr.file = pool[r.u2()]?.value;
    } else if (name === 'LineNumberTable' && length >= 2) {
      const c = r.u2();
      attr.lines = [];
      for (let e = 0; e < c; e++) attr.lines.push({ pc: r.u2(), line: r.u2() });
    } else if (name === 'BootstrapMethods' && length >= 2) {
      const c = r.u2();
      attr.count = c;
    }
    r.i = start + length; // trust the declared length
    out.push(attr);
  }
  return out;
}

/* ---------------------------------------------------------------- CAP files */

export const CAP_COMPONENTS = {
  1: 'Header', 2: 'Directory', 3: 'Applet', 4: 'Import', 5: 'ConstantPool',
  6: 'Class', 7: 'Method', 8: 'StaticField', 9: 'Export', 10: 'Descriptor',
  11: 'Debug',
};

export function parseCap(bytes) {
  const r = new Reader(bytes);
  const magic = r.u4();
  if (magic !== 0xdecaffed) throw new Error(`not a CAP file: magic 0x${hex(magic, 8)}`);
  const minor = r.u1();
  const major = r.u1();
  const flags = r.u1();
  const packageLength = r.u4();
  // The package AID is carried by the Header component that follows, not by the
  // file header: cap_file = magic u4, minor u1, major u1, flags u1,
  // package_length u4, then components (each tag u1 + size u2 + data).
  const components = [];
  while (r.left >= 3) {
    const tag = r.u1();
    const size = r.u2();
    components.push({
      tag, name: CAP_COMPONENTS[tag] ?? `tag:${tag}`, size,
      hex: Array.from(r.bytes(Math.min(size, 32))).map((b) => hex(b)).join(' '),
    });
  }
  return {
    kind: 'cap', magic: 'DECAFFED', version: `${major}.${minor}`, major, minor, flags,
    packageLength, components,
  };
}

/* ------------------------------------------------------------------- summary */

/**
 * One-shot triage: magic → parsed structure → a verdict string that says which
 * virtual machine (and therefore which Ghidra language) the blob belongs to.
 */
export function triage(bytes) {
  const s = sniff(bytes);
  const out = { ...s, bytes: bytes.length, notes: [] };
  try {
    if (s.kind === 'class') {
      const c = parseClass(bytes);
      out.class = {
        version: c.version, java: c.javaVersion, thisClass: c.thisClass, superClass: c.superClass,
        flags: c.flags, constantPool: c.constantPoolCount,
        methods: c.methods.map((m) => ({
          name: m.name, descriptor: m.descriptor, flags: m.flags,
          instructions: m.attributes.find((a) => a.name === 'Code')?.instructions?.length ?? 0,
        })),
      };
      const classNames = c.pool.filter((e) => e?.tag === 7).map((e) => c.pool[e.nameIndex]?.value ?? '');
      const jc = classNames.some((n) => /javacard|javacardx/i.test(n)) ||
        /javacard/i.test(c.superClass ?? '') ||
        c.interfaces.some((i) => /javacard/i.test(i ?? ''));
      out.verdict = jc
        ? `Java Card applet class file, version ${c.version} — the off-card converter turns this into a CAP for the JCVM, not a full JVM. Ghidra language JVM:BE:32:default reads the bytecode either way.`
        : `JVM class file, version ${c.version} (${c.javaVersion}) — Ghidra language JVM:BE:32:default.`;
      out.javaCard = Boolean(jc);
    } else if (s.kind === 'cap') {
      const c = parseCap(bytes);
      out.cap = { version: c.version, packageLength: c.packageLength, components: c.components };
      out.verdict = `Java Card CAP package v${c.version} for the JCVM: ${c.components.map((x) => `${x.name}(${x.size})`).join(', ')}.`;
    } else {
      out.verdict = `magic ${s.magic ?? 'unrecognised'} — not a Java class or CAP file.`;
    }
  } catch (e) {
    out.error = e.message;
    out.verdict = `magic ${s.magic}: parse failed (${e.message}).`;
  }
  return out;
}
