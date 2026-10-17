import java.applet.Applet;
import java.awt.BorderLayout;
import java.awt.Button;
import java.awt.EventQueue;
import java.awt.Font;
import java.awt.Label;
import java.awt.Panel;
import java.awt.TextArea;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

/** Historical Java 8 applet READER, not a browser plug-in revival or an HTML/JS translator.
 * Reads public snapshot pages from the same-origin ACME server. No write token or vault key.
 */
@SuppressWarnings("removal")
public final class WikiReaderApplet extends Applet {
    private final java.awt.List files = new java.awt.List(15);
    private final TextArea source = new TextArea("Loading repository index…", 20, 70, TextArea.SCROLLBARS_BOTH);
    private final Label status = new Label("Repository snapshot reader — read only");
    private final ArrayList<String> ids = new ArrayList<String>();
    private volatile boolean stopped;
    private volatile int request;

    @Override public void init() {
        setLayout(new BorderLayout(10,10));
        source.setEditable(false); source.setFont(new Font("Monospaced",Font.PLAIN,12));
        add(files,BorderLayout.WEST); add(source,BorderLayout.CENTER); add(status,BorderLayout.NORTH);
        Panel footer=new Panel(); Button open=new Button("Open full browser wiki");footer.add(open);add(footer,BorderLayout.SOUTH);
        open.addActionListener(event -> {
            try { getAppletContext().showDocument(new URL(getCodeBase(),"library/index.html"),"_blank"); }
            catch(Exception e) { status.setText("Could not open browser wiki"); }
        });
        files.addItemListener(event -> loadPage());
        new Thread(() -> {
            try (BufferedReader reader=read("reader-index.tsv")) {
                final ArrayList<String> names=new ArrayList<String>(), keys=new ArrayList<String>();
                String line; while((line=reader.readLine())!=null) { String[] parts=line.split("\t",2); if(parts.length==2){keys.add(parts[0]);names.add(parts[1]);} }
                EventQueue.invokeLater(() -> { if(stopped)return;ids.addAll(keys);for(String name:names)files.add(name);status.setText(names.size()+" snapshot pages — read only");if(!names.isEmpty()){files.select(0);loadPage();} });
            } catch(Exception e) { EventQueue.invokeLater(() -> source.setText("Reader unavailable. Serve this applet beside reader-index.tsv with the JAR's ACME server. Modern browsers do not run Java plug-ins.\n"+e.getClass().getSimpleName())); }
        },"wiki-index-reader").start();
    }
    private BufferedReader read(String relative) throws Exception {
        return new BufferedReader(new InputStreamReader(new URL(getCodeBase(),relative).openStream(),StandardCharsets.UTF_8));
    }
    private void loadPage() {
        int selected=files.getSelectedIndex();if(selected<0||selected>=ids.size())return;
        final String id=ids.get(selected);final int serial=++request;
        new Thread(() -> {
            try(BufferedReader reader=read("pages/"+id+".txt")) {
                StringBuilder text=new StringBuilder();String line;while((line=reader.readLine())!=null&&text.length()<1048576)text.append(line).append('\n');
                EventQueue.invokeLater(() -> {if(!stopped&&request==serial){source.setText(text.toString());source.setCaretPosition(0);}});
            }catch(Exception e){EventQueue.invokeLater(() -> {if(request==serial)source.setText("Could not load page: "+e.getClass().getSimpleName());});}
        },"wiki-page-reader").start();
    }
    @Override public void destroy() { stopped=true;request++; }
}
