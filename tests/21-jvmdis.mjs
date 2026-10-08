/**
 * 21 · js/jvmdis.js — the Java class / Java Card CAP reader and bytecode
 * disassembler that the Lantronix lab's JAVA tab runs in the browser.
 *
 * The fixture below is assembled byte by byte from the JVMS class-file layout,
 * independently of the parser: if the parser's constant-pool walk, its Code
 * attribute handling or its opcode table were wrong, the strings and the
 * instruction stream would come out wrong rather than merely different.
 *
 * node tests/21-jvmdis.mjs
 */
import { suite } from './lib.mjs';
import {
  sniff, parseClass, parseCap, disassemble, describe, triage, OPCODES, utf8, majorToJava,
} from '../js/jvmdis.js';

const s = suite('21 · jvmdis (class + CAP reader, bytecode disassembler)');

/* ------------------------------------------------------- fixture: a class */

const strings = [
  'Hello',                                  // 1
  'java/lang/Object',                       // 3 (via Class entries below)
  'main',                                   // 5
  '([Ljava/lang/String;)V',                 // 6
  'Code',                                   // 7
  'java/lang/System',                       // 8
  'out',                                    // 10
  'Ljava/io/PrintStream;',                  // 11
  'hello, xPort Pro',                       // 14
  'java/io/PrintStream',                    // 16
  'println',                                // 18
  '(Ljava/lang/String;)V',                  // 19
  'SourceFile',                             // 22
  'Hello.java',                             // 23
];

function buildClass() {
  const b = [];
  const u1 = (v) => b.push(v & 0xff);
  const u2 = (v) => { b.push((v >> 8) & 0xff, v & 0xff); };
  const u4 = (v) => { b.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); };
  const utf = (str) => { const bytes = [...new TextEncoder().encode(str)]; u1(1); u2(bytes.length); b.push(...bytes); };

  u4(0xcafebabe); u2(0); u2(52);           // magic, minor, major (Java 8)
  u2(24);                                  // constant_pool_count = entries + 1
  utf('Hello');                            // #1
  u1(7); u2(1);                            // #2 Class -> Hello
  utf('java/lang/Object');                 // #3
  u1(7); u2(3);                            // #4 Class -> java/lang/Object
  utf('main');                             // #5
  utf('([Ljava/lang/String;)V');           // #6
  utf('Code');                             // #7
  utf('java/lang/System');                 // #8
  u1(7); u2(8);                            // #9 Class -> java/lang/System
  utf('out');                              // #10
  utf('Ljava/io/PrintStream;');            // #11
  u1(12); u2(10); u2(11);                  // #12 NameAndType out:Ljava/io/PrintStream;
  u1(9); u2(9); u2(12);                    // #13 Fieldref System.out
  utf('hello, xPort Pro');                 // #14
  u1(8); u2(14);                           // #15 String
  utf('java/io/PrintStream');              // #16
  u1(7); u2(16);                           // #17 Class -> java/io/PrintStream
  utf('println');                          // #18
  utf('(Ljava/lang/String;)V');            // #19
  u1(12); u2(18); u2(19);                  // #20 NameAndType println:(Ljava/lang/String;)V
  u1(10); u2(17); u2(20);                  // #21 Methodref PrintStream.println
  utf('SourceFile');                       // #22
  utf('Hello.java');                       // #23

  u2(0x0021);                              // ACC_PUBLIC | ACC_SUPER
  u2(2); u2(4);                            // this_class, super_class
  u2(0);                                   // interfaces_count
  u2(0);                                   // fields_count
  u2(1);                                   // methods_count
  u2(0x0009); u2(5); u2(6);                // ACC_PUBLIC|ACC_STATIC main([Ljava/lang/String;)V
  u2(1);                                   // one attribute: Code
  u2(7);                                   //   attribute_name -> "Code"
  const code = [
    0xb2, 0x00, 0x0d,                      //   getstatic #13
    0x12, 0x0f,                            //   ldc #15
    0xb6, 0x00, 0x15,                      //   invokevirtual #21
    0xb1,                                  //   return
  ];
  u4(2 + 2 + 4 + code.length + 2 + 2);      //   attribute_length
  u2(2); u2(1);                            //   max_stack, max_locals
  u4(code.length); b.push(...code);         //   code_length + code
  u2(0);                                   //   exception_table_length
  u2(0);                                   //   Code attributes_count
  u2(1);                                   // class attributes_count: SourceFile
  u2(22); u4(2); u2(23);
  return new Uint8Array(b);
}

