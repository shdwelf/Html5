#!/usr/bin/env python3
"""Emit a minimal JVM class file, without javac.

Why this exists: this sandbox has no Java runtime at all -- no javac, no java,
no libjvm.so anywhere on the filesystem. That made it impossible to verify the
System.in / InputStream.read() support just added to cfjvm, and "it compiles"
is not verification of an interpreter change.

So this assembles the one class needed to exercise that path: read one byte
from standard input, append it to a StringBuilder, print it. Every opcode used
is chosen to avoid anything the interpreter might not implement -- no swap, no
exception table, no arithmetic.

Only what the probe needs is supported. It is deliberately not a general
assembler.
"""

import struct
import sys

MAGIC = 0xCAFEBABE
MAJOR = 50          # Java 6 class file
MINOR = 0

# Opcode bytes used by the probe.
NEW = 0xBB
DUP = 0x59
INVOKESPECIAL = 0xB7
GETSTATIC = 0xB2
INVOKEVIRTUAL = 0xB6
RETURN = 0xB1


class Pool:
    """Constant pool with dedup, indexed from 1 as the JVM requires."""

    def __init__(self):
        self._entries = []
        self._index = {}

    def _add(self, key, payload):
        if key in self._index:
            return self._index[key]
        self._entries.append(payload)
        # The index of the entry just appended is its 1-based position. The "+1"
        # that constant_pool_count needs belongs in dump(), not here: putting it
        # here inflated every returned index by one, so a NameAndType ended up
        # pointing at itself.
        n = len(self._entries)
        self._index[key] = n
        return n

    def utf8(self, s):
        b = s.encode("utf-8")
        return self._add(("utf8", s), bytes([1]) + struct.pack(">H", len(b)) + b)

    def cls(self, name):
        return self._add(("class", name), bytes([7]) + struct.pack(">H", self.utf8(name)))

    def nat(self, name, desc):
        return self._add(("nat", name, desc),
                         bytes([12]) + struct.pack(">H", self.utf8(name)) + struct.pack(">H", self.utf8(desc)))

    def fieldref(self, cls, name, desc):
        return self._add(("fieldref", cls, name, desc),
                         bytes([9]) + struct.pack(">H", self.cls(cls)) + struct.pack(">H", self.nat(name, desc)))

    def methodref(self, cls, name, desc):
        return self._add(("methodref", cls, name, desc),
                         bytes([10]) + struct.pack(">H", self.cls(cls)) + struct.pack(">H", self.nat(name, desc)))

    def dump(self):
        return struct.pack(">H", len(self._entries) + 1) + b"".join(self._entries)


def probe_class():
    """main: read one byte from stdin and echo it."""
    cp = Pool()

    this_c = cp.cls("StdinProbe")
    super_c = cp.cls("java/lang/Object")

    f_in = cp.fieldref("java/lang/System", "in", "Ljava/io/InputStream;")
    f_out = cp.fieldref("java/lang/System", "out", "Ljava/io/PrintStream;")
    m_read = cp.methodref("java/io/InputStream", "read", "()I")
    m_sbinit = cp.methodref("java/lang/StringBuilder", "<init>", "()V")
    m_append = cp.methodref("java/lang/StringBuilder", "append", "(C)Ljava/lang/StringBuilder;")
    m_tostr = cp.methodref("java/lang/StringBuilder", "toString", "()Ljava/lang/String;")
    m_print = cp.methodref("java/io/PrintStream", "println", "(Ljava/lang/String;)V")

    code = b"".join([
        bytes([GETSTATIC]) + struct.pack(">H", f_out),        #  0 [PrintStream]
        bytes([NEW]) + struct.pack(">H", cp.cls("java/lang/StringBuilder")),
        bytes([DUP]),
        bytes([INVOKESPECIAL]) + struct.pack(">H", m_sbinit), # 10 [PS, SB]
        bytes([GETSTATIC]) + struct.pack(">H", f_in),         # 13 [PS, SB, IS]
        bytes([INVOKEVIRTUAL]) + struct.pack(">H", m_read),   # 16 [PS, SB, int]
        bytes([INVOKEVIRTUAL]) + struct.pack(">H", m_append), # 19 [PS, SB]
        bytes([INVOKEVIRTUAL]) + struct.pack(">H", m_tostr),  # 22 [PS, String]
        bytes([INVOKEVIRTUAL]) + struct.pack(">H", m_print),  # 25 []
        bytes([RETURN]),                                      # 26
    ])

    name_main = cp.utf8("main")
    desc_main = cp.utf8("([Ljava/lang/String;)V")
    name_code = cp.utf8("Code")

    code_attr = (struct.pack(">H", name_code)
                 + struct.pack(">I", 2 + 2 + 4 + len(code) + 2 + 2)
                 + struct.pack(">HHI", 4, 1, len(code))
                 + code
                 + struct.pack(">HH", 0, 0))          # no exception table, no attrs

    method = (struct.pack(">HHH", 0x0009, name_main, desc_main)   # public static
              + struct.pack(">H", 1) + code_attr)

    return (struct.pack(">IHH", MAGIC, MINOR, MAJOR)
            + cp.dump()
            + struct.pack(">HHHHH", 0x0021, this_c, super_c, 0, 0)  # public super, no ifaces/fields
            + struct.pack(">H", 1) + method
            + struct.pack(">H", 0))                                  # no class attrs


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "StdinProbe.class"
    data = probe_class()
    with open(out, "wb") as f:
        f.write(data)
    print(f"wrote {out} ({len(data)} bytes)")
