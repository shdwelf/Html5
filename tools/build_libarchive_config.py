#!/usr/bin/env python3
"""Generate libarchive's config.h without autotools.

libarchive's git repo ships build/cmake/config.h.in with 429 #cmakedefine
features, but no configure script (that needs autoconf, which cannot be
bootstrapped here: autoconf/automake/libtool ship no generated configure on
GitHub, and m4 alone is not enough).

So this does what configure would do, directly: for each feature, run the
matching compile or link test with the system compiler and emit #define or
/* #undef */. Anything ambiguous is left undefined, which libarchive treats as
"feature absent" and degrades around.
"""
import os
import re
import subprocess
import sys
import tempfile

TEMPLATE = "/tmp/dep-libarchive/build/cmake/config.h.in"
OUT = "/tmp/dep-libarchive/generated-config.h"

cache = {}


def run(src, extra_ld=""):
    """Compile+link a probe. True if it succeeds."""
    key = (src, extra_ld)
    if key in cache:
        return cache[key]
    with tempfile.NamedTemporaryFile("w", suffix=".c", delete=False) as fh:
        fh.write(src)
        path = fh.name
    try:
        p = subprocess.run(
            ["gcc", "-w", "-o", "/dev/null", path] + extra_ld.split(),
            capture_output=True, timeout=30)
        ok = p.returncode == 0
    except Exception:
        ok = False
    finally:
        os.unlink(path)
    cache[key] = ok
    return ok


HDR_HINTS = {
    "ACL": "sys/acl.h", "ATTR": "attr/xattr.h", "BZLIB": "bzlib.h",
    "LZMA": "lzma.h", "ZSTD": "zstd.h", "OPENSSL": "openssl/evp.h",
    "ZLIB": "zlib.h", "LIBXML": "libxml/xmlreader.h",
    "EXPAT": "expat.h", "SQLITE3": "sqlite3.h", "E2P": "e2p/e2p.h",
    "EXT2FS": "ext2fs/ext2_fs.h", "ICONV": "iconv.h",
}


def header_test(name):
    """HAVE_<X>_H -> #include <<x>.h> ; special-case the odd ones."""
    base = name[:-2] if name.endswith("_H") else name
    if base.startswith("HAVE_"):          # the prefix must go too
        base = base[len("HAVE_"):]
    dotted = base.lower().replace("__", "/")
    cand = "%s.h" % dotted
    if name.startswith("HAVE_MACHINE_"):
        cand = "machine/" + name[len("HAVE_MACHINE_"):-2].lower() + ".h"
    if name.startswith("HAVE_SYS_"):
        cand = "sys/" + name[len("HAVE_SYS_"):-2].lower() + ".h"
    if name.startswith("HAVE_LINUX_"):
        cand = "linux/" + name[len("HAVE_LINUX_"):-2].lower() + ".h"
    if name.startswith("HAVE_NETINET_"):
        cand = "netinet/" + name[len("HAVE_NETINET_"):-2].lower() + ".h"
    if name.startswith("HAVE_NET_"):
        cand = "net/" + name[len("HAVE_NET_"):-2].lower() + ".h"
    if name.startswith("HAVE_ARPA_"):
        cand = "arpa/" + name[len("HAVE_ARPA_"):-2].lower() + ".h"
    if name.startswith("HAVE_LINUX_FS"):
        cand = "linux/fs.h"
    return run('#include <%s>\nint main(void){return 0;}\n' % cand)


def func_test(fn):
    """check_function_exists equivalent: declare extern, call, link."""
    return run('extern int %s();\nint main(void){%s();return 0;}\n' % (fn, fn))


def type_test(ty):
    return run('#include <sys/types.h>\n#include <stdint.h>\n'
               '#include <stddef.h>\n#include <stdio.h>\n'
               'int main(void){%s x; (void)x; return 0;}\n' % ty)


DECL_HDRS = ("#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n"
             "#include <unistd.h>\n#include <errno.h>\n#include <stdint.h>\n"
             "#include <limits.h>\n#include <sys/types.h>\n#include <stddef.h>\n")


def decl_test(sym):
    """HAVE_DECL_<SYM>: is the symbol declared by the usual headers?

    Must work for macro constants (UINT64_MAX) as well as variables (optarg),
    so evaluate in a constant-friendly context instead of taking an address --
    &UINT64_MAX never compiles, and every HAVE_DECL_*_MAX probe would report
    the feature absent.
    """
    hdrs = DECL_HDRS
    for k, v in HDR_HINTS.items():
        if k in sym:
            hdrs += "#include <%s>\n" % v
    return run(hdrs +
               'int main(void){long long x=(long long)(%s);(void)x;return 0;}\n'
               % sym)


