package org.html5.wiki;

import Acme.Serve.Serve;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

/** ACME/TJWS host for an immutable repository snapshot, plus opt-in local revisions.
 * No CGI, WAR deployment, directory listing, arbitrary filesystem route or remote fetch.
 */
public final class WikiServer extends HttpServlet {
    private static final int MAX_PAGE = 1024 * 1024, MAX_VAULT = 16 * 1024 * 1024;
    private final Map<String, Asset> assets = new HashMap<>();
    private final Map<String, String> mediaTypes = new HashMap<>();
    private final Path data;
    private final byte[] token;
    private final String edition, landing;
    private static final class Asset {
        final String mime, hash; final int length;
        Asset(String mime, int length, String hash) { this.mime=mime; this.length=length; this.hash=hash; }
    }
    private static final class Revision {
        final String hash, parent, updated; final byte[] body;
        Revision(String hash, String parent, String updated, byte[] body) {
            this.hash=hash; this.parent=parent; this.updated=updated; this.body=body;
        }
    }
    public WikiServer(Path directory, String bearer) throws IOException {
        data = directory.toAbsolutePath().normalize();
        if (bearer != null && (bearer.length()<32 || bearer.matches(".*\\s.*"))) throw new IllegalArgumentException("WIKI_WRITE_TOKEN must be at least 32 characters, without whitespace");
        token = bearer==null ? null : bearer.getBytes(StandardCharsets.UTF_8);
        Properties properties = new Properties();
        try (InputStream in=resource("edition.properties")) { properties.load(in); }
        edition=properties.getProperty("edition"); landing=properties.getProperty("landing");
        try (BufferedReader reader=new BufferedReader(new InputStreamReader(resource("assets.tsv"),StandardCharsets.UTF_8))) {
            String line;
            while ((line=reader.readLine())!=null) {
                String[] p=line.split("\t");
                assets.put(p[0],new Asset(p[1],Integer.parseInt(p[2]),p[3]));
            }
        }
        try (BufferedReader reader=new BufferedReader(new InputStreamReader(resource("media.tsv"),StandardCharsets.UTF_8))) {
            String line; while ((line=reader.readLine())!=null) { String[] p=line.split("\t"); mediaTypes.put(p[0],p[1]); }
        }
        if (token!=null) {
            Files.createDirectories(data);
            if (Files.isSymbolicLink(data)) throw new IOException("Data directory must not be a symlink");
        }
    }
    static InputStream resource(String name) throws IOException {
        InputStream in=WikiServer.class.getClassLoader().getResourceAsStream(name);
        if (in==null) throw new FileNotFoundException(name); return in;
    }
    static String hash(byte[] bytes) {
        try {
            byte[] digest=MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder s=new StringBuilder(); for(byte b:digest) s.append(String.format("%02x",b&255)); return s.toString();
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
    static String quote(String text) {
        StringBuilder out=new StringBuilder("\"");
        for(char c:text.toCharArray()) {
            if(c=='"'||c=='\\') out.append('\\').append(c);
            else if(c<32) out.append(String.format("\\u%04x",(int)c)); else out.append(c);
        }
        return out.append('"').toString();
    }
    private static boolean validId(String id) { return id.matches("[0-9a-f]{64}"); }
    private static String safePath(String raw) {
        String decoded=URLDecoder.decode(raw.replace("+","%2B"),StandardCharsets.UTF_8);
        if (!decoded.startsWith("/") || decoded.contains("\\") || decoded.contains("%") || decoded.contains("\0") || decoded.contains("//")) throw new IllegalArgumentException();
        for(String part:decoded.split("/")) if(part.equals(".")||part.equals("..")||part.startsWith(".")) throw new IllegalArgumentException();
        return decoded;
    }
    private void headers(HttpServletResponse res) {
        res.setHeader("X-Content-Type-Options","nosniff");
        res.setHeader("Referrer-Policy","no-referrer");
        res.setHeader("Cache-Control","no-store");
        // No frame-ancestors / X-Frame-Options: Arena previews and Webxdc embed these pages.
        // Repository bytes always download as attachments; they never execute at this origin.
    }
    private static void send(HttpServletRequest req,HttpServletResponse res,int status,String type,byte[] body) throws IOException {
        res.setStatus(status); res.setContentType(type); res.setContentLength(body.length);
        if (!req.getMethod().equals("HEAD")) res.getOutputStream().write(body);
    }
    private static void message(HttpServletRequest req,HttpServletResponse res,int status,String message) throws IOException {
        send(req,res,status,"application/json; charset=utf-8",("{\"message\":"+quote(message)+"}").getBytes(StandardCharsets.UTF_8));
    }
    private boolean authorize(HttpServletRequest req,HttpServletResponse res) throws IOException {
        if(token==null) { message(req,res,403,"Read-only server. Configure WIKI_WRITE_TOKEN to enable local persistence."); return false; }
        String auth=req.getHeader("Authorization");
        if(auth==null || !auth.startsWith("Bearer ") || !MessageDigest.isEqual(token,auth.substring(7).getBytes(StandardCharsets.UTF_8))) {
            message(req,res,401,"Bearer authorization required"); return false;
        }
        String origin=req.getHeader("Origin");
        if(origin!=null) {
            try {
                URI u=URI.create(origin);
                if (!("https".equals(u.getScheme())||"http".equals(u.getScheme())) || u.getRawUserInfo()!=null || !u.getRawAuthority().equalsIgnoreCase(req.getHeader("Host"))) throw new IllegalArgumentException();
            } catch(Exception e) { message(req,res,403,"Cross-origin request denied"); return false; }
        }
        if("cross-site".equals(req.getHeader("Sec-Fetch-Site"))) { message(req,res,403,"Cross-site request denied"); return false; }
        return true;
    }
    private static byte[] limited(HttpServletRequest req,int maximum) throws IOException {
        if(req.getContentLength()>maximum) throw new TooLarge();
        ByteArrayOutputStream out=new ByteArrayOutputStream(); byte[] buffer=new byte[8192]; int n;
        InputStream in=req.getInputStream();
        while((n=in.read(buffer))!=-1) { if(out.size()+n>maximum) throw new TooLarge(); out.write(buffer,0,n); }
        return out.toByteArray();
    }
    private static class TooLarge extends IOException { }
    // Data paths consist only of validated hashes. Refuse symlinked components as well.
    private Path dataPath(String relative) throws IOException {
        Path result=data.resolve(relative).normalize();
        if(!result.startsWith(data)) throw new IOException("Unsafe data path");
        Path p=data;
        if(Files.isSymbolicLink(p)) throw new IOException("Symlink in data path");
        for(Path part:data.relativize(result)) { p=p.resolve(part); if(Files.isSymbolicLink(p)) throw new IOException("Symlink in data path"); }
        return result;
    }
    private static void atomicWrite(Path target,byte[] bytes) throws IOException {
        Files.createDirectories(target.getParent());
        Path tmp=Files.createTempFile(target.getParent(),"write-",".tmp");
        try {
            Files.write(tmp,bytes);
            try { Files.move(tmp,target,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING); }
            catch(AtomicMoveNotSupportedException e) { Files.move(tmp,target,StandardCopyOption.REPLACE_EXISTING); }
        } finally { Files.deleteIfExists(tmp); }
    }
    private Revision seed(String id) throws IOException {
        Asset asset=assets.get("pages/"+id+".txt");
        if(asset==null) return null;
        byte[] body; try(InputStream in=resource("web/pages/"+id+".txt")) { body=in.readAllBytes(); }
        return new Revision(hash(body),"","snapshot",body);
    }
    private Revision revision(String id,String revision) throws IOException {
        Revision seed=seed(id);
        if(seed!=null && seed.hash.equals(revision)) return seed;
        Path meta=dataPath("pages/"+id+"/"+revision+".meta");
        if(!Files.isRegularFile(meta)) throw new IOException("Missing revision metadata");
        List<String> lines=Files.readAllLines(meta,StandardCharsets.UTF_8);
        return new Revision(revision,lines.get(0),lines.get(1),Files.readAllBytes(dataPath("pages/"+id+"/"+revision+".txt")));
    }
    private Revision current(String id) throws IOException {
        Path head=dataPath("pages/"+id+"/HEAD");
        if(Files.exists(head)) {
            String rev=Files.readString(head,StandardCharsets.UTF_8).trim();
            if(!validId(rev)) throw new IOException("Invalid revision head"); return revision(id,rev);
        }
        return seed(id);
    }
    private synchronized void page(HttpServletRequest req,HttpServletResponse res,String id) throws IOException {
        if(!validId(id) || !assets.containsKey("pages/"+id+".txt")) { message(req,res,404,"Unknown repository page"); return; }
        Revision old=current(id);
        if(req.getMethod().equals("GET")||req.getMethod().equals("HEAD")) {
            res.setHeader("ETag","\""+old.hash+"\""); send(req,res,200,"text/plain; charset=utf-8",old.body); return;
        }
        if(!req.getMethod().equals("PUT")) { message(req,res,405,"Use GET, HEAD or PUT"); return; }
        if(!authorize(req,res)) return;
        String expected=req.getHeader("If-Match");
        if(expected==null) { message(req,res,428,"If-Match revision is required"); return; }
        if(!expected.equals("\""+old.hash+"\"")) { res.setHeader("ETag","\""+old.hash+"\""); message(req,res,409,"Revision conflict. Reload or preserve a separate copy; no data was overwritten."); return; }
        byte[] body=limited(req,MAX_PAGE);
        // Reject invalid UTF-8 instead of silently changing a saved document.
        try { StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(body)); }
        catch(java.nio.charset.CharacterCodingException e) { message(req,res,400,"Page must be UTF-8"); return; }
        if(Arrays.equals(body,old.body)) { res.setHeader("ETag","\""+old.hash+"\""); message(req,res,200,"Unchanged"); return; }
        byte[] prefix=(old.hash+"\n").getBytes(StandardCharsets.UTF_8);
        byte[] combined=new byte[prefix.length+body.length]; System.arraycopy(prefix,0,combined,0,prefix.length); System.arraycopy(body,0,combined,prefix.length,body.length);
        String next=hash(combined), timestamp=Instant.now().toString();
        atomicWrite(dataPath("pages/"+id+"/"+next+".txt"),body);
        atomicWrite(dataPath("pages/"+id+"/"+next+".meta"),(old.hash+"\n"+timestamp+"\n").getBytes(StandardCharsets.UTF_8));
        atomicWrite(dataPath("pages/"+id+"/HEAD"),next.getBytes(StandardCharsets.UTF_8));
        res.setHeader("ETag","\""+next+"\""); message(req,res,201,"Revision saved");
    }
    private synchronized void history(HttpServletRequest req,HttpServletResponse res,String id) throws IOException {
        if(!validId(id)||!assets.containsKey("pages/"+id+".txt")) { message(req,res,404,"Unknown page"); return; }
        Revision r=current(id); StringBuilder json=new StringBuilder("["); int count=0;
        while(r!=null && count++<1000) {
            if(count>1) json.append(',');
            json.append("{\"revision\":").append(quote(r.hash)).append(",\"parent\":").append(quote(r.parent)).append(",\"updated\":").append(quote(r.updated)).append('}');
            if(r.parent.isEmpty()) break; r=revision(id,r.parent);
        }
        send(req,res,200,"application/json; charset=utf-8",json.append(']').toString().getBytes(StandardCharsets.UTF_8));
    }
    private void vault(HttpServletRequest req,HttpServletResponse res,String id) throws IOException {
        if(!validId(id)) { message(req,res,404,"Invalid vault hash"); return; }
        if(!authorize(req,res)) return; // Encrypted private uploads are not public repository attachments.
        Path file=dataPath("vault/"+id+".haikuvault");
        if(req.getMethod().equals("PUT")) {
            byte[] bytes=limited(req,MAX_VAULT);
            String value=new String(bytes,StandardCharsets.US_ASCII);
            if(!hash(bytes).equals(id)||!value.startsWith("haiku-vault-v1.")) { message(req,res,400,"Vault hash or format mismatch"); return; }
            try {
                byte[] packed=Base64.getDecoder().decode(value.substring(15));
                if(packed.length<46||packed[0]!=1) throw new IllegalArgumentException();
            } catch(IllegalArgumentException e) { message(req,res,400,"Malformed haiku-vault-v1 envelope"); return; }
            atomicWrite(file,bytes); message(req,res,201,"Encrypted envelope stored; the server has no decryption key"); return;
        }
        if(!Files.isRegularFile(file)) { message(req,res,404,"Vault envelope not found"); return; }
        res.setHeader("Content-Disposition","attachment; filename=\""+id+".haikuvault\"");
        send(req,res,200,"application/octet-stream",Files.readAllBytes(file));
    }
    @Override public void service(HttpServletRequest req,HttpServletResponse res) throws IOException {
        headers(res);
        try {
            String p=safePath(req.getRequestURI()), method=req.getMethod();
            if(method.equals("OPTIONS")) {
                res.setHeader("Allow",p.startsWith("/api/pages/")||p.startsWith("/api/vault/")?"GET, HEAD, PUT, OPTIONS":"GET, HEAD, OPTIONS");
                res.setStatus(204); res.setContentLength(0); return; // no DAV header: whole-file saving is not supported
            }
            if(!Arrays.asList("GET","HEAD","PUT").contains(method)) { res.setHeader("Allow","GET, HEAD, PUT"); message(req,res,405,"Method not allowed"); return; }
            if(p.startsWith("/api/pages/")) { page(req,res,p.substring(11)); return; }
            if(p.startsWith("/api/vault/")) { vault(req,res,p.substring(11)); return; }
            if(method.equals("PUT")) { message(req,res,405,"No write endpoint at this path"); return; }
            if(p.equals("/api/capabilities")) {
                String json="{\"edition\":"+quote(edition)+",\"server\":\"ACME/TJWS\",\"writable\":"+(token!=null)+",\"javacard\":\"host client prototype; not connected\",\"maxPageBytes\":"+MAX_PAGE+"}";
                send(req,res,200,"application/json; charset=utf-8",json.getBytes(StandardCharsets.UTF_8)); return;
            }
            if(p.startsWith("/api/history/")) { history(req,res,p.substring(13)); return; }
            if(p.startsWith("/api/revisions/")) {
                String[] bits=p.substring(15).split("/");
                if(bits.length!=2||!validId(bits[0])||!validId(bits[1])||!assets.containsKey("pages/"+bits[0]+".txt")) { message(req,res,404,"Unknown revision"); return; }
                Revision rev=revision(bits[0],bits[1]); send(req,res,200,"text/plain; charset=utf-8",rev.body); return;
            }
            if(p.equals("/")) { res.setStatus(302); res.setHeader("Location",landing); res.setContentLength(0); return; }
            if(p.endsWith("/")) p+="index.html";
            String name=p.substring(1), forcedMime=null;
            if(p.startsWith("/media/")) {
                String id=p.substring(7); forcedMime=mediaTypes.get(id);
                if(!validId(id)||forcedMime==null) { message(req,res,404,"Not a supported raster or DjVu object"); return; }
                name="vault/"+id;
            }
            Asset asset=assets.get(name);
            if(asset==null) { message(req,res,404,"Not found"); return; }
            boolean download=name.startsWith("vault/")&&forcedMime==null;
            res.setStatus(200); res.setContentType(download?"application/octet-stream":forcedMime!=null?forcedMime:asset.mime);
            res.setContentLength(asset.length); res.setHeader("ETag","\""+asset.hash+"\"");
            if(download) res.setHeader("Content-Disposition","attachment; filename=\""+name.substring(6)+"\"");
            if(!method.equals("HEAD")) try(InputStream in=resource("web/"+name)) { in.transferTo(res.getOutputStream()); }
        } catch(TooLarge e) { message(req,res,413,"Request body exceeds limit"); }
        catch(IllegalArgumentException e) { message(req,res,400,"Invalid request path or parameter"); }
        catch(FileNotFoundException|NoSuchFileException e) { message(req,res,404,"Not found"); }
        catch(IOException e) { System.err.println("Wiki I/O failure: "+e.getClass().getSimpleName()); message(req,res,500,"Storage or resource error"); }
    }
    public static void main(String[] args) throws Exception {
        int port=3003; String bind="127.0.0.1"; Path directory=Paths.get(".wiki-data");
        for(int i=0;i<args.length;i++) {
            if(args[i].equals("--port")) port=Integer.parseInt(args[++i]);
            else if(args[i].equals("--bind")) bind=args[++i];
            else if(args[i].equals("--data")) directory=Paths.get(args[++i]);
            else if(args[i].matches("[0-9]+")) port=Integer.parseInt(args[i]);
            else throw new IllegalArgumentException("Usage: java -jar wiki.in.a.jar [port] [--port 3003] [--bind 127.0.0.1] [--data .wiki-data]");
        }
        if(port<1024||port>65535) throw new IllegalArgumentException("Port must be 1024–65535");
        WikiServer wiki=new WikiServer(directory,System.getenv("WIKI_WRITE_TOKEN"));
        Map<String,Object> config=new HashMap<>();
        config.put(Serve.ARG_PORT,port); config.put(Serve.ARG_BINDADDRESS,bind); config.put(Serve.ARG_KEEPALIVE,Boolean.FALSE);
        Serve server=new Serve(config,System.err);
        server.addServlet("/*",wiki);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> { server.notifyStop(); server.destroyAllServlets(); }));
        System.out.println(wiki.edition+" · ACME/TJWS · http://"+bind+":"+port+"/ · "+(wiki.token==null?"read-only":"authorized writes enabled"));
        int status=server.serve(); if(status!=0) throw new IOException("ACME server stopped with status "+status);
    }
}
