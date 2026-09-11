#!/usr/bin/env python3
"""Transpile the SITE-K C core to an ES module.

The web emulator in calc.html does NOT reimplement anything: it runs this
translation of calc/core/*.c, so a rendering bug you see in the browser is a
rendering bug you would see on the calculator.

The accepted dialect is the one documented at the top of calc/core/sitek.h.
Everything else is rejected loudly instead of being silently mistranslated.

Usage:
    python3 calc/tools/c2js.py core/*.c --out js/calc-core.js
"""
import re
import sys
from pathlib import Path

SCALAR_TYPES = ("u8", "i8", "u16", "i16", "u32", "i32", "int", "char",
                "unsigned", "signed", "long", "short", "void")
ARRAY_CTORS = {
    "u8": "Uint8Array", "i8": "Int8Array",
    "u16": "Uint16Array", "i16": "Int16Array",
    "u32": "Uint32Array", "i32": "Int32Array",
    "int": "Int32Array",
}
CAST_RE = re.compile(
    r"\((?:unsigned\s+long|unsigned\s+int|unsigned\s+char|signed\s+char|"
    r"unsigned\s+short|long\s+int|unsigned|signed|long|short|int|char|"
    r"u8|i8|u16|i16|u32|i32)\)")
TYPES_ALT = (r"(?:u8|i8|u16|i16|u32|i32|int|char|unsigned\s+long|unsigned\s+int|"
             r"unsigned\s+char|signed\s+char|unsigned|signed|long|short)")
DECL_RE = re.compile(
    r"^(?:static\s+)?(?:const\s+)?(" + TYPES_ALT + r")\s*(?:\*\s*)?([A-Za-z_][A-Za-z0-9_]*)"
    r"\s*\[\s*([^\]]*)\]\s*(?:=\s*(\{.*))?;?\s*$")
SCALAR_DECL_RE = re.compile(
    r"^(?:static\s+)?(?:const\s+)?(" + TYPES_ALT + r")\s*(?:\*\s*)?([A-Za-z_][A-Za-z0-9_]*)"
    r"\s*(?:=\s*(.+?))?;$")
FUNC_RE = re.compile(
    r"^(?:static\s+)?(?:const\s+)?(?:void|" + TYPES_ALT + r")\s*(?:\*\s*)?"
    r"([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*\{$")
PROTO_RE = re.compile(
    r"^(?:static\s+)?(?:const\s+)?(?:void|" + TYPES_ALT + r")\s*(?:\*\s*)?"
    r"([A-Za-z_][A-Za-z0-9_]*)\s*\([^;]*\);$")


class TranspileError(Exception):
    pass


def strip_casts(text: str) -> str:
    prev = None
    while prev != text:
        prev = text
        text = CAST_RE.sub("", text)
    return text


def char_literals(text: str) -> str:
    def repl(m):
        body = m.group(1)
        if body.startswith("\\"):
            return str(ord(body[1:2])) if body[1:2] in "0nrt\\'\"x" else "0"
        return str(ord(body))
    return re.sub(r"'(\\?.|)'", repl, text)


def fix_stmt(line: str) -> str:
    line = char_literals(line)
    line = strip_casts(line)
    line = re.sub(r"\b([A-Za-z_][A-Za-z0-9_]*)\+\+", r"\1 = \1 + 1", line)
    line = re.sub(r"\b([A-Za-z_][A-Za-z0-9_]*)--", r"\1 = \1 - 1", line)
    line = re.sub(r"\+\+([A-Za-z_][A-Za-z0-9_]*)", r"\1 = \1 + 1", line)
    line = re.sub(r"--([A-Za-z_][A-Za-z0-9_]*)", r"\1 = \1 - 1", line)
    line = line.replace("while (1)", "while (true)")
    line = re.sub(r"([0-9a-fA-F])[uU]\b", r"\1", line)
    return line


def js_number(text: str) -> str:
    return re.sub(r"([0-9a-fA-F])[uU]\b", r"\1", text)


def array_ctor(ctype: str, name: str) -> str:
    base = ctype.replace("const", "").replace("static", "").strip()
    if base not in ARRAY_CTORS:
        raise TranspileError("no array constructor for type %r (%s)" % (base, name))
    return ARRAY_CTORS[base]


