#!/usr/bin/env node
/**
 * blink_contract.mjs — derive config/blink-dom-contract.json from a Chromium
 * checkout, so this repository's DOM stand-ins are checked against the engine
 * that defines them instead against somebody's memory of the spec.
 *
 *   node tools/blink_contract.mjs --src /path/to/src [--check] [--out config/blink-dom-contract.json]
 *
 * `--src` is a *source* checkout of https://github.com/chromium/chromium — only
 * a few directories are needed, and they stay outside this repository:
 *
 *   git clone --depth 1 --filter=blob:none --no-checkout https://github.com/chromium/chromium.git src
 *   cd src && git sparse-checkout init --cone
 *   git sparse-checkout set third_party/blink/renderer/core/html/canvas \
 *       third_party/blink/renderer/modules/webgl \
 *       third_party/blink/renderer/modules/canvas \
 *       third_party/blink/renderer/core/html/canvas \
 *       third_party/blink/renderer/core/dom
 *   git checkout
 *
 * What gets extracted is deliberately narrow: the interface membership, the
 * context-creation surface, the argument shapes of the four WebGL calls the
 * wasm vertex/texture path uses, and the canvas size limits. That is the
 * contract our stubs implement and that tests/09-blink-contract.mjs enforces.
 * Nothing from Chromium is vendored into the app: the JSON is derived data with
 * a recorded revision and per-file digests, regenerable by this script.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argOf = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const CHECK = args.includes("--check");
const SRC = argOf("src", process.env.CHROMIUM_SRC || "");
const OUT = argOf("out", join(ROOT, "config", "blink-dom-contract.json"));

const B = "third_party/blink/renderer";
const FILES = {
  canvasIdl: `${B}/core/html/canvas/html_canvas_element.idl`,
  canvasModuleIdl: `${B}/modules/canvas/htmlcanvas/html_canvas_element_module.idl`,
  ctxAttrsIdl: `${B}/modules/canvas/htmlcanvas/canvas_context_creation_attributes_module.idl`,
  renderingCtx: `${B}/core/html/canvas/canvas_rendering_context.cc`,
  ctxHost: `${B}/core/html/canvas/canvas_rendering_context_host.cc`,
  webglBaseIdl: `${B}/modules/webgl/webgl_rendering_context_base.idl`,
  webgl1Idl: `${B}/modules/webgl/webgl_rendering_context.idl`,
  webgl2BaseIdl: `${B}/modules/webgl/webgl2_rendering_context_base.idl`,
  webgl2Idl: `${B}/modules/webgl/webgl2_rendering_context.idl`,
  webglCtxAttrs: `${B}/modules/webgl/webgl_context_attributes.idl`,
  webglRenderCtx: `${B}/modules/webgl/webgl_rendering_context_base.cc`,
  webglHeader: `${B}/modules/webgl/webgl_rendering_context_base.h`,
  nonElementParent: `${B}/core/dom/non_element_parent_node.idl`,
  elementIdl: `${B}/core/dom/element.idl`,
  nodeFilterIdl: `${B}/core/dom/node.idl`,
};

function read(rel) {
  const p = join(SRC, rel);
  if (!existsSync(p)) throw new Error(`no such file in the checkout: ${rel}`);
  return readFileSync(p, "utf8");
}
const sha = (text) => createHash("sha256").update(text).digest("hex");

/* ------------------------------------------------------------------ *
 * IDL helpers — enough grammar to read declarations, not a parser.
 * ------------------------------------------------------------------ */