def struct_test(name):
    ty = name[len("HAVE_STRUCT_"):].lower()
    return run('#include <sys/types.h>\n#include <sys/stat.h>\n'
               '#include <sys/statvfs.h>\n'
               'int main(void){struct %s x; (void)x; return 0;}\n' % ty)


def sizeof_test(name):
    ty = name[len("SIZEOF_"):].lower().replace("_", " ")
    if ty.startswith("unsigned "):
        pass
    ty = {"wchar t": "wchar_t", "unsigned short": "unsigned short",
          "unsigned int": "unsigned int", "unsigned long": "unsigned long",
          "long long": "long long", "unsigned long long": "unsigned long long",
          "int": "int", "long": "long", "short": "short",
          "size t": "size_t", "off t": "off_t", "pid t": "pid_t",
          "time t": "time_t", "wchar": "wchar_t"}.get(ty)
    if not ty:
        return None
    return run('#include <sys/types.h>\n#include <stddef.h>\n'
               '#include <stdio.h>\n#include <wchar.h>\n'
               'int a[(int)sizeof(%s) > 0 ? 1 : -1];\nint main(void){return 0;}\n' % ty)


# --- @VAR@ substitutions ----------------------------------------------------
# The template is shared with CMake, so it carries @VAR@ placeholders as well as
# #cmakedefine lines. configure would fill these; we compute them directly.

def sizeof_code(macro, ctype):
    """Emit '#define SIZEOF_X n' using a real compile, or nothing."""
    probe = ("#include <sys/types.h>\n#include <stddef.h>\n#include <wchar.h>\n"
             "int a[(int)sizeof(%s) - 0];\nint main(void){return (int)sizeof(%s);}\n"
             % (ctype, ctype))
    n = None
    with tempfile.NamedTemporaryFile("w", suffix=".c", delete=False) as fh:
        fh.write(probe)
        path = fh.name
    try:
        import subprocess as _sp
        r = _sp.run(["gcc", "-w", "-o", "/tmp/.szprobe", path],
                    capture_output=True, timeout=30)
        if r.returncode == 0:
            n = _sp.run(["/tmp/.szprobe"], capture_output=True).returncode
    except Exception:
        n = None
    finally:
        os.unlink(path)
    return "#define %s %d" % (macro, n) if n else "/* %s unknown */" % macro


SIZEOF_MAP = {
    "SIZEOF_SHORT_CODE": ("SIZEOF_SHORT", "short"),
    "SIZEOF_INT_CODE": ("SIZEOF_INT", "int"),
    "SIZEOF_LONG_CODE": ("SIZEOF_LONG", "long"),
    "SIZEOF_LONG_LONG_CODE": ("SIZEOF_LONG_LONG", "long long"),
    "SIZEOF_UNSIGNED_SHORT_CODE": ("SIZEOF_UNSIGNED_SHORT", "unsigned short"),
    "SIZEOF_UNSIGNED_CODE": ("SIZEOF_UNSIGNED", "unsigned"),
    "SIZEOF_UNSIGNED_LONG_CODE": ("SIZEOF_UNSIGNED_LONG", "unsigned long"),
    "SIZEOF_UNSIGNED_LONG_LONG_CODE": ("SIZEOF_UNSIGNED_LONG_LONG",
                                       "unsigned long long"),
}

# Types glibc provides natively: AC_TYPE_* style placeholders substitute empty.
EMPTY_VARS = {
    "const", "gid_t", "id_t", "intptr_t", "mode_t", "off_t", "pid_t",
    "size_t", "ssize_t", "uid_t", "uintptr_t", "ICONV_CONST",
    "_LARGE_FILES", "WINVER", "NTDDI_VERSION", "_WIN32_WINNT",
    "LIBACL_PKGCONFIG_VERSION", "LIBATTR_PKGCONFIG_VERSION",
    "LIBRICHACL_PKGCONFIG_VERSION",
}


def libarchive_version():
    """build/version holds e.g. 3009000 -> 3.9.0 (three digits per field)."""
    try:
        n = open("/tmp/dep-libarchive/build/version").read().strip()
        if n.isdigit() and len(n) == 7:
            return "%d.%d.%d" % (int(n[0]), int(n[1:4]), int(n[4:7]))
    except OSError:
        pass
    try:
        txt = open("/tmp/dep-libarchive/CMakeLists.txt").read()
        m = re.search(r"set\(VERSION\s+\"?([0-9][0-9a-z.]*)", txt)
        if m:
            return m.group(1)
        m = re.search(r"VERSION\s+([0-9]+\.[0-9]+\.[0-9]+)", txt)
        if m:
            return m.group(1)
    except OSError:
        pass
    return "3.7.7"


