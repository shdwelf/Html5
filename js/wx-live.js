/** Live weather for terrariums.
 *  NOAA/NWS observations first, Open-Meteo (NOAA GFS/HRRR blend) second,
 *  Weather Underground PWS if a key is stored (localStorage wx_wu_key).
 */

export const STATIONS = {
  stx: {
    lat: 17.702, lon: -64.799,
    nws: ["TISX", "TIST"],
    wu: ["IVISTX1", "KVICHRIST10"],
    name: "Henry E. Rohlsen / Christiansted",
  },
  la: {
    lat: 30.451, lon: -91.187,
    nws: ["KBTR", "KNEW", "KMSY"],
    wu: ["KLABATON131", "KLANEWOR184"],
    name: "Baton Rouge / New Orleans",
  },
  ww: {
    lat: 34.3608, lon: -117.6331,
    nws: ["KCCB", "KWJF", "KONT"],
    wu: ["KCAWRIGH16", "KCAWRIGH22"],
    name: "Wrightwood / Big Pines",
  },
  dalton: {
    lat: 34.168, lon: -117.819,
    nws: ["KEMT", "KPOC", "KCCB"],
    wu: ["KCAGLEND33", "KCAGLEND48"],
    name: "Glendora / Big Dalton",
  },
  iv: {
    lat: 34.413, lon: -119.861,
    nws: ["KSBA", "KSDB"],
    wu: ["KCAISLA12", "KCAISLA22"],
    name: "Santa Barbara / Isla Vista",
  },
};

const UA = { "User-Agent": "SITE-K-Terrarium/1.0 (educational ecosystem model)", Accept: "application/geo+json, application/ld+json, application/json" };

