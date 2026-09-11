/**
 * GLENDORA HIGH · three.js front end for the arena shooter.
 *
 * Renders the campus model with three.js, locks the pointer, and drives the
 * pure simulation in ghs-shooter.js.  All game rules live there; this file
 * only draws and collects input, so the headless harness covers the same
 * logic the player is using.
 */

import * as THREE from "../vendor/three.module.min.js";
import { buildModel } from "./ghs-model.js";
import { buildWorld, createGame, step, fire, reload, scoreboard, PLAYER } from "./ghs-shooter.js";

const GROUND_COLORS = {
  yard: [0x4e7a3c, 0.1],
  field: [0x426b31, 0.09],
  court: [0x2f6b52, 0.06],
  track: [0xb0522c, 0.07],
  parking: [0x54575b, 0.07],
  road: [0x3b3e41, 0.06],
  path: [0xb6ad9c, 0.08],
  plaza: [0x98917f, 0.07],
  interior: [0x7c7367, 0.05],
  block: [0x6d665e, 0.05],
  doorway: [0xb6ad9c, 0.05],
};

const WALL_COLORS = {
  classroom: 0xd8cbb2,
  admin: 0xa4553c,
  gym: 0xb9b6ad,
  hall: 0xc2b49a,
  default: 0xcfc6b4,
};

/** map metres (x east, y north) → three.js (x east, y up, z south) */
const toThree = (x, y, z = 0) => new THREE.Vector3(x, z, -y);

function surfaceAt(world, x, y) {
  for (const s of world.slabs) {
    if (x < s.x0 || x > s.x1) continue;
    const t = (x - s.x0) / (s.x1 - s.x0 || 1);
    const lo = s.yl0 + (s.yl1 - s.yl0) * t;
    const hi = s.yh0 + (s.yh1 - s.yh0) * t;
    if (y >= lo && y <= hi) return s.kind;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * scene
 * ------------------------------------------------------------------ */

function buildGround(model, world, res = 150) {
  const { bounds } = model;
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  const geo = new THREE.PlaneGeometry(w, h, res, res);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + (bounds.minX + bounds.maxX) / 2;
    const y = -(pos.getZ(i) - (bounds.minY + bounds.maxY) / 2);
    const elev = model.ground(x, y);
    pos.setY(i, elev);
    const kind = surfaceAt(world, x, y) || "yard";
    const [hex, jitter] = GROUND_COLORS[kind] || GROUND_COLORS.yard;
    c.setHex(hex);
    const n = (Math.sin(x * 1.7) * Math.cos(y * 1.3) + 1) * 0.5;
    const k = 1 - jitter / 2 + n * jitter;
    colors[i * 3] = c.r * k;
    colors[i * 3 + 1] = c.g * k;
    colors[i * 3 + 2] = c.b * k;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((bounds.minX + bounds.maxX) / 2, 0, -(bounds.minY + bounds.maxY) / 2);
  mesh.name = "ground";
  return mesh;
}

function shapeFromRing(ring) {
  const shape = new THREE.Shape();
  for (let i = 0; i < ring.length; i += 2) {
    if (i === 0) shape.moveTo(ring[i], ring[i + 1]);
    else shape.lineTo(ring[i], ring[i + 1]);
  }
  shape.closePath();
  return shape;
}

function buildBuildings(model) {
  const group = new THREE.Group();
  group.name = "buildings";
  for (const b of model.buildings) {
    const ring = b.ring || b.box;
    if (!ring || ring.length < 6) continue;
    const geo = new THREE.ExtrudeGeometry(shapeFromRing(ring), {
      depth: Math.max(2.4, b.h),
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);
    const cx = ring.reduce((s, v, i) => (i % 2 === 0 ? s + v : s), 0) / (ring.length / 2);
    const cy = ring.reduce((s, v, i) => (i % 2 === 1 ? s + v : s), 0) / (ring.length / 2);
    const base = model.ground(cx, cy) - 0.6;
    const mat = new THREE.MeshLambertMaterial({
      color: WALL_COLORS[b.kind] || WALL_COLORS.default,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = base;
    mesh.name = b.name || "building";
    mesh.userData = { building: b };
    group.add(mesh);

    // roof cap so the top reads as a parapet from the air
    const roofGeo = new THREE.ExtrudeGeometry(shapeFromRing(ring), { depth: 0.5, bevelEnabled: false });
    roofGeo.rotateX(-Math.PI / 2);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshLambertMaterial({ color: 0x8d8579 }));
    roof.position.y = base + Math.max(2.4, b.h);
    group.add(roof);
  }
  return group;
}

function buildTrees(model) {
  const group = new THREE.Group();
  group.name = "trees";
  const count = model.trees.length;
  if (!count) return group;
  const trunk = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.16, 0.22, 2.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x5c452f }),
    count,
  );
  const crown = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.9, 5.4, 7),
    new THREE.MeshLambertMaterial({ color: 0x2f5f2c }),
    count,
  );
  const m = new THREE.Matrix4();
  model.trees.forEach((t, i) => {
    const g = model.ground(t.x, t.y);
    const s = 0.8 + ((i * 37) % 10) / 22;
    m.makeScale(s, s, s).setPosition(toThree(t.x, t.y, g + 1.1 * s));
    trunk.setMatrixAt(i, m);
    m.makeScale(s, s, s).setPosition(toThree(t.x, t.y, g + (2.2 + 2.4) * s));
    crown.setMatrixAt(i, m);
  });
  group.add(trunk, crown);
  return group;
}

