import * as THREE from "../vendor/three.module.min.js";

/**
 * Original Three.js demonstrations for the 1990 BSA handbook viewer prototype.
 * None of these specimens has yet been checked against the user's copy of the
 * book. The verified catalog intentionally remains empty until that source is
 * supplied and indexed.
 */
export const SAMPLE_MODELS = [
  {
    id: "tripod-lashing",
    name: "Tripod lashing",
    category: "Pioneering · demo",
    teaser: "Three poles meet at a lashing; a hanging pot gives the silhouette scale.",
    description:
      "An original, schematic Three.js model of a generic lashed tripod. The rope wraps and pole dimensions are illustrative only; this is not yet verified as an illustration or project in the 1990 tenth edition.",
    page: "Not checked — book copy pending",
    cameraTarget: [0, 1.15, 0],
    cameraDistance: 6.7,
    parts: [
      { kind: "beam", from: [-1.18, 0.05, -0.75], to: [0, 2.75, 0], radius: 0.075, color: "#85552f" },
      { kind: "beam", from: [1.18, 0.05, -0.75], to: [0, 2.75, 0], radius: 0.075, color: "#9b6839" },
      { kind: "beam", from: [0, 0.05, 1.4], to: [0, 2.75, 0], radius: 0.075, color: "#744722" },
      ...Array.from({ length: 5 }, (_, turn) => {
        const y = 2.28 + turn * 0.045;
        const a = [-0.16, y, -0.12];
        const b = [0.16, y, -0.12];
        const c = [0, y, 0.19];
        return [
          { kind: "beam", from: a, to: b, radius: 0.018, color: "#d9bd83" },
          { kind: "beam", from: b, to: c, radius: 0.018, color: "#d9bd83" },
          { kind: "beam", from: c, to: a, radius: 0.018, color: "#d9bd83" },
        ];
      }).flat(),
      { kind: "beam", from: [0, 2.25, -0.05], to: [0, 1.62, -0.05], radius: 0.022, color: "#d9bd83" },
      { kind: "cylinder", position: [0, 1.48, -0.05], radius: 0.29, height: 0.22, color: "#6d7370" },
      { kind: "cylinder", position: [0, 1.61, -0.05], radius: 0.26, height: 0.035, color: "#aab0a3" },
    ],
  },
  {
    id: "baseplate-compass",
    name: "Baseplate compass",
    category: "Navigation · demo",
    teaser: "A simplified compass housing, dial, tick marks, and two-color needle.",
    description:
      "A generic schematic baseplate compass modeled from simple geometry. It is an original demo, not a reproduction of a named product or a claim about a particular handbook page.",
    page: "Not checked — book copy pending",
    cameraTarget: [0, 0.18, 0],
    cameraDistance: 4.3,
    parts: [
      { kind: "box", position: [0, 0.02, 0], size: [2.1, 0.11, 1.3], color: "#5c7652", roughness: 0.92 },
      { kind: "cylinder", position: [0, 0.12, 0], radius: 0.48, height: 0.13, color: "#24342c", segments: 32 },
      { kind: "cylinder", position: [0, 0.20, 0], radius: 0.405, height: 0.035, color: "#d8c99c", segments: 32 },
      ...Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const major = i % 4 === 0;
        return {
          kind: "box",
          position: [Math.sin(angle) * 0.34, 0.224, Math.cos(angle) * 0.34],
          size: [major ? 0.035 : 0.022, 0.009, major ? 0.09 : 0.055],
          rotation: [0, angle, 0],
          color: "#4f554d",
        };
      }),
      {
        kind: "mesh",
        position: [0, 0.235, 0],
        vertices: [0, 0, -0.29, -0.075, 0, 0.06, 0.075, 0, 0.06],
        faces: [[0, 1, 2]],
        color: "#b94432",
        emissive: "#2c0704",
      },
      {
        kind: "mesh",
        position: [0, 0.236, 0],
        vertices: [0, 0, 0.29, 0.075, 0, -0.06, -0.075, 0, -0.06],
        faces: [[0, 1, 2]],
        color: "#eee3c5",
      },
      { kind: "sphere", position: [0, 0.255, 0], radius: 0.055, scale: [1, 0.35, 1], color: "#b08b4e" },
    ],
  },
  {
    id: "a-frame-tent",
    name: "A-frame tent",
    category: "Shelter · demo",
    teaser: "A simple ridge-pole shelter with a canvas shell and four guy lines.",
    description:
      "A generic A-frame shelter assembled from an original polygonal canvas shell, ridge pole, stakes, and guy lines. Its shape is a visual demo only; verify the 1990 handbook's exact design and page from the supplied copy.",
    page: "Not checked — book copy pending",
    cameraTarget: [0, 0.72, 0],
    cameraDistance: 6.8,
    parts: [
      {
        kind: "mesh",
        position: [0, 0, 0],
        vertices: [
          -1.25, 0, -0.86,
          -1.25, 0, 0.86,
          -1.25, 1.38, 0,
          1.25, 0, -0.86,
          1.25, 0, 0.86,
          1.25, 1.38, 0,
        ],
        faces: [[0, 3, 5, 2], [1, 2, 5, 4], [0, 2, 1], [3, 4, 5]],
        color: "#c6aa72",
        side: "double",
        roughness: 1,
      },
      { kind: "beam", from: [-1.38, 1.41, 0], to: [1.38, 1.41, 0], radius: 0.045, color: "#875a33" },
      { kind: "beam", from: [-1.25, 0.15, -0.86], to: [-1.75, 0.03, -1.18], radius: 0.018, color: "#dfd0a8" },
      { kind: "beam", from: [-1.25, 0.15, 0.86], to: [-1.75, 0.03, 1.18], radius: 0.018, color: "#dfd0a8" },
      { kind: "beam", from: [1.25, 0.15, -0.86], to: [1.75, 0.03, -1.18], radius: 0.018, color: "#dfd0a8" },
      { kind: "beam", from: [1.25, 0.15, 0.86], to: [1.75, 0.03, 1.18], radius: 0.018, color: "#dfd0a8" },
      { kind: "box", position: [-1.75, 0.07, -1.18], size: [0.18, 0.11, 0.12], color: "#84532e" },
      { kind: "box", position: [-1.75, 0.07, 1.18], size: [0.18, 0.11, 0.12], color: "#84532e" },
      { kind: "box", position: [1.75, 0.07, -1.18], size: [0.18, 0.11, 0.12], color: "#84532e" },
      { kind: "box", position: [1.75, 0.07, 1.18], size: [0.18, 0.11, 0.12], color: "#84532e" },
    ],
  },
  {
    id: "campfire-ring",
    name: "Campfire ring",
    category: "Campcraft · demo",
    teaser: "A ring of stones, laid logs, and stylized flame cones.",
    description:
      "An original, simplified campfire scene for testing the gallery. It is not a page scan, not a copy of handbook art, and not yet verified as a specific illustration in the 1990 edition.",
    page: "Not checked — book copy pending",
    cameraTarget: [0, 0.65, 0],
    cameraDistance: 5.3,
    parts: [
      ...Array.from({ length: 13 }, (_, i) => {
        const a = (i / 13) * Math.PI * 2;
        return {
          kind: "sphere",
          position: [Math.cos(a) * 0.82, 0.13, Math.sin(a) * 0.82],
          radius: 0.17 + (i % 3) * 0.015,
          scale: [1.25, 0.7, 0.9],
          color: i % 2 ? "#716f5d" : "#8c826c",
        };
      }),
      { kind: "beam", from: [-0.72, 0.24, -0.35], to: [0.72, 0.24, 0.35], radius: 0.12, color: "#67452d" },
      { kind: "beam", from: [-0.72, 0.24, 0.35], to: [0.72, 0.24, -0.35], radius: 0.12, color: "#815432" },
      { kind: "beam", from: [-0.56, 0.39, 0], to: [0.56, 0.39, 0], radius: 0.10, color: "#765033" },
      { kind: "cone", position: [0, 0.78, 0], radius: 0.37, height: 0.82, color: "#e57832", emissive: "#8b2b08", emissiveIntensity: 0.55, flame: true },
      { kind: "cone", position: [-0.16, 0.73, 0.08], radius: 0.23, height: 0.61, color: "#ffc85a", emissive: "#bd4709", emissiveIntensity: 0.85, flame: true },
      { kind: "cone", position: [0.15, 0.69, -0.04], radius: 0.18, height: 0.52, color: "#fff0b0", emissive: "#cf6b11", emissiveIntensity: 0.65, flame: true },
    ],
  },
];

