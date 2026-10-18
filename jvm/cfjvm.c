/*
 * cfjvm - a small Java class-file interpreter.
 *
 * WHY THIS EXISTS
 * The xPort Pro fit analysis (docs/xport-pro-synchronet-fit.md) concluded that
 * wiki.in.a.jar's xrays.jar fits in flash 33 times over and still cannot run,
 * because there is no JVM for ColdFire uClinux. That conclusion was reached by
 * elimination and deserves to be tested rather than asserted, so this is a
 * from-scratch interpreter small enough to actually reason about, written
 * against the real .class files that javac produces.
 *
 * WHAT IT IS
 * An interpreter for the subset of the JVM instruction set that javac emits
 * for ordinary sequential code, plus just enough of a class library
 * (Object/String/StringBuilder/System/PrintStream/Math/Integer) to make
 * "compute something and print it" work end to end.
 *
 * WHAT IT IS NOT
 * Not a conformant JVM. No verifier, no GC, no threads, no exceptions beyond
 * an immediate abort, no floating point, no JIT, no JNI, no class loading from
 * a jar, and no support for invokedynamic (so no lambdas or string switches
 * compiled by modern javac - the tests use JDK 8 with -target 1.8, and
 * string concatenation there still lowers to StringBuilder). Anyone calling
 * this a drop-in replacement for Kaffe would be wrong.
 *
 * WHY IT MIGHT STILL MATTER FOR COLDFIRE
 * The interesting constraints on the xPort Pro are not instruction coverage,
 * they are: no MMU (so no demand paging, no copy-on-write, and a wild pointer
 * takes the whole system down), vfork-only (so no fork, which rules out the
 * Synchronet process model entirely), and 4 MiB of writable JFFS2. This
 * interpreter is single-threaded, allocates only forward from one heap, never
 * forks, and touches no shared libraries - which are exactly the properties a
 * uClinux/bFLT port needs. It is a seed and a measuring stick, not a product.
 *
 * PORTING
 * Everything platform-specific is behind cfjvm_port.h. The uClinux notes in
 * that header are the actual porting contract.
 */

#include "cfjvm_port.h"

#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CF_MAGIC 0xCAFEBABEu

/* ------------------------------ constant pool ---------------------------- */

enum {
  CP_UTF8 = 1, CP_INTEGER = 3, CP_FLOAT = 4, CP_LONG = 5, CP_DOUBLE = 6,
  CP_CLASS = 7, CP_STRING = 8, CP_FIELDREF = 9, CP_METHODREF = 10,
  CP_IFMETHODREF = 11, CP_NAMEANDTYPE = 12, CP_METHODHANDLE = 15,
  CP_METHODTYPE = 16, CP_DYNAMIC = 17, CP_INVOKEDYNAMIC = 18,
  CP_MODULE = 19, CP_PACKAGE = 20,
};

typedef struct {
  uint8_t tag;
  union {
    struct { char *bytes; uint16_t len; } utf8;
    int32_t integer;
    float float_;
    int64_t long_;
    double double_;
    uint16_t class_idx;         /* CLASS, STRING */
    struct { uint16_t class_idx, nat_idx; } ref; /* *REF */
    struct { uint16_t name_idx, desc_idx; } nat;
  } u;
} Cp;

typedef struct {
  uint16_t access, name_idx, desc_idx;
  /* Code attribute, if any */
  uint8_t *code;
  uint32_t code_len;
  uint16_t max_stack, max_locals;
  /* ConstantValue, if any */
  int has_const_value;
  uint16_t const_value_idx;
} Member;

typedef struct ClassFile {
  uint16_t cp_count;
  Cp *cp;
  uint16_t this_class, super_class;
  uint16_t n_fields, n_methods;
  Member *fields, *methods;
  struct ClassFile *super;
  int field_count_total;  /* including inherited */
} ClassFile;

/* --------------------------------- values -------------------------------- */

typedef struct Obj Obj;

typedef union {
  int32_t i;
  int64_t l;
  Obj *ref;
  float f;
  double d;
} Value;

enum { KIND_INSTANCE, KIND_ARRAY, KIND_STRING, KIND_SB };

struct Obj {
  int kind;
  const char *class_name;   /* not owned */
  int n_fields;
  Value *fields;            /* KIND_INSTANCE */
  int elem_type;            /* KIND_ARRAY: 'I','J','B','C','S','L','F','D','Z' */
  int length;               /* KIND_ARRAY */
  void *data;               /* KIND_ARRAY */
  char *str;                /* KIND_STRING / KIND_SB */
  int str_len, str_cap;
};

/* ------------------------------ error handling --------------------------- */

static void cfj_fail(const char *fmt, ...) {
  va_list ap;
  va_start(ap, fmt);
  cfj_vfprintf(stderr, fmt, ap);
  va_end(ap);
  cfj_fputc('\n', stderr);
  cfj_exit(2);
}

static void *xmalloc(size_t n) {
  void *p = cfj_alloc(n ? n : 1);
  if (!p) cfj_fail("out of memory allocating %lu bytes", (unsigned long)n);
  return p;
}

static void *xcalloc(size_t n, size_t sz) {
  void *p = xmalloc(n * sz);
  memset(p, 0, n * sz);
  return p;
}

/* ------------------------------- class reader ---------------------------- */

typedef struct {
  const uint8_t *p, *end;
} Rd;

static uint8_t u1(Rd *r) {
  if (r->p + 1 > r->end) cfj_fail("truncated class file");
  return *r->p++;
}
static uint16_t u2(Rd *r) {
  uint16_t v = (uint16_t)((u1(r) << 8) | u1(r));
  return v;
}
static uint32_t u4(Rd *r) {
  uint32_t v = ((uint32_t)u1(r) << 24) | ((uint32_t)u1(r) << 16) |
               ((uint32_t)u1(r) << 8) | (uint32_t)u1(r);
  return v;
}
static uint64_t u8(Rd *r) {
  uint64_t hi = u4(r), lo = u4(r);
  return (hi << 32) | lo;
}

static const char *cp_utf8(ClassFile *c, uint16_t idx) {
  if (idx == 0 || idx >= c->cp_count || c->cp[idx].tag != CP_UTF8)
    cfj_fail("constant pool index %u is not a Utf8 entry", idx);
  /* Entries are NUL-terminated on load so callers can treat them as C strings. */
  return c->cp[idx].u.utf8.bytes;
}

static const char *cp_class_name(ClassFile *c, uint16_t idx) {
  if (idx == 0 || idx >= c->cp_count || c->cp[idx].tag != CP_CLASS)
    cfj_fail("constant pool index %u is not a Class entry", idx);
  return cp_utf8(c, c->cp[idx].u.class_idx);
}

static ClassFile *parse_class(const uint8_t *buf, size_t len);

