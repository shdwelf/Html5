# The WebAssembly lens rasteriser, and the DOM it runs in

Two pieces of work live here, and they are deliberately joined: the keyspace
3-D lens layers are moved behind a WebAssembly module that writes into a WebGL
buffer and texture, and the DOM/WebGL surface that module touches is checked
against Blink's own sources rather than against anyone's recollection of the
spec.

```
wasm/lens3d.wat              the module, hand-written text format
wasm/lens3d.wasm             the 4 KB binary it assembles to (committed)
tools/build_lens3d_wasm.mjs  wabt assemble + instantiate + staleness check
js/lens3d-ref.js             the JavaScript shadow, op for op
js/lens3d-wasm.js            the client: instantiate, views, uploads, uniforms
lens3d-wasm.html             the demo: both backends, both GPU paths
tests/10-lens3d-wasm.mjs     parity, invariants, guards, real-Chromium boot
tools/blink_contract.mjs     mine third_party/blink/renderer → JSON contract
config/blink-dom-contract.json   what it found (derived, regenerable)
tests/09-blink-contract.mjs  our stubs are checked against that contract
tools/dom-stub.mjs           the stub, with an opt-in Blink-shaped canvas/WebGL
```

## 1 · Why the rasteriser is in wasm, and what that costs

`js/lens-3d.js` builds three.js scene graph objects for eleven lens layers. The
three that are *pure projection arithmetic* — `inv-subcube`, `inv-geodesic`,
`inv-complement` — are the ones worth moving: their entire cost is deriving
Morton cells from key bits and turning vertices into pixels, and both halves
are integer/floating point work that a small module does without a scene graph.

The module has two jobs.

**Build the vertices.** `buildSubcube`, `buildGeodesic`, `buildComplement` write
records into linear memory, interleaved as eight f32s:

```
x  y  z  r  g  b  size  alpha
```

Colours are divided in f64 (`channel / 255`) and demoted once on store, which is
the same thing a `Float32Array` write does — that is not an optimisation, it is
what makes the shadow in `js/lens3d-ref.js` comparable byte for byte.

**Rasterise into a texture.** `raster()` projects each vertex (yaw about Y, then
pitch about X, one-point perspective), splats a linear-falloff disc into an f32
RGBA accumulator, tone maps `q = trunc(clamp(v,0,1)·255 + 0.5)` and emits a
u8 RGBA block sized for `texImage2D`. Points and lines live in one buffer, as
two runs: points grow up from `VERTS`, line vertices grow up from
`LINES_BASE = VERTS + 4096·32`. Split halves beat "lines grow down from the far
end", which I tried first: the latter hands `linePtr()` to a `gl.LINES` consumer
in *reverse push order*, and there is no reason for a caller to know that.

The memory map is fixed at 64 pages, `initial = maximum`:

| address | contents |
| --- | --- |
| `0x000` | parameter block: i32 slots at 0…60, f64 slots at 128…192 |
| `0x400` | key A bytes (up to 1 KiB) |
| `0x800` | key B bytes |
| `0xC00` | 8192 vertex slots (4096 points, then 4096 line verts) |
| `0x41000` | f32 RGBA accumulator, 256² max |
| `0x141000` | u8 RGBA output |
| `0x241000` | differing-bit scratch for the geodesic/subcube walks |

Never growing is a correctness decision, not a shortcut: growing a wasm memory
detaches the old `ArrayBuffer`, and every typed-array view of the previous
buffer then reads as zero-length. `js/lens3d-wasm.js` takes its views once and
keeps them, and `tests/10` asserts the module has one memory of exactly 64
pages.

### What wasm cannot do here, and so what stays in JS

The MVP instruction set has `sqrt`, `ceil`, `floor`, `trunc`, `nearest`,
`min`/`max` on floats, and *nothing else*: no `sin`, no `acos`, no `pow`. The
layers that need transcendentals (`stochastic`, `inv-shell`, `modal-mu`,
`influence`, `vector`, `process|pi`) stay in `js/lens-3d.js`. Re-implementing
libm inside the module would buy nothing and would cost the exactness property,
because a hand-rolled `sin` would not agree with V8's to the last bit — and
agreement to the last bit is the whole reason this is testable.

Two more places where "MVP" is felt rather than worked around:

* `i32.min` / `i32.max` do not exist in wabt 1.0.36's MVP feature set, so the
  splat's integer bounds clamp through f64 `min`/`max`.
* `i32.trunc_f64_s` **traps** on out-of-range input instead of saturating. Every
  float that reaches a pixel index is clamped into `±(w+h)` first, and a vertex
  with a non-finite component is dropped (`f64.ne(v,v)`). `tests/10` feeds
  `NaN` and `Infinity` vertices through `pushVert` and requires the raster to
  survive, to still draw the finite vertex, and to agree with the shadow.

### The shadow, and why it is not "a second implementation to maintain"

