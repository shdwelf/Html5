// Approximate heliocentric Kepler model for the offline Astronomy Observatory.
// Elements are educational J2000-scale snapshots, not precision ephemerides.
const DEG = Math.PI / 180;
export const J2000 = Date.UTC(2000, 0, 1, 12);

export const BODIES = [
  {id:"mercury",name:"Mercury",kind:"planet",a:.3871,e:.2056,i:7.005,node:48.33,peri:29.12,M0:174.80,period:87.969,size:.38,color:0xaeb3b8},
  {id:"venus",name:"Venus",kind:"planet",a:.7233,e:.0068,i:3.395,node:76.68,peri:54.88,M0:50.42,period:224.701,size:.95,color:0xffd28a},
  {id:"earth",name:"Earth",kind:"planet",a:1,e:.0167,i:.0001,node:-11.26,peri:114.21,M0:357.52,period:365.256,size:1,color:0x4fa9ff},
  {id:"mars",name:"Mars",kind:"planet",a:1.5237,e:.0934,i:1.85,node:49.56,peri:286.50,M0:19.41,period:686.98,size:.53,color:0xff694d},
  {id:"jupiter",name:"Jupiter",kind:"planet",a:5.2029,e:.0484,i:1.303,node:100.46,peri:273.87,M0:20.02,period:4332.59,size:2.5,color:0xe7bd91},
  {id:"saturn",name:"Saturn",kind:"planet",a:9.537,e:.0542,i:2.489,node:113.67,peri:339.39,M0:317.02,period:10759.2,size:2.1,color:0xf5d77f},
  {id:"uranus",name:"Uranus",kind:"planet",a:19.191,e:.0472,i:.773,node:74.01,peri:96.99,M0:142.24,period:30688.5,size:1.55,color:0x8be7ed},
  {id:"neptune",name:"Neptune",kind:"planet",a:30.069,e:.0086,i:1.77,node:131.78,peri:273.19,M0:256.23,period:60182,size:1.5,color:0x547dff},
  {id:"ceres",name:"Ceres",kind:"dwarf",a:2.768,e:.076,i:10.59,node:80.3,peri:73.6,M0:95.9,period:1682,size:.28,color:0xc4c1b8},
  {id:"pluto",name:"Pluto",kind:"dwarf",a:39.482,e:.249,i:17.14,node:110.3,peri:113.8,M0:14.5,period:90560,size:.35,color:0xd9c0a8},
  {id:"haumea",name:"Haumea",kind:"dwarf",a:43.12,e:.195,i:28.2,node:122.0,peri:240.7,M0:205,period:103774,size:.25,color:0xd8ebff},
  {id:"makemake",name:"Makemake",kind:"dwarf",a:45.43,e:.159,i:29.0,node:79.6,peri:294.8,M0:166,period:111845,size:.25,color:0xd5906f},
  {id:"eris",name:"Eris",kind:"dwarf",a:67.78,e:.44,i:44.0,node:35.95,peri:151.6,M0:204,period:203830,size:.28,color:0xe8edf7},
  {id:"bennu",name:"101955 Bennu",kind:"neo",a:1.1264,e:.2037,i:6.03,node:2.06,peri:66.22,M0:101.7,period:436.65,size:.12,color:0xff6685},
  {id:"apophis",name:"99942 Apophis",kind:"neo",a:.9224,e:.1912,i:3.34,node:204.0,peri:126.7,M0:180,period:323.6,size:.11,color:0xff8d66},
  {id:"phaethon",name:"3200 Phaethon",kind:"neo",a:1.271,e:.89,i:22.3,node:265.2,peri:322.1,M0:210,period:523.6,size:.14,color:0xffb35c},
  {id:"eros",name:"433 Eros",kind:"asteroid",a:1.458,e:.223,i:10.83,node:304.3,peri:178.8,M0:320,period:643.2,size:.16,color:0xb8a99b},
  {id:"vesta",name:"4 Vesta",kind:"asteroid",a:2.362,e:.089,i:7.14,node:103.8,peri:150.9,M0:20,period:1325.9,size:.22,color:0xd1c9bd},
  {id:"halley",name:"1P/Halley",kind:"comet",a:17.834,e:.967,i:162.26,node:58.42,peri:111.33,M0:38.4,period:27500,size:.16,color:0x8fffea},
  {id:"swift-tuttle",name:"109P/Swift–Tuttle",kind:"comet",a:26.09,e:.963,i:113.45,node:139.4,peri:152.98,M0:358,period:48620,size:.15,color:0x6fffd5},
  {id:"tempel-tuttle",name:"55P/Tempel–Tuttle",kind:"comet",a:10.33,e:.906,i:162.5,node:235.3,peri:172.5,M0:12,period:12055,size:.14,color:0x78dbff},
  {id:"encke",name:"2P/Encke",kind:"comet",a:2.216,e:.848,i:11.78,node:334.6,peri:186.5,M0:160,period:1204,size:.13,color:0xa2ffdf},
  {id:"moon",name:"Moon",kind:"moon",parent:"earth",a:.00257,e:.055,i:5.15,node:125.1,peri:318.1,M0:135.3,period:27.32,size:.27,color:0xd8dbe0},
  {id:"io",name:"Io",kind:"moon",parent:"jupiter",a:.00282,e:.004,i:.04,node:43.98,peri:84.1,M0:170,period:1.769,size:.29,color:0xffdc72},
  {id:"europa",name:"Europa",kind:"moon",parent:"jupiter",a:.00449,e:.009,i:.47,node:219.1,peri:88.97,M0:40,period:3.551,size:.25,color:0xe0d4b0},
  {id:"ganymede",name:"Ganymede",kind:"moon",parent:"jupiter",a:.00716,e:.0013,i:.2,node:63.5,peri:192.4,M0:120,period:7.155,size:.41,color:0xb9a58c},
  {id:"callisto",name:"Callisto",kind:"moon",parent:"jupiter",a:.01259,e:.0074,i:.28,node:298.8,peri:52.6,M0:280,period:16.689,size:.38,color:0x8f8377},
  {id:"titan",name:"Titan",kind:"moon",parent:"saturn",a:.00817,e:.029,i:.35,node:28.1,peri:186.6,M0:65,period:15.945,size:.4,color:0xe5ad55},
  {id:"triton",name:"Triton",kind:"moon",parent:"neptune",a:.00237,e:.00002,i:156.9,node:177.6,peri:0,M0:300,period:5.877,size:.21,color:0xb6dce8},
];

