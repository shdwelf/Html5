/* CHIPWRIGHT · cw-data-jvm.js — Java bytecode, the class file, and Java Card.
 *
 * Why a hardware workbench carries a bytecode module: Java bytecode is the one
 * instruction set in this app that is *manufacturer-independent by design*. The
 * same CAP file runs on an NXP JCOP, an Infineon SECORA, a Gemalto/Thales
 * card and a simulator, because the ISA is specified rather than reverse
 * engineered. When the silicon underneath is unobtainable — which is the whole
 * premise of a substitution repair — a bytecode layer is the part of the stack
 * that survives the change of manufacturer. That is the argument, and it is the
 * reason Java Card belongs next to JTAG rather than in some other project.
 *
 * Evidence tags: std / tool / report / recall.
 */

/* ------------------------------------------------------------------ *
 * 1. The class file
 *    ev: "std" (JVMS §4.1). This layout is exact and is what lets a parser
 *    be written without ever running a JVM.
 * ------------------------------------------------------------------ */

export const CLASS_MAGIC = 0xcafebabe;

export const CLASS_LAYOUT = [
  { off: 0x00, size: 4, field: "magic", meaning: "0xCAFEBABE. The same magic as a Mach-O fat binary, which is a genuine collision and the reason `file` sometimes guesses wrong." },
  { off: 0x04, size: 2, field: "minor_version", meaning: "" },
  { off: 0x06, size: 2, field: "major_version", meaning: "45 = 1.1, 52 = Java 8, 55 = 11, 61 = 17, 65 = 21. A card VM will refuse a class file compiled for a newer major version, and the error it gives is usually unhelpful." },
  { off: 0x08, size: 2, field: "constant_pool_count", meaning: "ONE-BASED: the pool has count-1 entries and index 0 is reserved to mean 'no reference'. Off-by-one here shifts every subsequent offset and the parse looks like corruption." },
  { off: "…", size: "var", field: "constant_pool[count-1]", meaning: "Tagged entries; Long and Double take two slots and leave the following index unusable." },
  { off: "…", size: 2, field: "access_flags", meaning: "0x0001 PUBLIC, 0x0010 FINAL, 0x0200 SUPER/INTERFACE, 0x0400 INTERFACE, 0x1000 ABSTRACT, 0x2000 SYNTHETIC, 0x4000 ANNOTATION, 0x8000 ENUM, 0x20000 MODULE." },
  { off: "…", size: 2, field: "this_class", meaning: "Index into the pool of a CONSTANT_Class_info." },
  { off: "…", size: 2, field: "super_class", meaning: "Zero for java/lang/Object." },
  { off: "…", size: 2, field: "interfaces_count", meaning: "" },
  { off: "…", size: "2n", field: "interfaces[]", meaning: "" },
  { off: "…", size: 2, field: "fields_count", meaning: "" },
  { off: "…", size: "var", field: "fields[]", meaning: "Each: access_flags, name_index, descriptor_index, attributes_count, attributes[]." },
  { off: "…", size: 2, field: "methods_count", meaning: "" },
  { off: "…", size: "var", field: "methods[]", meaning: "Same shape; the Code attribute holds max_stack, max_locals, code[], exception_table[], attributes[]." },
  { off: "…", size: 2, field: "attributes_count", meaning: "" },
];

export const CP_TAGS = [
  { tag: 1, name: "Utf8", size: "2 + length", ev: "std", what: "Modified UTF-8: NUL is encoded as C0 80 and supplementary characters as surrogate pairs. A naive UTF-8 decoder produces a wrong string, not an error." },
  { tag: 3, name: "Integer", size: 4, ev: "std" },
  { tag: 4, name: "Float", size: 4, ev: "std" },
  { tag: 5, name: "Long", size: 8, ev: "std", what: "Takes TWO pool slots. The next index is unusable — a parse that does not account for this drifts." },
  { tag: 6, name: "Double", size: 8, ev: "std", what: "Also takes two slots." },
  { tag: 7, name: "Class", size: 2, ev: "std" },
  { tag: 8, name: "String", size: 2, ev: "std" },
  { tag: 9, name: "Fieldref", size: 4, ev: "std" },
  { tag: 10, name: "Methodref", size: 4, ev: "std" },
  { tag: 11, name: "InterfaceMethodref", size: 4, ev: "std" },
  { tag: 12, name: "NameAndType", size: 4, ev: "std" },
  { tag: 15, name: "MethodHandle", size: 3, ev: "std" },
  { tag: 16, name: "MethodType", size: 2, ev: "std" },
  { tag: 17, name: "Dynamic", size: 4, ev: "std" },
  { tag: 18, name: "InvokeDynamic", size: 4, ev: "std" },
  { tag: 19, name: "Module", size: 2, ev: "std" },
  { tag: 20, name: "Package", size: 2, ev: "std" },
];