static ClassFile *parse_class(const uint8_t *buf, size_t len) {
  Rd r = { buf, buf + len };
  if (u4(&r) != CF_MAGIC) cfj_fail("bad magic; not a .class file");
  u2(&r); /* minor */
  uint16_t major = u2(&r);
  if (major < 45 || major > 52)
    cfj_fail("unsupported class file version %u (this interpreter targets 45..52)", major);

  ClassFile *c = xcalloc(1, sizeof(ClassFile));
  c->cp_count = u2(&r);
  c->cp = xcalloc(c->cp_count, sizeof(Cp));

  for (uint16_t i = 1; i < c->cp_count; i++) {
    Cp *e = &c->cp[i];
    e->tag = u1(&r);
    switch (e->tag) {
      case CP_UTF8: {
        uint16_t n = u2(&r);
        if (r.p + n > r.end) cfj_fail("Utf8 entry runs past end of file");
        char *s = xmalloc((size_t)n + 1);
        memcpy(s, r.p, n);
        s[n] = '\0';
        r.p += n;
        e->u.utf8.bytes = s;
        e->u.utf8.len = n;
        break;
      }
      case CP_INTEGER: e->u.integer = (int32_t)u4(&r); break;
      case CP_FLOAT: { uint32_t b = u4(&r); memcpy(&e->u.float_, &b, 4); break; }
      case CP_LONG: e->u.long_ = (int64_t)u8(&r); i++; break;   /* occupies two slots */
      case CP_DOUBLE: { uint64_t b = u8(&r); memcpy(&e->u.double_, &b, 8); i++; break; }
      case CP_CLASS: case CP_STRING: e->u.class_idx = u2(&r); break;
      case CP_FIELDREF: case CP_METHODREF: case CP_IFMETHODREF:
        e->u.ref.class_idx = u2(&r);
        e->u.ref.nat_idx = u2(&r);
        break;
      case CP_NAMEANDTYPE:
        e->u.nat.name_idx = u2(&r);
        e->u.nat.desc_idx = u2(&r);
        break;
      case CP_METHODHANDLE: u1(&r); u2(&r); break;
      case CP_METHODTYPE: u2(&r); break;
      case CP_DYNAMIC: case CP_INVOKEDYNAMIC: u2(&r); u2(&r); break;
      case CP_MODULE: case CP_PACKAGE: u2(&r); break;
      default: cfj_fail("unknown constant pool tag %u at index %u", e->tag, i);
    }
  }

  u2(&r); /* access flags */
  c->this_class = u2(&r);
  c->super_class = u2(&r);

  uint16_t n_if = u2(&r);
  for (uint16_t i = 0; i < n_if; i++) u2(&r);

  c->n_fields = u2(&r);
  c->fields = xcalloc(c->n_fields ? c->n_fields : 1, sizeof(Member));
  for (uint16_t i = 0; i < c->n_fields; i++) {
    Member *m = &c->fields[i];
    m->access = u2(&r);
    m->name_idx = u2(&r);
    m->desc_idx = u2(&r);
    uint16_t na = u2(&r);
    for (uint16_t k = 0; k < na; k++) {
      uint16_t an = u2(&r);
      uint32_t al = u4(&r);
      if (r.p + al > r.end) cfj_fail("field attribute past end of file");
      const char *an_name = cp_utf8(c, an);
      if (strcmp(an_name, "ConstantValue") == 0 && al >= 2) {
        Rd a = { r.p, r.p + al };
        m->has_const_value = 1;
        m->const_value_idx = u2(&a);
      }
      r.p += al;
    }
  }

  c->n_methods = u2(&r);
  c->methods = xcalloc(c->n_methods ? c->n_methods : 1, sizeof(Member));
  for (uint16_t i = 0; i < c->n_methods; i++) {
    Member *m = &c->methods[i];
    m->access = u2(&r);
    m->name_idx = u2(&r);
    m->desc_idx = u2(&r);
    uint16_t na = u2(&r);
    for (uint16_t k = 0; k < na; k++) {
      uint16_t an = u2(&r);
      uint32_t al = u4(&r);
      if (r.p + al > r.end) cfj_fail("method attribute past end of file");
      if (strcmp(cp_utf8(c, an), "Code") == 0) {
        Rd a = { r.p, r.p + al };
        m->max_stack = u2(&a);
        m->max_locals = u2(&a);
        m->code_len = u4(&a);
        if (a.p + m->code_len > a.end) cfj_fail("code array past end of attribute");
        m->code = xmalloc(m->code_len);
        memcpy(m->code, a.p, m->code_len);
        a.p += m->code_len;
      }
      r.p += al;
    }
  }
  /* Remaining class attributes (SourceFile, InnerClasses, ...) are irrelevant. */
  return c;
}

/* --------------------------- class registry ------------------------------ */

#define MAX_CLASSES 64
static ClassFile *g_classes[MAX_CLASSES];
static int g_n_classes;

static ClassFile *find_class(const char *name) {
  for (int i = 0; i < g_n_classes; i++)
    if (strcmp(cp_class_name(g_classes[i], g_classes[i]->this_class), name) == 0)
      return g_classes[i];
  return NULL;
}

/* Built-in classes have no .class file; recognise them by name. */
static int is_builtin(const char *n) {
  static const char *b[] = {
    "java/lang/Object", "java/lang/String", "java/lang/StringBuilder",
    "java/lang/System", "java/io/PrintStream", "java/io/InputStream",
    "java/lang/Math",
    "java/lang/Integer", "java/lang/Long", "java/lang/Class", NULL,
  };
  for (int i = 0; b[i]; i++) if (strcmp(b[i], n) == 0) return 1;
  return 0;
}

static void register_class(ClassFile *c) {
  if (g_n_classes >= MAX_CLASSES) cfj_fail("too many classes (limit %d)", MAX_CLASSES);
  g_classes[g_n_classes++] = c;
  const char *super = c->super_class ? cp_class_name(c, c->super_class) : NULL;
  if (super && !is_builtin(super)) {
    c->super = find_class(super);
    if (!c->super) cfj_fail("superclass %s was not supplied on the command line", super);
  }
}

/* ------------------------------ objects ---------------------------------- */

static Obj *new_obj(int kind, const char *class_name) {
  Obj *o = xcalloc(1, sizeof(Obj));
  o->kind = kind;
  o->class_name = class_name;
  return o;
}

static Obj *new_string(const char *s, int len) {
  Obj *o = new_obj(KIND_STRING, "java/lang/String");
  o->str = xmalloc((size_t)len + 1);
  memcpy(o->str, s, (size_t)len);
  o->str[len] = '\0';
  o->str_len = len;
  return o;
}

static Obj *new_stringz(const char *s) { return new_string(s, (int)strlen(s)); }

static void sb_init(Obj *o, int cap) {
  o->kind = KIND_SB;
  o->class_name = "java/lang/StringBuilder";
  o->str_cap = cap > 16 ? cap : 16;
  o->str = xmalloc((size_t)o->str_cap);
  o->str[0] = '\0';
  o->str_len = 0;
}

static void sb_append(Obj *o, const char *s, int len) {
  if (o->str_len + len + 1 > o->str_cap) {
    while (o->str_len + len + 1 > o->str_cap) o->str_cap *= 2;
    char *n = xmalloc((size_t)o->str_cap);
    memcpy(n, o->str, (size_t)o->str_len + 1);
    cfj_free(o->str);
    o->str = n;
  }
  memcpy(o->str + o->str_len, s, (size_t)len);
  o->str_len += len;
  o->str[o->str_len] = '\0';
}

static int elem_size(char t) {
  switch (t) {
    case 'J': case 'D': return 8;
    case 'I': case 'F': return 4;
    case 'C': case 'S': return 2;
    case 'B': case 'Z': return 1;
    default: return (int)sizeof(void *);
  }
}

