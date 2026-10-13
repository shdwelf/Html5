import com.sun.source.tree.CompilationUnitTree;
import com.sun.source.util.JavacTask;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

/**
 * Parse the generated JavaCard applets with OpenJDK's real JavacParser.
 *
 * This deliberately calls JavacTask.parse() only: no JavaCard SDK/API jar is
 * bundled here, so it checks Java grammar without pretending to type-check the
 * JavaCard API or produce CAP files.
 *
 * Run with a full JDK (JDK 21 in the relayed toolchain):
 *   java tools/verify_javacard_parse.java samples/javacard/*.java
 */
public final class VerifyJavacardParse {
  private VerifyJavacardParse() {}

  public static void main(String[] args) throws Exception {
    if (args.length == 0) {
      System.err.println("usage: java tools/verify_javacard_parse.java samples/javacard/*.java");
      System.exit(2);
    }

    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    if (compiler == null) {
      System.err.println("error: a full JDK with the jdk.compiler module is required");
      System.exit(2);
    }

    DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
    int parsed = 0;
    try (StandardJavaFileManager fileManager = compiler.getStandardFileManager(
        diagnostics, Locale.ROOT, StandardCharsets.UTF_8)) {
      Iterable<? extends JavaFileObject> files = fileManager.getJavaFileObjectsFromStrings(
          Arrays.asList(args));
      JavacTask task = (JavacTask) compiler.getTask(
          null, fileManager, diagnostics, List.of("-proc:none", "-source", "8"), null, files);
      for (CompilationUnitTree ignored : task.parse()) parsed++;
    }

    List<Diagnostic<? extends JavaFileObject>> errors = new ArrayList<>();
    for (Diagnostic<? extends JavaFileObject> diagnostic : diagnostics.getDiagnostics()) {
      if (diagnostic.getKind() == Diagnostic.Kind.ERROR) errors.add(diagnostic);
    }
    for (Diagnostic<? extends JavaFileObject> error : errors) System.err.println(error);

    System.out.printf("JavacParser parsed %d/%d source file(s); %d syntax error(s)%n",
        parsed, args.length, errors.size());
    if (parsed != args.length || !errors.isEmpty()) System.exit(1);
  }
}