/* ------------------------------------------------------------------ *
 * 2. JVM opcodes
 *    ev: "std" (JVMS §6.5). Every row gives the operand bytes that follow
 *    the opcode, which is what makes a length-correct decoder possible.
 * ------------------------------------------------------------------ */

export const JVM_OPCODES = [
  { op: 0x00, name: "nop", operands: [], stack: "… → …", ev: "std" },
  { op: 0x01, name: "aconst_null", operands: [], stack: "… → null", ev: "std" },
  { op: 0x02, name: "iconst_m1", operands: [], stack: "… → -1", ev: "std" },
  { op: 0x03, name: "iconst_0", operands: [], stack: "… → 0", ev: "std" },
  { op: 0x04, name: "iconst_1", operands: [], stack: "… → 1", ev: "std" },
  { op: 0x05, name: "iconst_2", operands: [], stack: "… → 2", ev: "std" },
  { op: 0x06, name: "iconst_3", operands: [], stack: "… → 3", ev: "std" },
  { op: 0x07, name: "iconst_4", operands: [], stack: "… → 4", ev: "std" },
  { op: 0x08, name: "iconst_5", operands: [], stack: "… → 5", ev: "std" },
  { op: 0x09, name: "lconst_0", operands: [], stack: "… → 0L", ev: "std" },
  { op: 0x0a, name: "lconst_1", operands: [], stack: "… → 1L", ev: "std" },
  { op: 0x0b, name: "fconst_0", operands: [], stack: "… → 0.0f", ev: "std" },
  { op: 0x0c, name: "fconst_1", operands: [], stack: "… → 1.0f", ev: "std" },
  { op: 0x0d, name: "fconst_2", operands: [], stack: "… → 2.0f", ev: "std" },
  { op: 0x0e, name: "dconst_0", operands: [], stack: "… → 0.0d", ev: "std" },
  { op: 0x0f, name: "dconst_1", operands: [], stack: "… → 1.0d", ev: "std" },
  { op: 0x10, name: "bipush", operands: ["byte"], stack: "… → value", ev: "std", what: "Sign-extended byte." },
  { op: 0x11, name: "sipush", operands: ["short"], stack: "… → value", ev: "std", what: "Sign-extended 16-bit." },
  { op: 0x12, name: "ldc", operands: ["indexbyte1"], stack: "… → item", ev: "std", what: "Pool index fits in one byte; ldc_w for larger pools." },
  { op: 0x13, name: "ldc_w", operands: ["indexbyte1", "indexbyte2"], stack: "… → item", ev: "std" },
  { op: 0x14, name: "ldc2_w", operands: ["indexbyte1", "indexbyte2"], stack: "… → long/double", ev: "std", what: "Pushes a two-slot value." },
  { op: 0x15, name: "iload", operands: ["index"], stack: "… → value", ev: "std" },
  { op: 0x16, name: "lload", operands: ["index"], stack: "… → value", ev: "std" },
  { op: 0x17, name: "fload", operands: ["index"], stack: "… → value", ev: "std" },
  { op: 0x18, name: "dload", operands: ["index"], stack: "… → value", ev: "std" },
  { op: 0x19, name: "aload", operands: ["index"], stack: "… → objectref", ev: "std" },
  { op: 0x1a, name: "iload_0", operands: [], ev: "std" }, { op: 0x1b, name: "iload_1", operands: [], ev: "std" },
  { op: 0x1c, name: "iload_2", operands: [], ev: "std" }, { op: 0x1d, name: "iload_3", operands: [], ev: "std" },
  { op: 0x1e, name: "lload_0", operands: [], ev: "std" }, { op: 0x1f, name: "lload_1", operands: [], ev: "std" },
  { op: 0x20, name: "lload_2", operands: [], ev: "std" }, { op: 0x21, name: "lload_3", operands: [], ev: "std" },
  { op: 0x22, name: "fload_0", operands: [], ev: "std" }, { op: 0x23, name: "fload_1", operands: [], ev: "std" },
  { op: 0x24, name: "fload_2", operands: [], ev: "std" }, { op: 0x25, name: "fload_3", operands: [], ev: "std" },
  { op: 0x26, name: "dload_0", operands: [], ev: "std" }, { op: 0x27, name: "dload_1", operands: [], ev: "std" },
  { op: 0x28, name: "dload_2", operands: [], ev: "std" }, { op: 0x29, name: "dload_3", operands: [], ev: "std" },
  { op: 0x2a, name: "aload_0", operands: [], ev: "std", what: "In an instance method, local 0 is always `this`." },
  { op: 0x2b, name: "aload_1", operands: [], ev: "std" }, { op: 0x2c, name: "aload_2", operands: [], ev: "std" },
  { op: 0x2d, name: "aload_3", operands: [], ev: "std" },
  { op: 0x2e, name: "iaload", operands: [], ev: "std" }, { op: 0x2f, name: "laload", operands: [], ev: "std" },
  { op: 0x30, name: "faload", operands: [], ev: "std" }, { op: 0x31, name: "daload", operands: [], ev: "std" },
  { op: 0x32, name: "aaload", operands: [], ev: "std" }, { op: 0x33, name: "baload", operands: [], ev: "std" },
  { op: 0x34, name: "caload", operands: [], ev: "std" }, { op: 0x35, name: "saload", operands: [], ev: "std" },
  { op: 0x36, name: "istore", operands: ["index"], ev: "std" }, { op: 0x37, name: "lstore", operands: ["index"], ev: "std" },
  { op: 0x38, name: "fstore", operands: ["index"], ev: "std" }, { op: 0x39, name: "dstore", operands: ["index"], ev: "std" },
  { op: 0x3a, name: "astore", operands: ["index"], ev: "std" },
  { op: 0x3b, name: "istore_0", operands: [], ev: "std" }, { op: 0x3c, name: "istore_1", operands: [], ev: "std" },
  { op: 0x3d, name: "istore_2", operands: [], ev: "std" }, { op: 0x3e, name: "istore_3", operands: [], ev: "std" },
  { op: 0x3f, name: "lstore_0", operands: [], ev: "std" }, { op: 0x40, name: "lstore_1", operands: [], ev: "std" },
  { op: 0x41, name: "lstore_2", operands: [], ev: "std" }, { op: 0x42, name: "lstore_3", operands: [], ev: "std" },
  { op: 0x43, name: "fstore_0", operands: [], ev: "std" }, { op: 0x44, name: "fstore_1", operands: [], ev: "std" },
  { op: 0x45, name: "fstore_2", operands: [], ev: "std" }, { op: 0x46, name: "fstore_3", operands: [], ev: "std" },
  { op: 0x47, name: "dstore_0", operands: [], ev: "std" }, { op: 0x48, name: "dstore_1", operands: [], ev: "std" },
  { op: 0x49, name: "dstore_2", operands: [], ev: "std" }, { op: 0x4a, name: "dstore_3", operands: [], ev: "std" },
  { op: 0x4b, name: "astore_0", operands: [], ev: "std" }, { op: 0x4c, name: "astore_1", operands: [], ev: "std" },
  { op: 0x4d, name: "astore_2", operands: [], ev: "std" }, { op: 0x4e, name: "astore_3", operands: [], ev: "std" },
  { op: 0x4f, name: "iastore", operands: [], ev: "std" }, { op: 0x50, name: "lastore", operands: [], ev: "std" },
  { op: 0x51, name: "fastore", operands: [], ev: "std" }, { op: 0x52, name: "dastore", operands: [], ev: "std" },
  { op: 0x53, name: "aastore", operands: [], ev: "std" }, { op: 0x54, name: "bastore", operands: [], ev: "std" },
  { op: 0x55, name: "castore", operands: [], ev: "std" }, { op: 0x56, name: "sastore", operands: [], ev: "std" },
  { op: 0x57, name: "pop", operands: [], ev: "std" }, { op: 0x58, name: "pop2", operands: [], ev: "std" },
  { op: 0x59, name: "dup", operands: [], ev: "std" }, { op: 0x5a, name: "dup_x1", operands: [], ev: "std" },
  { op: 0x5b, name: "dup_x2", operands: [], ev: "std" }, { op: 0x5c, name: "dup2", operands: [], ev: "std" },
  { op: 0x5d, name: "dup2_x1", operands: [], ev: "std" }, { op: 0x5e, name: "dup2_x2", operands: [], ev: "std" },
  { op: 0x5f, name: "swap", operands: [], ev: "std" },
  { op: 0x60, name: "iadd", operands: [], ev: "std" }, { op: 0x61, name: "ladd", operands: [], ev: "std" },
  { op: 0x62, name: "fadd", operands: [], ev: "std" }, { op: 0x63, name: "dadd", operands: [], ev: "std" },
  { op: 0x64, name: "isub", operands: [], ev: "std" }, { op: 0x65, name: "lsub", operands: [], ev: "std" },
  { op: 0x66, name: "fsub", operands: [], ev: "std" }, { op: 0x67, name: "dsub", operands: [], ev: "std" },
  { op: 0x68, name: "imul", operands: [], ev: "std" }, { op: 0x69, name: "lmul", operands: [], ev: "std" },
  { op: 0x6a, name: "fmul", operands: [], ev: "std" }, { op: 0x6b, name: "dmul", operands: [], ev: "std" },
  { op: 0x6c, name: "idiv", operands: [], ev: "std" }, { op: 0x6d, name: "ldiv", operands: [], ev: "std" },
  { op: 0x6e, name: "fdiv", operands: [], ev: "std" }, { op: 0x6f, name: "ddiv", operands: [], ev: "std" },
  { op: 0x70, name: "irem", operands: [], ev: "std" }, { op: 0x71, name: "lrem", operands: [], ev: "std" },
  { op: 0x72, name: "frem", operands: [], ev: "std" }, { op: 0x73, name: "drem", operands: [], ev: "std" },
  { op: 0x74, name: "ineg", operands: [], ev: "std" }, { op: 0x75, name: "lneg", operands: [], ev: "std" },
  { op: 0x76, name: "fneg", operands: [], ev: "std" }, { op: 0x77, name: "dneg", operands: [], ev: "std" },
  { op: 0x78, name: "ishl", operands: [], ev: "std" }, { op: 0x79, name: "lshl", operands: [], ev: "std" },
  { op: 0x7a, name: "ishr", operands: [], ev: "std" }, { op: 0x7b, name: "lshr", operands: [], ev: "std" },
  { op: 0x7c, name: "iushr", operands: [], ev: "std" }, { op: 0x7d, name: "lushr", operands: [], ev: "std" },
  { op: 0x7e, name: "iand", operands: [], ev: "std" }, { op: 0x7f, name: "land", operands: [], ev: "std" },
  { op: 0x80, name: "ior", operands: [], ev: "std" }, { op: 0x81, name: "lor", operands: [], ev: "std" },
  { op: 0x82, name: "ixor", operands: [], ev: "std" }, { op: 0x83, name: "lxor", operands: [], ev: "std" },
  { op: 0x84, name: "iinc", operands: ["index", "const"], ev: "std", what: "The loop increment. index and const are both single bytes (signed const), so iinc is 3 bytes total." },
  { op: 0x85, name: "i2l", operands: [], ev: "std" }, { op: 0x86, name: "i2f", operands: [], ev: "std" },
  { op: 0x87, name: "i2d", operands: [], ev: "std" }, { op: 0x88, name: "l2i", operands: [], ev: "std" },
  { op: 0x89, name: "l2f", operands: [], ev: "std" }, { op: 0x8a, name: "l2d", operands: [], ev: "std" },
  { op: 0x8b, name: "f2i", operands: [], ev: "std" }, { op: 0x8c, name: "f2l", operands: [], ev: "std" },
  { op: 0x8d, name: "f2d", operands: [], ev: "std" }, { op: 0x8e, name: "d2i", operands: [], ev: "std" },
  { op: 0x8f, name: "d2l", operands: [], ev: "std" }, { op: 0x90, name: "d2f", operands: [], ev: "std" },
  { op: 0x91, name: "i2b", operands: [], ev: "std" }, { op: 0x92, name: "i2c", operands: [], ev: "std" },
  { op: 0x93, name: "i2s", operands: [], ev: "std" },
  { op: 0x94, name: "lcmp", operands: [], ev: "std" }, { op: 0x95, name: "fcmpl", operands: [], ev: "std" },
  { op: 0x96, name: "fcmpg", operands: [], ev: "std" }, { op: 0x97, name: "dcmpl", operands: [], ev: "std" },
  { op: 0x98, name: "dcmpg", operands: [], ev: "std" },
  { op: 0x99, name: "ifeq", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0x9a, name: "ifne", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0x9b, name: "iflt", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0x9c, name: "ifge", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0x9d, name: "ifgt", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0x9e, name: "ifle", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0x9f, name: "if_icmpeq", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xa0, name: "if_icmpne", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xa1, name: "if_icmplt", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xa2, name: "if_icmpge", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xa3, name: "if_icmpgt", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xa4, name: "if_icmple", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xa5, name: "if_acmpeq", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xa6, name: "if_acmpne", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xa7, name: "goto", operands: ["branchbyte1", "branchbyte2"], ev: "std", what: "Signed 16-bit offset relative to THIS instruction's address." },
  { op: 0xa8, name: "jsr", operands: ["branchbyte1", "branchbyte2"], ev: "std", what: "Obsoleted by the compiler's inlining of finally blocks; present only in very old class files." },
  { op: 0xa9, name: "ret", operands: ["index"], ev: "std" },
  { op: 0xaa, name: "tableswitch", operands: ["variable"], ev: "std", what: "Padded to a 4-byte boundary, then default + low + high + (high-low+1) jump offsets. The padding bytes are the thing that makes a naive sequential decoder lose sync." },
  { op: 0xab, name: "lookupswitch", operands: ["variable"], ev: "std", what: "Padded, then default + npairs + npairs × (match, offset)." },
  { op: 0xac, name: "ireturn", operands: [], ev: "std" }, { op: 0xad, name: "lreturn", operands: [], ev: "std" },
  { op: 0xae, name: "freturn", operands: [], ev: "std" }, { op: 0xaf, name: "dreturn", operands: [], ev: "std" },
  { op: 0xb0, name: "areturn", operands: [], ev: "std" }, { op: 0xb1, name: "return", operands: [], ev: "std" },
  { op: 0xb2, name: "getstatic", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xb3, name: "putstatic", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xb4, name: "getfield", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xb5, name: "putfield", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xb6, name: "invokevirtual", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xb7, name: "invokespecial", operands: ["indexbyte1", "indexbyte2"], ev: "std", what: "Constructors, private methods, and explicit super calls." },
  { op: 0xb8, name: "invokestatic", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xb9, name: "invokeinterface", operands: ["indexbyte1", "indexbyte2", "count", "0"], ev: "std", what: "Four operand bytes, the last always zero — a trap for length tables that say three." },
  { op: 0xba, name: "invokedynamic", operands: ["indexbyte1", "indexbyte2", "0", "0"], ev: "std", what: "Two zero bytes follow. This is how a lambda is represented." },
  { op: 0xbb, name: "new", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xbc, name: "newarray", operands: ["atype"], ev: "std", what: "atype: 4=boolean, 5=char, 6=float, 7=double, 8=byte, 9=short, 10=int, 11=long." },
  { op: 0xbd, name: "anewarray", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xbe, name: "arraylength", operands: [], ev: "std" },
  { op: 0xbf, name: "athrow", operands: [], ev: "std" },
  { op: 0xc0, name: "checkcast", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xc1, name: "instanceof", operands: ["indexbyte1", "indexbyte2"], ev: "std" },
  { op: 0xc2, name: "monitorenter", operands: [], ev: "std" },
  { op: 0xc3, name: "monitorexit", operands: [], ev: "std" },
  { op: 0xc4, name: "wide", operands: ["variable"], ev: "std", what: "Prefix that widens the local-variable index of the following instruction to 16 bits. 4 bytes normally, 6 if the next opcode is iinc." },
  { op: 0xc5, name: "multianewarray", operands: ["indexbyte1", "indexbyte2", "dimensions"], ev: "std" },
  { op: 0xc6, name: "ifnull", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xc7, name: "ifnonnull", operands: ["branchbyte1", "branchbyte2"], ev: "std" },
  { op: 0xc8, name: "goto_w", operands: ["4 bytes"], ev: "std", what: "32-bit offset." },
  { op: 0xc9, name: "jsr_w", operands: ["4 bytes"], ev: "std" },
  { op: 0xca, name: "breakpoint", operands: [], ev: "std", what: "Reserved for debuggers; never emitted by javac." },
  { op: 0xfe, name: "impdep1", operands: [], ev: "std", what: "Reserved for VM implementation use — this is exactly the space a Java Card VM uses for its own extensions." },
  { op: 0xff, name: "impdep2", operands: [], ev: "std" },
];