function vector3(value = [0, 0, 0]) {
  return new THREE.Vector3(value[0] || 0, value[1] || 0, value[2] || 0);
}

function materialFor(part) {
  const doubleSided = part.side === "double";
  return new THREE.MeshStandardMaterial({
    color: part.color || "#9b8761",
    roughness: part.roughness ?? 0.82,
    metalness: part.metalness ?? 0.02,
    emissive: part.emissive || "#000000",
    emissiveIntensity: part.emissiveIntensity ?? 0,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });
}

function createPart(part) {
  let geometry;
  const object = new THREE.Mesh();
  if (part.kind === "beam") {
    const from = vector3(part.from);
    const to = vector3(part.to);
    const delta = to.clone().sub(from);
    const length = Math.max(delta.length(), 0.001);
    geometry = new THREE.CylinderGeometry(part.radius || 0.04, part.radius || 0.04, length, 12, 1);
    object.position.copy(from.clone().add(to).multiplyScalar(0.5));
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  } else if (part.kind === "box") {
    geometry = new THREE.BoxGeometry(...(part.size || [1, 1, 1]));
    object.position.copy(vector3(part.position));
    object.rotation.set(...(part.rotation || [0, 0, 0]));
  } else if (part.kind === "sphere") {
    geometry = new THREE.SphereGeometry(part.radius || 0.1, 18, 12);
    object.position.copy(vector3(part.position));
    object.scale.set(...(part.scale || [1, 1, 1]));
  } else if (part.kind === "cylinder") {
    geometry = new THREE.CylinderGeometry(part.radius || 0.2, part.radius || 0.2, part.height || 0.2, part.segments || 20, 1);
    object.position.copy(vector3(part.position));
    object.rotation.set(...(part.rotation || [0, 0, 0]));
  } else if (part.kind === "cone") {
    geometry = new THREE.ConeGeometry(part.radius || 0.2, part.height || 0.4, part.segments || 18, 1);
    object.position.copy(vector3(part.position));
    object.rotation.set(...(part.rotation || [0, 0, 0]));
  } else if (part.kind === "mesh") {
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(part.vertices || [], 3));
    const indices = [];
    for (const face of part.faces || []) {
      for (let i = 1; i + 1 < face.length; i++) indices.push(face[0], face[i], face[i + 1]);
    }
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    object.position.copy(vector3(part.position));
    object.rotation.set(...(part.rotation || [0, 0, 0]));
    object.scale.set(...(part.scale || [1, 1, 1]));
  } else {
    return null;
  }
  object.geometry = geometry;
  object.material = materialFor(part);
  object.castShadow = true;
  object.receiveShadow = true;
  if (part.flame) object.userData.flame = true;
  return object;
}