static Obj *new_array(char t, int len) {
  if (len < 0) cfj_fail("negative array size %d", len);
  Obj *o = new_obj(KIND_ARRAY, "array");
  o->elem_type = t;
  o->length = len;
  o->data = xcalloc((size_t)len + 1, (size_t)elem_size(t));
  return o;
}

/* --------------------------- instance field layout ----------------------- */

/*
 * Fields are laid out superclass-first, which is what makes an inherited
 * field's slot stable across the hierarchy. Only the instance (non-static)
 * fields count; statics live in the class's own slot table.
 */
static int count_instance_fields(ClassFile *c) {
  int n = 0;
  for (uint16_t i = 0; i < c->n_fields; i++)
    if (!(c->fields[i].access & 0x0008)) n++;
  return n;
}

static int field_slot(ClassFile *owner, Member *m) {
  int base = 0;
  for (ClassFile *p = owner->super; p; p = p->super) base += count_instance_fields(p);
  int k = 0;
  for (uint16_t i = 0; i < owner->n_fields; i++) {
    if (owner->fields[i].access & 0x0008) continue;
    if (&owner->fields[i] == m) return base + k;
    k++;
  }
  cfj_fail("field not found in its own class");
  return -1;
}

static int total_instance_fields(ClassFile *c) {
  int n = count_instance_fields(c);
  for (ClassFile *p = c->super; p; p = p->super) n += count_instance_fields(p);
  return n;
}

/* Find the class that actually declares a named instance field. */
static Member *resolve_field(ClassFile *c, const char *name, ClassFile **owner) {
  for (ClassFile *p = c; p; p = p->super)
    for (uint16_t i = 0; i < p->n_fields; i++)
      if (!(p->fields[i].access & 0x0008) &&
          strcmp(cp_utf8(p, p->fields[i].name_idx), name) == 0) {
        *owner = p;
        return &p->fields[i];
      }
  cfj_fail("instance field %s not found", name);
  return NULL;
}

/* ------------------------------- statics --------------------------------- */

#define MAX_STATICS 128
static struct { ClassFile *cls; Member *m; Value v; } g_statics[MAX_STATICS];
static int g_n_statics;

static Value *static_slot(ClassFile *c, Member *m) {
  for (int i = 0; i < g_n_statics; i++)
    if (g_statics[i].cls == c && g_statics[i].m == m) return &g_statics[i].v;
  if (g_n_statics >= MAX_STATICS) cfj_fail("too many static fields");
  g_statics[g_n_statics].cls = c;
  g_statics[g_n_statics].m = m;
  memset(&g_statics[g_n_statics].v, 0, sizeof(Value));
  /* A static with a ConstantValue attribute is initialised to it. */
  if (m->has_const_value) {
    Cp *cv = &c->cp[m->const_value_idx];
    Value *v = &g_statics[g_n_statics].v;
    switch (cv->tag) {
      case CP_INTEGER: v->i = cv->u.integer; break;
      case CP_LONG: v->l = cv->u.long_; break;
      case CP_STRING: v->ref = new_stringz(cp_utf8(c, cv->u.class_idx)); break;
      case CP_FLOAT: v->f = cv->u.float_; break;
      case CP_DOUBLE: v->d = cv->u.double_; break;
      default: break;
    }
  }
  return &g_statics[g_n_statics++].v;
}

static Member *find_static(ClassFile *c, const char *name) {
  for (ClassFile *p = c; p; p = p->super)
    for (uint16_t i = 0; i < p->n_fields; i++)
      if ((p->fields[i].access & 0x0008) &&
          strcmp(cp_utf8(p, p->fields[i].name_idx), name) == 0)
        return &p->fields[i];
  return NULL;
}

/* --------------------------- descriptor helpers -------------------------- */

/* Number of stack slots consumed by the arguments of a method descriptor. */
static int desc_arg_slots(const char *d) {
  int n = 0;
  const char *p = d + 1;
  while (*p && *p != ')') {
    if (*p == 'L') { while (*p && *p != ';') p++; n++; }
    else if (*p == '[') { /* array: consume to the element type */ }
    else if (*p == 'J' || *p == 'D') n += 2;
    else n++;
    p++;
  }
  return n;
}

static char desc_return(const char *d) {
  const char *p = strrchr(d, ')');
  return p ? p[1] : 'V';
}

/* -------------------------------- natives -------------------------------- */