export const JVM_BY_OP = Object.fromEntries(JVM_OPCODES.map((o) => [o.op, o]));

export function jvmInstructionLength(op, code, pc) {
  const info = JVM_BY_OP[op];
  if (!info) return null;
  if (op === 0xaa || op === 0xab) {
    // switch: pad to a 4-byte boundary from the start of the instruction
    const pad = (4 - ((pc + 1) % 4)) % 4;
    const base = pc + 1 + pad;
    if (op === 0xaa) {
      const low = (code[base + 4] << 24) | (code[base + 5] << 16) | (code[base + 6] << 8) | code[base + 7];
      const high = (code[base + 8] << 24) | (code[base + 9] << 16) | (code[base + 10] << 8) | code[base + 11];
      return 1 + pad + 12 + (high - low + 1) * 4;
    }
    const npairs = (code[base + 4] << 24) | (code[base + 5] << 16) | (code[base + 6] << 8) | code[base + 7];
    return 1 + pad + 8 + npairs * 8;
  }
  if (op === 0xc4) return code[pc + 1] === 0x84 ? 6 : 4; // wide iinc vs wide anything else
  const operandBytes = info.operands.reduce((a, o) => a + (o.includes("4 bytes") ? 4 : 1), 0);
  return 1 + operandBytes;
}

