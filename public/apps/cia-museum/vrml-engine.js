/*
 * MuseumVRML — a deliberately small, dependency-free VRML97 viewer.
 * Supported nodes: Transform, Group, Shape, Appearance, Material,
 * Box, Cylinder, Cone and Sphere, including DEF/USE references.
 * This is enough to render every hand-authored model shipped with this app.
 */

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

const M4={
  identity(){const m=new Float32Array(16);m[0]=m[5]=m[10]=m[15]=1;return m},
  multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=a[k*4+r]*b[c*4+k];o[c*4+r]=v}return o},
  translation(v){const m=M4.identity();m[12]=v[0];m[13]=v[1];m[14]=v[2];return m},
  scaling(v){const m=M4.identity();m[0]=v[0];m[5]=v[1];m[10]=v[2];return m},
  rotation(v){let [x,y,z,a]=v;const l=Math.hypot(x,y,z)||1;x/=l;y/=l;z/=l;const c=Math.cos(a),s=Math.sin(a),t=1-c,m=M4.identity();m[0]=x*x*t+c;m[1]=y*x*t+z*s;m[2]=z*x*t-y*s;m[4]=x*y*t-z*s;m[5]=y*y*t+c;m[6]=z*y*t+x*s;m[8]=x*z*t+y*s;m[9]=y*z*t-x*s;m[10]=z*z*t+c;return m},
  perspective(fov,aspect,near,far){const m=new Float32Array(16),f=1/Math.tan(fov/2);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m},
  lookAt(eye,center,up=[0,1,0]){const m=new Float32Array(16);let zx=eye[0]-center[0],zy=eye[1]-center[1],zz=eye[2]-center[2],l=Math.hypot(zx,zy,zz)||1;zx/=l;zy/=l;zz/=l;let xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;l=Math.hypot(xx,xy,xz)||1;xx/=l;xy/=l;xz/=l;const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;m[0]=xx;m[1]=yx;m[2]=zx;m[4]=xy;m[5]=yy;m[6]=zy;m[8]=xz;m[9]=yz;m[10]=zz;m[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2]);m[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2]);m[14]=-(zx*eye[0]+zy*eye[1]+zz*eye[2]);m[15]=1;return m},
  normal(m){const a=m[0],b=m[1],c=m[2],d=m[4],e=m[5],f=m[6],g=m[8],h=m[9],i=m[10],det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)||1,o=new Float32Array(9),q=1/det;o[0]=(e*i-f*h)*q;o[1]=(c*h-b*i)*q;o[2]=(b*f-c*e)*q;o[3]=(f*g-d*i)*q;o[4]=(a*i-c*g)*q;o[5]=(c*d-a*f)*q;o[6]=(d*h-e*g)*q;o[7]=(b*g-a*h)*q;o[8]=(a*e-b*d)*q;return o},
  point(m,p){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]]},
  vec4(m,p){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12]*p[3],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13]*p[3],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]*p[3],m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15]*p[3]]}
};