function disposeGroup(group) {
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
    else object.material?.dispose();
  });
}

function addTree(scene, x, z, height, shade) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.16, height * 0.38, 7),
    new THREE.MeshStandardMaterial({ color: "#493b2b", roughness: 1 }),
  );
  trunk.position.set(x, height * 0.19, z);
  scene.add(trunk);
  for (let tier = 0; tier < 3; tier++) {
    const h = height * (0.36 - tier * 0.035);
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(height * (0.23 - tier * 0.025), h, 7),
      new THREE.MeshStandardMaterial({ color: shade, roughness: 1 }),
    );
    crown.position.set(x, height * (0.43 + tier * 0.20), z);
    scene.add(crown);
  }
}

function makeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1711);
  scene.fog = new THREE.Fog(0x0b1711, 18, 36);
  scene.add(new THREE.HemisphereLight(0xcbd9be, 0x17251a, 2.15));

  const key = new THREE.DirectionalLight(0xffd9a1, 2.35);
  key.position.set(-5, 9, 6);
  key.castShadow = true;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x93bb9a, 1.2);
  fill.position.set(6, 4, -7);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x1b3021, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.035;
  ground.receiveShadow = true;
  scene.add(ground);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.65, 2.69, 80),
    new THREE.MeshBasicMaterial({ color: 0x8e9d69, transparent: true, opacity: 0.24, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.012;
  scene.add(ring);

  const trees = [
    [-7.8, -7.2, 7.2, "#203a2a"], [-4.8, -10.5, 8.8, "#1d3426"], [-1.3, -9.3, 7.6, "#25412e"],
    [3.0, -10.4, 9.3, "#1c3527"], [7.1, -7.7, 8.2, "#27432d"], [9.8, -2.8, 7.5, "#1c3527"],
    [-9.7, -1.9, 8.7, "#203a2a"], [-8.1, 4.4, 7.1, "#294732"], [-4.1, 7.7, 8.9, "#1c3527"],
    [0.2, 8.7, 7.4, "#25412e"], [4.9, 7.4, 8.6, "#203a2a"], [8.4, 4.6, 7.6, "#1d3426"],
  ];
  trees.forEach(([x, z, h, shade]) => addTree(scene, x, z, h, shade));
  return scene;
}

function cleanLabel(value) {
  return String(value).replace(/["\r\n]/g, " ").slice(0, 160);
}

function fmt(value) {
  return Number(value).toFixed(4);
}

function axisAngle(quaternion) {
  const q = quaternion.clone().normalize();
  const w = THREE.MathUtils.clamp(q.w, -1, 1);
  const angle = 2 * Math.acos(w);
  const s = Math.sqrt(Math.max(0, 1 - w * w));
  if (s < 0.0001 || angle < 0.0001) return "0 1 0 0";
  return `${fmt(q.x / s)} ${fmt(q.y / s)} ${fmt(q.z / s)} ${fmt(angle)}`;
}

function transformFor(part) {
  if (part.kind === "beam") {
    const from = vector3(part.from);
    const to = vector3(part.to);
    const direction = to.clone().sub(from);
    const length = Math.max(direction.length(), 0.001);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    return {
      position: from.clone().add(to).multiplyScalar(0.5),
      rotation: axisAngle(quaternion),
      scale: [1, 1, 1],
      geometry: `Cylinder { radius ${fmt(part.radius || 0.04)} height ${fmt(length)} }`,
    };
  }
  const position = vector3(part.position);
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(part.rotation || [0, 0, 0])));
  let geometry = "";
  let scale = part.scale || [1, 1, 1];
  if (part.kind === "box") {
    const [x, y, z] = part.size || [1, 1, 1];
    geometry = `Box { size ${fmt(x)} ${fmt(y)} ${fmt(z)} }`;
  } else if (part.kind === "sphere") {
    geometry = `Sphere { radius ${fmt(part.radius || 0.1)} }`;
  } else if (part.kind === "cylinder") {
    geometry = `Cylinder { radius ${fmt(part.radius || 0.2)} height ${fmt(part.height || 0.2)} }`;
  } else if (part.kind === "cone") {
    geometry = `Cone { bottomRadius ${fmt(part.radius || 0.2)} height ${fmt(part.height || 0.4)} }`;
  } else if (part.kind === "mesh") {
    const points = [];
    for (let i = 0; i + 2 < (part.vertices || []).length; i += 3) {
      points.push(`${fmt(part.vertices[i])} ${fmt(part.vertices[i + 1])} ${fmt(part.vertices[i + 2])}`);
    }
    const faces = (part.faces || []).map((face) => `${face.join(" ")} -1`).join(", ");
    geometry = `IndexedFaceSet { solid FALSE coord Coordinate { point [ ${points.join(", ")} ] } coordIndex [ ${faces} ] }`;
  }
  return { position, rotation: axisAngle(quaternion), scale, geometry };
}

/** Return a standards-shaped VRML 2.0 scene for the selected original demo. */
export function buildVrml(item) {
  const title = cleanLabel(item?.name || "Scoutbook demo specimen");
  const shapes = (item?.parts || []).map((part) => {
    const transform = transformFor(part);
    if (!transform.geometry) return "";
    const diffuse = new THREE.Color(part.color || "#9b8761");
    const emissive = new THREE.Color(part.emissive || "#000000");
    const transparency = THREE.MathUtils.clamp(part.transparency || 0, 0, 1);
    return `Transform {
  translation ${fmt(transform.position.x)} ${fmt(transform.position.y)} ${fmt(transform.position.z)}
  rotation ${transform.rotation}
  scale ${transform.scale.map(fmt).join(" ")}
  children [ Shape {
    appearance Appearance { material Material {
      diffuseColor ${fmt(diffuse.r)} ${fmt(diffuse.g)} ${fmt(diffuse.b)}
      emissiveColor ${fmt(emissive.r)} ${fmt(emissive.g)} ${fmt(emissive.b)}
      transparency ${fmt(transparency)}
      shininess 0.08
    } }
    geometry ${transform.geometry}
  } ]
}`;
  }).filter(Boolean).join("\n");
  return `#VRML V2.0 utf8
# Original procedural demo geometry; not traced from handbook artwork.
WorldInfo { title "${title}" info [ "Prototype specimen — source page not yet verified" ] }
Background { skyColor [ 0.04 0.08 0.06 ] }
NavigationInfo { type [ "EXAMINE" "ANY" ] headlight TRUE }
DirectionalLight { direction -0.4 -1 -0.3 color 1 0.87 0.66 intensity 0.85 }
Transform { children [
${shapes}
] }
`;
}

function downloadText(filename, text, mime = "model/vrml") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/[^A-Za-z0-9._-]/g, "_");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function initScoutbookViewer() {
  const host = document.getElementById("world");
  if (!host) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (error) {
    const fallback = document.getElementById("webgl-fallback");
    if (fallback) {
      fallback.hidden = false;
      fallback.textContent = `This browser could not start WebGL. The source notes and demo catalog remain available. (${error?.message || "WebGL unavailable"})`;
    }
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth || 800, host.clientHeight || 560);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-label", "Interactive 3D demo object; drag to orbit and use the mouse wheel to zoom");
  host.appendChild(renderer.domElement);

  const scene = makeScene();
  const camera = new THREE.PerspectiveCamera(42, (host.clientWidth || 800) / (host.clientHeight || 560), 0.1, 80);
  const target = new THREE.Vector3(0, 1.15, 0);
  let yaw = 0.72;
  let pitch = 0.33;
  let distance = 6.7;
  let activeIndex = 0;
  let activeGroup = null;
  let autoRotate = true;
  let dragging = false;
  let lastPointer = { x: 0, y: 0 };

  const applyCamera = () => {
    camera.position.set(
      target.x + Math.cos(pitch) * Math.sin(yaw) * distance,
      target.y + Math.sin(pitch) * distance,
      target.z + Math.cos(pitch) * Math.cos(yaw) * distance,
    );
    camera.lookAt(target);
  };

  const search = document.getElementById("catalog-search");
  const list = document.getElementById("specimen-list");
  const title = document.getElementById("specimen-title");
  const category = document.getElementById("specimen-category");
  const teaser = document.getElementById("specimen-teaser");
  const description = document.getElementById("specimen-description");
  const page = document.getElementById("specimen-page");
  const specimenCount = document.getElementById("specimen-count");
  const spinButton = document.getElementById("spin-toggle");

  function renderList() {
    if (!list) return;
    const query = (search?.value || "").trim().toLowerCase();
    const shown = SAMPLE_MODELS.filter((item) => `${item.name} ${item.category} ${item.teaser}`.toLowerCase().includes(query));
    list.replaceChildren();
    for (const item of shown) {
      const index = SAMPLE_MODELS.indexOf(item);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "specimen-card";
      button.setAttribute("aria-pressed", String(index === activeIndex));
      button.dataset.specimenId = item.id;
      const kicker = document.createElement("span");
      kicker.className = "specimen-kicker";
      kicker.textContent = item.category;
      const name = document.createElement("span");
      name.className = "specimen-name";
      name.textContent = item.name;
      const hint = document.createElement("span");
      hint.className = "specimen-hint";
      hint.textContent = item.teaser;
      button.append(kicker, name, hint);
      button.addEventListener("click", () => selectItem(index));
      list.append(button);
    }
    if (specimenCount) specimenCount.textContent = `${SAMPLE_MODELS.length} demo specimens · 0 verified entries`;
  }

  function selectItem(index) {
    activeIndex = (index + SAMPLE_MODELS.length) % SAMPLE_MODELS.length;
    const item = SAMPLE_MODELS[activeIndex];
    if (activeGroup) {
      scene.remove(activeGroup);
      disposeGroup(activeGroup);
    }
    activeGroup = new THREE.Group();
    activeGroup.name = item.name;
    item.parts.forEach((part) => {
      const object = createPart(part);
      if (object) activeGroup.add(object);
    });
    scene.add(activeGroup);
    target.set(...item.cameraTarget);
    distance = item.cameraDistance;
    applyCamera();

    if (title) title.textContent = item.name;
    if (category) category.textContent = item.category;
    if (teaser) teaser.textContent = item.teaser;
    if (description) description.textContent = item.description;
    if (page) page.textContent = item.page;
    document.getElementById("entry-number").textContent = `DEMO ${String(activeIndex + 1).padStart(2, "0")} / ${String(SAMPLE_MODELS.length).padStart(2, "0")}`;
    document.getElementById("vrml-filename").textContent = `${item.id}.wrl`;
    renderList();
  }

  function resetCamera() {
    const item = SAMPLE_MODELS[activeIndex];
    target.set(...item.cameraTarget);
    distance = item.cameraDistance;
    yaw = 0.72;
    pitch = 0.33;
    applyCamera();
  }

  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    yaw -= (event.clientX - lastPointer.x) * 0.006;
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - lastPointer.y) * 0.005, 0.05, 1.42);
    lastPointer = { x: event.clientX, y: event.clientY };
    applyCamera();
  });
  const stopDrag = () => { dragging = false; };
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    distance = THREE.MathUtils.clamp(distance * (1 + Math.sign(event.deltaY) * 0.11), 2.8, 14);
    applyCamera();
  }, { passive: false });
  canvas.addEventListener("dblclick", resetCamera);

  document.getElementById("previous-specimen")?.addEventListener("click", () => selectItem(activeIndex - 1));
  document.getElementById("next-specimen")?.addEventListener("click", () => selectItem(activeIndex + 1));
  document.getElementById("next-specimen-footer")?.addEventListener("click", () => selectItem(activeIndex + 1));
  document.getElementById("reset-view")?.addEventListener("click", resetCamera);
  search?.addEventListener("input", renderList);
  spinButton?.addEventListener("click", () => {
    autoRotate = !autoRotate;
    spinButton.setAttribute("aria-pressed", String(autoRotate));
    spinButton.textContent = autoRotate ? "Pause orbit" : "Resume orbit";
  });
  document.getElementById("download-vrml")?.addEventListener("click", () => {
    const item = SAMPLE_MODELS[activeIndex];
    downloadText(`${item.id}.wrl`, buildVrml(item));
  });
  document.addEventListener("keydown", (event) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    if (event.key === "ArrowRight") selectItem(activeIndex + 1);
    if (event.key === "ArrowLeft") selectItem(activeIndex - 1);
    if (event.key.toLowerCase() === "r") resetCamera();
  });

  const resize = () => {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(host);
  window.addEventListener("resize", resize);

  applyCamera();
  selectItem(0);
  let previousTime = 0;
  const flameMeshes = () => activeGroup?.children.filter((object) => object.userData.flame) || [];
  function animate(time = 0) {
    requestAnimationFrame(animate);
    const elapsed = (time - previousTime) / 1000;
    previousTime = time;
    if (autoRotate && !dragging) {
      yaw += Math.min(elapsed, 0.05) * 0.15;
      applyCamera();
    }
    const flicker = flameMeshes();
    if (flicker.length) {
      flicker.forEach((flame, index) => {
        const wobble = 1 + Math.sin(time * 0.004 + index * 1.7) * 0.07;
        flame.scale.set(1, wobble, 1);
      });
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  return { scene, camera, renderer, resizeObserver };
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScoutbookViewer, { once: true });
  } else {
    initScoutbookViewer();
  }
}