/* ------------------------------------------------------------------ *
 * 3. Java Card — the same bytecode on 8-16 KiB of everything
 *    ev: "std" for the CAP format (Java Card VM Specification ch. 6);
 *    "tool" for the GlobalPlatform opcodes, which are quoted from the GP
 *    Card Specification and from the open tooling that implements it.
 * ------------------------------------------------------------------ */

export const CAP_MAGIC = 0xdecaffed;

export const CAP_COMPONENTS = [
  { tag: 1, name: "Header", file: "Header.cap", required: true, ev: "std", what: "Carries the magic 0xDECAFFED, the CAP format version, package flags, the package AID and the package name. The first component in the file and the fastest way to tell a CAP from a JAR." },
  { tag: 2, name: "Directory", file: "Directory.cap", required: true, ev: "std", what: "A u2 size for each of the twelve component types, plus the static-field size info and the import/applet/custom counts. Parse this first and you can skip straight to any component." },
  { tag: 3, name: "Applet", file: "Applet.cap", required: false, ev: "std", what: "One entry per applet: AID length, AID, and the offset of its install() method in the Method component." },
  { tag: 4, name: "Import", file: "Import.cap", required: true, ev: "std", what: "The packages this one links against, by package token and AID. On a Java Card 2.x platform this is normally exactly two: javacard.framework and java.lang." },
  { tag: 5, name: "ConstantPool", file: "ConstantPool.cap", required: true, ev: "std", what: "Six tag types only (Classref 1, InstanceFieldref 2, VirtualMethodref 3, SuperMethodref 4, StaticFieldref 5, StaticMethodref 6) — a much smaller pool than a desktop JVM's." },
  { tag: 6, name: "Class", file: "Class.cap", required: true, ev: "std", what: "The signature pool, the interfaces and the class_info entries." },
  { tag: 7, name: "Method", file: "Method.cap", required: true, ev: "std", what: "The exception handlers and the method bodies. This is where the bytecode lives." },
  { tag: 8, name: "StaticField", file: "StaticField.cap", required: true, ev: "std", what: "The static-field image: its size, the array initialisers and the non-default values. This is what lets the card instantiate a package's static state without running <clinit>." },
  { tag: 9, name: "ReferenceLocation", file: "RefLocation.cap", required: true, ev: "std", what: "The relocation data: a run-length list of where in the Method component a token must be patched to a real address. The linker's whole job." },
  { tag: 10, name: "Export", file: "Export.cap", required: false, ev: "std", what: "What other packages may import from this one. Absent for a private package." },
  { tag: 11, name: "Descriptor", file: "Descriptor.cap", required: false, ev: "std", what: "Enough metadata to parse and verify every other component. This is what the verifier (verifycap) consumes." },
  { tag: 12, name: "Debug", file: "Debug.cap", required: false, ev: "std", what: "String table and per-class debug info. Stripped from production CAPs; its presence tells you the file came from a developer's build rather than a vendor's release." },
];