`js/lens3d-ref.js` exports `createLens3dRef()`, which returns
`{ memory, exports }` — a `WebAssembly.Memory` and an `exports` object with the
same names, arity and return types as the instantiated module. `tests/10` builds
the same keys both ways and requires:

* the 4240 f32 point values to be identical (`Object.is`, so a signed zero or a
  NaN difference fails),
* the line run to be identical,
* the whole `256×256×4` texture to be identical byte for byte.

That turns "the wasm looks plausible" into a checked property, and it gives
hosts that refuse to compile WebAssembly — a document whose CSP lacks
`wasm-unsafe-eval`, or a webxdc runtime with wasm disabled — the *same*
numbers, not an approximation. `loadLens3d({backend:"auto"})` prefers the
module and says which it chose; `{backend:"wasm"}` surfaces the instantiation
error instead of degrading quietly.

### Building it

```
npm i --no-save wabt
node tools/build_lens3d_wasm.mjs          # wasm/lens3d.wat → wasm/lens3d.wasm
node tools/build_lens3d_wasm.mjs --check  # fails if the binary is stale
```

wabt is the only toolchain this repository needs: `parseWat → toBinary`, then
`WebAssembly.instantiate` as a second opinion, since wabt 1.0.36 exposes no
`validate` binding. `--check` prints `SKIPPED` and exits 0 when wabt is absent,
so `tests/run.sh` can call it unconditionally. Writing the module by hand is
practical at this size (4.1 KB) and keeps the app free of a toolchain — there is
no `compile` step to run, in CI or anywhere else.

## 2 · What Blink actually does