static int native_method(const char *cls, const char *name, const char *desc,
                         Value *args, int nargs, Value *out) {
  if (!strcmp(cls, "java/lang/Object")) {
    if (!strcmp(name, "<init>")) return 1;
    if (!strcmp(name, "toString")) { out->ref = new_stringz("[object]"); return 1; }
    if (!strcmp(name, "hashCode")) { out->i = (int32_t)(uintptr_t)args[0].ref; return 1; }
    return 0;
  }
  if (!strcmp(cls, "java/lang/StringBuilder")) {
    if (!strcmp(name, "<init>")) {
      Obj *o = args[0].ref;
      if (nargs >= 2 && !strcmp(desc, "(Ljava/lang/String;)V")) {
        sb_init(o, 32);
        Obj *s = args[1].ref;
        if (s && s->kind == KIND_STRING) sb_append(o, s->str, s->str_len);
      } else {
        sb_init(o, 32);
      }
      return 1;
    }
    if (!strcmp(name, "append")) {
      Obj *o = args[0].ref;
      char rt = desc[1];
      char buf[32];
      switch (rt) {
        case 'L': {
          Obj *s = args[1].ref;
          if (s && s->kind == KIND_STRING) sb_append(o, s->str, s->str_len);
          else if (s) sb_append(o, "[object]", 8);
          else sb_append(o, "null", 4);
          break;
        }
        case 'I': snprintf(buf, sizeof buf, "%d", args[1].i); sb_append(o, buf, (int)strlen(buf)); break;
        case 'J': snprintf(buf, sizeof buf, "%lld", (long long)args[1].l); sb_append(o, buf, (int)strlen(buf)); break;
        case 'C': { char c = (char)args[1].i; sb_append(o, &c, 1); break; }
        case 'Z': sb_append(o, args[1].i ? "true" : "false", args[1].i ? 4 : 5); break;
        default: cfj_fail("StringBuilder.append: unsupported descriptor %s", desc);
      }
      out->ref = o;
      return 1;
    }
    if (!strcmp(name, "toString")) {
      Obj *o = args[0].ref;
      out->ref = new_string(o->str ? o->str : "", o->str ? o->str_len : 0);
      return 1;
    }
    if (!strcmp(name, "length")) { out->i = args[0].ref->str_len; return 1; }
    return 0;
  }
  if (!strcmp(cls, "java/lang/String")) {
    if (!strcmp(name, "<init>")) return 1;
    if (!strcmp(name, "length")) { out->i = args[0].ref->str_len; return 1; }
    if (!strcmp(name, "charAt")) {
      int i = args[1].i;
      Obj *s = args[0].ref;
      if (i < 0 || i >= s->str_len) cfj_fail("String.charAt: index %d out of bounds", i);
      out->i = (uint8_t)s->str[i];
      return 1;
    }
    if (!strcmp(name, "isEmpty")) { out->i = args[0].ref->str_len == 0; return 1; }
    if (!strcmp(name, "equals")) {
      Obj *a = args[0].ref, *b = args[1].ref;
      out->i = (a && b && a->str_len == b->str_len && !memcmp(a->str, b->str, (size_t)a->str_len));
      return 1;
    }
    if (!strcmp(name, "valueOf") || !strcmp(name, "toString")) {
      char buf[32];
      const char *p = desc + 1;
      if (*p == 'I') { snprintf(buf, sizeof buf, "%d", args[0].i); out->ref = new_stringz(buf); return 1; }
      if (*p == 'J') { snprintf(buf, sizeof buf, "%lld", (long long)args[0].l); out->ref = new_stringz(buf); return 1; }
      if (*p == 'Z') { out->ref = new_stringz(args[0].i ? "true" : "false"); return 1; }
      if (*p == 'C') { char c = (char)args[0].i; out->ref = new_string(&c, 1); return 1; }
      if (*p == 'L') { out->ref = args[0].ref; return 1; }
      return 0;
    }
    if (!strcmp(name, "concat")) {
      Obj *a = args[0].ref, *b = args[1].ref;
      Obj *o = new_string("", 0);
      sb_append(o, a->str, a->str_len);
      sb_append(o, b->str, b->str_len);
      out->ref = o;
      return 1;
    }
    if (!strcmp(name, "substring")) {
      Obj *s = args[0].ref;
      int from = args[1].i;
      int to = nargs > 2 ? args[2].i : s->str_len;
      if (from < 0 || to > s->str_len || from > to)
        cfj_fail("String.substring: %d..%d out of bounds for length %d", from, to, s->str_len);
      out->ref = new_string(s->str + from, to - from);
      return 1;
    }
    if (!strcmp(name, "toCharArray")) {
      Obj *s = args[0].ref;
      Obj *a = new_array('C', s->str_len);
      for (int i = 0; i < s->str_len; i++) ((uint16_t *)a->data)[i] = (uint8_t)s->str[i];
      out->ref = a;
      return 1;
    }
    return 0;
  }
  if (!strcmp(cls, "java/io/PrintStream")) {
    if (!strcmp(name, "print") || !strcmp(name, "println")) {
      int nl = name[5] == 'l';
      char rt = desc[1];
      if (rt == ')') { if (nl) cfj_fputc('\n', stdout); return 1; }
      char buf[32];
      switch (rt) {
        case 'L': {
          Obj *o = nargs > 1 ? args[1].ref : NULL;
          if (o && o->kind == KIND_STRING) cfj_fwrite(o->str, 1, (size_t)o->str_len, stdout);
          else cfj_fwrite("null", 1, 4, stdout);
          break;
        }
        case 'I': snprintf(buf, sizeof buf, "%d", args[1].i); cfj_fputs(buf, stdout); break;
        case 'J': snprintf(buf, sizeof buf, "%lld", (long long)args[1].l); cfj_fputs(buf, stdout); break;
        case 'C': { char c = (char)args[1].i; cfj_fputc(c, stdout); break; }
        case 'Z': cfj_fputs(args[1].i ? "true" : "false", stdout); break;
        default: cfj_fail("PrintStream.%s: unsupported descriptor %s", name, desc);
      }
      if (nl) cfj_fputc('\n', stdout);
      return 1;
    }
    if (!strcmp(name, "flush")) return 1;
    return 0;
  }
  if (!strcmp(cls, "java/io/InputStream")) {
    /* The only input path this interpreter has. read() returns 0..255, or -1 at
       end of input, exactly as java.io.InputStream.read() does, so a caller can
       loop on -1 rather than on an exception -- which matters here, because
       this interpreter has no exception tables. */
    if (!strcmp(name, "read") && !strcmp(desc, "()I")) {
      int c = cfj_fgetc(stdin);
      out->i = (c == EOF) ? -1 : (c & 0xFF);
      return 1;
    }
    /* Honestly zero: with a blocking single-threaded interpreter there is no
       buffered look-ahead to report. Callers must not rely on it. */
    if (!strcmp(name, "available") && !strcmp(desc, "()I")) { out->i = 0; return 1; }
    if (!strcmp(name, "close")) return 1;
    return 0;
  }
  if (!strcmp(cls, "java/lang/Math")) {
    /* int overloads only. The double forms are deliberately absent: with no
       floating point in this interpreter, implementing Math.sqrt(double) as an
       integer approximation would return a plausible wrong answer instead of a
       loud failure. Absent is better than wrong. */
    if (!strcmp(name, "abs") && !strcmp(desc, "(I)I")) { out->i = args[0].i < 0 ? -args[0].i : args[0].i; return 1; }
    if (!strcmp(name, "max") && !strcmp(desc, "(II)I")) { out->i = args[0].i > args[1].i ? args[0].i : args[1].i; return 1; }
    if (!strcmp(name, "min") && !strcmp(desc, "(II)I")) { out->i = args[0].i < args[1].i ? args[0].i : args[1].i; return 1; }
    return 0;
  }
  if (!strcmp(cls, "java/lang/Long")) {
    if (!strcmp(name, "compare") && !strcmp(desc, "(JJ)I")) {
      int64_t x = args[0].l, y = args[1].l;
      out->i = x < y ? -1 : x > y ? 1 : 0;
      return 1;
    }
    if (!strcmp(name, "toString") && !strcmp(desc, "(J)Ljava/lang/String;")) {
      char buf[32];
      snprintf(buf, sizeof buf, "%lld", (long long)args[0].l);
      out->ref = new_stringz(buf);
      return 1;
    }
    return 0;
  }
  if (!strcmp(cls, "java/lang/Integer")) {
    if (!strcmp(name, "parseInt")) {
      Obj *s = args[0].ref;
      char *endp = NULL;
      char *tmp = xmalloc((size_t)s->str_len + 1);
      memcpy(tmp, s->str, (size_t)s->str_len);
      tmp[s->str_len] = '\0';
      long v = strtol(tmp, &endp, 10);
      int ok = endp != tmp && *endp == '\0';
      cfj_free(tmp);
      if (!ok) cfj_fail("NumberFormatException: \"%s\"", s->str);
      out->i = (int32_t)v;
      return 1;
    }
    if (!strcmp(name, "toString")) {
      char buf[32];
      snprintf(buf, sizeof buf, "%d", args[0].i);
      out->ref = new_stringz(buf);
      return 1;
    }
    if (!strcmp(name, "intValue")) { out->i = args[0].i; return 1; }
    return 0;
  }
  return 0;
}

/* --------------------------------- frames -------------------------------- */

typedef struct Frame {
  Member *m;
  ClassFile *cls;
  Value *locals;
  Value *stack;
  int sp;
  struct Frame *prev;
} Frame;

static Value pop(Frame *f) {
  if (f->sp <= 0) cfj_fail("operand stack underflow in %s.%s",
                           cp_utf8(f->cls, f->m->name_idx), cp_utf8(f->cls, f->m->desc_idx));
  return f->stack[--f->sp];
}
static void push(Frame *f, Value v) {
  if (f->sp >= f->m->max_stack + 4) cfj_fail("operand stack overflow in %s.%s",
                                             cp_utf8(f->cls, f->m->name_idx),
                                             cp_utf8(f->cls, f->m->desc_idx));
  f->stack[f->sp++] = v;
}
static Value vi(int32_t x) { Value v; memset(&v, 0, sizeof v); v.i = x; return v; }
static Value vr(Obj *x) { Value v; memset(&v, 0, sizeof v); v.ref = x; return v; }

