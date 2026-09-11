;; ═══════════════════════════════════════════════════════════════════════════
;; lens3d.wat — the keyspace 3-D lens rasteriser, in WebAssembly
;; ═══════════════════════════════════════════════════════════════════════════
;;
;; What lives here: the geometry of the three projection-determined 3-D lens
;; layers (affine subcube, geodesic staircase, complement chord) plus a CPU splat
;; rasteriser whose output is uploaded straight into a WebGL texture. Everything
;; is integer bit maths and exact IEEE-754 arithmetic, so the module is
;; *bit-exactly* shadowed by the JavaScript reference in js/lens3d-ref.js —
;; tests/10-lens3d-wasm.mjs locks that identity. Layers whose shape depends on
;; transcendentals (Math.pow / Math.sin / Math.acos in the stochastic and shell
;; lenses) deliberately stay on the JS side: re-implementing libm inside wasm
;; would forfeit the exactness that makes the two interchangeable.
;;
;; Memory map (64 pages = 4 MiB, allocated once and never grown — the ArrayBuffer
;; backing the vertex view is therefore never detached; see
;; docs/blink-webgl-wasm.md for the Blink semantics behind that choice):
;;
;;   0x000000 params             (0x400)
;;   0x000400 key A bytes        (0x400)   1 KiB — up to 1024 entropy bytes
;;   0x000800 key B bytes        (0x400)
;;   0x000C00 vertex buffer     (0x40000)  8192 verts × 8 f32: points grow up,
;;                                          line verts grow down from the far end,
;;                                          so one upload feeds both draws
;;   0x0041000 accumulation    (0x100000)  256×256 RGBA f32
;;   0x0141000 rgba output      (0x100000) 256×256 RGBA u8 — the texImage2D source
;;   0x0241000 scratch             (0x100) differing-prefix-bit list
;;
;; Vertex layout (8 × f32 = 32 bytes):
;;   [x y z] scene position · [r g b] colour in [0,1] · [size] splat size in
;;   scene units · [alpha] 0…1 — one interleaved record, read by both the GPU
;;   shader (buffer path) and the rasteriser (texture path).
;;
;; Build:  node tools/build_lens3d_wasm.mjs        (wabt is dev-only)