export const METEOR_STREAMS = [
  {id:"perseids",name:"Perseids",parent:"109P/Swift–Tuttle",peak:"Aug 12",color:0x67e8f9,a:26.09,e:.963,i:113.45,node:139.4,peri:152.98},
  {id:"geminids",name:"Geminids",parent:"3200 Phaethon",peak:"Dec 14",color:0xfbbf24,a:1.271,e:.89,i:22.3,node:265.2,peri:322.1},
  {id:"leonids",name:"Leonids",parent:"55P/Tempel–Tuttle",peak:"Nov 17",color:0xa78bfa,a:10.33,e:.906,i:162.5,node:235.3,peri:172.5},
  {id:"eta-aquariids",name:"Eta Aquariids",parent:"1P/Halley",peak:"May 6",color:0x34d399,a:17.834,e:.967,i:162.26,node:58.42,peri:111.33},
  {id:"taurids",name:"Taurids",parent:"2P/Encke",peak:"Nov 5",color:0xfb7185,a:2.216,e:.848,i:11.78,node:334.6,peri:186.5},
];

export function solveKepler(meanAnomaly, eccentricity, iterations = 12) {
  const M = ((meanAnomaly % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let E = eccentricity < .8 ? M : Math.PI;
  for (let j = 0; j < iterations; j++) E -= (E - eccentricity * Math.sin(E) - M) / (1 - eccentricity * Math.cos(E));
  return E;
}

export function orbitalPosition(body, days = 0, anomalyOverride = null) {
  const M = anomalyOverride == null ? (body.M0 || 0) * DEG + Math.PI * 2 * days / body.period : anomalyOverride;
  const E = solveKepler(M, body.e);
  const x0 = body.a * (Math.cos(E) - body.e);
  const y0 = body.a * Math.sqrt(1 - body.e * body.e) * Math.sin(E);
  const O = (body.node || 0) * DEG, w = (body.peri || 0) * DEG, inc = (body.i || 0) * DEG;
  const cw=Math.cos(w),sw=Math.sin(w),cO=Math.cos(O),sO=Math.sin(O),ci=Math.cos(inc),si=Math.sin(inc);
  const x = (cO*cw-sO*sw*ci)*x0 + (-cO*sw-sO*cw*ci)*y0;
  const y = (sw*si)*x0 + (cw*si)*y0;
  const z = (sO*cw+cO*sw*ci)*x0 + (-sO*sw+cO*cw*ci)*y0;
  return {x,y,z,r:Math.hypot(x,y,z),E};
}

export function orbitPath(body, segments = 180) {
  return Array.from({length:segments+1},(_,i)=>orbitalPosition(body,0,i/segments*Math.PI*2));
}

export function daysSinceJ2000(date = new Date()) { return (date.getTime() - J2000) / 86400000; }
export function bodyById(id) { return BODIES.find((b)=>b.id===id) || null; }