/*
 * Longs live in ONE logical local slot (holding the full 64 bits) but occupy
 * TWO operand-stack slots, matching how javac numbers them. The local-slot
 * index still advances by two so the numbering in the bytecode stays valid.
 */
static int64_t pop_long(Frame *f) {
  Value lo = pop(f); /* pushed last, so popped first */
  Value hi = pop(f);
  return ((int64_t)(uint32_t)hi.i << 32) | (uint32_t)lo.i;
}

static void push_long(Frame *f, int64_t x) {
  push(f, vi((int32_t)(uint32_t)((uint64_t)x >> 32)));
  push(f, vi((int32_t)(uint32_t)x));
}

static void run_method(ClassFile *cls, Member *m, Value *args, int nargs, Value *out);

static Obj *g_stdout;

static void ensure_stdout(void) {
  if (!g_stdout) g_stdout = new_obj(KIND_INSTANCE, "java/io/PrintStream");
}

static Obj *g_stdin;

static void ensure_stdin(void) {
  if (!g_stdin) g_stdin = new_obj(KIND_INSTANCE, "java/io/InputStream");
}

/*
 * Lay incoming arguments out into locals following the method descriptor, so
 * a long or double argument correctly consumes two slot numbers. `args` is
 * already slot-ordered by the caller.
 */
static void load_args(Frame *fr, const char *desc, int has_this, Value *args, int nargs) {
  int li = 0, ai = 0;
  if (has_this && ai < nargs) fr->locals[li++] = args[ai++];
  const char *p = desc + 1;
  while (*p && *p != ')' && ai < nargs) {
    if (*p == 'L') {
      while (*p && *p != ';') p++;
      fr->locals[li++] = args[ai++];
    } else if (*p == '[') {
      /* fall through to the element type, which decides the width */
    } else if (*p == 'J' || *p == 'D') {
      fr->locals[li] = args[ai++];
      li += 2; /* the second slot number is burned but never read */
    } else {
      fr->locals[li++] = args[ai++];
    }
    p++;
  }
}

/* ------------------------------- interpreter ----------------------------- */

static int16_t rd16(const uint8_t *c, int p) {
  return (int16_t)((c[p] << 8) | c[p + 1]);
}

/* Big-endian unsigned 32 at a code-array offset (switch operands). */
static uint32_t u4be(const uint8_t *c, int p) {
  return ((uint32_t)c[p] << 24) | ((uint32_t)c[p + 1] << 16) |
         ((uint32_t)c[p + 2] << 8) | (uint32_t)c[p + 3];
}