export const CAP_INSTALL_ORDER = [1, 2, 4, 3, 6, 7, 8, 10, 5, 9, 11];

export const CAP_NOTES = [
  "A CAP file is a ZIP. Unzip it and you get a directory tree `<package path>/javacard/*.cap`, one file per component. That is why a CAP sometimes starts with 'PK' and sometimes with the Header component's tag byte 0x01 — it depends whether you are looking at the archive or at the extracted Header.cap.",
  "Component format is `u1 tag, u2 size, u1 info[size]`. The size excludes the tag and the size field itself.",
  "Tags 13-127 are reserved for future standard components; 128-255 are vendor-defined and must be registered in the Directory component's custom_component list with an ISO 7816-5 AID. A VM that does not recognise a custom component must silently ignore it.",
  "Java Card bytecode is a subset of JVM bytecode. Floating-point opcodes are absent unless the card declares FP support; long arithmetic may be implemented in software; and `impdep1`/`impdep2` (0xFE/0xFF) are where a vendor VM puts its own instructions. A CAP that uses an impdep opcode is not portable between manufacturers, which is the one place the 'same bytecode runs anywhere' promise actually breaks.",
  "The CAP format version matters: 2.1 and 2.2 CAPs will not load on a 3.x-only card and vice versa without a converter run. Check Header.cap's major/minor before blaming the card.",
];