/** Strip // and block comments; both appear inside IDL bodies. */
function stripComments(src) {
  return src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * The body of `interface X { … }`, `interface mixin X { … }`,
 * `partial interface mixin X { … }`, or `dictionary X { … }`.
 *
 * Blink writes the WebGL surface as mixins attached with `includes`, so the
 * declaration line is `(partial )?interface( mixin)? NAME (: parents)? {` and
 * extended attributes sit above it — matching on the name and the brace, not on
 * a fixed prefix, is what keeps this working across the DOM and WebGL files.
 */
function blockOf(src, name) {
  const re = new RegExp(
    `\\b(?:interface\\s+mixin|partial\\s+interface\\s+mixin|partial\\s+interface|callback\\s+interface|interface|dictionary|enum)\\s+${name}\\b[^{};]*\\{`
  );
  const m = re.exec(src);
  if (!m) return null;
  const open = src.indexOf("{", m.index + m[0].length - 1);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return null;
}

/** Which mixins a concrete interface pulls in: `X includes Y`. */
function includes(src, name) {
  return [...src.matchAll(new RegExp(`^\\s*${name}\\s+includes\\s+(\\w+)\\s*;`, "gm"))].map((m) => m[1]);
}

const RESERVED = new Set([
  "void", "attribute", "readonly", "const", "getter", "setter", "deleter",
  "legacy", "legacycaller", "static", "stringifier", "iterable", "maplike",
  "setmaplike", "constructor", "includes", "namespace", "callback", "typedef",
]);

/**
 * Split an interface/mixin/dictionary body into member records.
 *
 * IDL declarations are `modifiers type name(args)`, `attribute T name`, or
 * `const T name = value`, and Blink writes the union types the specs need with
 * parentheses — `readonly attribute (HTMLCanvasElement or OffscreenCanvas)
 * canvas` — so the member name is the word *before* the argument list (or the
 * last word of the head for an attribute) rather than a counted type token.
 * Overloads stay separate entries: the overload count is part of the contract.
 */
function members(body) {
  if (body === null) return [];
  const out = [];
  for (const raw of body.split(";")) {
    let decl = raw.replace(/\s+/g, " ").trim();
    if (!decl) continue;
    const attrs = [];
    decl = decl.replace(/^\[([^\]]*)\]\s*/, (_m, a) => {
      for (const piece of a.split(",")) if (piece.trim()) attrs.push(piece.trim());
      return "";
    });
    if (/\{$/.test(decl)) continue; // inline dictionary / enum declaration

    let modifier = null;
    decl = decl.replace(/^(getter|setter|deleter|static|legacycaller|stringifier)\s+/, (_m, k) => {
      modifier = k;
      return "";
    });

    const mConst = decl.match(/^const\s+([\w?]+(?:\[\w+\])?)\s+(\w+)\s*=\s*(.+)$/);
    if (mConst) {
      out.push({ kind: "const", type: mConst[1], name: mConst[2], value: mConst[3].trim(), extendedAttributes: attrs });
      continue;
    }

    const open = decl.indexOf("(");
    if (open > 0 && decl.endsWith(")")) {
      const head = decl.slice(0, open).trim();
      const nameMatch = head.match(/(\w+)\s*$/);
      const name = nameMatch ? nameMatch[1] : "";
      if (/(^|\s)attribute(\s|$)/.test(head)) {
        const type = head.replace(/\breadonly\b/, "").replace(/\battribute\b/, "").trim();
        out.push({ kind: "attribute", type, name, extendedAttributes: attrs, modifier });
        continue;
      }
      if (name && !RESERVED.has(name)) {
        out.push({
          kind: "operation",
          name,
          returns: head.slice(0, head.length - name.length).trim() || "void",
          args: splitArgs(decl.slice(open + 1, -1)).map(argText),
          extendedAttributes: attrs,
          modifier,
        });
        continue;
      }
      continue;
    }

    const mAttr = decl.match(/^(?:readonly\s+)?attribute\s+(.+?)\s+(\w+)$/);
    if (mAttr) {
      out.push({ kind: "attribute", type: mAttr[1], name: mAttr[2], extendedAttributes: attrs, modifier });
      continue;
    }
    const mProp = decl.match(/^(?:readonly\s+)?([\w?]+(?:\?)?)\s+(\w+)$/);
    if (mProp && !RESERVED.has(mProp[1])) {
      out.push({ kind: "attribute", type: mProp[1], name: mProp[2], extendedAttributes: attrs, modifier, implied: true });
    }
  }
  return out;
}

/** Split an argument list on top-level commas. */
function splitArgs(s) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    if (ch === ")" || ch === "]" || ch === "}") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Reduce one argument declaration to { type, name, optional, defaultValue }. */
function argText(a) {
  const attrs = [];
  let t = a.replace(/^\[([^\]]*)\]\s*/, (_m, x) => {
    attrs.push(x.trim());
    return "";
  });
  t = t.replace(/^optional\s+/, "");
  const optional = /^optional\s/.test(a.replace(/^\[[^\]]*\]\s*/, ""));
  let defaultValue = null;
  t = t.replace(/\s*=\s*(.+)$/, (_m, d) => {
    defaultValue = d.trim();
    return "";
  });
  const parts = t.trim().split(/\s+/);
  const name = parts.length > 1 ? parts.pop() : "";
  return {
    type: parts.join(" ").replace(/\s*\?\s*$/, "?"),
    name,
    optional: optional || defaultValue !== null,
    defaultValue,
    extendedAttributes: attrs,
  };
}