static void run_method(ClassFile *cls, Member *m, Value *args, int nargs, Value *out) {
  if (!m->code) cfj_fail("method %s.%s has no Code attribute",
                         cp_utf8(cls, m->name_idx), cp_utf8(cls, m->desc_idx));

  Frame fr;
  memset(&fr, 0, sizeof fr);
  fr.m = m;
  fr.cls = cls;
  fr.locals = xcalloc(m->max_locals + 4, sizeof(Value));
  fr.stack = xcalloc((size_t)m->max_stack + 8, sizeof(Value));
  fr.sp = 0;

  const char *desc = cp_utf8(cls, m->desc_idx);
  /* An instance method's slot 0 is `this`; a static method's is the first arg. */
  int has_this = (m->access & 0x0008) ? 0 : 1;
  load_args(&fr, desc, has_this, args, nargs);

  const uint8_t *c = m->code;
  int n = (int)m->code_len;
  int pc = 0;

#define FETCH8() (c[pc++])
#define FETCH16() ({ int16_t v = rd16(c, pc); pc += 2; v; })

  while (pc < n) {
    uint8_t op = FETCH8();
    Value a, b;
    switch (op) {
      case 0x00: break; /* nop */
      case 0x01: push(&fr, vr(NULL)); break; /* aconst_null */
      case 0x02: push(&fr, vi(-1)); break;
      case 0x03: case 0x04: case 0x05: case 0x06:
      case 0x07: case 0x08: push(&fr, vi(op - 0x03)); break;
      case 0x09: push_long(&fr, 0); break;
      case 0x0A: push_long(&fr, 1); break;
      case 0x10: push(&fr, vi((int8_t)FETCH8())); break;
      case 0x11: push(&fr, vi(FETCH16())); break;
      case 0x12: {
        uint8_t idx = FETCH8();
        Cp *e = &cls->cp[idx];
        if (e->tag == CP_INTEGER) push(&fr, vi(e->u.integer));
        else if (e->tag == CP_STRING) push(&fr, vr(new_stringz(cp_utf8(cls, e->u.class_idx))));
        else if (e->tag == CP_FLOAT) { Value v; v.f = e->u.float_; push(&fr, v); }
        else cfj_fail("ldc: unsupported constant tag %u", e->tag);
        break;
      }
      case 0x13: {
        uint16_t idx = (uint16_t)FETCH16();
        Cp *e = &cls->cp[idx];
        if (e->tag == CP_INTEGER) push(&fr, vi(e->u.integer));
        else if (e->tag == CP_STRING) push(&fr, vr(new_stringz(cp_utf8(cls, e->u.class_idx))));
        else cfj_fail("ldc_w: unsupported constant tag %u", e->tag);
        break;
      }
      case 0x14: {
        uint16_t idx = (uint16_t)FETCH16();
        Cp *e = &cls->cp[idx];
        if (e->tag == CP_LONG) push_long(&fr, e->u.long_);
        else cfj_fail("ldc2_w: unsupported constant tag %u", e->tag);
        break;
      }
      case 0x15: push(&fr, fr.locals[FETCH8()]); break;      /* iload */
      case 0x16: { Value v = fr.locals[FETCH8()]; push_long(&fr, v.l); break; } /* lload */
      case 0x19: push(&fr, fr.locals[FETCH8()]); break;      /* aload */
      case 0x1A: case 0x1B: case 0x1C: case 0x1D:
        push(&fr, fr.locals[op - 0x1A]); break;
      case 0x1E: case 0x1F: case 0x20: case 0x21:
        push_long(&fr, fr.locals[op - 0x1E].l); break;
      case 0x2A: case 0x2B: case 0x2C: case 0x2D:
        push(&fr, fr.locals[op - 0x2A]); break;
      case 0x36: fr.locals[FETCH8()] = pop(&fr); break;      /* istore */
      case 0x37: { Value v; v.l = pop_long(&fr); fr.locals[FETCH8()] = v; break; } /* lstore */
      case 0x3A: fr.locals[FETCH8()] = pop(&fr); break;      /* astore */
      case 0x3B: case 0x3C: case 0x3D: case 0x3E:
        fr.locals[op - 0x3B] = pop(&fr); break;
      case 0x3F: case 0x40: case 0x41: case 0x42: {          /* lstore_0..3 */
        Value v; v.l = pop_long(&fr); fr.locals[op - 0x3F] = v; break;
      }
      case 0x4B: case 0x4C: case 0x4D: case 0x4E:
        fr.locals[op - 0x4B] = pop(&fr); break;
      case 0x57: pop(&fr); break;                            /* pop */
      case 0x59: a = fr.stack[fr.sp - 1]; push(&fr, a); break; /* dup */
      case 0x60: a = pop(&fr); b = pop(&fr); push(&fr, vi(b.i + a.i)); break;
      case 0x61: { int64_t x = pop_long(&fr), y = pop_long(&fr); push_long(&fr, y + x); break; }
      case 0x64: a = pop(&fr); b = pop(&fr); push(&fr, vi(b.i - a.i)); break;
      case 0x65: { int64_t x = pop_long(&fr), y = pop_long(&fr); push_long(&fr, y - x); break; }
      case 0x68: a = pop(&fr); b = pop(&fr); push(&fr, vi(b.i * a.i)); break;
      case 0x69: { int64_t x = pop_long(&fr), y = pop_long(&fr); push_long(&fr, y * x); break; }
      case 0x6C: a = pop(&fr); b = pop(&fr);
        if (a.i == 0) cfj_fail("java.lang.ArithmeticException: / by zero");
        push(&fr, vi(b.i / a.i)); break;
      case 0x6D: { int64_t x = pop_long(&fr), y = pop_long(&fr);
        if (x == 0) cfj_fail("java.lang.ArithmeticException: / by zero");
        push_long(&fr, y / x); break; }
      case 0x70: a = pop(&fr); b = pop(&fr);
        if (a.i == 0) cfj_fail("java.lang.ArithmeticException: / by zero");
        push(&fr, vi(b.i % a.i)); break;
      case 0x71: { int64_t x = pop_long(&fr), y = pop_long(&fr);
        if (x == 0) cfj_fail("java.lang.ArithmeticException: / by zero");
        push_long(&fr, y % x); break; }                   /* lrem */
      case 0x74: a = pop(&fr); push(&fr, vi(-a.i)); break;
      case 0x75: { int64_t x = pop_long(&fr); push_long(&fr, -x); break; } /* lneg */
      case 0x78: a = pop(&fr); b = pop(&fr); push(&fr, vi(b.i << (a.i & 31))); break;
      case 0x7A: a = pop(&fr); b = pop(&fr); push(&fr, vi(b.i >> (a.i & 31))); break;
      case 0x7C: a = pop(&fr); b = pop(&fr);
        push(&fr, vi((int32_t)((uint32_t)b.i >> (a.i & 31)))); break;
      case 0x7F: { int32_t sh = pop(&fr).i; int64_t v = pop_long(&fr);
        push_long(&fr, v << (sh & 63)); break; }          /* lshl */
      case 0x81: { int32_t sh = pop(&fr).i; int64_t v = pop_long(&fr);
        push_long(&fr, v >> (sh & 63)); break; }          /* lshr */
      case 0x83: { int32_t sh = pop(&fr).i; int64_t v = pop_long(&fr);
        push_long(&fr, (int64_t)((uint64_t)v >> (sh & 63))); break; } /* lushr */
      case 0x7E: a = pop(&fr); b = pop(&fr); push(&fr, vi(b.i & a.i)); break;
      case 0x80: a = pop(&fr); b = pop(&fr); push(&fr, vi(b.i | a.i)); break;
      case 0x82: a = pop(&fr); b = pop(&fr); push(&fr, vi(b.i ^ a.i)); break;
      case 0x84: { uint8_t i = FETCH8(); int8_t d = (int8_t)FETCH8(); fr.locals[i].i += d; break; }
      case 0x85: { a = pop(&fr); push_long(&fr, a.i); break; }   /* i2l */
      case 0x88: { int64_t x = pop_long(&fr); push(&fr, vi((int32_t)x)); break; } /* l2i */
      case 0x91: a = pop(&fr); push(&fr, vi((int8_t)a.i)); break;
      case 0x92: a = pop(&fr); push(&fr, vi((uint16_t)(uint8_t)a.i)); break;
      case 0x93: a = pop(&fr); push(&fr, vi((int16_t)a.i)); break;
      case 0x94: { int64_t x = pop_long(&fr), y = pop_long(&fr);
        push(&fr, vi(y < x ? -1 : y > x ? 1 : 0)); break; } /* lcmp */
      case 0x99: case 0x9A: case 0x9B: case 0x9C: case 0x9D: case 0x9E: {
        int16_t off = FETCH16(); int base = pc - 3; int32_t v = pop(&fr).i;
        int take = (op == 0x99 && v == 0) || (op == 0x9A && v != 0) ||
                   (op == 0x9B && v < 0) || (op == 0x9C && v >= 0) ||
                   (op == 0x9D && v > 0) || (op == 0x9E && v <= 0);
        if (take) pc = base + off;
        break;
      }
      case 0x9F: case 0xA0: case 0xA1: case 0xA2: case 0xA3: case 0xA4: {
        int16_t off = FETCH16(); int base = pc - 3;
        a = pop(&fr); b = pop(&fr);
        int take = (op == 0x9F && b.i == a.i) || (op == 0xA0 && b.i != a.i) ||
                   (op == 0xA1 && b.i < a.i) || (op == 0xA2 && b.i >= a.i) ||
                   (op == 0xA3 && b.i > a.i) || (op == 0xA4 && b.i <= a.i);
        if (take) pc = base + off;
        break;
      }
      case 0xA7: { int16_t off = FETCH16(); pc = (pc - 3) + off; break; } /* goto */
      case 0xC8: {                                    /* goto_w */
        int base = pc - 1;
        int32_t off = ((int32_t)(uint16_t)rd16(c, pc) << 16) | (uint16_t)rd16(c, pc + 2);
        pc += 4;
        pc = base + off;
        break;
      }
      case 0xAC: if (out) *out = pop(&fr); return; /* ireturn */
      case 0xAD: if (out) { int64_t x = pop_long(&fr); out->l = x; } else pop_long(&fr); return;
      case 0xB0: if (out) *out = pop(&fr); return; /* areturn */
      case 0xB1: return;                            /* return */
      case 0xC6: case 0xC7: {
        int16_t off = FETCH16(); int base = pc - 3; Obj *r = pop(&fr).ref;
        if ((op == 0xC6 && r == NULL) || (op == 0xC7 && r != NULL)) pc = base + off;
        break;
      }
      /* ---- field access ---- */
      case 0xB2: case 0xB3: { /* getstatic / putstatic */
        uint16_t idx = (uint16_t)FETCH16();
        Cp *e = &cls->cp[idx];
        const char *cn = cp_class_name(cls, e->u.ref.class_idx);
        Cp *nat = &cls->cp[e->u.ref.nat_idx];
        const char *fn = cp_utf8(cls, nat->u.nat.name_idx);
        const char *fd = cp_utf8(cls, nat->u.nat.desc_idx);
        if (op == 0xB2 && !strcmp(cn, "java/lang/System") && !strcmp(fn, "out")) {
          ensure_stdout();
          push(&fr, vr(g_stdout));
          break;
        }
        if (op == 0xB2 && !strcmp(cn, "java/lang/System") && !strcmp(fn, "in")) {
          ensure_stdin();
          push(&fr, vr(g_stdin));
          break;
        }
        ClassFile *oc = find_class(cn);
        if (!oc) cfj_fail("getstatic/putstatic: class %s not loaded", cn);
        Member *fm = find_static(oc, fn);
        if (!fm) cfj_fail("static field %s.%s not found", cn, fn);
        Value *slot = static_slot(oc, fm);
        if (op == 0xB2) {
          push(&fr, *slot);
          if (fd[0] == 'J' || fd[0] == 'D') push(&fr, *slot);
        } else {
          if (fd[0] == 'J' || fd[0] == 'D') pop(&fr);
          *slot = pop(&fr);
        }
        break;
      }
      case 0xB4: case 0xB5: { /* getfield / putfield */
        uint16_t idx = (uint16_t)FETCH16();
        Cp *e = &cls->cp[idx];
        const char *cn = cp_class_name(cls, e->u.ref.class_idx);
        Cp *nat = &cls->cp[e->u.ref.nat_idx];
        const char *fn = cp_utf8(cls, nat->u.nat.name_idx);
        ClassFile *oc = find_class(cn);
        if (!oc) cfj_fail("field access: class %s not loaded", cn);
        if (op == 0xB5) {
          Value v = pop(&fr);
          Obj *o = pop(&fr).ref;
          if (!o) cfj_fail("NullPointerException on putfield %s", fn);
          ClassFile *owner;
          Member *fm = resolve_field(o->class_name ? find_class(o->class_name) : oc, fn, &owner);
          o->fields[field_slot(owner, fm)] = v;
        } else {
          Obj *o = pop(&fr).ref;
          if (!o) cfj_fail("NullPointerException on getfield %s", fn);
          ClassFile *owner;
          Member *fm = resolve_field(find_class(o->class_name) ? find_class(o->class_name) : oc, fn, &owner);
          push(&fr, o->fields[field_slot(owner, fm)]);
        }
        break;
      }
      /* ---- invocation ---- */
      case 0xB6: case 0xB7: case 0xB8: case 0xB9: {
        uint16_t idx = (uint16_t)FETCH16();
        if (op == 0xB9) { (void)FETCH8(); (void)FETCH8(); } /* count byte + reserved zero */
        Cp *e = &cls->cp[idx];
        const char *cn = cp_class_name(cls, e->u.ref.class_idx);
        Cp *nat = &cls->cp[e->u.ref.nat_idx];
        const char *mn = cp_utf8(cls, nat->u.nat.name_idx);
        const char *md = cp_utf8(cls, nat->u.nat.desc_idx);

        int aslots = desc_arg_slots(md);
        /* invokeinterface and invokespecial/virtual all pass a receiver; only
           invokestatic does not. */
        int has_this = (op == 0xB8) ? 0 : 1;
        int total = aslots + has_this;
        if (total > 64) cfj_fail("too many argument slots for %s.%s", cn, mn);

        /* Pop slot-wise, then reassemble into LOGICAL arguments. A long or
           double occupies two stack slots but is one argument, and handing a
           callee only its high half is a silently wrong answer. */
        Value slots[64];
        for (int i = total - 1; i >= 0; i--) slots[i] = pop(&fr);
        Value argv[32];
        int na = 0, si = 0;
        if (has_this) argv[na++] = slots[si++];
        {
          const char *p = md + 1;
          while (*p && *p != ')') {
            if (*p == 'L') {
              while (*p && *p != ';') p++;
              argv[na++] = slots[si++];
            } else if (*p == '[') {
              /* array: the element type that follows decides the width */
            } else if (*p == 'J' || *p == 'D') {
              Value v;
              memset(&v, 0, sizeof v);
              v.l = ((int64_t)(uint32_t)slots[si].i << 32) | (uint32_t)slots[si + 1].i;
              argv[na++] = v;
              si += 2;
            } else {
              argv[na++] = slots[si++];
            }
            p++;
          }
        }
        total = na;

        /* Resolve the real class for virtual dispatch. */
        ClassFile *target = NULL;
        if (has_this && argv[0].ref) {
          const char *rt = argv[0].ref->class_name;
          if (rt) target = find_class(rt);
        }
        if (!target) target = find_class(cn);

        Value ret;
        memset(&ret, 0, sizeof ret);

        if (is_builtin(cn) && native_method(cn, mn, md, argv, total, &ret)) {
          char rt = desc_return(md);
          if (rt == 'J' || rt == 'D') push_long(&fr, ret.l);
          else if (rt != 'V') push(&fr, ret);
          break;
        }
        if (!strcmp(cn, "java/lang/StringBuilder") && !strcmp(mn, "<init>")) {
          /* <new StringBuilder> is allocated by `new`; initialise it here. */
          native_method(cn, mn, md, argv, total, &ret);
          break;
        }
        if (!target) cfj_fail("cannot resolve %s.%s%s: class not loaded", cn, mn, md);
        Member *callee = NULL;
        for (ClassFile *p = target; p && !callee; p = p->super)
          for (uint16_t i = 0; i < p->n_methods; i++)
            if (!strcmp(cp_utf8(p, p->methods[i].name_idx), mn) &&
                !strcmp(cp_utf8(p, p->methods[i].desc_idx), md)) {
              callee = &p->methods[i];
              target = p;
              break;
            }
        if (!callee) cfj_fail("method %s.%s%s not found", cn, mn, md);
        run_method(target, callee, argv, total, &ret);
        char rt = desc_return(md);
        if (rt == 'J' || rt == 'D') push_long(&fr, ret.l);
        else if (rt != 'V') push(&fr, ret);
        break;
      }
      /* ---- objects and arrays ---- */
      case 0xBB: {
        uint16_t idx = (uint16_t)FETCH16();
        const char *cn = cp_class_name(cls, idx);
        Obj *o;
        if (!strcmp(cn, "java/lang/StringBuilder")) o = new_obj(KIND_SB, cn);
        else if (!strcmp(cn, "java/lang/String")) o = new_string("", 0);
        else {
          ClassFile *oc = find_class(cn);
          if (!oc) cfj_fail("new: class %s not loaded", cn);
          o = new_obj(KIND_INSTANCE, cn);
          o->n_fields = total_instance_fields(oc);
          o->fields = xcalloc((size_t)o->n_fields + 1, sizeof(Value));
        }
        push(&fr, vr(o));
        break;
      }
      case 0xBC: {                                    /* newarray (primitive) */
        uint8_t t = FETCH8();
        int len = pop(&fr).i;
        /* atype: 4=boolean 5=char 6=float 7=double 8=byte 9=short 10=int 11=long */
        static const char map[12] = { 0, 0, 0, 0, 'Z', 'C', 'F', 'D', 'B', 'S', 'I', 'J' };
        if (t < 4 || t > 11) cfj_fail("newarray: bad atype %u", t);
        push(&fr, vr(new_array(map[t], len)));
        break;
      }
      case 0xBD: { /* anewarray */
        uint16_t idx = (uint16_t)FETCH16();
        int len = pop(&fr).i;
        (void)idx;
        push(&fr, vr(new_array('L', len)));
        break;
      }
      case 0xBE: { Obj *o = pop(&fr).ref;
        if (!o) cfj_fail("NullPointerException on arraylength");
        if (o->kind != KIND_ARRAY) cfj_fail("arraylength on a non-array");
        push(&fr, vi(o->length)); break; }
      case 0x2E: case 0x2F: case 0x32: case 0x33: case 0x34: case 0x35: {
        int i = pop(&fr).i;
        Obj *o = pop(&fr).ref;
        if (!o) cfj_fail("NullPointerException on array load");
        if (o->kind != KIND_ARRAY) cfj_fail("array load on a non-array");
        if (i < 0 || i >= o->length) cfj_fail("ArrayIndexOutOfBoundsException: %d", i);
        switch (op) {
          case 0x2E: push(&fr, vi(((int32_t *)o->data)[i])); break;
          case 0x2F: { int64_t v = ((int64_t *)o->data)[i]; push_long(&fr, v); break; }
          case 0x32: push(&fr, vr(((Obj **)o->data)[i])); break;
          case 0x33: push(&fr, vi(((int8_t *)o->data)[i])); break;
          case 0x34: push(&fr, vi(((uint16_t *)o->data)[i])); break;
          case 0x35: push(&fr, vi(((int16_t *)o->data)[i])); break;
        }
        break;
      }
      case 0x4F: case 0x50: case 0x53: case 0x54: case 0x55: case 0x56: {
        /* Stack is [arrayref, index, value]; a long value occupies two slots. */
        int64_t lv = 0;
        Value v;
        memset(&v, 0, sizeof v);
        if (op == 0x50) lv = pop_long(&fr);
        else v = pop(&fr);
        int i = pop(&fr).i;
        Obj *o = pop(&fr).ref;
        if (!o) cfj_fail("NullPointerException on array store");
        if (o->kind != KIND_ARRAY) cfj_fail("array store on a non-array");
        if (i < 0 || i >= o->length) cfj_fail("ArrayIndexOutOfBoundsException: %d", i);
        switch (op) {
          case 0x4F: ((int32_t *)o->data)[i] = v.i; break;
          case 0x50: ((int64_t *)o->data)[i] = lv; break;
          case 0x53: ((Obj **)o->data)[i] = v.ref; break;
          case 0x54: ((int8_t *)o->data)[i] = (int8_t)v.i; break;
          case 0x55: ((uint16_t *)o->data)[i] = (uint16_t)v.i; break;
          case 0x56: ((int16_t *)o->data)[i] = (int16_t)v.i; break;
        }
        break;
      }
      case 0xAA: case 0xAB: {
        /*
         * Both switch forms pad to a 4-byte boundary measured from the start
         * of the method, so the pad count depends on where the opcode landed.
         */
        int base = pc - 1;
        while ((pc % 4) != 0) pc++;
        int32_t def = (int32_t)u4be(c, pc); pc += 4;
        int32_t key = pop(&fr).i;
        int32_t target = def;
        if (op == 0xAA) {                              /* tableswitch */
          int32_t low = (int32_t)u4be(c, pc); pc += 4;
          int32_t high = (int32_t)u4be(c, pc); pc += 4;
          if (high < low || high - low > 65535) cfj_fail("tableswitch: bad range %d..%d", low, high);
          if (key >= low && key <= high) target = (int32_t)u4be(c, pc + (key - low) * 4);
          pc += (high - low + 1) * 4;
        } else {                                       /* lookupswitch */
          int32_t npairs = (int32_t)u4be(c, pc); pc += 4;
          for (int32_t k = 0; k < npairs; k++) {
            int32_t match = (int32_t)u4be(c, pc + k * 8);
            if (match == key) { target = (int32_t)u4be(c, pc + k * 8 + 4); break; }
          }
          pc += npairs * 8;
        }
        pc = base + target;
        break;
      }
      case 0xC0: case 0xC1: { /* checkcast / instanceof */
        uint16_t idx = (uint16_t)FETCH16();
        const char *cn = cp_class_name(cls, idx);
        Obj *o = fr.stack[fr.sp - 1].ref;
        if (op == 0xC1) {
          pop(&fr);
          push(&fr, vi(o && o->class_name && !strcmp(o->class_name, cn)));
        }
        (void)cn;
        break;
      }
      default:
        cfj_fail("unsupported opcode 0x%02x at pc=%d in %s.%s", op, pc - 1,
                 cp_utf8(cls, m->name_idx), cp_utf8(cls, m->desc_idx));
    }
  }
  cfj_fail("fell off the end of the code array in %s.%s",
           cp_utf8(cls, m->name_idx), cp_utf8(cls, m->desc_idx));
#undef FETCH8
#undef FETCH16
}

