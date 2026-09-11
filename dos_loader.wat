;; ═══════════════════════════════════════════════════════════════════════
;; x86:LE:16:Real Mode — DOS Binary Loader WASM Module
;; ═══════════════════════════════════════════════════════════════════════
;;
;; Memory Map (2MB = 32 × 64KB pages):
;;   0x00000 - 0x0FFFF : DOS address space (64KB)
;;     0x00000-0x000FF : Program Segment Prefix (PSP)
;;     0x00100-0x0FFFF : Loaded code / data
;;   0x10000 - 0x1FFFF : Scratch / relocation buffer
;;   0x20000 - 0x2FFFF : Instruction decode output buffer (256 entries × 16B)
;;   0x30000 - 0x3FFFF : Disassembly string buffer
;;   0x40000 - 0x7FFFF : File upload buffer (256KB max)
;;   0x80000 - 0xFFFFF : Decompile / metadata buffer
;; ═══════════════════════════════════════════════════════════════════════

(module
  (memory (export "memory") 32) ;; 32 pages = 2 MB

  ;; ─── Immutable constants ─────────────────────────────────────────────
  (global $FMT_UNKNOWN i32 (i32.const 0))
  (global $FMT_MZ      i32 (i32.const 1))
  (global $FMT_COM     i32 (i32.const 2))
  (global $FMT_RAW     i32 (i32.const 3))

  (global $IT_NORMAL  i32 (i32.const 0))
  (global $IT_BRANCH  i32 (i32.const 1))
  (global $IT_CALL    i32 (i32.const 2))
  (global $IT_INT     i32 (i32.const 3))
  (global $IT_RET     i32 (i32.const 4))
  (global $IT_DATA    i32 (i32.const 5))
  (global $IT_PUSHPOP i32 (i32.const 6))
  (global $IT_MOV     i32 (i32.const 7))
  (global $IT_STRING  i32 (i32.const 8))

  (global $DOS_SPACE  i32 (i32.const 0x00000))
  (global $PSP_SIZE   i32 (i32.const 0x100))
  (global $DECODE_BUF i32 (i32.const 0x20000))
  (global $STRING_BUF i32 (i32.const 0x30000))
  (global $FILE_BUF   i32 (i32.const 0x40000))
  (global $META_BUF   i32 (i32.const 0x80000))
  (global $HEADER_BUF i32 (i32.const 0x80000))

  ;; ─── Mutable exported globals ────────────────────────────────────────
  (global $format         (export "format")         (mut i32) (i32.const 0))
  (global $file_len       (export "file_len")       (mut i32) (i32.const 0))
  (global $load_seg       (export "load_seg")       (mut i32) (i32.const 0))
  (global $code_off       (export "code_off")       (mut i32) (i32.const 0))
  (global $code_size      (export "code_size")      (mut i32) (i32.const 0))
  (global $hdr_cs         (export "hdr_cs")         (mut i32) (i32.const 0))
  (global $hdr_ip         (export "hdr_ip")         (mut i32) (i32.const 0))
  (global $hdr_ss         (export "hdr_ss")         (mut i32) (i32.const 0))
  (global $hdr_sp         (export "hdr_sp")         (mut i32) (i32.const 0))
  (global $hdr_reloc_count(export "hdr_reloc_count")(mut i32) (i32.const 0))
  (global $hdr_reloc_off  (export "hdr_reloc_off")  (mut i32) (i32.const 0))
  (global $entry_phys     (export "entry_phys")     (mut i32) (i32.const 0))
  (global $last_error     (export "last_error")     (mut i32) (i32.const 0))
  (global $decode_count   (export "decode_count")   (mut i32) (i32.const 0))
  (global $reloc_applied  (export "reloc_applied")  (mut i32) (i32.const 0))

  ;; ─── Private mutable globals ────────────────────────────────────────
  (global $dos_seg_base (mut i32) (i32.const 0))
  (global $img_size     (mut i32) (i32.const 0))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; HELPERS
  ;; ═══════════════════════════════════════════════════════════════════

  (func $write_le16 (param $addr i32) (param $val i32)
    (i32.store16 (local.get $addr) (local.get $val)))

  ;; segment:offset → 20-bit physical address
  (func $seg_off_to_phys (export "seg_off_to_phys")
    (param $seg i32) (param $off i32) (result i32)
    (i32.and
      (i32.add (i32.shl (local.get $seg) (i32.const 4)) (local.get $off))
      (i32.const 0xFFFFF)))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; FORMAT DETECTION
  ;; ═══════════════════════════════════════════════════════════════════

  (func $detect_format (export "detect_format")
    (param $ptr i32) (param $len i32) (result i32)
    (local $b0 i32) (local $b1 i32)

    (if (i32.lt_u (local.get $len) (i32.const 2))
      (then (return (global.get $FMT_UNKNOWN))))

    (local.set $b0 (i32.load8_u (local.get $ptr)))
    (local.set $b1 (i32.load8_u (i32.add (local.get $ptr) (i32.const 1))))

    (if (i32.and (i32.eq (local.get $b0) (i32.const 0x4D))
                 (i32.eq (local.get $b1) (i32.const 0x5A)))
      (then (return (global.get $FMT_MZ))))

    (if (i32.and (i32.eq (local.get $b0) (i32.const 0x5A))
                 (i32.eq (local.get $b1) (i32.const 0x4D)))
      (then (return (global.get $FMT_MZ))))

    (if (i32.le_u (local.get $len) (i32.const 0xFF00))
      (then (return (global.get $FMT_COM))))

    (global.get $FMT_RAW))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; MZ HEADER PARSING
  ;; ═══════════════════════════════════════════════════════════════════

  (func $parse_mz (export "parse_mz")
    (param $ptr i32) (param $len i32) (result i32)
    (local $hdr_paras i32) (local $hdr_size i32)
    (local $pages i32) (local $last_page i32) (local $img_sz i32)

    (if (i32.lt_u (local.get $len) (i32.const 0x1E))
      (then (global.set $last_error (i32.const 1)) (return (i32.const 1))))

    (memory.copy (global.get $HEADER_BUF) (local.get $ptr) (i32.const 0x1E))

    (local.set $last_page (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x02))))
    (local.set $pages     (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x04))))
    (global.set $hdr_reloc_count (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x06))))
    (local.set $hdr_paras (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x08))))
    (global.set $hdr_ss   (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x0E))))
    (global.set $hdr_sp   (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x10))))
    (global.set $hdr_ip   (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x14))))
    (global.set $hdr_cs   (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x16))))
    (global.set $hdr_reloc_off (i32.load16_u (i32.add (local.get $ptr) (i32.const 0x18))))

    (local.set $hdr_size (i32.mul (local.get $hdr_paras) (i32.const 16)))
    (local.set $img_sz
      (i32.sub
        (i32.add (i32.mul (i32.sub (local.get $pages) (i32.const 1)) (i32.const 512))
                 (local.get $last_page))
        (local.get $hdr_size)))

    (if (i32.gt_u (i32.add (local.get $hdr_size) (local.get $img_sz)) (local.get $len))
      (then (local.set $img_sz (i32.sub (local.get $len) (local.get $hdr_size)))))
    (if (i32.lt_s (local.get $img_sz) (i32.const 0))
      (then (local.set $img_sz (i32.sub (local.get $len) (local.get $hdr_size)))))

    (global.set $code_off    (local.get $hdr_size))
    (global.set $code_size   (local.get $img_sz))
    (global.set $img_size    (local.get $img_sz))
    (global.set $load_seg    (i32.const 0x1000))
    (global.set $dos_seg_base (i32.const 0x10000))
    (global.set $entry_phys
      (call $seg_off_to_phys
        (i32.add (global.get $load_seg) (global.get $hdr_cs))
        (global.get $hdr_ip)))
    (global.set $format (global.get $FMT_MZ))
    (global.set $last_error (i32.const 0))
    (i32.const 0))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; COM FILE LOADING
  ;; ═══════════════════════════════════════════════════════════════════

  (func $parse_com (export "parse_com")
    (param $ptr i32) (param $len i32) (result i32)
    (global.set $load_seg (i32.const 0x1000))
    (global.set $dos_seg_base (i32.const 0x10000))
    (memory.copy (i32.add (global.get $dos_seg_base) (global.get $PSP_SIZE))
                 (local.get $ptr) (local.get $len))
    (call $init_psp (global.get $dos_seg_base))
    (global.set $hdr_cs (i32.const 0x1000))
    (global.set $hdr_ip (i32.const 0x0100))
    (global.set $hdr_ss (i32.const 0x1000))
    (global.set $hdr_sp (i32.const 0xFFFE))
    (global.set $hdr_reloc_count (i32.const 0))
    (global.set $hdr_reloc_off  (i32.const 0))
    (global.set $code_off  (i32.const 0))
    (global.set $code_size (local.get $len))
    (global.set $img_size  (local.get $len))
    (global.set $entry_phys (call $seg_off_to_phys (i32.const 0x1000) (i32.const 0x0100)))
    (global.set $format (global.get $FMT_COM))
    (global.set $last_error (i32.const 0))
    (i32.const 0))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; RAW BINARY LOADING
  ;; ═══════════════════════════════════════════════════════════════════

  (func $parse_raw (export "parse_raw")
    (param $ptr i32) (param $len i32) (result i32)
    (memory.copy (global.get $DOS_SPACE) (local.get $ptr) (local.get $len))
    (global.set $load_seg (i32.const 0))
    (global.set $dos_seg_base (i32.const 0))
    (global.set $hdr_cs (i32.const 0))
    (global.set $hdr_ip (i32.const 0))
    (global.set $hdr_ss (i32.const 0))
    (global.set $hdr_sp (i32.const 0xFFFE))
    (global.set $hdr_reloc_count (i32.const 0))
    (global.set $hdr_reloc_off  (i32.const 0))
    (global.set $code_off  (i32.const 0))
    (global.set $code_size (local.get $len))
    (global.set $img_size  (local.get $len))
    (global.set $entry_phys (i32.const 0))
    (global.set $format (global.get $FMT_RAW))
    (global.set $last_error (i32.const 0))
    (i32.const 0))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; UNIVERSAL LOAD — Auto-detect + parse + map into DOS space
  ;; ═══════════════════════════════════════════════════════════════════

  (func $load_binary (export "load_binary")
    (param $src i32) (param $len i32) (result i32)
    (local $fmt i32)

    (global.set $file_len (local.get $len))
    (memory.copy (global.get $FILE_BUF) (local.get $src) (local.get $len))
    (local.set $fmt (call $detect_format (global.get $FILE_BUF) (local.get $len)))
    (global.set $format (local.get $fmt))

    ;; MZ
    (if (i32.eq (local.get $fmt) (global.get $FMT_MZ))
      (then
        (drop (call $parse_mz (global.get $FILE_BUF) (local.get $len)))
        (if (i32.gt_u (global.get $code_size) (i32.const 0))
          (then
            (memory.copy
              (i32.add (global.get $dos_seg_base) (global.get $PSP_SIZE))
              (i32.add (global.get $FILE_BUF) (global.get $code_off))
              (global.get $code_size))))
        (call $init_psp (global.get $dos_seg_base))
        (if (i32.gt_u (global.get $hdr_reloc_count) (i32.const 0))
          (then (call $apply_relocations)))
        (call $write_le16 (i32.add (global.get $dos_seg_base) (i32.const 0x0A))
                          (global.get $hdr_ip))
        (call $write_le16 (i32.add (global.get $dos_seg_base) (i32.const 0x0C))
                          (i32.add (global.get $load_seg) (global.get $hdr_cs)))
      )
      (else
        ;; COM
        (if (i32.eq (local.get $fmt) (global.get $FMT_COM))
          (then (drop (call $parse_com (global.get $FILE_BUF) (local.get $len))))
          (else  (drop (call $parse_raw (global.get $FILE_BUF) (local.get $len)))))))

    (local.get $fmt))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; PSP INITIALIZATION
  ;; ═══════════════════════════════════════════════════════════════════

  (func $init_psp (param $base i32)
    (memory.fill (local.get $base) (i32.const 0) (global.get $PSP_SIZE))
    (i32.store8  (local.get $base) (i32.const 0xCD))   ;; INT 20h
    (i32.store8  (i32.add (local.get $base) (i32.const 1)) (i32.const 0x20))
    (call $write_le16 (i32.add (local.get $base) (i32.const 2))
      (i32.add (global.get $load_seg)
        (i32.shr_u (i32.add (global.get $code_size) (i32.const 15)) (i32.const 4))))
    (i32.store8  (i32.add (local.get $base) (i32.const 5)) (i32.const 0xEA))
    (call $write_le16 (i32.add (local.get $base) (i32.const 6)) (i32.const 0))
    (call $write_le16 (i32.add (local.get $base) (i32.const 8)) (i32.const 0))
    (call $write_le16 (i32.add (local.get $base) (i32.const 0x0A)) (i32.const 0))
    (call $write_le16 (i32.add (local.get $base) (i32.const 0x0C)) (global.get $load_seg))
    (call $write_le16 (i32.add (local.get $base) (i32.const 0x0E)) (i32.const 0))
    (call $write_le16 (i32.add (local.get $base) (i32.const 0x10)) (i32.const 0))
    (call $write_le16 (i32.add (local.get $base) (i32.const 0x12)) (i32.const 0))
    (call $write_le16 (i32.add (local.get $base) (i32.const 0x14)) (i32.const 0))
    (call $write_le16 (i32.add (local.get $base) (i32.const 0x2C)) (i32.const 0))
    (i32.store8  (i32.add (local.get $base) (i32.const 0x80)) (i32.const 0))
    (i32.store8  (i32.add (local.get $base) (i32.const 0x81)) (i32.const 0x0D)))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; MZ RELOCATION
  ;; ═══════════════════════════════════════════════════════════════════

  (func $apply_relocations
    (local $i i32) (local $reloc_base i32)
    (local $off i32) (local $seg i32) (local $phys i32) (local $val i32) (local $count i32)

    (local.set $count (global.get $hdr_reloc_count))
    (local.set $reloc_base (i32.add (global.get $FILE_BUF) (global.get $hdr_reloc_off)))
    (local.set $i (i32.const 0))

    (block $break
      (loop $loop
        (br_if $break (i32.ge_u (local.get $i) (local.get $count)))
        (local.set $off
          (i32.load16_u (i32.add (local.get $reloc_base) (i32.mul (local.get $i) (i32.const 4)))))
        (local.set $seg
          (i32.load16_u
            (i32.add (local.get $reloc_base)
              (i32.add (i32.mul (local.get $i) (i32.const 4)) (i32.const 2)))))
        (local.set $phys
          (i32.add
            (global.get $dos_seg_base)
            (i32.add (i32.shl (local.get $seg) (i32.const 4)) (local.get $off))))
        (local.set $val (i32.load16_u (local.get $phys)))
        (i32.store16 (local.get $phys) (i32.add (local.get $val) (global.get $load_seg)))
        (global.set $reloc_applied (i32.add (global.get $reloc_applied) (i32.const 1)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop))))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; DOS MEMORY ACCESS
  ;; ═══════════════════════════════════════════════════════════════════

  (func $dos_read_u8 (export "dos_read_u8")
    (param $seg i32) (param $off i32) (result i32)
    (i32.load8_u (call $seg_off_to_phys (local.get $seg) (local.get $off))))

  (func $dos_read_u16 (export "dos_read_u16")
    (param $seg i32) (param $off i32) (result i32)
    (i32.load16_u (call $seg_off_to_phys (local.get $seg) (local.get $off))))

  (func $dos_write_u8 (export "dos_write_u8")
    (param $seg i32) (param $off i32) (param $val i32)
    (i32.store8 (call $seg_off_to_phys (local.get $seg) (local.get $off)) (local.get $val)))

  (func $dos_write_u16 (export "dos_write_u16")
    (param $seg i32) (param $off i32) (param $val i32)
    (i32.store16 (call $seg_off_to_phys (local.get $seg) (local.get $off)) (local.get $val)))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; 16-bit x86 INSTRUCTION DECODER
  ;; ═══════════════════════════════════════════════════════════════════
  ;;
  ;; Uses a table-driven approach: a 256-byte lookup at META_BUF+0x10000
  ;; stores (len | type<<4) for each opcode, then a second pass resolves
  ;; operands, targets etc. for the interesting opcodes.
  ;;
  ;; Decode record (16 bytes at DECODE_BUF + idx*16):
  ;;   [0]   type      [1]   sub_type  [2]   length    [3]   flags
  ;;   [4-7] raw       [8-11] operand  [12-15] seg:off (offset<<16|seg)

  ;; Build the 256-byte opcode-length/type table once.
  (func $init_opcode_table
    (local $p i32) (local $i i32)
    ;; Clear
    (local.set $p (i32.add (global.get $META_BUF) (i32.const 0x10000)))
    (memory.fill (local.get $p) (i32.const 0x10) (i32.const 256))  ;; len=1, type=0(NORMAL)
    ;; Set defaults — each entry = lo nibble = len (1..5), hi nibble = IT_type
    ;; Format: (len | (type << 4))
    (local.set $i (i32.const 0))
    (block $done (loop $l
      (br_if $done (i32.ge_u (local.get $i) (i32.const 256)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x01))  ;; len=1, type=NORMAL
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l)))

    ;; len=2 opcodes (1-byte opcode + 1-byte imm/modrm)
    ;; INT nn
    (i32.store8 (i32.add (local.get $p) (i32.const 0xCD)) (i32.const 0x32))  ;; len=2, type=INT
    ;; Conditional jumps 0x70-0x7F
    (local.set $i (i32.const 0x70))
    (block $b1 (loop $l1
      (br_if $b1 (i32.gt_u (local.get $i) (i32.const 0x7F)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x12))  ;; len=2, type=BRANCH
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l1)))
    ;; LOOP/JCXZ 0xE0-0xE3
    (local.set $i (i32.const 0xE0))
    (block $b2 (loop $l2
      (br_if $b2 (i32.gt_u (local.get $i) (i32.const 0xE3)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x12))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l2)))
    ;; IN/OUT imm8 0xE4-0xE7
    (local.set $i (i32.const 0xE4))
    (block $b3 (loop $l3
      (br_if $b3 (i32.gt_u (local.get $i) (i32.const 0xE7)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x02))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l3)))
    ;; JMP rel8
    (i32.store8 (i32.add (local.get $p) (i32.const 0xEB)) (i32.const 0x12))  ;; len=2, BRANCH
    ;; AAM/AAD
    (i32.store8 (i32.add (local.get $p) (i32.const 0xD4)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xD5)) (i32.const 0x02))
    ;; MOV reg,imm8 0xB0-0xB7
    (local.set $i (i32.const 0xB0))
    (block $b4 (loop $l4
      (br_if $b4 (i32.gt_u (local.get $i) (i32.const 0xB7)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x72))  ;; len=2, MOV
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l4)))
    ;; ModR/M base group — 2 bytes default: 0x00-0x3F odd, 0x80-0x8F, 0xD0-0xD3, 0xF6-0xFF
    ;; Arithmetic rm,r (even opcodes 0x00,0x02,0x04..0x3E — but only even)
    ;; Simplified: anything with ModR/M
    ;; 0x00-0x05
    (i32.store8 (i32.add (local.get $p) (i32.const 0x00)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x01)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x02)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x03)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x08)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x09)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x0A)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x0B)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x10)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x11)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x12)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x13)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x18)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x19)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x1A)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x1B)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x20)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x21)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x22)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x23)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x28)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x29)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x2A)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x2B)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x30)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x31)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x32)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x33)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x38)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x39)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x3A)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x3B)) (i32.const 0x02))
    ;; 0x80-0x8F
    (local.set $i (i32.const 0x80))
    (block $b5 (loop $l5
      (br_if $b5 (i32.gt_u (local.get $i) (i32.const 0x8F)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x02))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l5)))
    ;; 0xC0-0xC1 (shift/rotate imm8)
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC0)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC1)) (i32.const 0x02))
    ;; 0xC4-0xC5 (LES/LDS)
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC4)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC5)) (i32.const 0x02))
    ;; 0xC6-0xC7 (MOV r/m, imm)
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC6)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC7)) (i32.const 0x02))
    ;; 0xD0-0xD3 (shift/rotate)
    (i32.store8 (i32.add (local.get $p) (i32.const 0xD0)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xD1)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xD2)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xD3)) (i32.const 0x02))
    ;; 0xD6 (undocumented SALC)
    ;; 0xF6-0xFF (unary group 3/4/5)
    (local.set $i (i32.const 0xF6))
    (block $b6 (loop $l6
      (br_if $b6 (i32.gt_u (local.get $i) (i32.const 0xFF)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x02))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l6)))
    ;; 0x8D (LEA)
    (i32.store8 (i32.add (local.get $p) (i32.const 0x8D)) (i32.const 0x02))

    ;; len=3 opcodes (opcode + imm16 or opcode + rel16)
    (i32.store8 (i32.add (local.get $p) (i32.const 0x05)) (i32.const 0x03))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x0D)) (i32.const 0x03))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x15)) (i32.const 0x03))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x1D)) (i32.const 0x03))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x25)) (i32.const 0x03))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x2D)) (i32.const 0x03))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x35)) (i32.const 0x03))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x3D)) (i32.const 0x03))
    ;; TEST AL/AX imm
    (i32.store8 (i32.add (local.get $p) (i32.const 0xA8)) (i32.const 0x02))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xA9)) (i32.const 0x03))
    ;; MOV reg, imm16
    (local.set $i (i32.const 0xB8))
    (block $b7 (loop $l7
      (br_if $b7 (i32.gt_u (local.get $i) (i32.const 0xBF)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x73))  ;; len=3, MOV
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l7)))
    ;; CALL/JMP rel16
    (i32.store8 (i32.add (local.get $p) (i32.const 0xE8)) (i32.const 0x23))  ;; len=3, CALL
    (i32.store8 (i32.add (local.get $p) (i32.const 0xE9)) (i32.const 0x13))  ;; len=3, BRANCH
    ;; MOV moffs
    (i32.store8 (i32.add (local.get $p) (i32.const 0xA0)) (i32.const 0x73))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xA1)) (i32.const 0x73))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xA2)) (i32.const 0x73))
    (i32.store8 (i32.add (local.get $p) (i32.const 0xA3)) (i32.const 0x73))
    ;; RET imm16
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC2)) (i32.const 0x43))  ;; len=3, RET

    ;; len=4 opcodes
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC8)) (i32.const 0x04))  ;; ENTER

    ;; len=5 opcodes
    (i32.store8 (i32.add (local.get $p) (i32.const 0x9A)) (i32.const 0x25))  ;; CALL far len=5
    (i32.store8 (i32.add (local.get $p) (i32.const 0xEA)) (i32.const 0x15))  ;; JMP far len=5

    ;; RET type overrides
    (i32.store8 (i32.add (local.get $p) (i32.const 0xC3)) (i32.const 0x41))  ;; RET len=1
    (i32.store8 (i32.add (local.get $p) (i32.const 0xCB)) (i32.const 0x41))  ;; RETF len=1
    (i32.store8 (i32.add (local.get $p) (i32.const 0xCA)) (i32.const 0x43))  ;; RETF imm16 len=3
    (i32.store8 (i32.add (local.get $p) (i32.const 0xCF)) (i32.const 0x41))  ;; IRET len=1
    ;; INT3
    (i32.store8 (i32.add (local.get $p) (i32.const 0xCC)) (i32.const 0x31))  ;; INT len=1

    ;; PUSH/POP reg
    (local.set $i (i32.const 0x50))
    (block $b8 (loop $l8
      (br_if $b8 (i32.gt_u (local.get $i) (i32.const 0x57)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x61))  ;; PUSH len=1
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l8)))
    (local.set $i (i32.const 0x58))
    (block $b9 (loop $l9
      (br_if $b9 (i32.gt_u (local.get $i) (i32.const 0x5F)))
      (i32.store8 (i32.add (local.get $p) (local.get $i)) (i32.const 0x61))  ;; POP len=1
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $l9)))

    ;; MOV r/m,r and MOV r,r/m (0x88-0x8B)
    (i32.store8 (i32.add (local.get $p) (i32.const 0x88)) (i32.const 0x72))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x89)) (i32.const 0x72))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x8A)) (i32.const 0x72))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x8B)) (i32.const 0x72))
    ;; MOV seg
    (i32.store8 (i32.add (local.get $p) (i32.const 0x8C)) (i32.const 0x72))
    (i32.store8 (i32.add (local.get $p) (i32.const 0x8E)) (i32.const 0x72))

    ;; XCHG AX,reg
    (i32.store8 (i32.add (local.get $p) (i32.const 0x90)) (i32.const 0x01))  ;; NOP (special XCHG AX,AX)
  )

  ;; ─── Single-instruction decode ──────────────────────────────────────

  (func $decode_instruction (export "decode_instruction")
    (param $seg i32) (param $off i32) (param $idx i32) (result i32)
    (local $phys i32) (local $op i32) (local $len i32)
    (local $type i32) (local $sub i32) (local $flags i32)
    (local $operand i32) (local $rec_off i32) (local $raw i32) (local $tbl i32)

    (local.set $phys (call $seg_off_to_phys (local.get $seg) (local.get $off)))
    (local.set $op (i32.load8_u (local.get $phys)))
    (local.set $raw (local.get $op))
    (local.set $flags (i32.const 0))
    (local.set $operand (i32.const 0))
    (local.set $sub (i32.const 0))

    ;; Read from opcode table
    (local.set $tbl (i32.load8_u
      (i32.add (i32.add (global.get $META_BUF) (i32.const 0x10000)) (local.get $op))))
    (local.set $len  (i32.and (local.get $tbl) (i32.const 0x0F)))
    (local.set $type (i32.shr_u (i32.and (local.get $tbl) (i32.const 0xF0)) (i32.const 4)))

    ;; ── Operand / target resolution for specific opcodes ──

    ;; Branch rel8: target = off + len + sign_ext(byte at phys+1)
    (if (i32.and (i32.eq (local.get $type) (global.get $IT_BRANCH))
                 (i32.eq (local.get $len) (i32.const 2)))
      (then
        (local.set $operand
          (i32.and
            (i32.add (i32.add (local.get $off) (i32.const 2))
                     (i32.extend8_s (i32.load8_u (i32.add (local.get $phys) (i32.const 1)))))
            (i32.const 0xFFFF)))
        (local.set $sub (i32.and (local.get $op) (i32.const 0x0F)))))

    ;; Branch rel16
    (if (i32.and (i32.eq (local.get $type) (global.get $IT_BRANCH))
                 (i32.eq (local.get $len) (i32.const 3)))
      (then
        (local.set $operand
          (i32.and
            (i32.add (i32.add (local.get $off) (i32.const 3))
                     (i32.extend16_s (i32.load16_u (i32.add (local.get $phys) (i32.const 1)))))
            (i32.const 0xFFFF)))))

    ;; Branch far (JMP far)
    (if (i32.and (i32.eq (local.get $type) (global.get $IT_BRANCH))
                 (i32.eq (local.get $len) (i32.const 5)))
      (then
        (local.set $operand (i32.load (i32.add (local.get $phys) (i32.const 1))))
        (local.set $flags (i32.const 2))))

    ;; CALL rel16
    (if (i32.and (i32.eq (local.get $type) (global.get $IT_CALL))
                 (i32.eq (local.get $len) (i32.const 3)))
      (then
        (local.set $operand
          (i32.and
            (i32.add (i32.add (local.get $off) (i32.const 3))
                     (i32.extend16_s (i32.load16_u (i32.add (local.get $phys) (i32.const 1)))))
            (i32.const 0xFFFF)))))

    ;; CALL far
    (if (i32.and (i32.eq (local.get $type) (global.get $IT_CALL))
                 (i32.eq (local.get $len) (i32.const 5)))
      (then
        (local.set $operand (i32.load (i32.add (local.get $phys) (i32.const 1))))
        (local.set $flags (i32.const 1))))

    ;; INT nn
    (if (i32.eq (local.get $op) (i32.const 0xCD))
      (then
        (local.set $operand (i32.load8_u (i32.add (local.get $phys) (i32.const 1))))
        (local.set $raw (i32.or (i32.const 0xCD) (i32.shl (local.get $operand) (i32.const 8))))))
    (if (i32.eq (local.get $op) (i32.const 0xCC))
      (then (local.set $operand (i32.const 3))))

    ;; MOV reg,imm8
    (if (i32.and (i32.ge_u (local.get $op) (i32.const 0xB0))
                 (i32.le_u (local.get $op) (i32.const 0xB7)))
      (then
        (local.set $sub (i32.and (local.get $op) (i32.const 0x07)))
        (local.set $operand (i32.load8_u (i32.add (local.get $phys) (i32.const 1))))))

    ;; MOV reg,imm16
    (if (i32.and (i32.ge_u (local.get $op) (i32.const 0xB8))
                 (i32.le_u (local.get $op) (i32.const 0xBF)))
      (then
        (local.set $sub (i32.and (local.get $op) (i32.const 0x07)))
        (local.set $operand (i32.load16_u (i32.add (local.get $phys) (i32.const 1))))))

    ;; MOV r/m,r (0x88-0x8B), MOV seg (0x8C, 0x8E) — operand = modrm
    (if (i32.and (i32.ge_u (local.get $op) (i32.const 0x88))
                 (i32.le_u (local.get $op) (i32.const 0x8B)))
      (then (local.set $operand (i32.load8_u (i32.add (local.get $phys) (i32.const 1))))))

    ;; MOV moffs (0xA0-0xA3)
    (if (i32.and (i32.ge_u (local.get $op) (i32.const 0xA0))
                 (i32.le_u (local.get $op) (i32.const 0xA3)))
      (then (local.set $operand (i32.load16_u (i32.add (local.get $phys) (i32.const 1))))))

    ;; PUSH reg (0x50-0x57)
    (if (i32.and (i32.ge_u (local.get $op) (i32.const 0x50))
                 (i32.le_u (local.get $op) (i32.const 0x57)))
      (then
        (local.set $sub (i32.and (local.get $op) (i32.const 0x07)))
        (local.set $flags (i32.const 0))))

    ;; POP reg (0x58-0x5F)
    (if (i32.and (i32.ge_u (local.get $op) (i32.const 0x58))
                 (i32.le_u (local.get $op) (i32.const 0x5F)))
      (then
        (local.set $sub (i32.and (local.get $op) (i32.const 0x07)))
        (local.set $flags (i32.const 1))))

    ;; PUSH/POP seg
    (if (i32.or
          (i32.eq (local.get $op) (i32.const 0x06))
          (i32.or (i32.eq (local.get $op) (i32.const 0x0E))
            (i32.or (i32.eq (local.get $op) (i32.const 0x16))
                    (i32.eq (local.get $op) (i32.const 0x1E)))))
      (then
        (local.set $type (global.get $IT_PUSHPOP))
        (local.set $sub (i32.or (i32.const 0x10) (i32.shr_u (local.get $op) (i32.const 3))))
        (local.set $flags (i32.const 0))))
    (if (i32.or
          (i32.eq (local.get $op) (i32.const 0x07))
          (i32.or (i32.eq (local.get $op) (i32.const 0x0F))
            (i32.or (i32.eq (local.get $op) (i32.const 0x17))
                    (i32.eq (local.get $op) (i32.const 0x1F)))))
      (then
        (local.set $type (global.get $IT_PUSHPOP))
        (local.set $sub (i32.or (i32.const 0x10) (i32.shr_u (local.get $op) (i32.const 3))))
        (local.set $flags (i32.const 1))))

    ;; String ops (0xA4-0xAF)
    (if (i32.and (i32.ge_u (local.get $op) (i32.const 0xA4))
                 (i32.le_u (local.get $op) (i32.const 0xAF)))
      (then
        (local.set $type (global.get $IT_STRING))
        (local.set $sub (i32.and (local.get $op) (i32.const 0x0F)))))

    ;; RETF far-flag
    (if (i32.or (i32.eq (local.get $op) (i32.const 0xCB))
                (i32.eq (local.get $op) (i32.const 0xCA)))
      (then (local.set $flags (i32.const 1))))
    ;; IRET flag
    (if (i32.eq (local.get $op) (i32.const 0xCF))
      (then (local.set $flags (i32.const 2))))

    ;; ModR/M instructions — read operand from byte at phys+1
    (if (i32.eq (local.get $len) (i32.const 2))
      (then
        (if (i32.eq (local.get $operand) (i32.const 0))
          (then (local.set $operand (i32.load8_u (i32.add (local.get $phys) (i32.const 1))))))))

    ;; ── Write decode record ──
    (local.set $rec_off (i32.add (global.get $DECODE_BUF) (i32.mul (local.get $idx) (i32.const 16))))
    (i32.store8 (i32.add (local.get $rec_off) (i32.const 0)) (local.get $type))
    (i32.store8 (i32.add (local.get $rec_off) (i32.const 1)) (local.get $sub))
    (i32.store8 (i32.add (local.get $rec_off) (i32.const 2)) (local.get $len))
    (i32.store8 (i32.add (local.get $rec_off) (i32.const 3)) (local.get $flags))
    (i32.store  (i32.add (local.get $rec_off) (i32.const 4)) (local.get $raw))
    (i32.store  (i32.add (local.get $rec_off) (i32.const 8)) (local.get $operand))
    (i32.store  (i32.add (local.get $rec_off) (i32.const 12))
      (i32.or (local.get $seg) (i32.shl (local.get $off) (i32.const 16))))

    (local.get $len))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; BULK DISASSEMBLY
  ;; ═══════════════════════════════════════════════════════════════════

  (func $disassemble (export "disassemble")
    (param $max_count i32) (result i32)
    (local $seg i32) (local $off i32) (local $i i32)
    (local $len i32) (local $phys i32) (local $end_phys i32)

    (call $init_opcode_table)

    (local.set $seg (i32.add (global.get $load_seg) (global.get $hdr_cs)))
    (local.set $off (global.get $hdr_ip))
    (local.set $i (i32.const 0))
    (local.set $end_phys
      (i32.add (global.get $dos_seg_base)
               (i32.add (global.get $PSP_SIZE) (global.get $code_size))))

    (block $break (loop $loop
      (br_if $break (i32.ge_u (local.get $i) (local.get $max_count)))
      (local.set $phys (call $seg_off_to_phys (local.get $seg) (local.get $off)))
      (br_if $break (i32.ge_u (local.get $phys) (local.get $end_phys)))
      (br_if $break (i32.ge_u (local.get $off) (i32.const 0xFFF0)))
      (local.set $len (call $decode_instruction (local.get $seg) (local.get $off) (local.get $i)))
      (local.set $off (i32.add (local.get $off) (local.get $len)))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $loop)))

    (global.set $decode_count (local.get $i))
    (local.get $i))

  (func $disassemble_at (export "disassemble_at")
    (param $seg i32) (param $off i32) (param $max_count i32) (result i32)
    (local $i i32) (local $len i32)
    (local $phys i32) (local $end_phys i32)

    (call $init_opcode_table)

    (local.set $i (i32.const 0))
    (local.set $end_phys
      (i32.add (global.get $dos_seg_base)
               (i32.add (global.get $PSP_SIZE) (global.get $code_size))))

    (block $break (loop $loop
      (br_if $break (i32.ge_u (local.get $i) (local.get $max_count)))
      (local.set $phys (call $seg_off_to_phys (local.get $seg) (local.get $off)))
      (br_if $break (i32.ge_u (local.get $phys) (local.get $end_phys)))
      (br_if $break (i32.ge_u (local.get $off) (i32.const 0xFFF0)))
      (local.set $len (call $decode_instruction (local.get $seg) (local.get $off) (local.get $i)))
      (local.set $off (i32.add (local.get $off) (local.get $len)))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $loop)))

    (global.set $decode_count (local.get $i))
    (local.get $i))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; DECODE RECORD ACCESSORS
  ;; ═══════════════════════════════════════════════════════════════════

  (func $get_decode_type (export "get_decode_type") (param $idx i32) (result i32)
    (i32.load8_u (i32.add (global.get $DECODE_BUF) (i32.mul (local.get $idx) (i32.const 16)))))
  (func $get_decode_subtype (export "get_decode_subtype") (param $idx i32) (result i32)
    (i32.load8_u (i32.add (i32.add (global.get $DECODE_BUF) (i32.mul (local.get $idx) (i32.const 16))) (i32.const 1))))
  (func $get_decode_length (export "get_decode_length") (param $idx i32) (result i32)
    (i32.load8_u (i32.add (i32.add (global.get $DECODE_BUF) (i32.mul (local.get $idx) (i32.const 16))) (i32.const 2))))
  (func $get_decode_flags (export "get_decode_flags") (param $idx i32) (result i32)
    (i32.load8_u (i32.add (i32.add (global.get $DECODE_BUF) (i32.mul (local.get $idx) (i32.const 16))) (i32.const 3))))
  (func $get_decode_raw (export "get_decode_raw") (param $idx i32) (result i32)
    (i32.load (i32.add (i32.add (global.get $DECODE_BUF) (i32.mul (local.get $idx) (i32.const 16))) (i32.const 4))))
  (func $get_decode_operand (export "get_decode_operand") (param $idx i32) (result i32)
    (i32.load (i32.add (i32.add (global.get $DECODE_BUF) (i32.mul (local.get $idx) (i32.const 16))) (i32.const 8))))
  (func $get_decode_addr (export "get_decode_addr") (param $idx i32) (result i32)
    (i32.load (i32.add (i32.add (global.get $DECODE_BUF) (i32.mul (local.get $idx) (i32.const 16))) (i32.const 12))))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; MZ HEADER ACCESSOR
  ;; ═══════════════════════════════════════════════════════════════════

  (func $get_header_u16 (export "get_header_u16") (param $offset i32) (result i32)
    (i32.load16_u (i32.add (global.get $HEADER_BUF) (local.get $offset))))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; DOS MEMORY DUMP
  ;; ═══════════════════════════════════════════════════════════════════

  (func $dump_dos_region (export "dump_dos_region")
    (param $seg i32) (param $off i32) (param $len i32) (result i32)
    (local $src i32) (local $clamped i32)
    (local.set $src (call $seg_off_to_phys (local.get $seg) (local.get $off)))
    (local.set $clamped (local.get $len))
    (if (i32.gt_u (i32.add (local.get $src) (local.get $clamped)) (i32.const 0x10000))
      (then (local.set $clamped (i32.sub (i32.const 0x10000) (local.get $src)))))
    (memory.copy (global.get $META_BUF) (local.get $src) (local.get $clamped))
    (local.get $clamped))

  ;; ═══════════════════════════════════════════════════════════════════
  ;; RESET
  ;; ═══════════════════════════════════════════════════════════════════

  (func $reset (export "reset")
    (global.set $format (i32.const 0))
    (global.set $file_len (i32.const 0))
    (global.set $load_seg (i32.const 0))
    (global.set $code_off (i32.const 0))
    (global.set $code_size (i32.const 0))
    (global.set $hdr_cs (i32.const 0))
    (global.set $hdr_ip (i32.const 0))
    (global.set $hdr_ss (i32.const 0))
    (global.set $hdr_sp (i32.const 0))
    (global.set $hdr_reloc_count (i32.const 0))
    (global.set $hdr_reloc_off (i32.const 0))
    (global.set $entry_phys (i32.const 0))
    (global.set $last_error (i32.const 0))
    (global.set $decode_count (i32.const 0))
    (global.set $reloc_applied (i32.const 0))
    (global.set $dos_seg_base (i32.const 0))
    (global.set $img_size (i32.const 0)))
)