def transpile(paths, exports_path=None):
    out = []
    exports = []
    cond = []          # preprocessor conditional stack
    defines = []        # #define names, exported so the UI can use the constants
    guard = None

    def emit(line):
        out.append(line)

    for path in paths:
        raw = Path(path).read_text().splitlines()
        emit("/* --- %s --- */" % Path(path).name)
        i = 0
        while i < len(raw):
            line = raw[i]
            i += 1
            s = line.strip()
            if not s:
                continue

            # block comments
            if s.startswith("/*"):
                while "*/" not in s:
                    if i >= len(raw):
                        break
                    s = raw[i]
                    i += 1
                continue
            if s.startswith("//"):
                continue

            # preprocessor
            if s.startswith("#"):
                parts = s[1:].strip().split(None, 1)
                directive = parts[0] if parts else ""
                rest = parts[1] if len(parts) > 1 else ""
                if directive == "define":
                    name = rest.split(None, 1)[0]
                    if guard is not None and name == guard:
                        continue
                    if "(" in name:
                        raise TranspileError("function-like macros not supported: %s" % s)
                    value = rest[len(name):].strip()
                    emit("const %s = %s;" % (name, js_number(value)))
                    defines.append(name)
                elif directive == "ifndef":
                    if guard is None and rest.endswith("_H"):
                        guard = rest
                    else:
                        cond.append({"name": rest, "then": False, "active": False, "taken": False})
                elif directive == "ifdef":
                    cond.append({"name": rest, "then": True, "active": rest == "JS_BUILD", "taken": True})
                elif directive == "else":
                    if cond:
                        top = cond[-1]
                        top["active"] = not top["active"]
                elif directive == "endif":
                    if cond:
                        cond.pop()
                    elif guard is not None:
                        guard = None
                elif directive in ("include", "pragma", "error", "undef"):
                    continue
                else:
                    raise TranspileError("unsupported directive: %s" % s)
                continue

            skip = any(not frame["active"] for frame in cond)
            if skip:
                continue

            if s.startswith("typedef ") or s.startswith("extern "):
                continue
            if PROTO_RE.match(s) and "(" in s:
                continue

            # array declaration, possibly spanning lines
            m = DECL_RE.match(s)
            if m:
                ctype, name, size, init = m.group(1), m.group(2), m.group(3), m.group(4)
                if init is not None:
                    body = init
                    while "}" not in body:
                        if i >= len(raw):
                            raise TranspileError("unterminated array initialiser for %s" % name)
                        body += " " + raw[i].strip()
                        i += 1
                    body = body[: body.rindex("}")]
                    values = [v.strip() for v in body[1:].replace("\n", " ").split(",") if v.strip()]
                    vals = ", ".join(js_number(fix_stmt(v)) for v in values)
                    emit("const %s = new %s([%s]);" % (name, array_ctor(ctype, name), vals))
                else:
                    emit("let %s = new %s(%s);" % (name, array_ctor(ctype, name), size))
                continue

            m = SCALAR_DECL_RE.match(s)
            if m and not s.endswith(")"):
                ctype, name, init = m.group(1), m.group(2), m.group(3)
                base = ctype.replace("const", "").replace("static", "").strip()
                if base in SCALAR_TYPES:
                    if init is None:
                        emit("let %s = 0;" % name)
                    else:
                        emit("let %s = %s;" % (name, fix_stmt(init)))
                    continue

            m = None if re.match(r"^(if|else|while|for|return|switch|do|break|continue)\b", s) else FUNC_RE.match(s)
            if m:
                args = m.group(2).strip()
                args = strip_casts(args)
                args = ", ".join(a.strip().split()[-1].replace("*", "").strip()
                                 for a in args.split(",") if a.strip() and a.strip() != "void")
                emit("function %s(%s) {" % (m.group(1), args))
                exports.append(m.group(1))
                continue

            if s == "}" or s == "};":
                emit("}")
                continue

            # Anything that still looks like a declaration is a dialect violation:
            # fail loudly rather than emit C into a JS file.
            if re.match(r"^(?:static\s+|const\s+)*(?:u8|i8|u16|i16|u32|i32|int|char|"
                        r"unsigned|signed|long|short|void)\b", s) and "(" not in s:
                raise TranspileError("%s: unsupported declaration %r" % (Path(path).name, s))

            if s.startswith("return") or s.startswith("if") or s.startswith("while") \
               or s.startswith("for") or s.startswith("else") or s.startswith("break") \
               or s.startswith("continue"):
                emit(fix_stmt(s))
                continue

            emit(fix_stmt(s))

    # Export everything the module defines plus the core's live globals.
    globals_names = ["SK_FB", "SK_W", "SK_H", "SK_ROWB", "SK_FBB", "SK_DEV", "SK_SCREEN",
                     "SK_CURSOR", "SK_SUB", "SK_SELWORD", "SK_TICK", "SK_QUIT"]
    export_names = []
    for n in [e for e in exports if not e.startswith("_")] + globals_names + defines:
        if n not in export_names:
            export_names.append(n)

    header = [
        "/* GENERATED by calc/tools/c2js.py from calc/core/*.c — do not edit.",
        "   Same source that sdcc builds for the TI-83/85/90 and gcc4ti builds for the",
        "   TI-89/92. Keep calc/core/*.c as the single source of truth. */",
        "",
    ]
    footer = ["", "export { %s };" % ", ".join(export_names), ""]
    return "\n".join(header + out + footer)


def main(argv):
    out_path = None
    args = []
    i = 1
    while i < len(argv):
        if argv[i] == "--out" and i + 1 < len(argv):
            out_path = argv[i + 1]
            i += 2
            continue
        args.append(argv[i])
        i += 1
    if not args:
        sys.stderr.write("usage: c2js.py core/*.c --out js/calc-core.js\n")
        return 2
    text = transpile(args)
    if out_path:
        Path(out_path).write_text(text)
        print("wrote %s (%d bytes)" % (out_path, len(text)))
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