function buildAppletClass() {
  // Same shape, but the super class is javacard/framework/Applet: triage() must
  // call this a Java Card applet, not a plain JVM class.
  const b = [];
  const u1 = (v) => b.push(v & 0xff);
  const u2 = (v) => { b.push((v >> 8) & 0xff, v & 0xff); };
  const u4 = (v) => { b.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); };
  const utf = (str) => { const bytes = [...new TextEncoder().encode(str)]; u1(1); u2(bytes.length); b.push(...bytes); };
  u4(0xcafebabe); u2(0); u2(49);           // Java Card 2.2.x class files are 49.0
  u2(6);
  utf('lab/AesApplet');                    // #1
  u1(7); u2(1);                            // #2
  utf('javacard/framework/Applet');        // #3
  u1(7); u2(3);                            // #4
  utf('install');                          // #5
  u2(0x0021); u2(2); u2(4); u2(0); u2(0); u2(0);
  return new Uint8Array(b);
}

function buildCap() {
  const b = [];
  const u1 = (v) => b.push(v & 0xff);
  const u2 = (v) => { b.push((v >> 8) & 0xff, v & 0xff); };
  const u4 = (v) => { b.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff); };
  u4(0xdecaffed); u1(1); u1(2); u1(0);      // magic, minor, major, flags
  u4(64);                                   // package_length (AID lives in the Header component)
  const comps = [[1, 12], [2, 8], [3, 4], [4, 6], [5, 10], [6, 6]];
  for (const [tag, size] of comps) { u1(tag); u2(size); for (let k = 0; k < size; k++) u1(0); }
  return new Uint8Array(b);
}

/* ------------------------------------------------------------------ checks */

const cls = buildClass();
s.eq('magic sniffs as a class file', sniff(cls).kind, 'class');
s.eq('magic string', sniff(cls).magic, 'CAFEBABE');

let parsed = null;
let threw = null;
try { parsed = parseClass(cls); } catch (e) { threw = e; }
s.ok('parseClass() accepts the hand-built fixture', threw === null, threw ? threw.message : '');

if (parsed) {
  s.eq('class file version', parsed.version, '52.0');
  s.eq('version → Java release', parsed.javaVersion, 'Java 8');
  s.eq('this_class', parsed.thisClass, 'Hello');
  s.eq('super_class', parsed.superClass, 'java/lang/Object');
  s.eq('access flags decoded', parsed.flags, ['ACC_PUBLIC', 'ACC_SUPER']);
  s.eq('constant pool entries', parsed.constantPoolCount, 23);
  s.eq('one method', parsed.methods.length, 1);
  const m = parsed.methods[0];
  s.eq('method name', m.name, 'main');
  s.eq('method descriptor', m.descriptor, '([Ljava/lang/String;)V');
  s.eq('method flags', m.flags, ['ACC_PUBLIC', 'ACC_STATIC']);
  const code = m.attributes.find((a) => a.name === 'Code');
  s.ok('Code attribute present', Boolean(code));
  if (code) {
    s.eq('max_stack', code.maxStack, 2);
    s.eq('max_locals', code.maxLocals, 1);
    s.eq('code_length', code.codeLength, 9);
    s.eq('instruction count', code.instructions.length, 4);
    s.eq('instruction stream', code.instructions.map((i) => i.text.split(' //')[0]),
      ['getstatic #13', 'ldc #15', 'invokevirtual #21', 'return']);
    s.eq('instruction lengths', code.instructions.map((i) => i.length), [3, 2, 3, 1]);
    s.eq('instruction pcs', code.instructions.map((i) => i.pc), [0, 3, 5, 8]);
    s.eq('cp references resolved', code.instructions.slice(0, 3).map((i) => i.text.split('// ')[1]),
      // javap's own comment style: `// String hello` — no quotes around the value.
      ['java/lang/System.out:Ljava/io/PrintStream;', 'String hello, xPort Pro',
        'java/io/PrintStream.println:(Ljava/lang/String;)V']);
    s.eq('no disassembly errors', code.disassemblyErrors, []);
  }
  s.eq('SourceFile attribute', parsed.attributes[0].name, 'SourceFile');
  s.eq('SourceFile value', parsed.attributes[0].file, 'Hello.java');
}

/* ----------------------------------------------------- branch instructions */

const branch = disassemble(new Uint8Array([
  0x1b,                                     // iload_1
  0x99, 0x00, 0x06,                         // ifeq → pc 1 + 6 = 7
  0x84, 0x01, 0xff,                         // iinc 1, -1
  0xa7, 0xff, 0xfa,                         // goto → pc 4 + (-6) = -2
  0xb1,                                     // return
]), null);
s.eq('branch targets resolved', branch.instructions.map((i) => i.target), [null, 7, null, 1, null]);
s.eq('iinc operands are index + signed const', branch.instructions[2].operands, [1, -1]);
s.eq('no errors on the branch fixture', branch.errors, []);