export const ISO7816 = {
  apduLayout: [
    { name: "CLA", size: 1, meaning: "Class byte. Bits 8-5 are the interindustry class; bit 1 (0x04) marks a secure-messaging CLA; bits 3-2 (0x80/0x84) select the logical channel on a Java Card." },
    { name: "INS", size: 1, meaning: "Instruction. Odd values are interindustry commands per ISO 7816-4." },
    { name: "P1", size: 1, meaning: "Parameter 1." },
    { name: "P2", size: 1, meaning: "Parameter 2." },
    { name: "Lc / data", size: "1 or 3", meaning: "Length of the command data, then the data. Extended length uses three bytes with the first being 0x00." },
    { name: "Le", size: "1 or 2", meaning: "Maximum response data length. 0x00 means 'as much as you have'." },
  ],
  cases: [
    { case: 1, shape: "CLA INS P1 P2", what: "No data in, no data out. SELECT by AID in some profiles, GET RESPONSE polling." },
    { case: 2, shape: "CLA INS P1 P2 Le", what: "No data in, data out. READ BINARY, GET DATA." },
    { case: 3, shape: "CLA INS P1 P2 Lc data", what: "Data in, no data out. UPDATE BINARY, VERIFY." },
    { case: 4, shape: "CLA INS P1 P2 Lc data Le", what: "Data in, data out. The shape a Java Card applet's process() sees most." },
  ],
  instructions: [
    { ins: 0xa4, name: "SELECT", ev: "std", what: "P1 selects the mode: 0x04 select by DF/AID name — this is how an applet is activated on a Java Card." },
    { ins: 0xb0, name: "READ BINARY", ev: "std" },
    { ins: 0xd6, name: "UPDATE BINARY", ev: "std" },
    { ins: 0xb2, name: "READ RECORD(S)", ev: "std" },
    { ins: 0xd2, name: "UPDATE RECORD", ev: "std" },
    { ins: 0x20, name: "VERIFY", ev: "std", what: "PIN presentation. Two consecutive failures usually means one retry left before the PIN is blocked; the card says so in SW2." },
    { ins: 0x24, name: "CHANGE REFERENCE DATA", ev: "std", what: "Change the PIN." },
    { ins: 0x2c, name: "RESET RETRY COUNTER", ev: "std", what: "Unblock the PIN with the PUK." },
    { ins: 0xca, name: "GET DATA", ev: "std" },
    { ins: 0x82, name: "EXTERNAL AUTHENTICATE", ev: "std", what: "Part of the GP secure-channel establishment." },
    { ins: 0x84, name: "GET CHALLENGE", ev: "std", what: "Returns 8 random bytes used to build the secure channel." },
    { ins: 0x88, name: "INTERNAL AUTHENTICATE", ev: "std" },
    { ins: 0xc0, name: "GET RESPONSE", ev: "std", what: "Follows any command that returned SW 0x61xx, where xx is the number of bytes waiting." },
    { ins: 0xe2, name: "STORE DATA", ev: "std", what: "GP: the LOAD command's data carrier. Applet CAP file fragments are sent through this." },
    { ins: 0xe4, name: "DELETE", ev: "std", what: "GP: remove an applet or a package." },
    { ins: 0xe6, name: "INSTALL", ev: "std", what: "GP. P1 selects the phase: 0x02 INSTALL_FOR_LOAD, 0x04 INSTALL_FOR_INSTALL, 0x08 INSTALL_FOR_MAKE_SELECTABLE, and 0x0C is LOAD+INSTALL together." },
  ],
  statusWords: [
    { sw: 0x9000, meaning: "Normal processing. The only success code." },
    { sw: 0x6100 + 0x00, meaning: "0x61xx — normal processing, xx bytes of response data available. Follow with GET RESPONSE." },
    { sw: 0x6200, meaning: "0x62xx — warning, state unchanged. 0x6282 is 'end of file/record reached'." },
    { sw: 0x6300, meaning: "0x63xx — warning, state changed. 0x63Cx on many cards means C PIN retries remaining." },
    { sw: 0x6400, meaning: "0x64xx — error, state unchanged. No execution happened." },
    { sw: 0x6500, meaning: "0x65xx — error, state changed. 0x6581 is a write failure to memory — the EEPROM did not take." },
    { sw: 0x6700, meaning: "Wrong length. Lc/Le does not match what the command needs." },
    { sw: 0x6982, meaning: "Security status not satisfied. You have not authenticated for this command." },
    { sw: 0x6983, meaning: "Authentication method blocked. The PIN is locked." },
    { sw: 0x6985, meaning: "Conditions of use not satisfied." },
    { sw: 0x6a80, meaning: "Incorrect parameters in the data field. The most common Java Card applet error, and the least informative." },
    { sw: 0x6a82, meaning: "File or application not found. A SELECT by AID that matched nothing." },
    { sw: 0x6a84, meaning: "Not enough memory space. The card cannot fit the CAP file or the applet's instance data." },
    { sw: 0x6a86, meaning: "Incorrect P1/P2." },
    { sw: 0x6a88, meaning: "Referenced data not found." },
    { sw: 0x6b00, meaning: "Wrong parameter P2 — offset out of range for READ/UPDATE BINARY." },
    { sw: 0x6d00, meaning: "Instruction not supported. Either the applet is not selected, or the card's VM does not implement it." },
    { sw: 0x6e00, meaning: "Class not supported. Usually a logical-channel or secure-messaging mismatch in CLA." },
    { sw: 0x6f00, meaning: "No precise diagnosis. The card's equivalent of a kernel panic — the applet threw and nothing caught it." },
  ],
  ev: "std",
};

