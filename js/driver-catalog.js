/**
 * DriverGuide · driver version catalog.
 * Compiled 2026-08-31 from vendor release notes. Dates marked with "≈" are
 * approximate; always check the vendor page before downloading.
 */

export const DATA_AS_OF = "2026-08-31";

export const DRIVER_CATALOG = [
  {
    id: "nvidia",
    vendor: "NVIDIA",
    name: "NVIDIA GeForce Game Ready / Studio (DCH)",
    family: "Display",
    latest: "616.56",
    page: "https://www.nvidia.com/drivers",
    dlNote: "Choose GeForce Game Ready (gaming) or Studio (creation) on the NVIDIA drivers page.",
    detect: /nvidia/i,
    versions: [
      { v: "616.56", date: "2026-08-26", kind: "Game Ready WHQL", note: "Current release · Windows build 32.0.16.1656" },
      { v: "610.88", date: "2026-07-28", kind: "Game Ready WHQL", note: "R610 branch" },
      { v: "610.82", date: "2026-07-22", kind: "Hotfix", note: "Interim fix after 610.62" },
      { v: "610.62", date: "2026-06-16", kind: "Game Ready WHQL", note: "R610 branch" },
      { v: "610.47", date: "2026-05-26", kind: "Game Ready WHQL", note: "R610 branch" },
      { v: "596.72", date: "2026-06-17", kind: "Game Ready", note: "Parallel 596 branch" },
      { v: "596.49", date: "2026-05-12", kind: "Game Ready", note: "" },
      { v: "596.36", date: "2026-04-14", kind: "Game Ready", note: "" },
      { v: "595.97", date: "2026-03-24", kind: "Game Ready WHQL", note: "" },
      { v: "595.71", date: "2026-02-26", kind: "Game Ready", note: "" },
      { v: "591.74", date: "2026-01-27", kind: "Game Ready", note: "" },
      { v: "576.40", date: "2025-11-18", kind: "Game Ready", note: "R576 branch" },
      { v: "576.02", date: "2025-10-21", kind: "Game Ready", note: "" },
      { v: "571.96", date: "2025-09-16", kind: "Game Ready", note: "R571 branch" },
      { v: "566.36", date: "2024-12-10", kind: "Game Ready", note: "R566 branch" },
      { v: "560.94", date: "2024-09-17", kind: "Game Ready", note: "R560 branch" },
      { v: "552.44", date: "2024-05-15", kind: "Game Ready", note: "R552 branch" },
      { v: "537.42", date: "2023-09-21", kind: "Game Ready", note: "R537 branch" },
      { v: "536.40", date: "2023-06-29", kind: "Game Ready", note: "" },
    ],
  },
  {
    id: "amd",
    vendor: "AMD",
    name: "AMD Software: Adrenalin Edition",
    family: "Display",
    latest: "26.8.1",
    page: "https://www.amd.com/en/support",
    dlNote: "Pick your Radeon / Ryzen graphics product on the AMD support page, or use AMD Auto-Detect.",
    detect: /amd|radeon|adrenalin/i,
    versions: [
      { v: "26.8.1", date: "2026-08-20", kind: "WHQL Recommended", note: "Current release · RX 9050 4 GB support" },
      { v: "26.7.1", date: "2026-07-15", kind: "WHQL", note: "RX 9050 8 GB support" },
      { v: "26.6.4", date: "2026-06-30", kind: "WHQL", note: "Maintenance — install failures on Win10" },
      { v: "26.6.2", date: "2026-06-22", kind: "WHQL", note: "FSR 4.1 for RDNA 3" },
      { v: "26.5.2", date: "2026-05-14", kind: "WHQL", note: "" },
      { v: "26.5.1", date: "2026-05-06", kind: "WHQL", note: "" },
      { v: "26.4.1", date: "2026-04-21", kind: "WHQL", note: "" },
      { v: "26.3.1", date: "2026-03-20", kind: "WHQL", note: "Recommended workaround for Blender/C4D issues" },
      { v: "26.2.2", date: "2026-02-26", kind: "WHQL", note: "" },
      { v: "26.1.1", date: "2026-01-27", kind: "WHQL", note: "" },
      { v: "25.11.1", date: "2025-11-13", kind: "WHQL", note: "" },
      { v: "25.10.1", date: "2025-10-14", kind: "WHQL", note: "" },
      { v: "25.9.1", date: "2025-09-16", kind: "WHQL", note: "" },
      { v: "25.8.1", date: "2025-08-19", kind: "WHQL", note: "" },
      { v: "25.6.1", date: "2025-06-17", kind: "WHQL", note: "" },
      { v: "24.12.1", date: "2024-12-10", kind: "WHQL", note: "" },
      { v: "24.10.1", date: "2024-10-24", kind: "WHQL", note: "" },
      { v: "24.8.1", date: "2024-08-20", kind: "WHQL", note: "" },
      { v: "23.12.1", date: "2023-12-05", kind: "WHQL", note: "" },
      { v: "22.8.2", date: "2022-08-22", kind: "Beta", note: "" },
    ],
  },
  {
    id: "intel",
    vendor: "Intel",
    name: "Intel Arc & Iris Xe Graphics Driver (WHQL)",
    family: "Display",
    latest: "32.0.101.8991",
    page: "https://www.intel.com/content/www/us/en/download-center/home.html",
    dlNote: "Use the Intel Driver & Support Assistant, or search 'Arc Graphics' in the download center.",
    detect: /intel/i,
    versions: [
      { v: "32.0.101.8991", date: "2026-08-25", kind: "WHQL", note: "Current release" },
      { v: "32.0.101.8974", date: "2026-08-15", kind: "WHQL", note: "FPS uplift vs 8864" },
      { v: "32.0.101.8864", date: "2026-06-03", kind: "WHQL", note: "" },
      { v: "32.0.101.8788", date: "2026-04-21", kind: "WHQL", note: "" },
      { v: "31.0.101.5768", date: "2024-03-26", kind: "WHQL", note: "31.0 branch era" },
      { v: "31.0.101.5382", date: "2023-11-21", kind: "WHQL", note: "31.0 branch era" },
      { v: "31.0.101.5186", date: "2023-08-15", kind: "WHQL", note: "31.0 branch era" },
    ],
  },
  {
    id: "realtek",
    vendor: "Realtek",
    name: "Realtek High Definition Audio (UAD)",
    family: "Audio",
    latest: "6.0.9998.1",
    page: "https://www.realtek.com/Download/List?cate_id=581",
    dlNote: "Prefer your PC maker's (OEM) driver from the support page — it matches your codec.",
    detect: /realtek/i,
    versions: [
      { v: "6.0.9998.1", date: "2026-06-29", kind: "UAD WHQL", note: "Current generic UAD package" },
      { v: "6.0.9977.1", date: "2026-05-20", kind: "UAD", note: "" },
      { v: "6.0.9963.1", date: "2025-12-09", kind: "UAD WHQL", note: "" },
      { v: "6.0.9927.1", date: "2025-10-07", kind: "UAD WHQL", note: "Most common installed build" },
      { v: "6.0.9918.1", date: "2025-07-22", kind: "UAD", note: "" },
      { v: "6.0.9865.1", date: "2025-03-11", kind: "UAD", note: "" },
      { v: "6.0.9771.1", date: "2025-01-10", kind: "UAD", note: "" },
      { v: "6.0.9702.1", date: "2024-07-16", kind: "UAD", note: "" },
    ],
  },
];