class VRMLParser{
  constructor(text){
    const clean=text.replace(/^\s*#VRML[^\n]*$/gmi,"").replace(/#[^\n]*/g,"");
    this.tokens=clean.match(/"(?:\\.|[^"\\])*"|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?|[A-Za-z_][\w.-]*|[{}\[\],]/g)||[];
    this.i=0;this.defs=new Map();
  }
  peek(n=0){return this.tokens[this.i+n]}
  take(){return this.tokens[this.i++]}
  eat(t){if(this.peek()===t){this.i++;return true}return false}
  number(fallback=0){const n=Number(this.take());return Number.isFinite(n)?n:fallback}
  vec(n,defaults=[]){const a=[];for(let i=0;i<n;i++)a.push(this.number(defaults[i]??0));return a}
  parse(){const nodes=[];while(this.i<this.tokens.length){const before=this.i,node=this.node();if(node)nodes.push(node);if(this.i===before)this.i++}return {type:"Group",children:nodes}}
  node(){
    if(this.eat(","))return null;
    if(this.eat("DEF")){const name=this.take(),value=this.node();if(value)this.defs.set(name,value);return value}
    if(this.eat("USE"))return this.defs.get(this.take())||null;
    const type=this.peek();
    if(!type||!["Transform","Group","Shape","Appearance","Material","Box","Cylinder","Cone","Sphere"].includes(type)){this.skipNode();return null}
    this.take();
    if(!this.eat("{"))return null;
    if(type==="Transform")return this.transform();
    if(type==="Group")return this.group();
    if(type==="Shape")return this.shape();
    if(type==="Appearance")return this.appearance();
    if(type==="Material")return this.material();
    return this.geometry(type);
  }
  transform(){const n={type:"Transform",translation:[0,0,0],rotation:[0,1,0,0],scale:[1,1,1],children:[]};while(this.i<this.tokens.length&&!this.eat("}")){const f=this.take();if(f==="translation")n.translation=this.vec(3);else if(f==="rotation")n.rotation=this.vec(4,[0,1,0,0]);else if(f==="scale")n.scale=this.vec(3,[1,1,1]);else if(f==="children")n.children=this.children();else this.skipValue()}return n}
  group(){const n={type:"Group",children:[]};while(this.i<this.tokens.length&&!this.eat("}")){const f=this.take();if(f==="children")n.children=this.children();else this.skipValue()}return n}
  children(){const a=[];if(this.eat("[")){while(this.i<this.tokens.length&&!this.eat("]")){const before=this.i,n=this.node();if(n)a.push(n);if(before===this.i)this.i++}}else{const n=this.node();if(n)a.push(n)}return a}
  shape(){const n={type:"Shape",appearance:null,geometry:null};while(this.i<this.tokens.length&&!this.eat("}")){const f=this.take();if(f==="appearance")n.appearance=this.node();else if(f==="geometry")n.geometry=this.node();else this.skipValue()}return n}
  appearance(){const n={type:"Appearance",material:null};while(this.i<this.tokens.length&&!this.eat("}")){const f=this.take();if(f==="material")n.material=this.node();else this.skipValue()}return n}
  material(){const n={type:"Material",diffuseColor:[.65,.67,.63],emissiveColor:[0,0,0],specularColor:[.12,.12,.12],shininess:.2,transparency:0};while(this.i<this.tokens.length&&!this.eat("}")){const f=this.take();if(["diffuseColor","emissiveColor","specularColor"].includes(f))n[f]=this.vec(3);else if(["shininess","transparency","ambientIntensity"].includes(f))n[f]=this.number();else this.skipValue()}return n}
  geometry(type){const n={type};if(type==="Box")n.size=[2,2,2];if(type==="Cylinder"){n.radius=1;n.height=2}if(type==="Cone"){n.bottomRadius=1;n.height=2}if(type==="Sphere")n.radius=1;while(this.i<this.tokens.length&&!this.eat("}")){const f=this.take();if(f==="size")n.size=this.vec(3);else if(f==="radius"||f==="bottomRadius"||f==="height")n[f]=this.number();else this.skipValue()}return n}
  skipNode(){
    if(this.peek()==="DEF"){this.i+=2;this.skipNode();return}
    if(this.peek()==="USE"){this.i+=2;return}
    this.i++;
    if(!this.eat("{"))return;
    let d=1;while(this.i<this.tokens.length&&d){const t=this.take();if(t==="{")d++;else if(t==="}")d--}
  }
  skipValue(){
    if(this.peek()==="["){let d=0;do{const t=this.take();if(t==="[")d++;else if(t==="]")d--}while(this.i<this.tokens.length&&d);return}
    if(this.peek()==="DEF"||this.peek()==="USE"||this.peek(1)==="{"){this.node();return}
    this.i++;
  }
}