/* --------------------------------------------------- switches and wide */

const table = new Uint8Array([
  0xaa, 0x00, 0x00, 0x00,                   // tableswitch + 3 pad bytes (operands align to 4)
  0x00, 0x00, 0x00, 0x1c,                   // default = pc + 28
  0x00, 0x00, 0x00, 0x00,                   // low = 0
  0x00, 0x00, 0x00, 0x01,                   // high = 1
  0x00, 0x00, 0x00, 0x0e,                   // jump[0] = pc + 14
  0x00, 0x00, 0x00, 0x14,                   // jump[1] = pc + 20
  0xb1,
]);
const sw = disassemble(table, null);
s.eq('tableswitch mnemonic', sw.instructions[0].mnemonic, 'tableswitch');
s.eq('tableswitch jump table', sw.instructions[0].operands[0].jumps, [14, 20]);
s.eq('tableswitch default', sw.instructions[0].operands[0].def, 28);
s.eq('tableswitch errors', sw.errors, []);

const wide = disassemble(new Uint8Array([0xc4, 0x84, 0x01, 0x02, 0x00, 0x64]), null);
s.eq('wide iinc decoded', wide.instructions[0].text, 'wide iinc 258, 100');
s.eq('wide iinc length', wide.instructions[0].length, 6);

/* ------------------------------------------------------- opcode table audit */

const assigned = OPCODES.filter(Boolean);
s.ok('every opcode 0x00-0xc9 is assigned (JVMS chapter 6)',
  OPCODES.slice(0, 0xca).every((o, i) => o && o.code === i),
  `${assigned.length} entries total`);
s.eq('reserved breakpoint', OPCODES[0xca].name, 'breakpoint');
s.eq('impdep1 / impdep2', [OPCODES[0xfe].name, OPCODES[0xff].name], ['impdep1', 'impdep2']);
const spot = { 0xb2: 'getstatic', 0xb5: 'putfield', 0xb6: 'invokevirtual', 0xb7: 'invokespecial',
  0xb8: 'invokestatic', 0xb9: 'invokeinterface', 0xba: 'invokedynamic', 0xbb: 'new',
  0xbc: 'newarray', 0xc0: 'checkcast', 0xc5: 'multianewarray', 0xc6: 'ifnull', 0xc8: 'goto_w' };
for (const [code, name] of Object.entries(spot)) {
  s.eq(`opcode 0x${Number(code).toString(16)}`, OPCODES[code].name, name);
}
s.eq('newarray atype names a primitive', disassemble(new Uint8Array([0xbc, 0x0a]), null).instructions[0].text, 'newarray int');

/* -------------------------------------------------------- CAP + triage */

const cap = buildCap();
s.eq('CAP magic sniffs', sniff(cap).kind, 'cap');
const capp = parseCap(cap);
s.eq('CAP version', capp.version, '2.1');
s.eq('CAP components', capp.components.map((c) => `${c.name}(${c.size})`),
  ['Header(12)', 'Directory(8)', 'Applet(4)', 'Import(6)', 'ConstantPool(10)', 'Class(6)']);

const t = triage(cls);
s.ok('triage verdict names the Ghidra JVM language', /JVM:BE:32:default/.test(t.verdict), t.verdict);
s.eq('triage is not Java Card for a plain class', t.javaCard, false);
const tj = triage(buildAppletClass());
s.eq('Java Card applet detected', tj.javaCard, true);
s.ok('applet verdict mentions the JCVM', /JCVM/.test(tj.verdict), tj.verdict);
s.eq('CAP triage verdict', triage(cap).verdict.startsWith('Java Card CAP package v2.1'), true);
s.eq('unknown magic is reported, not thrown', triage(new Uint8Array([1, 2, 3, 4])).kind, 'unknown');

/* --------------------------------------------------------------- utilities */

s.eq('class-file UTF-8 decodes modified NUL', utf8(new Uint8Array([0x61, 0xc0, 0x80, 0x62])), 'a\u0000b');
s.eq('major 49 → Java 5', majorToJava(49), 'Java 5');
s.eq('major 45 → JDK 1.1', majorToJava(45), 'JDK 1.1');
s.eq('describe() falls back safely without a pool', describe(null, 7), '');

process.exit(s.done() ? 1 : 0);