/* --------------------------------- main ---------------------------------- */

static uint8_t *slurp(const char *path, size_t *out_len) {
  FILE *f = cfj_fopen(path, "rb");
  if (!f) cfj_fail("cannot open %s", path);
  cfj_fseek(f, 0, SEEK_END);
  long n = cfj_ftell(f);
  cfj_fseek(f, 0, SEEK_SET);
  if (n < 0) cfj_fail("cannot size %s", path);
  uint8_t *b = xmalloc((size_t)n);
  if (cfj_fread(b, 1, (size_t)n, f) != (size_t)n) cfj_fail("short read on %s", path);
  cfj_fclose(f);
  *out_len = (size_t)n;
  return b;
}

static void run_clinit(ClassFile *c) {
  for (uint16_t i = 0; i < c->n_methods; i++)
    if (!strcmp(cp_utf8(c, c->methods[i].name_idx), "<clinit>")) {
      run_method(c, &c->methods[i], NULL, 0, NULL);
      return;
    }
}

int main(int argc, char **argv) {
  if (argc < 2) {
    cfj_fputs("usage: cfjvm <Class.class> [more.class ...] -- [args...]\n", stderr);
    return 1;
  }
  int i = 1;
  ClassFile *main_cls = NULL;
  for (; i < argc; i++) {
    if (!strcmp(argv[i], "--")) { i++; break; }
    size_t len;
    uint8_t *buf = slurp(argv[i], &len);
    ClassFile *c = parse_class(buf, len);
    register_class(c);
    if (!main_cls) main_cls = c;
  }
  /* Two passes: supertypes must be registered before they are resolved. */
  for (int k = 0; k < g_n_classes; k++) {
    ClassFile *c = g_classes[k];
    const char *super = c->super_class ? cp_class_name(c, c->super_class) : NULL;
    if (super && !is_builtin(super) && !c->super) c->super = find_class(super);
  }
  if (!main_cls) { cfj_fputs("no class file given\n", stderr); return 1; }

  /* Initialise statics, then invoke main([Ljava/lang/String;)V. */
  for (int k = 0; k < g_n_classes; k++) run_clinit(g_classes[k]);

  Member *main_m = NULL;
  for (uint16_t k = 0; k < main_cls->n_methods; k++)
    if (!strcmp(cp_utf8(main_cls, main_cls->methods[k].name_idx), "main"))
      main_m = &main_cls->methods[k];
  if (!main_m) cfj_fail("%s has no main method",
                        cp_class_name(main_cls, main_cls->this_class));

  int nargs = argc - i;
  Obj *arr = new_array('L', nargs);
  for (int k = 0; k < nargs; k++) ((Obj **)arr->data)[k] = new_stringz(argv[i + k]);

  Value args[1];
  args[0] = vr(arr);
  run_method(main_cls, main_m, args, 1, NULL);
  cfj_fflush(stdout);
  return 0;
}