function buildCampusEdge(model) {
  const pts = [];
  for (let i = 0; i < model.campus.length; i += 2) {
    pts.push(toThree(model.campus[i], model.campus[i + 1], model.ground(model.campus[i], model.campus[i + 1]) + 0.4));
  }
  pts.push(pts[0].clone());
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf2e9c9, transparent: true, opacity: 0.45 }));
}

function buildGun() {
  const gun = new THREE.Group();
  const steel = new THREE.MeshLambertMaterial({ color: 0x2b2f33 });
  const grip = new THREE.MeshLambertMaterial({ color: 0x4a3524 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.44), steel);
  body.position.set(0, 0, -0.18);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 8), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.03, -0.46);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.09), grip);
  handle.position.set(0, -0.13, -0.02);
  handle.rotation.x = 0.22;
  gun.add(body, barrel, handle);
  gun.position.set(0.22, -0.2, -0.42);
  gun.name = "gun";
  return gun;
}

function makeBotMesh() {
  const g = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: 0xb4342a });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2a2f36 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 1.15, 10), skin);
  body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), new THREE.MeshLambertMaterial({ color: 0xd9b48f }));
  head.position.y = 1.72;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.06), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
  visor.position.set(0, 1.75, -0.2);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.45, 8), dark);
  legs.position.y = 0.25;
  g.add(body, head, visor, legs);
  g.userData.body = body;
  return g;
}

/**
 * The static half of the arena: ground, buildings, trees, campus edge.
 * Exported on its own so the headless harness can build the very same scene
 * graph and count it, without a canvas or a WebGL context.
 */
export function buildStaticScene(model, world) {
  const group = new THREE.Group();
  group.name = "campus";
  group.add(buildGround(model, world));
  group.add(buildBuildings(model));
  group.add(buildTrees(model));
  group.add(buildCampusEdge(model));
  let triangles = 0;
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    const per = g.index ? g.index.count : g.attributes.position.count;
    triangles += (per / 3) * (o.isInstancedMesh ? o.count : 1);
  });
  return { group, triangles };
}

/* ------------------------------------------------------------------ *
 * HUD
 * ------------------------------------------------------------------ */

