/**
 * Exercises the instruction and library surface cfjvm claims to support.
 *
 * The point of this file is that it is run TWICE by `make test`: once on the
 * real JDK and once under cfjvm, and the two outputs are diffed. So the
 * expected answers are not typed in by hand and cannot drift away from what
 * Java actually does.
 */
public class Smoke {
    static int counter = 10;
    static final String LABEL = "smoke";

    int id;
    String name;

    public Smoke(int id, String name) { this.id = id; this.name = name; }

    public int scale(int f) { return id * f + 1; }
    public String describe() { return name + "#" + id; }

    static int fib(int n) {
        int a = 0, b = 1;
        for (int i = 0; i < n; i++) { int t = a + b; a = b; b = t; }
        return a;
    }

    /* Dense switch: javac emits tableswitch. */
    static String classify(int n) {
        switch (n) {
            case 0: return "zero";
            case 1: return "one";
            case 2: return "two";
            default: return "many";
        }
    }

    /* Sparse switch: javac emits lookupswitch. */
    static String sparse(int n) {
        switch (n) {
            case 100: return "hundred";
            case 5000: return "five thousand";
            case 70000: return "seventy thousand";
            default: return "other";
        }
    }

    public static void main(String[] args) {
        System.out.println("cfjvm smoke");

        // integer arithmetic, including the wrapping the JLS requires
        System.out.println(2 + 3 * 4);
        System.out.println((7 / 2) + " " + (7 % 2));
        System.out.println(-7 / 2 + " " + (-7 % 2));
        System.out.println(Integer.MIN_VALUE + 1);
        System.out.println((1 << 10) + " " + (1024 >> 3) + " " + (-1024 >>> 28));
        System.out.println((255 & 15) + " " + (240 | 15) + " " + (255 ^ 15));
        System.out.println(~0 + " " + -(2147483647));
        System.out.println((int) (byte) 300 + " " + (int) (short) 40000 + " " + (char) 65);

        // longs, which occupy two operand-stack slots
        long L = 1234567890123L;
        System.out.println(L * 3);
        System.out.println(L / 1000 + " " + (L % 1000));
        System.out.println(L - 1234567890123L);
        System.out.println((int) L + " " + (long) 42);
        System.out.println(Long.compare(L, L + 1));

        // control flow
        int sum = 0;
        for (int i = 1; i <= 10; i++) sum += i;
        System.out.println(sum);
        int w = 0, k = 0;
        while (k < 5) { w += k * k; k++; }
        System.out.println(w);
        System.out.println(fib(20) + " " + fib(1));
        System.out.println(classify(0) + " " + classify(2) + " " + classify(9));
        System.out.println(sparse(5000) + " " + sparse(1) + " " + sparse(70000));

        // arrays
        int[] a = new int[5];
        for (int i = 0; i < a.length; i++) a[i] = i * i;
        int total = 0;
        for (int i = 0; i < a.length; i++) total += a[i];
        System.out.println(total + " len=" + a.length);
        char[] cs = "abc".toCharArray();
        System.out.println(cs.length + " " + (int) cs[2]);
        byte[] bs = new byte[3];
        bs[0] = (byte) 200;
        System.out.println(bs[0]);
        String[] sa = new String[3];
        sa[0] = "x"; sa[1] = "y"; sa[2] = sa[0] + sa[1];
        System.out.println(sa[2] + " " + (sa[1] == null));

        // objects, virtual dispatch, inheritance
        Smoke s = new Smoke(7, "sev");
        System.out.println(s.describe() + " scale=" + s.scale(6));
        Base b = new Derived(3, 4);
        System.out.println(b.kind() + " " + b.value() + " " + ((Derived) b).total());
        Base b2 = new Base(9);
        System.out.println(b2.kind() + " " + b2.value());

        // statics and constant fields
        System.out.println(LABEL + " counter=" + counter);
        counter += 5;
        System.out.println(counter);

        // strings
        String t = "Hello, world";
        System.out.println(t.length() + " " + (int) t.charAt(0) + " " + t.substring(7));
        System.out.println(t.equals("Hello, world") + " " + t.equals("nope") + " " + t.isEmpty());
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 3; i++) sb.append(i).append('-');
        System.out.println(sb.toString() + " len=" + sb.length());
        System.out.println("n=" + Integer.parseInt("42") + " s=" + Integer.toString(42));
        System.out.println(Math.abs(-9) + " " + Math.max(3, 8) + " " + Math.min(3, 8));

        // reference comparison and null
        Object o = null;
        System.out.println((o == null) + " " + (s != null));

        // command line
        System.out.println("argc=" + args.length);
        for (int i = 0; i < args.length; i++) System.out.println("arg" + i + "=" + args[i]);
    }
}

class Base {
    int v;
    Base(int v) { this.v = v; }
    public String kind() { return "base"; }
    public int value() { return v; }
}

class Derived extends Base {
    int extra;
    Derived(int v, int e) { super(v); this.extra = e; }
    public String kind() { return "derived"; }
    public int total() { return value() + extra; }
}