`tools/blink_contract.mjs` reads these files from a Chromium checkout and emits
`config/blink-dom-contract.json`; `tools/dom-stub.mjs` implements the canvas and
WebGL surface *from that JSON*, and `tests/09-blink-contract.mjs` fails if the
two disagree. Findings below are quoted from
[chromium/chromium](https://github.com/chromium/chromium) at
`8d021b3d480067e55940d1a5b64c4af094fcab07` (BSD-3; only derived facts and this
note live in the repository, no vendored sources).

**`getContext` is not on `HTMLCanvasElement` in core.**
`core/html/canvas/html_canvas_element.idl:33` says so outright — *"Due to
dependencies on modules, getContext is defined in a partial"* — and the real
declaration is `modules/canvas/htmlcanvas/html_canvas_element_module.idl:19`:

```
[CallWith=ScriptState, MeasureAs=HTMLCanvasGetContext, RaisesException]
RenderingContext? getContext(DOMString contextId,
    optional CanvasContextCreationAttributesModule attributes = {});
```

It returns a *nullable union* (2D | WebGL | WebGL2 | ImageBitmap |
GPUCanvasContext), which is why an unrecognised id yields `null` — no throw, no
console error. `RenderingAPIFromId` (`core/html/canvas/canvas_rendering_context.cc:513`)
accepts exactly `2d`, `experimental-webgl`, `webgl`, `webgl2`, `bitmaprenderer`,
`webgpu`, and maps `experimental-webgl` to `kWebgl`. So the legacy-name fallback
the VRML viewer uses is not superstition: both ids reach the same API, and
`GetCanvasRenderingContextInternal` hands back the *same memoised context* for
the second one. A different type is refused: `factory->OnError("Canvas has an
existing context of a different type")` and `null`. `tests/09` asserts all of
that against the stub, including that `"WebGL"` (wrong case) is unknown.

**Dictionary conversion is permissive.** `CanvasContextCreationAttributesModule`
carries `[PermissiveDictionaryConversion]`, so `getContext("2d", true)` is
*ignored* rather than a TypeError, and members the dictionary does not declare
are dropped rather than echoed back. The stub filters `getContextAttributes()`
through the contract's member list for exactly that reason.

**`WebGLContextAttributes` defaults** (`modules/webgl/webgl_context_attributes.idl:35`):
`alpha=true depth=true stencil=false antialias=true premultipliedAlpha=true
preserveDrawingBuffer=false powerPreference="default"
failIfMajorPerformanceCaveat=false desynchronized=false xrCompatible=false`.
`preserveDrawingBuffer=false` is the one that shapes this repository's testing:
after the frame is handed to the compositor the drawing buffer is discarded, so
`readPixels` after a `requestAnimationFrame` is unreliable. `tests/07` reads the
*composited screenshot* instead, and `tests/10` §7 does the same for the wasm
page — which is also why `lens3d-wasm.html` asks for `preserveDrawingBuffer: true`
explicitly so that its own read-back works.

**Canvas size gates** live in `core/html/canvas/canvas_rendering_context_host.cc:128`
(`IsValidImageSize`): an empty canvas is invalid, `kMaxCanvasArea = 32768 * 8192`,
`kMaxSkiaDim = 65535`; `width`/`height` are `[RaisesException=Setter]` unsigned
longs. The stub refuses to create a context past those limits, and `tests/09`
pins the boundary: 65535×4096 (exactly the area limit) passes, 65535×4097 does
not, 0×0 does not.

**The four WebGL calls this path uses, overload by overload**
(`modules/webgl/webgl_rendering_context_base.idl:489` onward):

```
void bufferData(GLenum target, GLsizeiptr size, GLenum usage);
void bufferData(GLenum target, [AllowShared, BufferSourceTypeNoSizeLimit] ArrayBufferView data, GLenum usage);
void bufferData(GLenum target, [AllowShared, BufferSourceTypeNoSizeLimit] ArrayBuffer? data, GLenum usage);
void bufferSubData(GLenum target, GLintptr offset, [AllowShared, PassAsSpan, BufferSourceTypeNoSizeLimit] BufferSource srcData);
```

`texImage2D` has eight overloads — one nine-argument typed-array form (the one
the module's texture uses) and six six-argument source-element forms — and Blink
rejects anything else with `GL_INVALID_VALUE` or a TypeError. The stub validates
*member existence and argument count* against that table, then reproduces the
engine's own error style: bad `bufferData` target/size **queue** a GL error for
`getError()` rather than throwing, with the messages from
`ValidateBufferDataTarget` / `ValidateBufferDataBufferSize`
(`INVALID_ENUM "invalid target"`, `INVALID_OPERATION "no buffer"`,
`INVALID_VALUE "data size is invalid"`, `"data size exceeds the maximum
supported size"`).

**The ceiling that is specifically about WebAssembly.**
`modules/webgl/webgl_rendering_context_base.h:667`:

> JavaScript cannot allocate bigger ArrayBuffers anyways. **Only with
> WebAssembly it is possible to allocate bigger ArrayBuffers.**

`kMaximumSupportedArrayBufferSize = partition_alloc::MaxAllocationSize()`
(2 GB − 2 MB), enforced by `ValidateBufferDataBufferSize`. Our upload is 256 KiB
and the texture 256 KiB, but the *rule* matters for anyone who points `bufferData`
at a bigger module: `tests/09` §8 checks our sizes against the recorded ceiling
and keeps the comment in the contract so the reason survives.

**`getElementById` returns `Element?`** —
`core/dom/non_element_parent_node.idl:7`, `[PerWorldBindings]`, and it never
fabricates a node. The repository's stub auto-creates elements on demand, which
is a *test double* decision, not DOM behaviour: it is what lets
`tools/check_ghs.mjs` drive a controller whose markup lives in a page. `tests/09`
labels it, and `installDomStub({ strictIds: true })` switches to the Blink
answer (`null` for a missing id) so a typo in an element id is observable in CI
instead of silently materialising a `<div>`.

## 3 · Re-mining the contract

```
git clone --depth 1 --filter=blob:none --no-checkout \
    https://github.com/chromium/chromium.git src
cd src
git sparse-checkout init --cone
git sparse-checkout set third_party/blink/renderer/core/dom \
    third_party/blink/renderer/core/html/canvas \
    third_party/blink/renderer/modules/webgl \
    third_party/blink/renderer/modules/canvas
git checkout
node tools/blink_contract.mjs --src /path/to/src           # rewrite the JSON
node tools/blink_contract.mjs --src /path/to/src --check   # drift check
CHROMIUM_SRC=/path/to/src node tests/09-blink-contract.mjs # 09 verifies the JSON too
```

Keep the checkout **outside** the repository: even the four sparse directories are
~100 MB, and nothing in the app needs them at runtime. The JSON is ~67 KB of
derived facts with a recorded revision and a sha256 per mined file; if Blink
changes an interface, `--check` says so instead of the shim drifting.

## 4 · What is *not* claimed

* The WebGL context in `tools/dom-stub.mjs` is a **recorder**: it validates calls
  against Blink's declarations and keeps a log. It does not rasterise, and no
  part of it is a GPU.
* `tests/stubs/three-stub.mjs` is a double for *three.js*, not for the DOM. Its
  parametric geometries do carry real position attributes (the lens audit counts
  them), which is the only reason `tests/04` can assert anything about vertex
  data at all.
* The exactness guarantee covers the three projection-determined layers. It says
  nothing about how three.js would shade them, and the GPU-shaded path in the
  demo page runs in f32 on the card, so it agrees with the module's raster to
  within a pixel — which is the point of offering both and showing which is
  which.
* The contract is a snapshot of one revision of one engine. It is the *reference
  we check ourselves against*, not a substitute for the spec: no IDL here is
  re-declared as normative, and Chromium's own behaviour is gated by runtime
  features: `RuntimeEnabled=WebGLDrawingBufferStorage` gates `RGB8`/`RGBA8` and
  `drawingBufferFormat` (`webgl_rendering_context_base.idl:470`),
  `RuntimeEnabled=WebGLToneMapping` gates `drawingBufferToneMapping` (:472), and
  `xrCompatible` — which the contract lists as a `WebGLContextAttributes` member
  with a default of `false` — is behind `RuntimeEnabled=WebXR`
  (`webgl_context_attributes.idl:45`). A build with a feature off does not
  expose that member at all, which a stub does not model.