function dictionary(src, name) {
  const body = blockOf(src, name);
  if (body === null) return null;
  const at = src.search(new RegExp(`(?:^|\\n)\\s*(?:\\[[^\\]]*\\]\\s*)?dictionary\\s+${name}\\b`));
  const extendedAttributes = at < 0 ? [] : (src.slice(at, src.indexOf("dictionary", at)).match(/\[([^\]]*)\]/g) || []);
  const members = [];
  for (const line of stripComments(body).split(";")) {
    const t = line.replace(/\s+/g, " ").trim();
    if (!t) continue;
    const m = t.match(/^(?:\[[^\]]*\]\s*)?([\w?]+)\s+(\w+)(?:\s*=\s*(.+))?$/);
    if (m) members.push({ type: m[1], name: m[2], defaultValue: (m[3] || null) });
  }
  return { extendedAttributes: extendedAttributes.map((s) => s.replace(/[[\]]/g, "")), members };
}

function interfaceNames(src) {
  const out = [];
  for (const m of src.matchAll(/(?:partial\s+)?interface\s+(\w+)(?:\s+:\s*(\w+))?/g)) {
    out.push({ name: m[1], inherits: m[2] || null });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * C++ helpers
 * ------------------------------------------------------------------ */

/** `if (id == "x") { return CanvasRenderingContext::CanvasRenderingAPI::kY; }` */
function renderingApiIds(src) {
  const fn = src.slice(src.indexOf("RenderingAPIFromId(const String& id) {"));
  const out = [];
  for (const m of fn.matchAll(/if\s*\(id\s*==\s*"([^"]+)"\)\s*\{[^}]*::(\w+);/g)) {
    out.push({ id: m[1], api: m[2] });
    if (m[1] === "webgpu") break;
  }
  return out;
}

/** `static constexpr int kName = value; // comment` */
function intConstants(src, names) {
  const out = {};
  for (const name of names) {
    const m = src.match(new RegExp(`k${name}\\s*=\\s*([\\d\\s*]+);\\s*(?://\\s*(.*))?`, ""));
    if (!m) continue;
    const expr = m[1].replace(/\s+/g, "").replace(/\/\*.*?\*\//g, "");
    if (!/^[\d*]+$/.test(expr)) continue;
    out[name] = expr.split("*").reduce((a, b) => a * Number(b), 1);
    if (m[2]) out[`${name}Note`] = m[2].trim();
  }
  return out;
}

/* ------------------------------------------------------------------ */

function extract() {
  const canvasIdl = stripComments(read(FILES.canvasIdl));
  const canvasModuleIdl = stripComments(read(FILES.canvasModuleIdl));
  const ctxAttrsIdl = stripComments(read(FILES.ctxAttrsIdl));
  const webglBase = stripComments(read(FILES.webglBaseIdl));
  const webgl1 = stripComments(read(FILES.webgl1Idl));
  const webgl2Base = stripComments(read(FILES.webgl2BaseIdl));
  const webgl2 = stripComments(read(FILES.webgl2Idl));
  const webglAttrs = stripComments(read(FILES.webglCtxAttrs));
  const renderingCtx = read(FILES.renderingCtx);
  const ctxHost = read(FILES.ctxHost);
  const parentNode = stripComments(read(FILES.nonElementParent));
  const elementIdl = stripComments(read(FILES.elementIdl));

  // WebGL 1.0 in Blink = the WebGLRenderingContextBase mixin, plus whatever the
  // concrete interface itself declares (a couple of GLenum constants).
  const webglMembers = [
    ...members(blockOf(webglBase, "WebGLRenderingContextBase")),
    ...members(blockOf(webgl1, "WebGLRenderingContext")),
  ];
  const webgl2Members = [
    ...members(blockOf(webglBase, "WebGLRenderingContextBase")),
    ...members(blockOf(webgl2Base, "WebGL2RenderingContextBase")),
    ...members(blockOf(webgl2, "WebGL2RenderingContext")),
  ];
  const mixins = {
    WebGLRenderingContext: includes(webgl1, "WebGLRenderingContext"),
    WebGL2RenderingContext: includes(webgl2, "WebGL2RenderingContext"),
  };

  const pickOps = (list, names) =>
    names.map((n) => ({
      name: n,
      overloads: list
        .filter((m) => m.kind === "operation" && m.name === n)
        .map((m) => ({ args: m.args, extendedAttributes: m.extendedAttributes })),
    }));

  return {
    schema: "blink-dom-contract/1",
    generatedBy: "tools/blink_contract.mjs",
    provenance: {
      source: "https://github.com/chromium/chromium",
      revision: git(["rev-parse", "HEAD"]),
      commitDate: git(["log", "-1", "--format=%cI"]),
      subject: git(["log", "-1", "--format=%s"]).slice(0, 120),
      files: Object.fromEntries(
        Object.entries(FILES).map(([k, rel]) => {
          const text = readFileSync(join(SRC, rel), "utf8");
          return [k, { path: rel, bytes: text.length, sha256: sha(text) }];
        })
      ),
    },
    canvas: {
      /** HTMLCanvasElement members declared in core (getContext lives in the module). */
      members: members(blockOf(canvasIdl, "HTMLCanvasElement")).map((m) => m.name).sort(),
      getContext: members(blockOf(canvasModuleIdl, "HTMLCanvasElement"))
        .filter((m) => m.kind === "operation" && m.name === "getContext")
        .map((m) => ({ args: m.args, returns: "RenderingContext?", extendedAttributes: m.extendedAttributes }))[0],
      renderingApiIds: renderingApiIds(renderingCtx),
      creationAttributes: dictionary(ctxAttrsIdl, "CanvasContextCreationAttributesModule"),
      sizeLimits: intConstants(ctxHost, ["MaxCanvasArea", "MaxSkiaDim"]),
      /** Blink memoises the context: a second getContext with the same id hands
       *  back the same object; a different id is refused outright. */
      contextReuseRule:
        "GetCanvasRenderingContextInternal returns the existing context when the requested API matches, and fails with \"Canvas has an existing context of a different type\" when it does not.",
    },
    webgl: {
      contextAttributes: dictionary(webglAttrs, "WebGLContextAttributes"),
      methods: webglMembers.filter((m) => m.kind === "operation").map((m) => m.name).sort(),
      attributes: webglMembers.filter((m) => m.kind === "attribute").map((m) => m.name).sort(),
      webgl2OnlyMethods: webgl2Members
        .filter((m) => m.kind === "operation")
        .map((m) => m.name)
        .filter((n) => !webglMembers.some((m) => m.kind === "operation" && m.name === n))
        .sort(),
      // The ceiling bufferData/texImage2D enforce on a BufferSource, with the
      // comment that motivates it — which names WebAssembly as the case that
      // can exceed an ordinary JS ArrayBuffer.
      bufferLimits: (() => {
        const h = read(FILES.webglHeader);
        const m = h.match(/kMaximumSupportedArrayBufferSize\s*=\s*([^;]+);/);
        const at = h.indexOf("kMaximumSupportedArrayBufferSize");
        // The comment block directly above the constant's *declaration*, and
        // nothing else — start by backing up to the beginning of that line.
        const before = h.slice(0, h.lastIndexOf("\n", at) + 1).split("\n").reverse();
        const lines = [];
        for (const line of before) {
          if (/^\s*\/\/\s?/.test(line)) lines.push(line.replace(/^\s*\/\/\s?/, "").trim());
          else if (line.trim() === "") continue;
          else break;
        }
        return {
          maxArrayBufferSize: m ? m[1].replace(/\s+/g, " ").trim() : null,
          comment: lines.reverse().join(" "),
        };
      })(),
      bufferDataValidation: (() => {
        const cc = read(FILES.webglRenderCtx);
        const fn = cc.slice(cc.indexOf("WebGLBuffer* WebGLRenderingContextBase::ValidateBufferDataTarget"));
        const errors = [...fn.slice(0, fn.indexOf("\n}")).matchAll(/SynthesizeGLError\((GL_\w+),\s*function_name,\s*"([^"]*)"/g)]
          .map((x) => ({ glError: x[1], message: x[2] }));
        const sizeFn = cc.slice(cc.indexOf("bool WebGLRenderingContextBase::ValidateBufferDataBufferSize"));
        const sizeErrors = [...sizeFn.slice(0, sizeFn.indexOf("\n}")).matchAll(/SynthesizeGLError\((GL_\w+),[^"]*"([^"]*)"/g)]
          .map((x) => ({ glError: x[1], message: x[2] }));
        return { target: errors, size: sizeErrors };
      })(),
      calls: [
        ...pickOps(webglMembers, [
          "bufferData", "bufferSubData", "texImage2D", "texSubImage2D", "drawArrays",
          "vertexAttribPointer", "enableVertexAttribArray", "getAttribLocation", "bindBuffer",
          "createBuffer", "deleteBuffer", "createProgram", "createShader", "shaderSource",
          "compileShader", "attachShader", "linkProgram", "useProgram", "getUniformLocation",
          "uniformMatrix4fv", "uniform1f", "uniform1i", "viewport", "clear", "clearColor",
          "enable", "disable", "blendFunc", "createTexture", "bindTexture", "texParameteri",
          "activeTexture", "getError", "getParameter", "getExtension", "isContextLost",
        ]),
        ...pickOps(webgl2Members, ["createVertexArray", "bindVertexArray"]),
      ],
      mixins,
    },
    dom: {
      nonElementParentNode: members(blockOf(parentNode, "NonElementParentNode")).map((m) => m.name),
      elementMembers: members(blockOf(elementIdl, "Element")).map((m) => m.name).sort(),
    },
  };
}

function git(argv) {
  try {
    return execFileSync("git", argv, { cwd: SRC, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

if (!SRC || !existsSync(join(SRC, ".git")) && !existsSync(join(SRC, FILES.canvasIdl))) {
  console.error(
    "a Chromium checkout is required: --src /path/to/src (see the header comment for the sparse-checkout recipe)"
  );
  process.exit(2);
}

const contract = extract();
const json = `${JSON.stringify(contract, null, 2)}\n`;

if (CHECK) {
  const onDisk = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  const strip = (t) => t.replace(/"revision": "[^"]*",\n/, "").replace(/"commitDate": "[^"]*",\n/, "");
  if (!onDisk) {
    console.error(`contract missing: ${relative(ROOT, OUT)}`);
    process.exit(1);
  }
  if (strip(onDisk) === strip(json)) {
    const prov = contract.provenance;
    console.log(
      `blink contract: matches the checkout at ${prov.revision.slice(0, 12)} ` +
        `(${contract.canvas.renderingApiIds.length} context ids, ${contract.webgl.methods.length} WebGL methods)`
    );
    process.exit(0);
  }
  console.error(
    "blink contract: config/blink-dom-contract.json does NOT match this checkout —\n" +
      "  the stub contract is stale, or the engine changed. Re-run without --check and review the diff."
  );
  process.exit(1);
}

writeFileSync(OUT, json);
console.log(
  `wrote ${relative(ROOT, OUT)}: ${json.length} bytes · rev ${contract.provenance.revision.slice(0, 12)} · ` +
    `${contract.webgl.methods.length} WebGL methods · ${contract.canvas.renderingApiIds.length} canvas context ids`
);