(module
  (memory (export "memory") 64)

  ;; ─── i32 parameter slots ────────────────────────────────────────────────
  (global $P_ORDER   i32 (i32.const 0))   ;; projection order; 3·order prefix bits
  (global $P_ALEN    i32 (i32.const 4))   ;; key A byte length
  (global $P_BLEN    i32 (i32.const 8))   ;; key B byte length
  (global $P_FLAGS   i32 (i32.const 12))  ;; bit 0 = a pair (key B) is present
  (global $P_NPTS    i32 (i32.const 16))  ;; point vertices emitted
  (global $P_NLN     i32 (i32.const 20))  ;; line vertices emitted
  (global $P_ERR     i32 (i32.const 24))  ;; 0 ok · 1 vertex overflow · 2 bad viewport · 3 bad order · 4 key too long
  (global $P_TEXW    i32 (i32.const 28))
  (global $P_TEXH    i32 (i32.const 32))
  (global $P_MAXS    i32 (i32.const 36))  ;; subcube sample cap
  (global $P_PREFIX  i32 (i32.const 40))  ;; scan only the first N prefix bits
  (global $P_DIFFCAP i32 (i32.const 44))  ;; at most N differing bits stay free
  (global $P_COLORA  i32 (i32.const 48))  ;; 0xRRGGBB
  (global $P_COLORB  i32 (i32.const 52))
  (global $P_COLORC  i32 (i32.const 56))
  (global $P_LIT     i32 (i32.const 60))  ;; pixels touched by the last raster()

  ;; ─── f64 parameter slots ────────────────────────────────────────────────
  (global $P_SCALE  i32 (i32.const 128))  ;; scene half-extent
  (global $P_YAWC   i32 (i32.const 136))
  (global $P_YAWS   i32 (i32.const 144))
  (global $P_PITC   i32 (i32.const 152))
  (global $P_PITS   i32 (i32.const 160))
  (global $P_FOCAL  i32 (i32.const 168))
  (global $P_DIST   i32 (i32.const 176))
  (global $P_PXRAD  i32 (i32.const 184))  ;; splat radius in px at unit depth
  (global $P_BRIGHT i32 (i32.const 192))

  ;; ─── data areas ─────────────────────────────────────────────────────────
  (global $KEY_A    i32 (i32.const 0x400))
  (global $KEY_B    i32 (i32.const 0x800))
  (global $VERTS    i32 (i32.const 0xC00))
  (global $ACCUM    i32 (i32.const 0x41000))
  (global $RGBA     i32 (i32.const 0x141000))
  (global $SCRATCH  i32 (i32.const 0x241000))
  (global $CAP      i32 (i32.const 8192)) ;; vertex slots in total
  ;; Two runs in one buffer, each half of it, both growing up: points from
  ;; VERTS, lines from LINES_BASE. Split halves beat "lines grow down from the
  ;; far end" because the line run then reads back in push order, which is what
  ;; a drawArrays(GL_LINES, 0, n) consumer expects.
  (global $PT_CAP   i32 (i32.const 4096)) ;; slots per run
  (global $LINES_BASE i32 (i32.const 134144)) ;; VERTS + PT_CAP·STRIDE
  (global $STRIDE   i32 (i32.const 32))   ;; bytes per vertex (8 × f32)
  (global $KEYSPAN  i32 (i32.const 0x400))

  ;; Marker / stroke sizing, in one place so the JS shadow can agree.
  (global $SIZE_MARK  f32 (f32.const 0.11))
  (global $SIZE_PT    f32 (f32.const 0.06))
  (global $SIZE_SML   f32 (f32.const 0.05))
  (global $SIZE_LN    f32 (f32.const 0.03))
  (global $ALPHA_PT   f32 (f32.const 0.95))
  (global $ALPHA_LN   f32 (f32.const 0.90))
  (global $ALPHA_DIM  f32 (f32.const 0.40))
  (global $ALPHA_EDGE f32 (f32.const 0.75))
  (global $ALPHA_SML  f32 (f32.const 0.70))

  ;; ─── prefix bit j of a key (bit 0 = MSB of byte 0) ──────────────────────
  ;; Reading past the key yields 0, which is exactly the left-alignment
  ;; prefixBits uses for short keys, so a 6-bit key still spans the grid.
  (func $bit (param $ptr i32) (param $len i32) (param $j i32) (result i32)
    (local $byte i32)
    (if (i32.ge_u (i32.shr_u (local.get $j) (i32.const 3)) (local.get $len))
      (then (return (i32.const 0))))
    (local.set $byte
      (i32.load8_u (i32.add (local.get $ptr) (i32.shr_u (local.get $j) (i32.const 3)))))
    (i32.and
      (i32.shr_u (local.get $byte)
        (i32.sub (i32.const 7) (i32.and (local.get $j) (i32.const 7))))
      (i32.const 1)))

  ;; ─── Morton cell of one axis ────────────────────────────────────────────
  ;; flip=1 complements every prefix bit — the antipode ¬k — so the identity
  ;; d(¬A, B) = ENT − d(A, B) falls out of the geometry rather than a formula.
  (func $cell (param $ptr i32) (param $len i32) (param $axis i32) (param $flip i32) (result i32)
    (local $order i32) (local $j i32) (local $k i32) (local $acc i32) (local $b i32)
    (local.set $order (i32.load (global.get $P_ORDER)))
    (local.set $j (local.get $axis))
    (local.set $k (i32.const 0))
    (local.set $acc (i32.const 0))
    (block $done
      (loop $l
        (br_if $done (i32.ge_u (local.get $k) (local.get $order)))
        (local.set $b (call $bit (local.get $ptr) (local.get $len) (local.get $j)))
        (if (i32.eq (local.get $flip) (i32.const 1))
          (then (local.set $b (i32.xor (local.get $b) (i32.const 1)))))
        (if (local.get $b)
          (then (local.set $acc
            (i32.or (local.get $acc) (i32.shl (i32.const 1) (local.get $k))))))
        (local.set $j (i32.add (local.get $j) (i32.const 3)))
        (local.set $k (i32.add (local.get $k) (i32.const 1)))
        (br $l)))
    (local.get $acc))

  ;; cell → scene coordinate: [0, 2^order) → [0, 1] → [−scale, +scale]
  (func $coordOfCell (param $cell i32) (result f64)
    (f64.mul
      (f64.sub
        (f64.mul
          (f64.div
            (f64.convert_i32_u (local.get $cell))
            (f64.convert_i32_u
              (i32.sub (i32.shl (i32.const 1) (i32.load (global.get $P_ORDER))) (i32.const 1))))
          (f64.const 2))
        (f64.const 1))
      (f64.load (global.get $P_SCALE))))

  (func $proj (param $key i32) (param $len i32) (param $axis i32) (param $flip i32) (result f64)
    (call $coordOfCell
      (call $cell (local.get $key) (local.get $len) (local.get $axis) (local.get $flip))))

  ;; ─── vertex emitters: points grow up, lines grow down ───────────────────
  (func $putVert (param $p i32) (param $x f64) (param $y f64) (param $z f64)
                 (param $col i32) (param $size f32) (param $alpha f32)
    (f32.store (local.get $p) (f32.demote_f64 (local.get $x)))
    (f32.store (i32.add (local.get $p) (i32.const 4)) (f32.demote_f64 (local.get $y)))
    (f32.store (i32.add (local.get $p) (i32.const 8)) (f32.demote_f64 (local.get $z)))
    (f32.store (i32.add (local.get $p) (i32.const 12))
      (f32.demote_f64 (f64.div
        (f64.convert_i32_u (i32.and (i32.shr_u (local.get $col) (i32.const 16)) (i32.const 255)))
        (f64.const 255))))
    (f32.store (i32.add (local.get $p) (i32.const 16))
      (f32.demote_f64 (f64.div
        (f64.convert_i32_u (i32.and (i32.shr_u (local.get $col) (i32.const 8)) (i32.const 255)))
        (f64.const 255))))
    (f32.store (i32.add (local.get $p) (i32.const 20))
      (f32.demote_f64 (f64.div
        (f64.convert_i32_u (i32.and (local.get $col) (i32.const 255)))
        (f64.const 255))))
    (f32.store (i32.add (local.get $p) (i32.const 24)) (local.get $size))
    (f32.store (i32.add (local.get $p) (i32.const 28)) (local.get $alpha)))

  (func $pushPt (param $x f64) (param $y f64) (param $z f64)
                 (param $col i32) (param $size f32) (param $alpha f32)
    (local $n i32)
    (local.set $n (i32.load (global.get $P_NPTS)))
    (if (i32.ge_u (local.get $n) (global.get $PT_CAP))
      (then
        (i32.store (global.get $P_ERR) (i32.const 1))
        (return)))
    (call $putVert
      (i32.add (global.get $VERTS) (i32.mul (local.get $n) (global.get $STRIDE)))
      (local.get $x) (local.get $y) (local.get $z) (local.get $col) (local.get $size) (local.get $alpha))
    (i32.store (global.get $P_NPTS) (i32.add (local.get $n) (i32.const 1))))

  (func $pushLn (param $x0 f64) (param $y0 f64) (param $z0 f64)
                 (param $x1 f64) (param $y1 f64) (param $z1 f64)
                 (param $col i32) (param $size f32) (param $alpha f32)
    (local $n i32) (local $p i32)
    (local.set $n (i32.load (global.get $P_NLN)))
    (if (i32.ge_u
          (i32.add (local.get $n) (i32.const 2))
          (global.get $PT_CAP))
      (then
        (i32.store (global.get $P_ERR) (i32.const 1))
        (return)))
    (local.set $p
      (i32.add
        (global.get $LINES_BASE)
        (i32.mul (local.get $n) (global.get $STRIDE))))
    (call $putVert (local.get $p)
      (local.get $x0) (local.get $y0) (local.get $z0) (local.get $col) (local.get $size) (local.get $alpha))
    (call $putVert (i32.add (local.get $p) (global.get $STRIDE))
      (local.get $x1) (local.get $y1) (local.get $z1) (local.get $col) (local.get $size) (local.get $alpha))
    (i32.store (global.get $P_NLN) (i32.add (local.get $n) (i32.const 2))))

  ;; ─── differing prefix bits, in flip order, into scratch ────────────────
  ;; Shared by the geodesic and the subcube. Returns how many were recorded.
  (func $collectDiff (result i32)
    (local $n i32) (local $j i32) (local $lim i32) (local $la i32) (local $lb i32)
    (local.set $lim (i32.load (global.get $P_PREFIX)))
    (local.set $n (i32.const 0))
    (local.set $j (i32.const 0))
    (block $done
      (loop $l
        (br_if $done (i32.ge_u (local.get $j) (local.get $lim)))
        (br_if $done (i32.ge_u (local.get $n) (i32.load (global.get $P_DIFFCAP))))
        (local.set $la
          (call $bit (global.get $KEY_A) (i32.load (global.get $P_ALEN)) (local.get $j)))
        (local.set $lb
          (call $bit (global.get $KEY_B) (i32.load (global.get $P_BLEN)) (local.get $j)))
        (if (i32.ne (local.get $la) (local.get $lb))
          (then
            (i32.store
              (i32.add (global.get $SCRATCH) (i32.mul (local.get $n) (i32.const 4)))
              (local.get $j))
            (local.set $n (i32.add (local.get $n) (i32.const 1)))))
        (local.set $j (i32.add (local.get $j) (i32.const 1)))
        (br $l)))
    (local.get $n))

  ;; Cell of key A with the mask-selected differing bits flipped. Flipping
  ;; prefix bit j toggles coordinate bit j/3 of axis j%3 — no byte copies.
  (func $cellAt (param $key i32) (param $len i32) (param $axis i32)
                (param $ndiff i32) (param $mask i32) (result i32)
    (local $cell i32) (local $m i32) (local $bit i32) (local $acc i32)
    (local.set $cell (call $cell (local.get $key) (local.get $len) (local.get $axis) (i32.const 0)))
    (local.set $m (i32.const 0))
    (local.set $acc (i32.const 0))
    (block $done
      (loop $l
        (br_if $done (i32.ge_u (local.get $m) (local.get $ndiff)))
        (if (i32.and (local.get $mask) (i32.shl (i32.const 1) (local.get $m)))
          (then
            (local.set $bit
              (i32.load (i32.add (global.get $SCRATCH) (i32.mul (local.get $m) (i32.const 4)))))
            (if (i32.eq (i32.rem_u (local.get $bit) (i32.const 3)) (local.get $axis))
              (then
                (local.set $acc
                  (i32.xor (local.get $acc)
                    (i32.shl (i32.const 1) (i32.div_u (local.get $bit) (i32.const 3)))))))))
        (local.set $m (i32.add (local.get $m) (i32.const 1)))
        (br $l)))
    (i32.xor (local.get $cell) (local.get $acc)))

  (func $coordAt (param $key i32) (param $len i32) (param $axis i32)
                 (param $ndiff i32) (param $mask i32) (result f64)
    (call $coordOfCell
      (call $cellAt (local.get $key) (local.get $len) (local.get $axis)
                    (local.get $ndiff) (local.get $mask))))

  ;; ─── layer: complement chord ────────────────────────────────────────────
  ;; A, ¬A and the A–¬A chord; with a pair loaded, B, ¬B and a dimmer chord.
  (func $buildComplement (export "buildComplement") (result i32)
    (local $ax f64) (local $ay f64) (local $az f64)
    (local $nx f64) (local $ny f64) (local $nz f64)
    (local $bx f64) (local $by f64) (local $bz f64)
    (local $mx f64) (local $my f64) (local $mz f64)
    (local $start i32) (local $colA i32) (local $colB i32) (local $colC i32)
    (local $alen i32) (local $blen i32)
    (local.set $start (i32.load (global.get $P_NPTS)))
    (if (i32.eqz (i32.load (global.get $P_ALEN))) (then (return (i32.const 0))))
    (local.set $colA (i32.load (global.get $P_COLORA)))
    (local.set $colB (i32.load (global.get $P_COLORB)))
    (local.set $colC (i32.load (global.get $P_COLORC)))
    (local.set $alen (i32.load (global.get $P_ALEN)))
    (local.set $blen (i32.load (global.get $P_BLEN)))
    (local.set $ax (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 0) (i32.const 0)))
    (local.set $ay (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 1) (i32.const 0)))
    (local.set $az (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 2) (i32.const 0)))
    (local.set $nx (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 0) (i32.const 1)))
    (local.set $ny (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 1) (i32.const 1)))
    (local.set $nz (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 2) (i32.const 1)))
    (call $pushPt (local.get $ax) (local.get $ay) (local.get $az)
      (local.get $colA) (global.get $SIZE_MARK) (global.get $ALPHA_PT))
    (call $pushPt (local.get $nx) (local.get $ny) (local.get $nz)
      (local.get $colC) (global.get $SIZE_MARK) (global.get $ALPHA_PT))
    (call $pushLn (local.get $ax) (local.get $ay) (local.get $az)
      (local.get $nx) (local.get $ny) (local.get $nz)
      (local.get $colC) (global.get $SIZE_LN) (global.get $ALPHA_LN))
    (if (i32.and (i32.load (global.get $P_FLAGS)) (i32.const 1))
      (then
        (local.set $bx (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 0) (i32.const 0)))
        (local.set $by (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 1) (i32.const 0)))
        (local.set $bz (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 2) (i32.const 0)))
        (local.set $mx (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 0) (i32.const 1)))
        (local.set $my (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 1) (i32.const 1)))
        (local.set $mz (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 2) (i32.const 1)))
        (call $pushPt (local.get $bx) (local.get $by) (local.get $bz)
          (local.get $colB) (global.get $SIZE_MARK) (global.get $ALPHA_PT))
        (call $pushPt (local.get $mx) (local.get $my) (local.get $mz)
          (local.get $colC) (global.get $SIZE_SML) (global.get $ALPHA_PT))
        (call $pushLn (local.get $bx) (local.get $by) (local.get $bz)
          (local.get $mx) (local.get $my) (local.get $mz)
          (local.get $colC) (global.get $SIZE_LN) (global.get $ALPHA_DIM))))
    (i32.sub (i32.load (global.get $P_NPTS)) (local.get $start)))

  ;; ─── layer: geodesic — the staircase of single-bit flips A → B ───────────
  ;; Each step is one prefix bit, so the walk is a shortest path: d flips, d
  ;; edges of the cube. Bits at or beyond the prefix limit never move.
  (func $buildGeodesic (export "buildGeodesic") (result i32)
    (local $ndiff i32) (local $step i32) (local $mask i32) (local $start i32)
    (local $alen i32) (local $px f64) (local $py f64) (local $pz f64)
    (local $cx f64) (local $cy f64) (local $cz f64)
    (local $colA i32) (local $colB i32) (local $colC i32)
    (local.set $start (i32.load (global.get $P_NPTS)))
    (if (i32.eqz (i32.load (global.get $P_BLEN))) (then (return (i32.const 0))))
    (local.set $colA (i32.load (global.get $P_COLORA)))
    (local.set $colB (i32.load (global.get $P_COLORB)))
    (local.set $colC (i32.load (global.get $P_COLORC)))
    (local.set $alen (i32.load (global.get $P_ALEN)))
    (local.set $ndiff (call $collectDiff))
    (local.set $mask (i32.const 0))
    (local.set $px (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 0) (local.get $ndiff) (local.get $mask)))
    (local.set $py (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 1) (local.get $ndiff) (local.get $mask)))
    (local.set $pz (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 2) (local.get $ndiff) (local.get $mask)))
    (call $pushPt (local.get $px) (local.get $py) (local.get $pz)
      (local.get $colA) (global.get $SIZE_PT) (global.get $ALPHA_PT))
    (local.set $step (i32.const 0))
    (block $done
      (loop $l
        (br_if $done (i32.ge_u (local.get $step) (local.get $ndiff)))
        (local.set $mask (i32.or (local.get $mask) (i32.shl (i32.const 1) (local.get $step))))
        (local.set $cx (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 0) (local.get $ndiff) (local.get $mask)))
        (local.set $cy (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 1) (local.get $ndiff) (local.get $mask)))
        (local.set $cz (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 2) (local.get $ndiff) (local.get $mask)))
        (call $pushPt (local.get $cx) (local.get $cy) (local.get $cz)
          (local.get $colC) (global.get $SIZE_PT) (global.get $ALPHA_PT))
        (call $pushLn (local.get $px) (local.get $py) (local.get $pz)
          (local.get $cx) (local.get $cy) (local.get $cz)
          (local.get $colC) (global.get $SIZE_LN) (global.get $ALPHA_LN))
        (local.set $px (local.get $cx))
        (local.set $py (local.get $cy))
        (local.set $pz (local.get $cz))
        (local.set $step (i32.add (local.get $step) (i32.const 1)))
        (br $l)))
    ;; the far corner of the staircase is B's projected cell — mark it
    (call $pushPt (local.get $px) (local.get $py) (local.get $pz)
      (local.get $colB) (global.get $SIZE_MARK) (global.get $ALPHA_PT))
    (i32.sub (i32.load (global.get $P_NPTS)) (local.get $start)))

  ;; corner of the axis-aligned box, per axis: bit set → hi, clear → lo
  (func $boxCoord (param $corner i32) (param $axis i32) (param $lo f64) (param $hi f64) (result f64)
    (if (result f64)
      (i32.and (local.get $corner) (i32.shl (i32.const 1) (local.get $axis)))
      (then (local.get $hi))
      (else (local.get $lo))))

  ;; ─── layer: affine subcube — the box A↔B plus its sampled corners ───────
  ;; |S| = 2^d over the free prefix bits, capped at maxSamples draws. The box is
  ;; axis-aligned *because* the projection is a Morton de-interleave.
  (func $buildSubcube (export "buildSubcube") (result i32)
    (local $ndiff i32) (local $count i32) (local $s i32) (local $start i32)
    (local $k i32) (local $axis i32) (local $q i32) (local $a1 i32) (local $a2 i32)
    (local $c0 i32) (local $c1 i32)
    (local $minx f64) (local $miny f64) (local $minz f64)
    (local $maxx f64) (local $maxy f64) (local $maxz f64)
    (local $cx f64) (local $cy f64) (local $cz f64)
    (local $ax f64) (local $ay f64) (local $az f64)
    (local $bx f64) (local $by f64) (local $bz f64)
    (local $colA i32) (local $colB i32) (local $colC i32)
    (local $alen i32) (local $blen i32)
    (local.set $start (i32.load (global.get $P_NPTS)))
    (if (i32.eqz (i32.load (global.get $P_BLEN))) (then (return (i32.const 0))))
    (local.set $colA (i32.load (global.get $P_COLORA)))
    (local.set $colB (i32.load (global.get $P_COLORB)))
    (local.set $colC (i32.load (global.get $P_COLORC)))
    (local.set $alen (i32.load (global.get $P_ALEN)))
    (local.set $blen (i32.load (global.get $P_BLEN)))
    (local.set $ax (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 0) (i32.const 0)))
    (local.set $ay (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 1) (i32.const 0)))
    (local.set $az (call $proj (global.get $KEY_A) (local.get $alen) (i32.const 2) (i32.const 0)))
    (local.set $bx (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 0) (i32.const 0)))
    (local.set $by (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 1) (i32.const 0)))
    (local.set $bz (call $proj (global.get $KEY_B) (local.get $blen) (i32.const 2) (i32.const 0)))
    (call $pushPt (local.get $ax) (local.get $ay) (local.get $az)
      (local.get $colA) (global.get $SIZE_MARK) (global.get $ALPHA_PT))
    (call $pushPt (local.get $bx) (local.get $by) (local.get $bz)
      (local.get $colB) (global.get $SIZE_MARK) (global.get $ALPHA_PT))
    (local.set $minx (f64.min (local.get $ax) (local.get $bx)))
    (local.set $miny (f64.min (local.get $ay) (local.get $by)))
    (local.set $minz (f64.min (local.get $az) (local.get $bz)))
    (local.set $maxx (f64.max (local.get $ax) (local.get $bx)))
    (local.set $maxy (f64.max (local.get $ay) (local.get $by)))
    (local.set $maxz (f64.max (local.get $az) (local.get $bz)))
    ;; 12 edges: for each axis, the four corners with that bit clear, joined to
    ;; the same corner with the bit set.
    (local.set $k (i32.const 0))
    (block $edges
      (loop $l
        (br_if $edges (i32.ge_u (local.get $k) (i32.const 12)))
        (local.set $axis (i32.shr_u (local.get $k) (i32.const 2)))
        (local.set $q (i32.and (local.get $k) (i32.const 3)))
        (local.set $a1 (i32.rem_u (i32.add (local.get $axis) (i32.const 1)) (i32.const 3)))
        (local.set $a2 (i32.rem_u (i32.add (local.get $axis) (i32.const 2)) (i32.const 3)))
        (local.set $c0
          (i32.or
            (i32.shl (i32.and (local.get $q) (i32.const 1)) (local.get $a1))
            (i32.shl (i32.shr_u (local.get $q) (i32.const 1)) (local.get $a2))))
        (local.set $c1 (i32.or (local.get $c0) (i32.shl (i32.const 1) (local.get $axis))))
        (call $pushLn
          (call $boxCoord (local.get $c0) (i32.const 0) (local.get $minx) (local.get $maxx))
          (call $boxCoord (local.get $c0) (i32.const 1) (local.get $miny) (local.get $maxy))
          (call $boxCoord (local.get $c0) (i32.const 2) (local.get $minz) (local.get $maxz))
          (call $boxCoord (local.get $c1) (i32.const 0) (local.get $minx) (local.get $maxx))
          (call $boxCoord (local.get $c1) (i32.const 1) (local.get $miny) (local.get $maxy))
          (call $boxCoord (local.get $c1) (i32.const 2) (local.get $minz) (local.get $maxz))
          (local.get $colC) (global.get $SIZE_LN) (global.get $ALPHA_EDGE))
        (local.set $k (i32.add (local.get $k) (i32.const 1)))
        (br $l)))
    ;; sampled corners of the projected box
    (local.set $ndiff (call $collectDiff))
    (local.set $count (i32.shl (i32.const 1) (local.get $ndiff)))
    (if (i32.gt_u (local.get $count) (i32.load (global.get $P_MAXS)))
      (then (local.set $count (i32.load (global.get $P_MAXS)))))
    (local.set $s (i32.const 0))
    (block $corners
      (loop $l
        (br_if $corners (i32.ge_u (local.get $s) (local.get $count)))
        (local.set $cx (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 0) (local.get $ndiff) (local.get $s)))
        (local.set $cy (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 1) (local.get $ndiff) (local.get $s)))
        (local.set $cz (call $coordAt (global.get $KEY_A) (local.get $alen) (i32.const 2) (local.get $ndiff) (local.get $s)))
        (call $pushPt (local.get $cx) (local.get $cy) (local.get $cz)
          (local.get $colC) (global.get $SIZE_SML) (global.get $ALPHA_SML))
        (local.set $s (i32.add (local.get $s) (i32.const 1)))
        (br $l)))
    (i32.sub (i32.load (global.get $P_NPTS)) (local.get $start)))

  ;; ─── splat: one vertex → a disc with linear falloff, accumulated in RGBA ─
  (func $splat (param $p i32) (param $w i32) (param $h i32)
    (local $x f64) (local $y f64) (local $z f64)
    (local $r f64) (local $g f64) (local $b f64) (local $alpha f64) (local $size f64)
    (local $x1 f64) (local $z1 f64) (local $y2 f64) (local $z2 f64)
    (local $depth f64) (local $sx f64) (local $sy f64) (local $rr f64)
    (local $px i32) (local $py i32) (local $x0 i32) (local $x1i i32)
    (local $y0 i32) (local $y1i i32) (local $k i32)
    (local $dx f64) (local $dy f64) (local $fall f64) (local $amt f64)
    (local $maxf f64) (local $lo f64)
    (local.set $x (f64.promote_f32 (f32.load (local.get $p))))
    (local.set $y (f64.promote_f32 (f32.load (i32.add (local.get $p) (i32.const 4)))))
    (local.set $z (f64.promote_f32 (f32.load (i32.add (local.get $p) (i32.const 8)))))
    (local.set $r (f64.promote_f32 (f32.load (i32.add (local.get $p) (i32.const 12)))))
    (local.set $g (f64.promote_f32 (f32.load (i32.add (local.get $p) (i32.const 16)))))
    (local.set $b (f64.promote_f32 (f32.load (i32.add (local.get $p) (i32.const 20)))))
    (local.set $size (f64.promote_f32 (f32.load (i32.add (local.get $p) (i32.const 24)))))
    (local.set $alpha (f64.promote_f32 (f32.load (i32.add (local.get $p) (i32.const 28)))))
    ;; A non-finite vertex is dropped rather than drawn: f64.ne(v, v) is true
    ;; exactly for NaN, and a canvas would silently skip the primitive anyway.
    (if (f64.ne (local.get $x) (local.get $x)) (then (return)))
    (if (f64.ne (local.get $y) (local.get $y)) (then (return)))
    (if (f64.ne (local.get $z) (local.get $z)) (then (return)))
    (if (f64.eq (local.get $alpha) (f64.const 0)) (then (return)))
    ;; yaw about Y, then pitch about X
    (local.set $x1 (f64.add (f64.mul (local.get $x) (f64.load (global.get $P_YAWC)))
                            (f64.mul (local.get $z) (f64.load (global.get $P_YAWS)))))
    (local.set $z1 (f64.sub (f64.mul (local.get $z) (f64.load (global.get $P_YAWC)))
                            (f64.mul (local.get $x) (f64.load (global.get $P_YAWS)))))
    (local.set $y2 (f64.sub (f64.mul (local.get $y) (f64.load (global.get $P_PITC)))
                            (f64.mul (local.get $z1) (f64.load (global.get $P_PITS)))))
    (local.set $z2 (f64.add (f64.mul (local.get $y) (f64.load (global.get $P_PITS)))
                            (f64.mul (local.get $z1) (f64.load (global.get $P_PITC)))))
    (local.set $depth (f64.add (local.get $z2) (f64.load (global.get $P_DIST))))
    (if (f64.le (local.get $depth) (f64.const 0.000001)) (then (return)))
    (local.set $sx (f64.add (f64.div (f64.convert_i32_u (local.get $w)) (f64.const 2))
      (f64.div (f64.mul (local.get $x1) (f64.load (global.get $P_FOCAL))) (local.get $depth))))
    (local.set $sy (f64.sub (f64.div (f64.convert_i32_u (local.get $h)) (f64.const 2))
      (f64.div (f64.mul (local.get $y2) (f64.load (global.get $P_FOCAL))) (local.get $depth))))
    (local.set $rr (f64.div
      (f64.mul (f64.load (global.get $P_PXRAD)) (f64.add (local.get $size) (f64.const 0.5)))
      (local.get $depth)))
    (if (f64.ne (local.get $sx) (local.get $sx)) (then (return)))
    (if (f64.ne (local.get $sy) (local.get $sy)) (then (return)))
    (if (f64.ne (local.get $rr) (local.get $rr)) (then (return)))
    ;; Clamp to the viewport *before* truncating, so an off-screen or gigantic
    ;; splat can never hand i32.trunc_f64_s an out-of-range value (that is a
    ;; trap, not a skip).
    ;; Integer min/max are not in the MVP instruction set, so the bound is the
    ;; sum of the sides: viewport sides are capped at 256 by setViewport, which
    ;; makes 512 a safe ceiling for every coordinate that can reach trunc below.
    (local.set $maxf (f64.convert_i32_u (i32.add (local.get $w) (local.get $h))))
    (local.set $lo (f64.sub (f64.const 0) (local.get $maxf)))
    (local.set $sx (f64.min (f64.max (local.get $sx) (local.get $lo)) (local.get $maxf)))
    (local.set $sy (f64.min (f64.max (local.get $sy) (local.get $lo)) (local.get $maxf)))
    (local.set $rr (f64.min (f64.max (local.get $rr) (f64.const 0.5)) (local.get $maxf)))
    (local.set $x0 (i32.trunc_f64_s (f64.floor (f64.sub (local.get $sx) (local.get $rr)))))
    (local.set $x1i (i32.trunc_f64_s (f64.ceil (f64.add (local.get $sx) (local.get $rr)))))
    (local.set $y0 (i32.trunc_f64_s (f64.floor (f64.sub (local.get $sy) (local.get $rr)))))
    (local.set $y1i (i32.trunc_f64_s (f64.ceil (f64.add (local.get $sy) (local.get $rr)))))
    (if (i32.lt_s (local.get $x0) (i32.const 0)) (then (local.set $x0 (i32.const 0))))
    (if (i32.lt_s (local.get $y0) (i32.const 0)) (then (local.set $y0 (i32.const 0))))
    (if (i32.gt_s (local.get $x1i) (local.get $w)) (then (local.set $x1i (local.get $w))))
    (if (i32.gt_s (local.get $y1i) (local.get $h)) (then (local.set $y1i (local.get $h))))
    (local.set $py (local.get $y0))
    (block $rows
      (loop $rl
        (br_if $rows (i32.ge_s (local.get $py) (local.get $y1i)))
        (local.set $dy (f64.sub (f64.add (f64.convert_i32_s (local.get $py)) (f64.const 0.5)) (local.get $sy)))
        (local.set $px (local.get $x0))
        (block $cols
          (loop $cl
            (br_if $cols (i32.ge_s (local.get $px) (local.get $x1i)))
            (local.set $dx (f64.sub (f64.add (f64.convert_i32_s (local.get $px)) (f64.const 0.5)) (local.get $sx)))
            (local.set $fall
              (f64.sub (f64.const 1)
                (f64.div
                  (f64.sqrt (f64.add (f64.mul (local.get $dx) (local.get $dx))
                                      (f64.mul (local.get $dy) (local.get $dy))))
                  (local.get $rr))))
            (if (f64.gt (local.get $fall) (f64.const 0))
              (then
                (local.set $amt (f64.mul (local.get $fall) (f64.load (global.get $P_BRIGHT))))
                (local.set $k (i32.add (global.get $ACCUM)
                  (i32.mul (i32.add (i32.mul (local.get $py) (local.get $w)) (local.get $px)) (i32.const 16))))
                (f32.store (local.get $k)
                  (f32.add (f32.load (local.get $k)) (f32.demote_f64 (f64.mul (local.get $r) (local.get $amt)))))
                (f32.store (i32.add (local.get $k) (i32.const 4))
                  (f32.add (f32.load (i32.add (local.get $k) (i32.const 4))) (f32.demote_f64 (f64.mul (local.get $g) (local.get $amt)))))
                (f32.store (i32.add (local.get $k) (i32.const 8))
                  (f32.add (f32.load (i32.add (local.get $k) (i32.const 8))) (f32.demote_f64 (f64.mul (local.get $b) (local.get $amt)))))
                (f32.store (i32.add (local.get $k) (i32.const 12))
                  (f32.add (f32.load (i32.add (local.get $k) (i32.const 12))) (f32.demote_f64 (f64.mul (local.get $alpha) (local.get $amt)))))))
            (local.set $px (i32.add (local.get $px) (i32.const 1)))
            (br $cl)))
        (local.set $py (i32.add (local.get $py) (i32.const 1)))
        (br $rl))))

  (func $toQ8 (param $v f64) (result i32)
    (i32.trunc_f64_s
      (f64.add
        (f64.mul
          (f64.min (f64.max (local.get $v) (f64.const 0)) (f64.const 1))
          (f64.const 255))
        (f64.const 0.5))))

  ;; ─── raster: clear, splat every vertex, tone map, count lit pixels ──────
  (func (export "raster") (result i32)
    (local $w i32) (local $h i32) (local $npx i32) (local $i i32) (local $n i32) (local $p i32)
    (local $acc i32) (local $out i32) (local $lit i32) (local $any i32)
    (local.set $w (i32.load (global.get $P_TEXW)))
    (local.set $h (i32.load (global.get $P_TEXH)))
    (if (i32.or (i32.eqz (local.get $w)) (i32.eqz (local.get $h))) (then (return (i32.const 0))))
    (local.set $npx (i32.mul (local.get $w) (local.get $h)))
    ;; clear the f32 accumulator (4 channels per pixel)
    (local.set $i (i32.const 0))
    (block $cl
      (loop $l
        (br_if $cl (i32.ge_u (local.get $i) (i32.mul (local.get $npx) (i32.const 4))))
        (f32.store (i32.add (global.get $ACCUM) (i32.mul (local.get $i) (i32.const 4))) (f32.const 0))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $l)))
    ;; splat the point run, then the line run
    (local.set $n (i32.load (global.get $P_NPTS)))
    (local.set $i (i32.const 0))
    (block $vs
      (loop $l
        (br_if $vs (i32.ge_u (local.get $i) (local.get $n)))
        (call $splat (i32.add (global.get $VERTS) (i32.mul (local.get $i) (global.get $STRIDE)))
                     (local.get $w) (local.get $h))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $l)))
    (local.set $n (i32.load (global.get $P_NLN)))
    (local.set $p (global.get $LINES_BASE))
    (local.set $i (i32.const 0))
    (block $vs2
      (loop $l
        (br_if $vs2 (i32.ge_u (local.get $i) (local.get $n)))
        (call $splat (local.get $p) (local.get $w) (local.get $h))
        (local.set $p (i32.add (local.get $p) (global.get $STRIDE)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $l)))
    ;; tone map q = floor(clamp(v, 0, 1) · 255 + 0.5) and count lit pixels
    (local.set $lit (i32.const 0))
    (local.set $i (i32.const 0))
    (block $tm
      (loop $l
        (br_if $tm (i32.ge_u (local.get $i) (local.get $npx)))
        (local.set $acc (i32.add (global.get $ACCUM) (i32.mul (local.get $i) (i32.const 16))))
        (local.set $out (i32.add (global.get $RGBA) (i32.mul (local.get $i) (i32.const 4))))
        (i32.store8 (local.get $out)
          (call $toQ8 (f64.promote_f32 (f32.load (local.get $acc)))))
        (i32.store8 (i32.add (local.get $out) (i32.const 1))
          (call $toQ8 (f64.promote_f32 (f32.load (i32.add (local.get $acc) (i32.const 4))))))
        (i32.store8 (i32.add (local.get $out) (i32.const 2))
          (call $toQ8 (f64.promote_f32 (f32.load (i32.add (local.get $acc) (i32.const 8))))))
        (i32.store8 (i32.add (local.get $out) (i32.const 3))
          (call $toQ8 (f64.promote_f32 (f32.load (i32.add (local.get $acc) (i32.const 12))))))
        (local.set $any
          (i32.or
            (i32.or (i32.load8_u (local.get $out)) (i32.load8_u (i32.add (local.get $out) (i32.const 1))))
            (i32.or (i32.load8_u (i32.add (local.get $out) (i32.const 2)))
                    (i32.load8_u (i32.add (local.get $out) (i32.const 3))))))
        (if (local.get $any)
          (then (local.set $lit (i32.add (local.get $lit) (i32.const 1)))))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $l)))
    (i32.store (global.get $P_LIT) (local.get $lit))
    (local.get $lit))

  ;; ─── configuration ──────────────────────────────────────────────────────
  ;; order is validated rather than silently clamped: 3·order has to stay inside
  ;; a 32-bit index, and the grid has to stay inside a Uint16 cell.
  (func (export "configure")
        (param $order i32) (param $aLen i32) (param $bLen i32) (param $flags i32)
        (param $scale f64) (param $prefix i32) (param $diffCap i32) (param $maxSamples i32)
        (param $colorA i32) (param $colorB i32) (param $colorC i32)
    (if (i32.or (i32.lt_u (local.get $order) (i32.const 1))
                (i32.gt_u (local.get $order) (i32.const 10)))
      (then
        (i32.store (global.get $P_ERR) (i32.const 3))
        (return)))
    (if (i32.or (i32.gt_u (local.get $aLen) (global.get $KEYSPAN))
                 (i32.gt_u (local.get $bLen) (global.get $KEYSPAN)))
      (then
        (i32.store (global.get $P_ERR) (i32.const 4))
        (return)))
    (i32.store (global.get $P_ORDER) (local.get $order))
    (i32.store (global.get $P_ALEN) (local.get $aLen))
    (i32.store (global.get $P_BLEN) (local.get $bLen))
    (i32.store (global.get $P_FLAGS) (local.get $flags))
    (f64.store (global.get $P_SCALE) (local.get $scale))
    (i32.store (global.get $P_PREFIX) (local.get $prefix))
    (i32.store (global.get $P_DIFFCAP) (local.get $diffCap))
    (i32.store (global.get $P_MAXS) (local.get $maxSamples))
    (i32.store (global.get $P_COLORA) (local.get $colorA))
    (i32.store (global.get $P_COLORB) (local.get $colorB))
    (i32.store (global.get $P_COLORC) (local.get $colorC)))

  (func (export "setView")
        (param $yawCos f64) (param $yawSin f64) (param $pitchCos f64) (param $pitchSin f64)
        (param $focal f64) (param $dist f64) (param $pxRadius f64) (param $brightness f64)
    (f64.store (global.get $P_YAWC) (local.get $yawCos))
    (f64.store (global.get $P_YAWS) (local.get $yawSin))
    (f64.store (global.get $P_PITC) (local.get $pitchCos))
    (f64.store (global.get $P_PITS) (local.get $pitchSin))
    (f64.store (global.get $P_FOCAL) (local.get $focal))
    (f64.store (global.get $P_DIST) (local.get $dist))
    (f64.store (global.get $P_PXRAD) (local.get $pxRadius))
    (f64.store (global.get $P_BRIGHT) (local.get $brightness)))

  ;; 1 .. 256 per side: the accumulator and the u8 target are sized for 256².
  (func (export "setViewport") (param $w i32) (param $h i32) (result i32)
    (if (i32.or
          (i32.or (i32.lt_u (local.get $w) (i32.const 1)) (i32.gt_u (local.get $w) (i32.const 256)))
          (i32.or (i32.lt_u (local.get $h) (i32.const 1)) (i32.gt_u (local.get $h) (i32.const 256))))
      (then
        (i32.store (global.get $P_ERR) (i32.const 2))
        (return (i32.const 1))))
    (i32.store (global.get $P_TEXW) (local.get $w))
    (i32.store (global.get $P_TEXH) (local.get $h))
    (i32.const 0))

  ;; ─── accessors ──────────────────────────────────────────────────────────
  (func (export "reset")
    (i32.store (global.get $P_NPTS) (i32.const 0))
    (i32.store (global.get $P_NLN) (i32.const 0))
    (i32.store (global.get $P_ERR) (i32.const 0))
    (i32.store (global.get $P_LIT) (i32.const 0)))

  (func (export "pointCount") (result i32) (i32.load (global.get $P_NPTS)))
  (func (export "lineCount") (result i32) (i32.load (global.get $P_NLN)))
  (func (export "pointPtr") (result i32) (global.get $VERTS))
  (func (export "linePtr") (result i32) (global.get $LINES_BASE))
  (func (export "vertexCapacity") (result i32) (global.get $CAP))
  (func (export "vertexStride") (result i32) (global.get $STRIDE))
  (func (export "floatsPerVertex") (result i32) (i32.const 8))
  (func (export "error") (result i32) (i32.load (global.get $P_ERR)))
  (func (export "litPixels") (result i32) (i32.load (global.get $P_LIT)))
  (func (export "rgbaPtr") (result i32) (global.get $RGBA))
  (func (export "rgbaBytes") (result i32)
    (i32.mul (i32.mul (i32.load (global.get $P_TEXW)) (i32.load (global.get $P_TEXH))) (i32.const 4)))
  (func $keyPtr (export "keyPtr") (param $which i32) (result i32)
    (i32.add (global.get $KEY_A) (i32.mul (local.get $which) (global.get $KEYSPAN))))
  (func $keyLen (export "keyLen") (param $which i32) (result i32)
    (i32.load (i32.add (global.get $P_ALEN) (i32.mul (local.get $which) (i32.const 4)))))
  ;; Projection probe for the parity tests: the integer Morton cell of a key.
  (func (export "cellOf") (param $which i32) (param $axis i32) (param $flip i32) (result i32)
    (call $cell (call $keyPtr (local.get $which)) (call $keyLen (local.get $which))
                (local.get $axis) (local.get $flip)))

  ;; Feed the rasteriser an arbitrary vertex (used by the non-finite guard test
  ;; and by anything outside the three lens layers).
  (func (export "pushVert") (param $x f64) (param $y f64) (param $z f64) (param $col i32)
                            (param $size f32) (param $alpha f32)
    (call $pushPt (local.get $x) (local.get $y) (local.get $z) (local.get $col)
                  (local.get $size) (local.get $alpha)))
)