function buildHud(host) {
  const el = document.createElement("div");
  el.className = "ghs-hud";
  el.innerHTML = `
    <div class="ghs-cross"><i></i><i></i></div>
    <div class="ghs-stats">
      <div class="ghs-row"><span>HP</span><b data-k="hp">100</b></div>
      <div class="ghs-row"><span>AMMO</span><b data-k="ammo">24</b><i data-k="reserve">/96</i></div>
      <div class="ghs-row"><span>WAVE</span><b data-k="wave">0</b><i data-k="waves">/6</i></div>
      <div class="ghs-row"><span>KILLS</span><b data-k="kills">0</b><i data-k="quota">/24</i></div>
      <div class="ghs-row"><span>SCORE</span><b data-k="score">0</b></div>
      <div class="ghs-row"><span>ACC</span><b data-k="accuracy">0</b><i>%</i></div>
    </div>
    <div class="ghs-feed" data-k="feed"></div>
    <div class="ghs-dmg" data-k="dmg"></div>
    <div class="ghs-overlay" data-k="overlay">
      <div class="ghs-card">
        <h2>GLENDORA HIGH · ARENA</h2>
        <p data-k="msg">Click to lock the pointer. WASD to move, Shift to run, mouse to fire, R to reload, Esc to release.</p>
        <button type="button" data-k="start">DROP IN</button>
      </div>
    </div>
    <div class="ghs-touch" data-k="touch" hidden>
      <div class="ghs-stick" data-k="stick"><i></i></div>
      <button type="button" class="ghs-fire" data-k="fireBtn">FIRE</button>
    </div>`;
  host.appendChild(el);
  const q = (k) => el.querySelector(`[data-k="${k}"]`);
  return {
    root: el,
    hp: q("hp"),
    ammo: q("ammo"),
    reserve: q("reserve"),
    wave: q("wave"),
    waves: q("waves"),
    kills: q("kills"),
    quota: q("quota"),
    score: q("score"),
    accuracy: q("accuracy"),
    feed: q("feed"),
    dmg: q("dmg"),
    overlay: q("overlay"),
    msg: q("msg"),
    start: q("start"),
    touch: q("touch"),
    stick: q("stick"),
    fireBtn: q("fireBtn"),
  };
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */

/**
 * @param {object} opts { host, model, waves, quota, seed, onScore }
 */
export function startShooter(opts = {}) {
  const host = opts.host;
  if (!host) throw new Error("startShooter needs a host element");
  const model = opts.model || buildModel({ boxes: false, simplify: 0.6 });
  const world = buildWorld(model, { walkable: opts.walkable ?? 5 });
  const game = createGame(model, { world, seed: opts.seed, waves: opts.waves, quota: opts.quota });

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth || 960, host.clientHeight || 600);
  renderer.setClearColor(0x9fc4dd);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9fc4dd, 90, 420);
  const camera = new THREE.PerspectiveCamera(74, (host.clientWidth || 960) / (host.clientHeight || 600), 0.1, 1200);
  camera.rotation.order = "YXZ";
  scene.add(camera);
  camera.add(buildGun());

  const hemi = new THREE.HemisphereLight(0xdfefff, 0x4c5a3a, 0.95);
  const sun = new THREE.DirectionalLight(0xfff2d8, 0.85);
  sun.position.set(120, 220, 90);
  scene.add(hemi, sun);

  scene.add(buildStaticScene(model, world).group);

  const muzzle = new THREE.PointLight(0xffd9a0, 0, 14);
  camera.add(muzzle);
  muzzle.position.set(0.22, -0.16, -0.9);

  // tracer pool
  const tracerMat = new THREE.LineBasicMaterial({ color: 0xfff0a8, transparent: true, opacity: 0.9 });
  const enemyTracerMat = new THREE.LineBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.85 });
  const tracerPool = [];
  for (let i = 0; i < 24; i++) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(geo, tracerMat);
    line.visible = false;
    line.frustumCulled = false;
    scene.add(line);
    tracerPool.push(line);
  }

  const botMeshes = new Map();
  const hud = buildHud(host);
  const input = { forward: 0, strafe: 0, run: false, yaw: 0, pitch: 0, fire: false, reload: false };
  let locked = false;
  let running = false;
  let raf = 0;
  let last = 0;
  let lastHurt = -1;

  const feedLine = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    hud.feed.appendChild(div);
    while (hud.feed.children.length > 5) hud.feed.removeChild(hud.feed.firstChild);
    setTimeout(() => div.remove(), 4200);
  };

  /* ---- input ---- */
  const keys = new Set();
  const onKeyDown = (e) => {
    if (e.code === "Escape") return;
    keys.add(e.code);
    if (e.code === "KeyR") input.reload = true;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  };
  const onKeyUp = (e) => keys.delete(e.code);
  const readKeys = () => {
    input.forward = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    input.strafe = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    input.run = keys.has("ShiftLeft") || keys.has("ShiftRight");
  };

  const onMouseMove = (e) => {
    if (!locked) return;
    input.yaw -= e.movementX * 0.0022;
    input.pitch -= e.movementY * 0.0022;
  };
  const onMouseDown = (e) => {
    if (!locked) return;
    if (e.button === 0) input.fire = true;
  };
  const onMouseUp = (e) => {
    if (e.button === 0) input.fire = false;
  };
  const onLockChange = () => {
    locked = document.pointerLockElement === renderer.domElement;
    if (!locked && running) {
      running = false;
      hud.overlay.hidden = false;
      hud.msg.textContent = "Paused. Click to drop back in.";
      hud.start.textContent = "RESUME";
    }
  };

  hud.start.addEventListener("click", () => {
    hud.overlay.hidden = true;
    running = true;
    if (renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
    else locked = true;
  });
  hud.overlay.addEventListener("click", (e) => {
    if (e.target === hud.overlay) hud.start.click();
  });

  // touch: virtual stick + fire button
  const isTouch = matchMedia("(pointer: coarse)").matches;
  if (isTouch) {
    hud.touch.hidden = false;
    locked = true;
    let stickId = null;
    let origin = null;
    const knob = hud.stick.firstElementChild;
    hud.stick.addEventListener("pointerdown", (e) => {
      stickId = e.pointerId;
      origin = { x: e.clientX, y: e.clientY };
      hud.stick.setPointerCapture(stickId);
    });
    hud.stick.addEventListener("pointermove", (e) => {
      if (e.pointerId !== stickId || !origin) return;
      const dx = Math.max(-1, Math.min(1, (e.clientX - origin.x) / 48));
      const dy = Math.max(-1, Math.min(1, (e.clientY - origin.y) / 48));
      knob.style.transform = `translate(${dx * 22}px, ${dy * 22}px)`;
      input.strafe = dx;
      input.forward = -dy;
      input.run = Math.hypot(dx, dy) > 0.85;
    });
    const endStick = (e) => {
      if (e.pointerId !== stickId) return;
      stickId = null;
      origin = null;
      knob.style.transform = "";
      input.strafe = 0;
      input.forward = 0;
      input.run = false;
    };
    hud.stick.addEventListener("pointerup", endStick);
    hud.stick.addEventListener("pointercancel", endStick);
    hud.fireBtn.addEventListener("pointerdown", () => (input.fire = true));
    hud.fireBtn.addEventListener("pointerup", () => (input.fire = false));
    // drag anywhere on the right half to look
    let lookId = null;
    let lookLast = null;
    renderer.domElement.addEventListener("pointerdown", (e) => {
      if (e.clientX < innerWidth * 0.4) return;
      lookId = e.pointerId;
      lookLast = { x: e.clientX, y: e.clientY };
    });
    renderer.domElement.addEventListener("pointermove", (e) => {
      if (e.pointerId !== lookId || !lookLast) return;
      input.yaw -= (e.clientX - lookLast.x) * 0.005;
      input.pitch -= (e.clientY - lookLast.y) * 0.005;
      lookLast = { x: e.clientX, y: e.clientY };
    });
    const endLook = (e) => {
      if (e.pointerId === lookId) lookId = null;
    };
    renderer.domElement.addEventListener("pointerup", endLook);
    renderer.domElement.addEventListener("pointercancel", endLook);
  }

  addEventListener("keydown", onKeyDown);
  addEventListener("keyup", onKeyUp);
  addEventListener("mousemove", onMouseMove);
  addEventListener("mousedown", onMouseDown);
  addEventListener("mouseup", onMouseUp);
  document.addEventListener("pointerlockchange", onLockChange);
  const onResize = () => {
    const w = host.clientWidth || 960;
    const h = host.clientHeight || 600;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", onResize);

  /* ---- frame ---- */
  const tmp = new THREE.Vector3();
  let tracerCursor = 0;
  let prevKills = 0;

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    readKeys();
    if (running && !game.over) {
      step(game, dt, input);
      input.yaw = 0;
      input.pitch = 0;
      input.reload = false;
    }

    const p = game.player;
    const g = model.ground(p.x, p.y);
    const bob = Math.sin(p.bob) * 0.045;
    tmp.set(p.x, g + PLAYER.eye + bob, -p.y);
    camera.position.copy(tmp);
    camera.rotation.y = p.yaw - Math.PI / 2;
    camera.rotation.x = -p.pitch;

    const gun = camera.getObjectByName("gun");
    if (gun) {
      gun.position.z = -0.42 + p.recoil * 0.06;
      gun.rotation.x = p.recoil * 0.16;
    }
    muzzle.intensity = p.recoil > 0.7 ? 2.4 : 0;

    // bots
    const seen = new Set();
    for (const b of game.bots) {
      seen.add(b.id);
      let mesh = botMeshes.get(b.id);
      if (!mesh) {
        mesh = makeBotMesh();
        scene.add(mesh);
        botMeshes.set(b.id, mesh);
      }
      mesh.visible = !b.dead;
      mesh.position.set(b.x, b.z, -b.y);
      mesh.rotation.y = Math.atan2(p.x - b.x, -(p.y - b.y)) + Math.PI;
      const body = mesh.userData.body;
      if (body) body.material.color.setHex(b.hitFlash > 0 ? 0xffffff : 0xb4342a);
    }
    for (const [id, mesh] of botMeshes) {
      if (!seen.has(id)) {
        scene.remove(mesh);
        botMeshes.delete(id);
      }
    }

    // tracers
    for (const line of tracerPool) line.visible = false;
    game.tracers.slice(0, tracerPool.length).forEach((t, i) => {
      const line = tracerPool[i];
      const z0 = model.ground(t.x0, t.y0) + 1.3;
      const z1 = model.ground(t.x1, t.y1) + 1.1;
      const pos = line.geometry.attributes.position;
      pos.setXYZ(0, t.x0, z0, -t.y0);
      pos.setXYZ(1, t.x1, z1, -t.y1);
      pos.needsUpdate = true;
      line.material = t.enemy ? enemyTracerMat : tracerMat;
      line.visible = true;
    });
    tracerCursor = (tracerCursor + 1) % 1000;

    // hud
    const s = scoreboard(game);
    hud.hp.textContent = s.hp;
    hud.ammo.textContent = s.ammo;
    hud.reserve.textContent = `/${s.reserve}`;
    hud.wave.textContent = s.wave;
    hud.waves.textContent = `/${s.waves}`;
    hud.kills.textContent = s.kills;
    hud.quota.textContent = `/${s.quota}`;
    hud.score.textContent = s.score;
    hud.accuracy.textContent = s.accuracy;
    hud.dmg.style.opacity = p.hurt > 0 ? String(0.18 + p.hurt * 0.4) : "0";
    if (s.kills !== prevKills) {
      if (s.kills > prevKills) feedLine(`TARGET DOWN · +${100 + s.wave * 10}`);
      prevKills = s.kills;
    }
    if (game.over && !hud.overlay.dataset.done) {
      hud.overlay.dataset.done = "1";
      hud.overlay.hidden = false;
      hud.start.textContent = "PLAY AGAIN";
      hud.msg.textContent = game.won
        ? `Campus cleared · ${s.kills} targets · ${s.score} points · ${s.accuracy}% accuracy in ${s.time}s.`
        : `You went down on wave ${s.wave} with ${s.kills} targets and ${s.score} points.`;
      hud.start.onclick = () => location.reload();
      running = false;
      opts.onScore?.(s);
    }

    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return {
    game,
    world,
    model,
    renderer,
    scene,
    camera,
    hud,
    fire: () => fire(game),
    reload: () => reload(game),
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", onKeyUp);
      removeEventListener("mousemove", onMouseMove);
      removeEventListener("mousedown", onMouseDown);
      removeEventListener("mouseup", onMouseUp);
      removeEventListener("resize", onResize);
      document.removeEventListener("pointerlockchange", onLockChange);
      renderer.dispose();
      host.removeChild(renderer.domElement);
      hud.root.remove();
    },
  };
}

export { buildWorld, createGame, step, scoreboard };