function cube(size){const [w,h,d]=size,HX=w/2,HY=h/2,HZ=d/2;const p=[-HX,-HY,-HZ,HX,-HY,-HZ,HX,HY,-HZ,-HX,HY,-HZ,HX,-HY,HZ,-HX,-HY,HZ,-HX,HY,HZ,HX,HY,HZ,-HX,HY,-HZ,HX,HY,-HZ,HX,HY,HZ,-HX,HY,HZ,-HX,-HY,HZ,HX,-HY,HZ,HX,-HY,-HZ,-HX,-HY,-HZ,HX,-HY,-HZ,HX,-HY,HZ,-HX,-HY,HZ,-HX,-HY,-HZ,HX,HY,-HZ,HX,-HY,-HZ,-HX,-HY,-HZ,-HX,HY,-HZ,HX,-HY,HZ,HX,HY,HZ,-HX,HY,HZ,-HX,-HY,HZ],n=[0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0],idx=[];for(let i=0;i<6;i++){const o=i*4;idx.push(o,o+1,o+2,o,o+2,o+3)}return mesh(p,n,idx,size)}
function cylinder(radius,height,segments=28){const p=[],n=[],idx=[];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,x=Math.cos(a),z=Math.sin(a);p.push(x*radius,-height/2,z*radius,x*radius,height/2,z*radius);n.push(x,0,z,x,0,z)}for(let i=0;i<segments;i++)idx.push(i*2,i*2+2,i*2+1,i*2+1,i*2+2,i*2+3);let o=p.length/3;for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;p.push(Math.cos(a)*radius,height/2,Math.sin(a)*radius);n.push(0,1,0)}p.push(0,height/2,0);n.push(0,1,0);for(let i=0;i<segments;i++)idx.push(o+i,o+segments+1,o+i+1);o=p.length/3;for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;p.push(Math.cos(a)*radius,-height/2,Math.sin(a)*radius);n.push(0,-1,0)}p.push(0,-height/2,0);n.push(0,-1,0);for(let i=0;i<segments;i++)idx.push(o+i+1,o+segments+1,o+i);return mesh(p,n,idx,[radius*2,height,radius*2])}
function cone(radius,height,segments=28){const p=[],n=[],idx=[],s=radius/Math.hypot(radius,height),y=height/Math.hypot(radius,height);for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,x=Math.cos(a),z=Math.sin(a);p.push(x*radius,-height/2,z*radius,0,height/2,0);n.push(x*y,s,z*y,x*y,s,z*y)}for(let i=0;i<segments;i++)idx.push(i*2,i*2+2,i*2+1);const o=p.length/3;for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;p.push(Math.cos(a)*radius,-height/2,Math.sin(a)*radius);n.push(0,-1,0)}p.push(0,-height/2,0);n.push(0,-1,0);for(let i=0;i<segments;i++)idx.push(o+i+1,o+segments+1,o+i);return mesh(p,n,idx,[radius*2,height,radius*2])}
function sphere(radius,segments=20){const p=[],n=[],idx=[];for(let y=0;y<=segments;y++){const t=y/segments*Math.PI,st=Math.sin(t),ct=Math.cos(t);for(let x=0;x<=segments;x++){const a=x/segments*Math.PI*2,nx=Math.cos(a)*st,nz=Math.sin(a)*st;p.push(nx*radius,ct*radius,nz*radius);n.push(nx,ct,nz)}}for(let y=0;y<segments;y++)for(let x=0;x<segments;x++){const a=y*(segments+1)+x,b=a+segments+1;idx.push(a,b,a+1,b,b+1,a+1)}return mesh(p,n,idx,[radius*2,radius*2,radius*2])}
function mesh(p,n,idx,size){return {positions:new Float32Array(p),normals:new Float32Array(n),indices:new Uint16Array(idx),size}}