def substitute(line):
    """Resolve @VAR@ placeholders. Returns the line unchanged if none match."""
    for var, (macro, ctype) in SIZEOF_MAP.items():
        if "@" + var + "@" in line:
            return sizeof_code(macro, ctype)
    if "@SIZEOF_WCHAR_T@" in line:
        return sizeof_code("SIZEOF_WCHAR_T", "wchar_t")
    for var in EMPTY_VARS:
        line = line.replace("@" + var + "@", "")
    v = libarchive_version()
    try:
        num = open("/tmp/dep-libarchive/build/version").read().strip()
    except OSError:
        num = "3009000"
    for var in ("LIBARCHIVE_VERSION_STRING", "BSDTAR_VERSION_STRING",
                "BSDCPIO_VERSION_STRING", "BSDCAT_VERSION_STRING",
                "BSDUNZIP_VERSION_STRING", "VERSION"):
        line = line.replace("@" + var + "@", v)
    line = line.replace("@LIBARCHIVE_VERSION_NUMBER@", num)
    line = line.replace("@_FILE_OFFSET_BITS@", "64")
    return line


def decide(name):
    """Return True/False, or None when the probe is not decidable."""
    if name.startswith("HAVE_DECL_"):
        return decl_test(name[len("HAVE_DECL_"):])
    if name.startswith("HAVE_STRUCT_"):
        return struct_test(name)
    if name.startswith("SIZEOF_"):
        r = sizeof_test(name)
        return r
    if name.endswith("_H"):
        return header_test(name)
    if name.startswith("HAVE_"):
        body = name[len("HAVE_"):]
        low = body.lower()
        if low.endswith("_t") and not body.startswith("HAVE"):
            return type_test(low)
        # types like HAVE_INT64_T / HAVE_UINTMAX_T / HAVE_PID_T
        if re.fullmatch(r"(U?INT(MAX|PTR|8|16|32|64)_T|PID_T|OFF_T|SIZE_T|"
                        r"TIME_T|WCHAR_T|UID_T|GID_T|MODE_T|INTMAX_T|"
                        r"UINTMAX_T|SIZEOF_[A-Z_]+)", body):
            return type_test(low)
        if re.fullmatch(r"[A-Z0-9_]+", body) and not any(
                c.isdigit() for c in body[:1]):
            return func_test(low)
        return None
    return None


def main():
    lines = open(TEMPLATE).read().splitlines()
    out, stats = [], {"defined": 0, "undefined": 0, "skipped": 0}
    for raw in lines:
        ln = substitute(raw)
        m = re.match(r"^#cmakedefine\s+(\w+)(?:\s+(.*))?$", ln)
        if not m:
            m2 = re.match(r"^#cmakedefine01\s+(\w+)$", ln)
            if m2:
                r = decide(m2.group(1))
                out.append("#define %s %d" % (m2.group(1), 1 if r else 0))
                stats["defined" if r else "undefined"] += 1
            else:
                out.append(ln)
            continue
        name, val = m.group(1), m.group(2)
        if name.endswith("VERSION_STRING"):
            out.append('#define %s "%s"' % (name, libarchive_version()))
            stats["defined"] += 1
            continue
        if name.endswith("VERSION_NUMBER"):
            try:
                num = open("/tmp/dep-libarchive/build/version").read().strip()
            except OSError:
                num = "3009000"
            out.append("#define %s %s" % (name, num))
            stats["defined"] += 1
            continue
        r = decide(name)
        if r is None:
            out.append("/* #undef %s */" % name)
            stats["skipped"] += 1
        elif r:
            out.append("#define %s %s" % (name, val if val else "1"))
            stats["defined"] += 1
        else:
            out.append("/* #undef %s */" % name)
            stats["undefined"] += 1
    open(OUT, "w").write("\n".join(out) + "\n")
    print("wrote %s" % OUT)
    print("  defined %d, absent %d, undecidable %d (of %d features)"
          % (stats["defined"], stats["undefined"], stats["skipped"],
             stats["defined"] + stats["undefined"] + stats["skipped"]))
    for probe in ("HAVE_ZLIB_H", "HAVE_STDINT_H", "HAVE_UNISTD_H",
                  "HAVE_OPEN", "HAVE_STAT", "HAVE_INT64_T"):
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
