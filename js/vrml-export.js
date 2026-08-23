/** VRML 2.0 terrarium writer. */

function fmt(n) {
  return Number(n).toFixed(4);
}

export function demToVrml(dem, world, wx, title = "SITE-K Terrarium") {
  const { nx, ny, elev } = dem;
  const stepX = 3;
  const stepY = 3;
  const cx = Math.ceil(nx / stepX);
  const cy = Math.ceil(ny / stepY);
  const coords = [];
  for (let j = 0; j < ny; j += stepY) {
    for (let i = 0; i < nx; i += stepX) {
      const x = (i / (nx - 1) - 0.5) * world.w;
      const z = (j / (ny - 1) - 0.5) * world.d;
      const y = elev[j * nx + i] * world.elevScale;
      coords.push(`${fmt(x)} ${fmt(y)} ${fmt(z)}`);
    }
  }
  const faces = [];
  const col = cx;
  for (let j = 0; j < cy - 1; j++) {
    for (let i = 0; i < cx - 1; i++) {
      const a = j * col + i;
      const b = a + 1;
      const c = a + col;
      const d = c + 1;
      faces.push(`${a} ${c} ${b} -1`);
      faces.push(`${b} ${c} ${d} -1`);
    }
  }

  const rain = [];
  if (wx && (wx.precipIn > 0.01 || /rain|snow/.test(String(wx.text || "").toLowerCase()))) {
    for (let k = 0; k < 180; k++) {
      const x = (Math.sin(k * 12.1) * 0.5) * world.w * 0.9;
      const z = (Math.cos(k * 7.7) * 0.5) * world.d * 0.9;
      const y = 4 + (k % 17) * 0.35;
      rain.push(`${fmt(x)} ${fmt(y)} ${fmt(z)}`);
    }
  }

  return `#VRML V2.0 utf8
# SITE-K terrarium — ${title}
# weather ${wx?.source || "n/a"}  ${wx?.tempF?.toFixed?.(1) || "—"}F  ${wx?.text || ""}
# generated ${new Date().toISOString()}

WorldInfo {
  title "${title.replace(/"/g, "")}"
  info [ "USGS 3DEP reconstruction", "NOAA / WU live weather", "Terraink line-art sibling" ]
}

Background { skyColor [ 0.06 0.10 0.09 ] }
NavigationInfo { type [ "EXAMINE" "ANY" ] headlight TRUE }

DirectionalLight { direction -0.4 -1 -0.3 color 0.6 0.9 0.55 intensity 0.8 }
DirectionalLight { direction 0.6 -0.4 0.5 color 1 0.7 0.3 intensity 0.35 }

# glass terrarium
Transform {
  translation 0 ${fmt(world.w * 0.08)} 0
  children [
    Shape {
      appearance Appearance {
        material Material { diffuseColor 0.15 0.25 0.18 transparency 0.82 shininess 0.7 }
      }
      geometry Box { size ${fmt(world.w + 2)} ${fmt(world.w * 0.22)} ${fmt(world.d + 2)} }
    }
  ]
}

# terrain IndexedFaceSet
Shape {
  appearance Appearance {
    material Material { diffuseColor 0.18 0.38 0.16 specularColor 0.2 0.3 0.2 }
  }
  geometry IndexedFaceSet {
    solid FALSE
    creaseAngle 1.2
    coord Coordinate { point [ ${coords.join(", ")} ] }
    coordIndex [ ${faces.join(" ")} ]
  }
}

${rain.length ? `Shape {
  appearance Appearance { material Material { emissiveColor 0.45 0.75 0.9 } }
  geometry PointSet { coord Coordinate { point [ ${rain.join(", ")} ] } }
}` : ""}
`;
}

export function downloadText(filename, text, mime = "model/vrml") {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