const vertexShader=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uProjection;uniform mat4 uView;uniform mat4 uModel;uniform mat3 uNormalMatrix;varying vec3 vNormal;varying vec3 vWorld;void main(){vec4 world=uModel*vec4(aPosition,1.0);vWorld=world.xyz;vNormal=normalize(uNormalMatrix*aNormal);gl_Position=uProjection*uView*world;}`;
const fragmentShader=`precision mediump float;varying vec3 vNormal;varying vec3 vWorld;uniform vec3 uColor;uniform vec3 uEmissive;uniform vec3 uEye;uniform vec3 uFog;uniform float uAlpha;void main(){vec3 N=normalize(vNormal);vec3 L=normalize(vec3(-.45,.85,.28));vec3 V=normalize(uEye-vWorld);vec3 H=normalize(L+V);float d=max(dot(N,L),0.0);float s=pow(max(dot(N,H),0.0),28.0);float rim=pow(1.0-max(dot(N,V),0.0),2.5);vec3 c=uColor*(.36+d*.64)+vec3(.72,.67,.53)*s*.22+uColor*rim*.12+uEmissive;float dist=length(uEye-vWorld);float fog=smoothstep(75.0,220.0,dist);c=mix(c,uFog,fog);gl_FragColor=vec4(c,uAlpha);}`;

function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||"Shader compile failed");return s}

export class VRMLViewer{
  constructor(canvas,options={}){
    this.canvas=canvas;this.options=options;this.gl=canvas.getContext("webgl",{antialias:true,alpha:false,preserveDrawingBuffer:false});
    if(!this.gl)throw new Error("WebGL is unavailable in this browser.");
    this.objects=[];this.buffers=[];this.sourceText="";this.fileName="model.wrl";this.bounds={min:[-1,-1,-1],max:[1,1,1]};this.autoRotate=false;this.onFrame=null;this.destroyed=false;
    this.camera={theta:.72,phi:.78,distance:20,target:[0,0,0],fov:38};this.cameraGoal=null;this.drag=null;this.lastPV=M4.identity();this.lastEye=[0,0,10];
    this.clear=options.clear||[.78,.81,.76];this.fog=options.fog||this.clear;
    this.setupGL();this.bind();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();this.loop(0);
  }
  setupGL(){const gl=this.gl,p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,vertexShader));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,fragmentShader));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||"Shader link failed");this.program=p;this.locations={position:gl.getAttribLocation(p,"aPosition"),normal:gl.getAttribLocation(p,"aNormal"),projection:gl.getUniformLocation(p,"uProjection"),view:gl.getUniformLocation(p,"uView"),model:gl.getUniformLocation(p,"uModel"),normalMatrix:gl.getUniformLocation(p,"uNormalMatrix"),color:gl.getUniformLocation(p,"uColor"),emissive:gl.getUniformLocation(p,"uEmissive"),eye:gl.getUniformLocation(p,"uEye"),fog:gl.getUniformLocation(p,"uFog"),alpha:gl.getUniformLocation(p,"uAlpha")};gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA)}
  bind(){
    this.canvas.addEventListener("pointerdown",e=>{this.canvas.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,pan:e.shiftKey||e.button===2};this.autoRotate=false});
    this.canvas.addEventListener("pointermove",e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(this.drag.pan){const k=this.camera.distance*.0017,ct=Math.cos(this.camera.theta),st=Math.sin(this.camera.theta);this.camera.target[0]-=dx*k*ct+dy*k*st;this.camera.target[2]+=dx*k*st-dy*k*ct;this.camera.target[1]+=dy*k*.45}else{this.camera.theta-=dx*.006;this.camera.phi=clamp(this.camera.phi-dy*.006,.08,1.5)}this.drag.x=e.clientX;this.drag.y=e.clientY});
    this.canvas.addEventListener("pointerup",()=>this.drag=null);this.canvas.addEventListener("pointercancel",()=>this.drag=null);this.canvas.addEventListener("contextmenu",e=>e.preventDefault());
    this.canvas.addEventListener("wheel",e=>{e.preventDefault();this.camera.distance=clamp(this.camera.distance*Math.exp(e.deltaY*.0012),.6,500);this.cameraGoal=null},{passive:false});
    this.canvas.addEventListener("keydown",e=>{const step=.09;if(e.key==="ArrowLeft")this.camera.theta+=step;else if(e.key==="ArrowRight")this.camera.theta-=step;else if(e.key==="ArrowUp")this.camera.phi=clamp(this.camera.phi+step,.08,1.5);else if(e.key==="ArrowDown")this.camera.phi=clamp(this.camera.phi-step,.08,1.5);else if(e.key==="+"||e.key==="=")this.camera.distance*=.9;else if(e.key==="-")this.camera.distance*=1.1;else return;e.preventDefault()})
  }
  async load(url){const response=await fetch(url);if(!response.ok)throw new Error(`Unable to read ${url} (${response.status})`);const text=await response.text();this.fileName=url.split("/").pop()||"model.wrl";this.loadText(text);return text}
  loadText(text){this.sourceText=text;const root=new VRMLParser(text).parse();this.clearScene();this.flatten(root,M4.identity());this.computeBounds();this.frameScene();return this.objects.length}
  flatten(node,parent,material=null){if(!node)return;if(node.type==="Group"){node.children.forEach(c=>this.flatten(c,parent,material));return}if(node.type==="Transform"){let local=M4.multiply(parent,M4.translation(node.translation));local=M4.multiply(local,M4.rotation(node.rotation));local=M4.multiply(local,M4.scaling(node.scale));node.children.forEach(c=>this.flatten(c,local,material));return}if(node.type==="Shape"&&node.geometry){const mat=node.appearance?.material||material||{diffuseColor:[.65,.67,.63],emissiveColor:[0,0,0],transparency:0};let data;if(node.geometry.type==="Box")data=cube(node.geometry.size);else if(node.geometry.type==="Cylinder")data=cylinder(node.geometry.radius,node.geometry.height);else if(node.geometry.type==="Cone")data=cone(node.geometry.bottomRadius,node.geometry.height);else if(node.geometry.type==="Sphere")data=sphere(node.geometry.radius);if(data)this.objects.push({buffer:this.upload(data),model:parent,size:data.size,color:mat.diffuseColor||[.65,.67,.63],emissive:mat.emissiveColor||[0,0,0],alpha:1-clamp(mat.transparency||0,0,.92)});return}}
  upload(data){const gl=this.gl,position=gl.createBuffer(),normal=gl.createBuffer(),index=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,position);gl.bufferData(gl.ARRAY_BUFFER,data.positions,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.bufferData(gl.ARRAY_BUFFER,data.normals,gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data.indices,gl.STATIC_DRAW);const b={position,normal,index,count:data.indices.length};this.buffers.push(b);return b}
  clearScene(){const gl=this.gl;for(const b of this.buffers){gl.deleteBuffer(b.position);gl.deleteBuffer(b.normal);gl.deleteBuffer(b.index)}this.buffers=[];this.objects=[]}
  computeBounds(){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const o of this.objects){const s=o.size.map(v=>v/2);for(const x of [-s[0],s[0]])for(const y of [-s[1],s[1]])for(const z of [-s[2],s[2]]){const p=M4.point(o.model,[x,y,z]);for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i])}}}if(!this.objects.length){min.splice(0,3,-1,-1,-1);max.splice(0,3,1,1,1)}this.bounds={min,max}}
  frameScene(animate=false){const {min,max}=this.bounds,target=min.map((n,i)=>(n+max[i])/2),radius=Math.max(1,Math.hypot(max[0]-min[0],max[1]-min[1],max[2]-min[2])*.53),next={theta:this.options.theta??.72,phi:this.options.phi??.68,distance:radius*1.72,target,fov:this.camera.fov};if(animate)this.cameraGoal=next;else Object.assign(this.camera,next)}
  setCamera(values,animate=true){const next={theta:values.theta??this.camera.theta,phi:values.phi??this.camera.phi,distance:values.distance??this.camera.distance,target:values.target?[...values.target]:[...this.camera.target],fov:values.fov??this.camera.fov};if(animate)this.cameraGoal=next;else Object.assign(this.camera,next)}
  getCamera(){return {theta:this.camera.theta,phi:this.camera.phi,distance:this.camera.distance,target:[...this.camera.target],fov:this.camera.fov}}
  resize(){const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(this.canvas.clientHeight*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}}
  loop(time){if(this.destroyed)return;requestAnimationFrame(t=>this.loop(t));if(this.autoRotate&&!this.drag)this.camera.theta+=.0008;if(this.cameraGoal){const c=this.camera,g=this.cameraGoal,ease=.085;c.theta+=(g.theta-c.theta)*ease;c.phi+=(g.phi-c.phi)*ease;c.distance+=(g.distance-c.distance)*ease;c.fov+=(g.fov-c.fov)*ease;for(let i=0;i<3;i++)c.target[i]+=(g.target[i]-c.target[i])*ease;if(Math.abs(c.distance-g.distance)<.01&&Math.abs(c.theta-g.theta)<.001)this.cameraGoal=null}this.render(time);if(this.onFrame)this.onFrame(this)}
  render(){const gl=this.gl,c=this.camera,aspect=this.canvas.width/Math.max(1,this.canvas.height),cp=Math.cos(c.phi),eye=[c.target[0]+Math.sin(c.theta)*cp*c.distance,c.target[1]+Math.sin(c.phi)*c.distance,c.target[2]+Math.cos(c.theta)*cp*c.distance],projection=M4.perspective(c.fov*Math.PI/180,aspect,.08,1000),view=M4.lookAt(eye,c.target);this.lastEye=eye;this.lastPV=M4.multiply(projection,view);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(this.clear[0],this.clear[1],this.clear[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);const u=this.locations;gl.uniformMatrix4fv(u.projection,false,projection);gl.uniformMatrix4fv(u.view,false,view);gl.uniform3fv(u.eye,eye);gl.uniform3fv(u.fog,this.fog);const opaque=this.objects.filter(o=>o.alpha>.97),transparent=this.objects.filter(o=>o.alpha<=.97);for(const list of [opaque,transparent]){for(const o of list){gl.depthMask(o.alpha>.97);gl.bindBuffer(gl.ARRAY_BUFFER,o.buffer.position);gl.enableVertexAttribArray(u.position);gl.vertexAttribPointer(u.position,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,o.buffer.normal);gl.enableVertexAttribArray(u.normal);gl.vertexAttribPointer(u.normal,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.buffer.index);gl.uniformMatrix4fv(u.model,false,o.model);gl.uniformMatrix3fv(u.normalMatrix,false,M4.normal(o.model));gl.uniform3fv(u.color,o.color);gl.uniform3fv(u.emissive,o.emissive);gl.uniform1f(u.alpha,o.alpha);gl.drawElements(gl.TRIANGLES,o.buffer.count,gl.UNSIGNED_SHORT,0)}}gl.depthMask(true)}
  project(point){const c=M4.vec4(this.lastPV,[point[0],point[1],point[2],1]);if(c[3]<=0)return null;const x=c[0]/c[3],y=c[1]/c[3],z=c[2]/c[3],r=this.canvas.getBoundingClientRect();return {x:(x*.5+.5)*r.width,y:(1-(y*.5+.5))*r.height,visible:z>-1&&z<1&&x>-1.15&&x<1.15&&y>-1.15&&y<1.15}}
  destroy(){this.destroyed=true;this.resizeObserver?.disconnect();this.clearScene()}
}

export function parseVRML(text){return new VRMLParser(text).parse()}