export const WINDOWS_BUILDS = [
  { build: "26200", name: "Windows 11 25H2", date: "2025-09" },
  { build: "26100", name: "Windows 11 24H2", date: "2024-10" },
  { build: "22631", name: "Windows 11 23H2", date: "2023-10" },
  { build: "22621", name: "Windows 11 22H2", date: "2022-09" },
  { build: "22000", name: "Windows 11 21H2", date: "2021-10" },
  { build: "19045", name: "Windows 10 22H2", date: "2022-10" },
  { build: "19044", name: "Windows 10 21H2", date: "2021-11" },
  { build: "19043", name: "Windows 10 21H1", date: "2021-05" },
  { build: "19042", name: "Windows 10 20H2", date: "2020-10" },
  { build: "19041", name: "Windows 10 2004", date: "2020-05" },
  { build: "18363", name: "Windows 10 1909", date: "2019-11" },
  { build: "18362", name: "Windows 10 1903", date: "2019-05" },
  { build: "17763", name: "Windows 10 1809", date: "2018-10" },
  { build: "17134", name: "Windows 10 1803", date: "2018-04" },
  { build: "16299", name: "Windows 10 1709", date: "2017-10" },
  { build: "15063", name: "Windows 10 1703", date: "2017-04" },
  { build: "14393", name: "Windows 10 1607", date: "2016-08" },
  { build: "10586", name: "Windows 10 1511", date: "2015-11" },
  { build: "10240", name: "Windows 10 1507", date: "2015-07" },
];

export function windowsName(build) {
  const b = String(build || "").replace(/^(\d+)\.\d+$/, "$1");
  const hit = WINDOWS_BUILDS.find((w) => w.build === b);
  return hit ? `${hit.name} (build ${b})` : b ? `Windows build ${b}` : null;
}