export const JAVACARD_LIMITS = {
  note: "These are the Java Card 2.x platform limits. They are the reason an applet that runs fine in the simulator fails to install on a real card, and they are not negotiable at runtime.",
  values: [
    { item: "Operand stack depth", limit: "typically 16-32 words", why: "The VM allocates it statically at install time." },
    { item: "Local variables", limit: "typically 16-32", why: "Same." },
    { item: "Method bytecode size", limit: "implementation-defined, often < 64 KiB and in practice much less", why: "Offsets inside the Method component are 16-bit." },
    { item: "Object references", limit: "short (16-bit) tokens, not 32-bit addresses", why: "The whole addressing model is 16-bit." },
    { item: "Array length", limit: "short (max 32767), and transient arrays compete with the same tiny heap", why: "—" },
    { item: "Floating point", limit: "absent unless the card advertises FP support", why: "Most payment cards have no FPU and no software FP." },
    { item: "Types", limit: "no `double`, limited `long` support, no reflection, no threads, no native methods", why: "The VM is a subset by design." },
  ],
  ev: "std",
};

/* ------------------------------------------------------------------ *
 * 4. Cross-manufacturer portability — the actual point of this module
 *    ev: "report" — this is workshop experience, not a spec quotation.
 * ------------------------------------------------------------------ */