function num(v) {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object" && v.value != null) return Number(v.value);
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cToF(c) {
  return c == null ? null : c * 9 / 5 + 32;
}

function climateFallback(id) {
  const now = new Date();
  const month = now.getUTCMonth();
  const hour = now.getHours();
  const day = 0.5 + 0.5 * Math.sin(((hour - 6) / 24) * Math.PI * 2);
  const packs = {
    stx: { t: 84, rh: 76, wind: 12, dir: 90, cloud: 40, precip: 0.02, pres: 1014, wx: "partly cloudy trade" },
    la: { t: 90, rh: 72, wind: 8, dir: 160, cloud: 45, precip: 0.05, pres: 1012, wx: "hot humid" },
    ww: { t: 78, rh: 28, wind: 14, dir: 40, cloud: 15, precip: 0, pres: 1016, wx: "high desert clear" },
    dalton: { t: 86, rh: 36, wind: 7, dir: 230, cloud: 20, precip: 0, pres: 1013, wx: "foothill haze" },
    iv: { t: 68, rh: 68, wind: 10, dir: 250, cloud: 35, precip: 0, pres: 1015, wx: "marine layer fringe" },
  };
  const b = packs[id] || packs.iv;
  const t = b.t + (day - 0.5) * 12 + (month > 4 && month < 9 ? 2 : -4);
  return {
    source: "climatology-fallback",
    station: "CLIMO/" + id,
    name: STATIONS[id]?.name || id,
    tempF: t,
    dewF: t - (100 - b.rh) * 0.18,
    rh: b.rh,
    windMph: b.wind + day * 4,
    windGust: b.wind + 8,
    windDir: b.dir,
    pressureMb: b.pres,
    precipIn: b.precip,
    cloud: b.cloud,
    visibilityMi: 10,
    text: b.wx + " (climatology — live feed unavailable)",
    lat: STATIONS[id]?.lat,
    lon: STATIONS[id]?.lon,
    at: now.toISOString(),
    live: false,
  };
}

function normalizeNws(obs, meta) {
  const p = obs.properties || {};
  const tempC = num(p.temperature);
  const dewC = num(p.dewpoint);
  const windKph = num(p.windSpeed);
  const gustKph = num(p.windGust);
  const visM = num(p.visibility);
  return {
    source: "NOAA/NWS",
    station: meta.station || p.station || "NWS",
    name: meta.name || p.stationName || "NWS observation",
    tempF: tempC != null ? cToF(tempC) : null,
    dewF: dewC != null ? cToF(dewC) : null,
    rh: num(p.relativeHumidity),
    windMph: windKph != null ? windKph * 0.621371 : null,
    windGust: gustKph != null ? gustKph * 0.621371 : null,
    windDir: num(p.windDirection),
    pressureMb: num(p.barometricPressure) != null ? num(p.barometricPressure) / 100 : num(p.seaLevelPressure) != null ? num(p.seaLevelPressure) / 100 : null,
    precipIn: num(p.precipitationLastHour) != null ? num(p.precipitationLastHour) / 25.4 : 0,
    cloud: guessCloud(p.textDescription),
    visibilityMi: visM != null ? visM / 1609.34 : null,
    text: p.textDescription || "NWS observation",
    lat: meta.lat,
    lon: meta.lon,
    at: p.timestamp || new Date().toISOString(),
    live: true,
  };
}

function guessCloud(text) {
  const s = String(text || "").toLowerCase();
  if (/overcast|storm|rain|snow/.test(s)) return 90;
  if (/mostly cloudy|broken/.test(s)) return 70;
  if (/partly|few/.test(s)) return 40;
  if (/fair|clear|sunny/.test(s)) return 10;
  return 35;
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!r.ok) throw new Error("http " + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function fromNoaa(id) {
  const s = STATIONS[id];
  const pt = await fetchJson(`https://api.weather.gov/points/${s.lat.toFixed(4)},${s.lon.toFixed(4)}`);
  let stationUrl = null;
  let stationId = s.nws[0];
  try {
    const list = await fetchJson(pt.properties.observationStations);
    const feat = list.features?.[0];
    stationUrl = feat?.id;
    stationId = feat?.properties?.stationIdentifier || stationId;
  } catch {
    stationUrl = `https://api.weather.gov/stations/${s.nws[0]}`;
  }
  const obs = await fetchJson(`${stationUrl}/observations/latest`);
  return normalizeNws(obs, { station: stationId, name: s.name, lat: s.lat, lon: s.lon });
}

async function fromOpenMeteo(id) {
  const s = STATIONS[id];
  const q =
    `https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}` +
    `&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,rain,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
  const j = await fetchJson(q);
  const c = j.current || {};
  return {
    source: "Open-Meteo (NOAA GFS/HRRR blend)",
    station: "OM/" + id,
    name: s.name,
    tempF: num(c.temperature_2m),
    dewF: num(c.dew_point_2m),
    rh: num(c.relative_humidity_2m),
    windMph: num(c.wind_speed_10m),
    windGust: num(c.wind_gusts_10m),
    windDir: num(c.wind_direction_10m),
    pressureMb: num(c.pressure_msl),
    precipIn: num(c.precipitation) || num(c.rain) || 0,
    cloud: num(c.cloud_cover) ?? 30,
    visibilityMi: 10,
    text: codeText(c.weather_code),
    lat: s.lat,
    lon: s.lon,
    at: c.time || new Date().toISOString(),
    live: true,
  };
}

function codeText(code) {
  const map = {
    0: "clear",
    1: "mainly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "fog",
    48: "rime fog",
    51: "light drizzle",
    61: "rain",
    71: "snow",
    80: "rain showers",
    95: "thunderstorm",
  };
  return map[code] || "live blend";
}

async function fromWunder(id) {
  const key = localStorage.getItem("wx_wu_key");
  if (!key) return null;
  const s = STATIONS[id];
  const sid = localStorage.getItem("wx_wu_station") || s.wu[0];
  const url = `https://api.weather.com/v2/pws/observations/current?stationId=${encodeURIComponent(sid)}&format=json&units=e&apiKey=${encodeURIComponent(key)}`;
  const j = await fetchJson(url);
  const o = j.observations?.[0];
  if (!o) return null;
  const i = o.imperial || {};
  return {
    source: "Weather Underground PWS",
    station: o.stationID || sid,
    name: o.neighborhood || s.name,
    tempF: num(i.temp),
    dewF: num(i.dewpt),
    rh: num(o.humidity),
    windMph: num(i.windSpeed),
    windGust: num(i.windGust),
    windDir: num(o.winddir),
    pressureMb: num(i.pressure) != null ? num(i.pressure) * 33.8639 : null,
    precipIn: num(i.precipRate) || num(i.precipTotal) || 0,
    cloud: 40,
    visibilityMi: null,
    text: "PWS " + (o.stationID || sid),
    lat: num(o.lat) ?? s.lat,
    lon: num(o.lon) ?? s.lon,
    at: o.obsTimeUtc || new Date().toISOString(),
    live: true,
  };
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

export function wxHudMarkup(wx) {
  if (!wx) {
    return `<div class="title">WX LIVE <i>offline</i></div><div class="body">no observation</div>`;
  }
  const t = wx.tempF != null ? wx.tempF.toFixed(1) : "—";
  const rh = wx.rh != null ? wx.rh.toFixed(0) : "—";
  const wind = wx.windMph != null ? wx.windMph.toFixed(0) : "—";
  const dir = wx.windDir != null ? `${wx.windDir.toFixed(0)}°` : "";
  const p = wx.pressureMb != null ? `${wx.pressureMb.toFixed(1)} mb` : "";
  const cloud = wx.cloud != null ? wx.cloud.toFixed(0) : "—";
  const precip = wx.precipIn != null ? wx.precipIn.toFixed(2) : "—";
  const err = wx.errors?.length ? `<div class="muted">tried: ${esc(wx.errors.join(" · "))}</div>` : "";
  return `
    <div class="title">WX LIVE <i>${esc(wx.source)}</i></div>
    <div class="body">
      <b>${esc(wx.station)}</b> · ${esc(wx.name)}<br/>
      ${t}°F · RH ${rh}% · ${wind} mph ${dir}<br/>
      ${p} · cloud ${cloud}% · precip ${precip} in<br/>
      <span class="muted">${esc(wx.text)} · ${esc(wx.at)}</span>
      ${err}
    </div>`;
}

export function wxChipText(wx) {
  if (!wx) return "WX · —";
  const t = wx.tempF != null ? `${wx.tempF.toFixed(0)}°F` : "—";
  let src = "CLIMO";
  if (wx.live) {
    const s = String(wx.source || "");
    if (/NWS|NOAA\/NWS/i.test(s)) src = "NWS";
    else if (/Underground|PWS/i.test(s)) src = "WU";
    else if (/Open-Meteo/i.test(s)) src = "OM";
    else src = "WX";
  }
  return `${src} · ${wx.station || "—"} · ${t}`;
}

export async function loadWeather(id) {
  const errors = [];
  try {
    const w = await fromWunder(id);
    if (w) return { ...w, errors };
  } catch (e) {
    errors.push("WU " + (e.message || e));
  }
  try {
    return { ...(await fromNoaa(id)), errors };
  } catch (e) {
    errors.push("NWS " + (e.message || e));
  }
  try {
    return { ...(await fromOpenMeteo(id)), errors };
  } catch (e) {
    errors.push("OM " + (e.message || e));
  }
  return { ...climateFallback(id), errors };
}

export function ecosystemFromWx(wx) {
  const t = wx.tempF ?? 70;
  const rh = wx.rh ?? 50;
  const wind = wx.windMph ?? 5;
  const cloud = wx.cloud ?? 30;
  const precip = wx.precipIn ?? 0;
  const text = String(wx.text || "").toLowerCase();
  const rain = precip > 0.01 || /rain|drizzle|shower|storm/.test(text);
  const snow = t < 34 && (precip > 0 || /snow/.test(text));
  const fog = rh > 92 || /fog|mist/.test(text);
  const moisture = Math.max(0, Math.min(1, rh / 100 * 0.55 + precip * 4 + (rain ? 0.25 : 0)));
  const snowLine = snow ? 0 : t < 40 ? 2200 : t < 55 ? 2800 : 9000;
  return {
    rain,
    snow,
    fog,
    moisture,
    snowLine,
    wind,
    windDir: wx.windDir ?? 0,
    cloud: cloud / 100,
    tempF: t,
    rh,
    sky: skyColor(t, cloud, rain),
    leaf: leafColor(t, moisture),
  };
}

function skyColor(t, cloud, rain) {
  if (rain) return 0x1a2830;
  if (cloud > 70) return 0x243038;
  if (t > 88) return 0x3a2818;
  return 0x152028;
}

function leafColor(t, m) {
  if (t < 40) return 0x6a7a4a;
  if (t > 92 && m < 0.25) return 0x8a7a3a;
  return 0x3d8a38;
}