/** Device setup class GUIDs → friendly names. */
export const CLASS_GUIDS = {
  "4d36e968-e325-11ce-bfc1-08002be10318": { name: "Display adapters", family: "display" },
  "4d36e96c-e325-11ce-bfc1-08002be10318": { name: "MEDIA · sound, video, game controllers", family: "media" },
  "4d36e972-e325-11ce-bfc1-08002be10318": { name: "Network adapters", family: "net" },
  "4d36e969-e325-11ce-bfc1-08002be10318": { name: "HDC · hard disk controllers", family: "hdc" },
  "4d36e97b-e325-11ce-bfc1-08002be10318": { name: "Keyboards", family: "input" },
  "4d36e97d-e325-11ce-bfc1-08002be10318": { name: "Printers", family: "print" },
  "4d36e97e-e325-11ce-bfc1-08002be10318": { name: "SCSI adapters", family: "scsi" },
  "4d36e980-e325-11ce-bfc1-08002be10318": { name: "Ports · COM & LPT", family: "ports" },
  "36fc9e60-c465-11cf-8056-444553540000": { name: "USB", family: "usb" },
  "745a17a0-74d3-11d0-b6fe-00a0c90f57da": { name: "HID · human interface devices", family: "input" },
  "6bdd1fc6-810f-11d0-bec7-08002be2092f": { name: "Imaging devices", family: "imaging" },
  "50127dc3-0f36-415e-a6cc-4cb3be910b65": { name: "Camera", family: "camera" },
  "4d36e974-e325-11ce-bfc1-08002be10318": { name: "PCMCIA adapters", family: "pcmcia" },
};

/* ---- NVIDIA internal version resolution ---------------------------------- */
/**
 * NVIDIA marketing "596.49" ↔ internal file suffix "5949" → "31.0.15.5949".
 * Rule: suffix = last two digits of the major + two-digit minor.
 * 616.56 → "16"+"56" = 1656 → "32.0.16.1656".
 */
export function nvidiaSuffix(marketingVersion) {
  const m = String(marketingVersion).match(/^(\d+)\.(\d+)$/);
  if (!m) return null;
  const major = m[1].padStart(3, "0");
  const minor = m[2].padStart(2, "0");
  return major.slice(-2) + minor;
}

export function nvidiaFromFileVersion(fileVersion) {
  const segs = String(fileVersion || "").split(".");
  const suffix = segs[segs.length - 1];
  if (!/^\d{4}$/.test(suffix)) return null;
  const entry = findNvidiaBySuffix(suffix);
  return entry ? { version: entry.v, suffix } : { version: null, suffix };
}

export function findNvidiaBySuffix(suffix) {
  const cat = DRIVER_CATALOG.find((d) => d.id === "nvidia");
  return cat.versions.find((e) => nvidiaSuffix(e.v) === suffix) || null;
}

export function nearestNvidiaBySuffix(suffix) {
  const cat = DRIVER_CATALOG.find((d) => d.id === "nvidia");
  const n = parseInt(suffix, 10);
  const nums = cat.versions
    .map((e) => ({ e, s: parseInt(nvidiaSuffix(e.v), 10) }))
    .filter((x) => Number.isFinite(x.s))
    .sort((a, b) => a.s - b.s);
  if (!nums.length) return null;
  let best = nums[0];
  for (const x of nums) if (Math.abs(x.s - n) < Math.abs(best.s - n)) best = x;
  return { version: best.e.v, gap: n - best.s };
}

export function findDriverById(id) {
  return DRIVER_CATALOG.find((d) => d.id === id) || null;
}

/** Try to match a raw version string against a vendor catalog. */
export function matchCatalogVersion(cat, rawVersion) {
  if (!rawVersion) return null;
  const v = String(rawVersion).trim();
  if (cat.id === "nvidia") {
    const direct = cat.versions.find((e) => e.v === v);
    if (direct) return { version: direct, exact: true };
    // "32.0.16.1656" / "31.0.15.9649" → internal file-version form
    const segs4 = v.split(".");
    const last = segs4[segs4.length - 1];
    if (/^\d{4}$/.test(last)) {
      const found = findNvidiaBySuffix(last);
      if (found) return { version: found, exact: true, viaSuffix: true };
      const near = nearestNvidiaBySuffix(last);
      if (near && near.version) {
        return { version: cat.versions.find((x) => x.v === near.version), exact: false, nearest: near, viaSuffix: true };
      }
      return null;
    }
    // "596.49" → marketing form
    const suffix = nvidiaSuffix(v);
    if (suffix) {
      const found = findNvidiaBySuffix(suffix);
      if (found) return { version: found, exact: true };
      const near = nearestNvidiaBySuffix(suffix);
      if (near && near.version) {
        return { version: cat.versions.find((x) => x.v === near.version), exact: false, nearest: near };
      }
    }
    return null;
  }
  const hit = cat.versions.find((e) => e.v === v);
  if (hit) return { version: hit, exact: true };
  return null;
}