export const PORTABILITY = {
  survives: [
    "The CAP file itself. Same bytecode, same constant pool, same reference-location relocations. It is manufacturer-independent because the VM specification is.",
    "The package and applet AIDs, which are the contract the host application uses to talk to the card.",
    "The APDU protocol at the applet boundary. Your host code does not change when the silicon does.",
  ],
  doesNotSurvive: [
    "GlobalPlatform key sets. The card manager's ISD keys (ENC/MAC/DEK) are provisioned per-issuer and per-batch. A different manufacturer's card arrives with different default keys, and the well-known test keys are the first thing a vendor changes.",
    "Pre-installed applets and the card's own security domain layout. A JCOP and a SECORA card both run Java Card; neither has the other's preloaded packages.",
    "Vendor-specific extensions reached through impdep opcodes or through a proprietary APDU on a private AID. If the applet uses them, it is not portable and the only fix is a recompile against the new platform's API export files.",
    "The API export files themselves. Compiling against JCOP's `api_export_files` and loading onto a different vendor's card can produce a CAP whose imports the target does not resolve. Recompile against the target's export files.",
    "Memory headroom. Two cards with the same Java Card version can differ by a factor of four in EEPROM, and 'not enough memory space' (0x6A84) is what you get.",
  ],
  procedure: [
    "Read the card's own identity first: SELECT the Card Manager AID A000000151000000 and issue GET DATA for the card recognition data, or use the vendor tool. You cannot plan a port without knowing what you have.",
    "Dump the target's supported Java Card version and GlobalPlatform version. A CAP built for JCVM 2.2 will not install on a 2.1 card.",
    "Recompile the applet against the target platform's export files rather than reusing the old CAP when the API surface differs at all.",
    "Test in the vendor simulator, then on a blank dev card with the default keys, then on the real card. Skipping the middle step is how a key set gets locked.",
    "If the card is in production and holds keys, the port is a re-issuance problem, not a firmware problem, and it belongs to whoever controls the key ceremony.",
  ],
  ev: "report",
};
