/**
 * DriverGuide · DLL catalog — every classic "missing .dll" with its version history.
 * Static, offline data compiled 2026-08-31. Version tables list the redistributable
 * builds that shipped in the wild; the latest entry of each row is what the
 * current installer drops on disk.
 */

export const PACKAGES = {
  vcpp2022: {
    id: "vcpp2022",
    name: "Microsoft Visual C++ 2015–2022 Redistributable (x86 & x64)",
    page: "https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist",
    url64: "https://aka.ms/vs/17/release/vc_redist.x64.exe",
    url32: "https://aka.ms/vs/17/release/vc_redist.x86.exe",
    note: "One installer covers every 2015–2022 version (14.0 → 14.4x). Install BOTH x86 and x64 — 32-bit games still need the x86 copy.",
  },
  vcpp2013: {
    id: "vcpp2013",
    name: "Microsoft Visual C++ 2013 Redistributable",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=40784",
    url64: "https://aka.ms/highdpimfc2013x64enu",
    url32: "https://aka.ms/highdpimfc2013x86enu",
    note: "Supports msvcr120.dll / msvcp120.dll. Ships 12.0.21005.1 (RTM) → 12.0.40664.0.",
  },
  vcpp2012: {
    id: "vcpp2012",
    name: "Microsoft Visual C++ 2012 Redistributable (Update 4)",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=30679",
    url64: "https://download.microsoft.com/download/1/6/B/16B06F60-3B20-4FF2-B699-5E9B7962F9AE/VSU_4/vcredist_x64.exe",
    url32: "https://download.microsoft.com/download/1/6/B/16B06F60-3B20-4FF2-B699-5E9B7962F9AE/VSU_4/vcredist_x86.exe",
    note: "Supports msvcr110.dll / msvcp110.dll. 11.0.61030.0 (Update 4) is the final build.",
  },
  vcpp2010: {
    id: "vcpp2010",
    name: "Microsoft Visual C++ 2010 Redistributable (SP1)",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=26999",
    url64: "https://download.microsoft.com/download/1/6/5/165255E7-1014-4D0A-B094-B6A430A6BFFC/vcredist_x64.exe",
    url32: "https://download.microsoft.com/download/1/6/5/165255E7-1014-4D0A-B094-B6A430A6BFFC/vcredist_x86.exe",
    note: "Supports msvcr100.dll / msvcp100.dll. 10.0.40219.325 (SP1) is the final build.",
  },
  vcpp2008: {
    id: "vcpp2008",
    name: "Microsoft Visual C++ 2008 SP1 Redistributable",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=5582",
    url32: "https://download.microsoft.com/download/5/D/8/5D8C65CB-C849-4025-8E95-C3966CAFD8AE/vc_redist.x86.exe",
    url64: "https://download.microsoft.com/download/5/D/8/5D8C65CB-C849-4025-8E95-C3966CAFD8AE/vc_redist.x64.exe",
    note: "Supports msvcr90.dll / msvcp90.dll (9.0.30729.6161 = SP1 security update).",
  },
  vcpp2005: {
    id: "vcpp2005",
    name: "Microsoft Visual C++ 2005 SP1 Redistributable",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=26347",
    url32: "https://download.microsoft.com/download/8/B/4/8B42259F-5D70-43F4-AC2E-4B208FD8D66A/VS8.0SP1-KB971090-x86-intl.exe",
    url64: "https://download.microsoft.com/download/8/B/4/8B42259F-5D70-43F4-AC2E-4B208FD8D66A/VS8.0SP1-KB971090-x64-intl.exe",
    note: "Supports msvcr80.dll / msvcp80.dll. 8.0.50727.762 (SP1) is the final build.",
  },
  vcpp2003: {
    id: "vcpp2003",
    name: "Microsoft Visual C++ 2003 / .NET 2003 Redistributable",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=40784",
    url64: "https://www.microsoft.com/en-us/download/details.aspx?id=40784",
    url32: "https://download.microsoft.com/download/7/8/3/78329E96-0D10-4A21-A674-3E78D8B06A0E/vcredist.exe",
    note: "Supports msvcr71.dll (7.10.6030.0). Rarely needed; msvcr71 is not a 64-bit DLL.",
  },
  dxruntime: {
    id: "dxruntime",
    name: "DirectX End-User Runtime (June 2010)",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=35",
    url64: "https://download.microsoft.com/download/8/4/A/84A35BF1-DAFE-4AE8-82AF-AD2AE20B6B03/directx_Jun2010_redist.exe",
    url32: "https://download.microsoft.com/download/8/4/A/84A35BF1-DAFE-4AE8-82AF-AD2AE20B6B03/directx_Jun2010_redist.exe",
    note: "Installs d3dx9_24 → d3dx9_43, d3dx10_43, d3dx11_43, d3dcompiler_43, xinput1_3, xactengine. One 32-bit installer services both x86 and x64. Reboot-free on Win10/11.",
  },
  dx11: {
    id: "dx11",
    name: "DirectX 11 runtime DLLs (d3dcompiler_46/47, d3dx11_43)",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=35",
    url64: "https://download.microsoft.com/download/8/4/A/84A35BF1-DAFE-4AE8-82AF-AD2AE20B6B03/directx_Jun2010_redist.exe",
    url32: "https://download.microsoft.com/download/8/4/A/84A35BF1-DAFE-4AE8-82AF-AD2AE20B6B03/directx_Jun2010_redist.exe",
    note: "d3dcompiler_47.dll is also shipped inside the Windows 10/11 system and the DirectX SDK.",
  },
  ucrt: {
    id: "ucrt",
    name: "Universal CRT (UCRT) — api-ms-win-crt-*.dll",
    page: "https://learn.microsoft.com/en-us/cpp/windows/universal-crt-deployment",
    url64: "https://aka.ms/vs/17/release/vc_redist.x64.exe",
    url32: "https://aka.ms/vs/17/release/vc_redist.x86.exe",
    note: "ucrtbase.dll lives in System32 on Win10+; older games may expect an app-local copy. VC++ 2015+ redist includes it.",
  },
  vb6: {
    id: "vb6",
    name: "Visual Basic 6.0 Runtime (SP6)",
    page: "https://www.microsoft.com/en-us/download/details.aspx?id=24417",
    url64: "https://www.microsoft.com/en-us/download/details.aspx?id=24417",
    url32: "https://download.microsoft.com/download/5/D/8/5D8C65CB-C849-4025-8E95-C3966CAFD8AE/VBRun60sp6.exe",
    note: "Supplies msvbvm60.dll (6.0.98.15). msvbvm50.dll comes from the VB5 runtime. 32-bit only — run the x86 installer.",
  },
  openal: {
    id: "openal",
    name: "OpenAL Soft / OpenAL32.dll",
    page: "https://openal-soft.org/",
    url64: "https://openal-soft.org/",
    note: "Many older games expect OpenAL32.dll + wrap_oal.dll from Creative's OpenAL. OpenAL Soft is the maintained drop-in.",
  },
  physx: {
    id: "physx",
    name: "NVIDIA PhysX System Software",
    page: "https://www.nvidia.com/en-us/drivers/physx-need/",
    url64: "https://www.nvidia.com/en-us/drivers/physx-need/",
    note: "PhysXLoader.dll and nvphysx*.dll for games that do not use the in-game build.",
  },
  netfx: {
    id: "netfx",
    name: ".NET Framework (3.5 / 4.8)",
    page: "https://dotnet.microsoft.com/en-us/download/dotnet-framework",
    url64: "https://dotnet.microsoft.com/en-us/download/dotnet-framework",
    note: "Not .dll-per-file; install the runtime bundle that the app asks for.",
  },
};

const PKG = (id) => PACKAGES[id];

export const DLL_CATALOG = [
  // ---- VC++ 2015-2022 (msvcp140 family) ----------------------------------
  {
    name: "msvcp140.dll",
    pkg: "vcpp2022",
    desc: "C++ runtime — the single most common missing-DLL on Windows for games and apps built with Visual Studio 2015–2022.",
    bits: ["x86", "x64"],
    related: ["vcruntime140.dll", "vcruntime140_1.dll", "msvcp140_1.dll", "msvcp140_2.dll", "msvcp140_atomic_wait.dll", "msvcp140_codecvt_ids.dll", "concrt140.dll"],
    versions: [
      { v: "14.00.24215.1", note: "2015 RTM (14.0)" },
      { v: "14.10.25017.0", note: "2015 Update 3" },
      { v: "14.14.26428.0", note: "2017 14.14" },
      { v: "14.15.26706.0", note: "2017 15.5" },
      { v: "14.16.27027.1", note: "2017 15.7" },
      { v: "14.20.27508.1", note: "2019 14.20" },
      { v: "14.21.27702.0", note: "2019 14.21" },
      { v: "14.22.27821.0", note: "2019 14.22" },
      { v: "14.23.27820.0", note: "2019 14.23" },
      { v: "14.24.28127.4", note: "2019 14.24" },
      { v: "14.25.28508.3", note: "2019 14.25" },
      { v: "14.26.28720.3", note: "2019 14.26" },
      { v: "14.27.29112.0", note: "2019 14.27" },
      { v: "14.28.29325.2", note: "2019 14.28" },
      { v: "14.28.29913.0", note: "2019 14.28.3" },
      { v: "14.29.30037.0", note: "2019 14.29" },
      { v: "14.29.30133.0", note: "2019 14.29.2" },
      { v: "14.30.30704.0", note: "2019 14.30" },
      { v: "14.30.30705.0", note: "2019 14.30.2" },
      { v: "14.31.31103.0", note: "2019 14.31" },
      { v: "14.31.30818.0", note: "2019 14.31.3" },
      { v: "14.32.31326.0", note: "2019 14.32" },
      { v: "14.32.31424.0", note: "2019 14.32.2" },
      { v: "14.33.31429.0", note: "2021 14.33" },
      { v: "14.34.31931.0", note: "2021 14.34" },
      { v: "14.35.32215.0", note: "2021 14.35" },
      { v: "14.36.32532.0", note: "2021 14.36" },
      { v: "14.37.32822.0", note: "2021 14.37" },
      { v: "14.38.33130.0", note: "2021 14.38" },
      { v: "14.38.33135.0", note: "2021 14.38.3" },
      { v: "14.39.33519.0", note: "2021 14.39" },
      { v: "14.40.33810.0", note: "2021 14.40" },
      { v: "14.41.34120.0", note: "2021 14.41" },
      { v: "14.42.34433.0", note: "2021 14.42" },
      { v: "14.43.34808.0", note: "2021 14.43" },
      { v: "14.44.35207.0", note: "2021 14.44" },
    ],
  },
  {
    name: "vcruntime140.dll",
    pkg: "vcpp2022",
    desc: "C runtime companion to msvcp140, VC++ 2015–2022. Ships in System32 on modern Windows; the redist refreshes it.",
    bits: ["x86", "x64"],
    related: ["msvcp140.dll", "vcruntime140_1.dll"],
    versions: [
      { v: "14.00.24215.1", note: "2015 RTM" },
      { v: "14.14.26428.0", note: "2017 14.14" },
      { v: "14.16.27027.1", note: "2017 15.7" },
      { v: "14.20.27508.1", note: "2019 14.20" },
      { v: "14.22.27821.0", note: "2019 14.22" },
      { v: "14.24.28127.4", note: "2019 14.24" },
      { v: "14.26.28720.3", note: "2019 14.26" },
      { v: "14.28.29325.2", note: "2019 14.28" },
      { v: "14.29.30037.0", note: "2019 14.29" },
      { v: "14.30.30704.0", note: "2019 14.30" },
      { v: "14.31.31103.0", note: "2019 14.31" },
      { v: "14.32.31326.0", note: "2019 14.32" },
      { v: "14.33.31429.0", note: "2021 14.33" },
      { v: "14.34.31931.0", note: "2021 14.34" },
      { v: "14.35.32215.0", note: "2021 14.35" },
      { v: "14.36.32532.0", note: "2021 14.36" },
      { v: "14.37.32822.0", note: "2021 14.37" },
      { v: "14.38.33130.0", note: "2021 14.38" },
      { v: "14.38.33135.0", note: "2021 14.38.3" },
      { v: "14.39.33519.0", note: "2021 14.39" },
      { v: "14.40.33810.0", note: "2021 14.40" },
      { v: "14.41.34120.0", note: "2021 14.41" },
      { v: "14.42.34433.0", note: "2021 14.42" },
      { v: "14.43.34808.0", note: "2021 14.43" },
      { v: "14.44.35207.0", note: "2021 14.44" },
    ],
  },
  {
    name: "vcruntime140_1.dll",
    pkg: "vcpp2022",
    desc: "64-bit only C runtime introduced with VC++ 2019 (14.20). Missing on old Windows without the redist.",
    bits: ["x64"],
    related: ["vcruntime140.dll", "msvcp140.dll"],
    versions: [
      { v: "14.20.27508.1", note: "2019 14.20 (introduced)" },
      { v: "14.21.27702.0", note: "2019 14.21" },
      { v: "14.22.27821.0", note: "2019 14.22" },
      { v: "14.24.28127.4", note: "2019 14.24" },
      { v: "14.26.28720.3", note: "2019 14.26" },
      { v: "14.28.29325.2", note: "2019 14.28" },
      { v: "14.29.30037.0", note: "2019 14.29" },
      { v: "14.30.30704.0", note: "2019 14.30" },
      { v: "14.31.31103.0", note: "2019 14.31" },
      { v: "14.32.31326.0", note: "2019 14.32" },
      { v: "14.33.31429.0", note: "2021 14.33" },
      { v: "14.34.31931.0", note: "2021 14.34" },
      { v: "14.35.32215.0", note: "2021 14.35" },
      { v: "14.36.32532.0", note: "2021 14.36" },
      { v: "14.37.32822.0", note: "2021 14.37" },
      { v: "14.38.33130.0", note: "2021 14.38" },
      { v: "14.39.33519.0", note: "2021 14.39" },
      { v: "14.40.33810.0", note: "2021 14.40" },
      { v: "14.41.34120.0", note: "2021 14.41" },
      { v: "14.42.34433.0", note: "2021 14.42" },
      { v: "14.43.34808.0", note: "2021 14.43" },
      { v: "14.44.35207.0", note: "2021 14.44" },
    ],
  },
  {
    name: "msvcp140_1.dll",
    pkg: "vcpp2022",
    desc: "Additional C++ runtime module (parallel patterns), VC++ 2015–2022 redist.",
    bits: ["x86", "x64"],
    related: ["msvcp140.dll"],
    versions: [
      { v: "14.00.24215.1", note: "2015 RTM" },
      { v: "14.16.27027.1", note: "2017 15.7" },
      { v: "14.20.27508.1", note: "2019 14.20" },
      { v: "14.28.29325.2", note: "2019 14.28" },
      { v: "14.29.30037.0", note: "2019 14.29" },
      { v: "14.32.31326.0", note: "2019 14.32" },
      { v: "14.36.32532.0", note: "2021 14.36" },
      { v: "14.40.33810.0", note: "2021 14.40" },
      { v: "14.43.34808.0", note: "2021 14.43" },
      { v: "14.44.35207.0", note: "2021 14.44" },
    ],
  },
  {
    name: "msvcp140_2.dll",
    pkg: "vcpp2022",
    desc: "Additional C++ runtime module, VC++ 2015–2022 redist.",
    bits: ["x86", "x64"],
    related: ["msvcp140.dll"],
    versions: [
      { v: "14.00.24215.1", note: "2015 RTM" },
      { v: "14.16.27027.1", note: "2017 15.7" },
      { v: "14.24.28127.4", note: "2019 14.24" },
      { v: "14.29.30037.0", note: "2019 14.29" },
      { v: "14.34.31931.0", note: "2021 14.34" },
      { v: "14.40.33810.0", note: "2021 14.40" },
      { v: "14.44.35207.0", note: "2021 14.44" },
    ],
  },
  {
    name: "msvcp140_atomic_wait.dll",
    pkg: "vcpp2022",
    desc: "C++17 atomic wait support DLL, VC++ 2019/2021 redist.",
    bits: ["x86", "x64"],
    related: ["msvcp140.dll"],
    versions: [
      { v: "14.29.30037.0", note: "2019 14.29 (introduced)" },
      { v: "14.30.30704.0", note: "2019 14.30" },
      { v: "14.31.31103.0", note: "2019 14.31" },
      { v: "14.36.32532.0", note: "2021 14.36" },
      { v: "14.38.33130.0", note: "2021 14.38" },
      { v: "14.40.33810.0", note: "2021 14.40" },
      { v: "14.44.35207.0", note: "2021 14.44" },
    ],
  },
  {
    name: "concrt140.dll",
    pkg: "vcpp2022",
    desc: "Concurrency Runtime, VC++ 2015–2022 redist.",
    bits: ["x86", "x64"],
    related: ["msvcp140.dll"],
    versions: [
      { v: "14.00.24215.1", note: "2015 RTM" },
      { v: "14.16.27027.1", note: "2017 15.7" },
      { v: "14.28.29325.2", note: "2019 14.28" },
      { v: "14.36.32532.0", note: "2021 14.36" },
      { v: "14.44.35207.0", note: "2021 14.44" },
    ],
  },

  // ---- VC++ 2013 ----------------------------------------------------------
  {
    name: "msvcr120.dll",
    pkg: "vcpp2013",
    desc: "VC++ 2013 C runtime. Games from 2014–2016 era need this or msvcp120.",
    bits: ["x86", "x64"],
    related: ["msvcp120.dll", "msvcr120_clr0400.dll"],
    versions: [
      { v: "12.0.21005.1", note: "2013 RTM" },
      { v: "12.0.30501.0", note: "2013 Update 2" },
      { v: "12.0.40660.0", note: "2013 Update 5" },
      { v: "12.0.40664.0", note: "2013 Update 5 (sec)" },
    ],
  },
  {
    name: "msvcp120.dll",
    pkg: "vcpp2013",
    desc: "VC++ 2013 C++ runtime.",
    bits: ["x86", "x64"],
    related: ["msvcr120.dll"],
    versions: [
      { v: "12.0.21005.1", note: "2013 RTM" },
      { v: "12.0.30501.0", note: "2013 Update 2" },
      { v: "12.0.40660.0", note: "2013 Update 5" },
      { v: "12.0.40664.0", note: "2013 Update 5 (sec)" },
    ],
  },

  // ---- VC++ 2012 ----------------------------------------------------------
  {
    name: "msvcr110.dll",
    pkg: "vcpp2012",
    desc: "VC++ 2012 C runtime. Windows 7/8-era games.",
    bits: ["x86", "x64"],
    related: ["msvcp110.dll"],
    versions: [
      { v: "11.0.50727.1", note: "2012 RTM" },
      { v: "11.0.51106.1", note: "2012 Update 1" },
      { v: "11.0.60315.1", note: "2012 Update 3" },
      { v: "11.0.61030.0", note: "2012 Update 4 (final)" },
    ],
  },
  {
    name: "msvcp110.dll",
    pkg: "vcpp2012",
    desc: "VC++ 2012 C++ runtime.",
    bits: ["x86", "x64"],
    related: ["msvcr110.dll"],
    versions: [
      { v: "11.0.50727.1", note: "2012 RTM" },
      { v: "11.0.51106.1", note: "2012 Update 1" },
      { v: "11.0.60315.1", note: "2012 Update 3" },
      { v: "11.0.61030.0", note: "2012 Update 4 (final)" },
    ],
  },

  // ---- VC++ 2010 ----------------------------------------------------------
  {
    name: "msvcr100.dll",
    pkg: "vcpp2010",
    desc: "VC++ 2010 C runtime — the classic 'msvcr100.dll is missing' error.",
    bits: ["x86", "x64"],
    related: ["msvcp100.dll"],
    versions: [
      { v: "10.0.30319.1", note: "2010 RTM" },
      { v: "10.0.40219.1", note: "2010 SP1" },
      { v: "10.0.40219.325", note: "2010 SP1 (sec)" },
    ],
  },
  {
    name: "msvcp100.dll",
    pkg: "vcpp2010",
    desc: "VC++ 2010 C++ runtime.",
    bits: ["x86", "x64"],
    related: ["msvcr100.dll"],
    versions: [
      { v: "10.0.30319.1", note: "2010 RTM" },
      { v: "10.0.40219.1", note: "2010 SP1" },
      { v: "10.0.40219.325", note: "2010 SP1 (sec)" },
    ],
  },

  // ---- VC++ 2008 ----------------------------------------------------------
  {
    name: "msvcr90.dll",
    pkg: "vcpp2008",
    desc: "VC++ 2008 C runtime. Pre-2010 games; 9.0.30729.6161 ships with the SP1 security update.",
    bits: ["x86", "x64"],
    related: ["msvcp90.dll"],
    versions: [
      { v: "9.0.21022.8", note: "2008 RTM" },
      { v: "9.0.30729.1", note: "2008 SP1" },
      { v: "9.0.30729.4148", note: "2008 SP1 (sec)" },
      { v: "9.0.30729.6161", note: "2008 SP1 (final sec)" },
    ],
  },
  {
    name: "msvcp90.dll",
    pkg: "vcpp2008",
    desc: "VC++ 2008 C++ runtime.",
    bits: ["x86", "x64"],
    related: ["msvcr90.dll"],
    versions: [
      { v: "9.0.21022.8", note: "2008 RTM" },
      { v: "9.0.30729.1", note: "2008 SP1" },
      { v: "9.0.30729.4148", note: "2008 SP1 (sec)" },
      { v: "9.0.30729.6161", note: "2008 SP1 (final sec)" },
    ],
  },

  // ---- VC++ 2005 ----------------------------------------------------------
  {
    name: "msvcr80.dll",
    pkg: "vcpp2005",
    desc: "VC++ 2005 C runtime. Very old titles (2005–2009).",
    bits: ["x86", "x64"],
    related: ["msvcp80.dll"],
    versions: [
      { v: "8.0.50727.42", note: "2005 RTM" },
      { v: "8.0.50727.762", note: "2005 SP1 (final)" },
    ],
  },
  {
    name: "msvcp80.dll",
    pkg: "vcpp2005",
    desc: "VC++ 2005 C++ runtime.",
    bits: ["x86", "x64"],
    related: ["msvcr80.dll"],
    versions: [
      { v: "8.0.50727.42", note: "2005 RTM" },
      { v: "8.0.50727.762", note: "2005 SP1 (final)" },
    ],
  },

  // ---- Legacy CRT ---------------------------------------------------------
  {
    name: "msvcr71.dll",
    pkg: "vcpp2003",
    desc: "VC++ .NET 2003 runtime (7.1). 32-bit only; classic on early XP-era games.",
    bits: ["x86"],
    related: [],
    versions: [
      { v: "7.10.3052.4", note: ".NET 2003 RTM" },
      { v: "7.10.6030.0", note: ".NET 2003 (final)" },
    ],
  },
  {
    name: "msvcrt.dll",
    pkg: "vcpp2003",
    desc: "C runtime (6.0/7.0 era). System component since Windows 95 — only ever 'missing' on broken installs.",
    bits: ["x86", "x64"],
    related: [],
    versions: [
      { v: "6.0.8168.0", note: "NT4/2000 era" },
      { v: "7.0.2600.0", note: "XP era" },
      { v: "7.0.3790.0", note: "Server 2003 era" },
      { v: "8.0.50727.42", note: "Vista-era forwarder" },
    ],
  },
  {
    name: "msvbvm60.dll",
    pkg: "vb6",
    desc: "Visual Basic 6.0 virtual machine. Needed by countless old business apps and VB6 games.",
    bits: ["x86"],
    related: ["msvbvm50.dll"],
    versions: [
      { v: "6.0.81.69", note: "VB6 RTM" },
      { v: "6.0.89.64", note: "SP4" },
      { v: "6.0.96.59", note: "SP5" },
      { v: "6.0.98.15", note: "SP6 (final)" },
    ],
  },
  {
    name: "msvbvm50.dll",
    pkg: "vb6",
    desc: "Visual Basic 5.0 virtual machine. Older VB5 applications.",
    bits: ["x86"],
    related: ["msvbvm60.dll"],
    versions: [
      { v: "5.0.1711.0", note: "VB5 SP3 (final)" },
    ],
  },

  // ---- DirectX 9 / 10 / 11 managed-side DLLs ------------------------------
  {
    name: "d3dx9_43.dll",
    pkg: "dxruntime",
    desc: "Direct3D 9 utility layer — the classic 'd3dx9_43.dll is missing' game error. Highest D3DX9 revision.",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [
      { v: "9.29.952.3111", note: "June 2010 runtime" },
      { v: "9.29.952.3107", note: "Feb 2010 SDK" },
    ],
  },
  {
    name: "d3dx9_42.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 42 (August 2009 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.27.952.3001", note: "Aug 2009 runtime" }],
  },
  {
    name: "d3dx9_41.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 41 (March 2009 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.26.952.2841", note: "Mar 2009 runtime" }],
  },
  {
    name: "d3dx9_40.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 40 (August 2008 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.24.952.2805", note: "Aug 2008 runtime" }],
  },
  {
    name: "d3dx9_39.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 39 (November 2007 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.23.949.2379", note: "Nov 2007 runtime" }],
  },
  {
    name: "d3dx9_38.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 38 (June 2007 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.22.949.2248", note: "Jun 2007 runtime" }],
  },
  {
    name: "d3dx9_37.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 37 (April 2007 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.21.949.2210", note: "Apr 2007 runtime" }],
  },
  {
    name: "d3dx9_36.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 36 (October 2006 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.16.949.2128", note: "Oct 2006 runtime" }],
  },
  {
    name: "d3dx9_35.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 35 (June 2006 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.15.949.1977", note: "Jun 2006 runtime" }],
  },
  {
    name: "d3dx9_34.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 34 (February 2006 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.13.949.1745", note: "Feb 2006 runtime" }],
  },
  {
    name: "d3dx9_33.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 33 (December 2005 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.12.949.1678", note: "Dec 2005 runtime" }],
  },
  {
    name: "d3dx9_32.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 32 (August 2005 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.11.949.1608", note: "Aug 2005 runtime" }],
  },
  {
    name: "d3dx9_31.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 31 (February 2005 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.10.949.1500", note: "Feb 2005 runtime" }],
  },
  {
    name: "d3dx9_30.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 30 (December 2004 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.9.949.1360", note: "Dec 2004 runtime" }],
  },
  {
    name: "d3dx9_29.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 29 (October 2004 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.8.949.1280", note: "Oct 2004 runtime" }],
  },
  {
    name: "d3dx9_28.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 28 (August 2004 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.7.949.1103", note: "Aug 2004 runtime" }],
  },
  {
    name: "d3dx9_27.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 27 (April 2004 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.6.949.1048", note: "Apr 2004 runtime" }],
  },
  {
    name: "d3dx9_26.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 26 (December 2003 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.4.949.994", note: "Dec 2003 runtime" }],
  },
  {
    name: "d3dx9_25.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 25 (August 2003 runtime).",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.2.949.909", note: "Aug 2003 runtime" }],
  },
  {
    name: "d3dx9_24.dll",
    pkg: "dxruntime",
    desc: "D3DX9 revision 24 (April 2003) — the oldest D3DX9 revision in the June 2010 redist.",
    bits: ["x86", "x64"],
    related: d3dx9family(),
    versions: [{ v: "9.0.904.0", note: "Apr 2003 runtime" }],
  },
  {
    name: "d3dx10_43.dll",
    pkg: "dxruntime",
    desc: "D3DX10 utility layer, revision 43 (June 2010 runtime).",
    bits: ["x86", "x64"],
    related: ["d3dx11_43.dll"],
    versions: [{ v: "10.0.2614.1750", note: "Jun 2010 runtime" }],
  },
  {
    name: "d3dx11_43.dll",
    pkg: "dxruntime",
    desc: "D3DX11 utility layer, revision 43 (June 2010 runtime).",
    bits: ["x86", "x64"],
    related: ["d3dx10_43.dll"],
    versions: [{ v: "11.0.2614.1750", note: "Jun 2010 runtime" }],
  },
  {
    name: "d3dcompiler_47.dll",
    pkg: "dx11",
    desc: "HLSL shader compiler, revision 47. Ships with Windows 10/11 (System32) and the DX SDK; games may need the redist copy.",
    bits: ["x86", "x64"],
    related: ["d3dcompiler_46.dll", "d3dcompiler_43.dll"],
    versions: [
      { v: "10.0.10240.16384", note: "Win10 1507" },
      { v: "10.0.10586.0", note: "Win10 1511" },
      { v: "10.0.14393.0", note: "Win10 1607" },
      { v: "10.0.16299.15", note: "Win10 1709" },
      { v: "10.0.17763.1", note: "Win10 1809" },
      { v: "10.0.18362.1", note: "Win10 1903" },
      { v: "10.0.19041.1", note: "Win10 2004" },
      { v: "10.0.22000.1", note: "Win11 21H2" },
      { v: "10.0.22621.1", note: "Win11 22H2" },
      { v: "10.0.26100.1", note: "Win11 24H2" },
    ],
  },
  {
    name: "d3dcompiler_46.dll",
    pkg: "dx11",
    desc: "HLSL compiler revision 46 (older titles).",
    bits: ["x86", "x64"],
    related: ["d3dcompiler_47.dll"],
    versions: [{ v: "9.30.9200.16384", note: "Win8-era" }],
  },
  {
    name: "d3dcompiler_43.dll",
    pkg: "dxruntime",
    desc: "HLSL compiler revision 43 (June 2010 runtime).",
    bits: ["x86", "x64"],
    related: ["d3dcompiler_46.dll"],
    versions: [{ v: "9.29.952.3111", note: "Jun 2010 runtime" }],
  },
  {
    name: "xinput1_3.dll",
    pkg: "dxruntime",
    desc: "XInput (Xbox 360 controller API), version 1.3 — required by countless games; often missing on Win10+ where only xinput1_4 is system.",
    bits: ["x86", "x64"],
    related: ["xinput9_1_0.dll", "xinput1_4.dll"],
    versions: [{ v: "9.18.944.0", note: "Jun 2010 runtime" }],
  },
  {
    name: "xinput9_1_0.dll",
    pkg: "dxruntime",
    desc: "XInput 9.1.0 — legacy controller API.",
    bits: ["x86", "x64"],
    related: ["xinput1_3.dll"],
    versions: [{ v: "9.18.944.0", note: "Jun 2010 runtime" }],
  },
  {
    name: "xinput1_4.dll",
    pkg: "dx11",
    desc: "XInput 1.4 — system component of Windows 8+; never copy it from the internet, use Windows Update if missing.",
    bits: ["x86", "x64"],
    related: ["xinput1_3.dll"],
    versions: [
      { v: "6.2.9200.16384", note: "Win8" },
      { v: "6.3.9600.16384", note: "Win8.1" },
      { v: "10.0.10240.16384", note: "Win10 1507" },
      { v: "10.0.19041.1", note: "Win10 2004" },
      { v: "10.0.26100.1", note: "Win11 24H2" },
    ],
  },
  {
    name: "xactengine3_7.dll",
    pkg: "dxruntime",
    desc: "XACT audio engine 3.7 (June 2010 runtime).",
    bits: ["x86", "x64"],
    related: ["xactengine3_0.dll", "xactengine3_6.dll"],
    versions: [{ v: "9.29.952.3111", note: "Jun 2010 runtime" }],
  },
  {
    name: "xactengine3_0.dll",
    pkg: "dxruntime",
    desc: "XACT audio engine 3.0 — earliest XACT revision.",
    bits: ["x86", "x64"],
    related: ["xactengine3_7.dll"],
    versions: [{ v: "9.14.949.1745", note: "Feb 2006 runtime" }],
  },

  // ---- UCRT / app-local runtime -------------------------------------------
  {
    name: "ucrtbase.dll",
    pkg: "ucrt",
    desc: "Universal C Runtime base. Present in System32 on Windows 10/11; older Windows need the UCRT update or VC++ 2015+ redist.",
    bits: ["x86", "x64"],
    related: ["api-ms-win-crt-runtime-l1-1-0.dll"],
    versions: [
      { v: "10.0.10240.16384", note: "Win10 1507" },
      { v: "10.0.10586.494", note: "Win10 1511" },
      { v: "10.0.14393.0", note: "Win10 1607" },
      { v: "10.0.16299.15", note: "Win10 1709" },
      { v: "10.0.17763.1", note: "Win10 1809" },
      { v: "10.0.18362.1", note: "Win10 1903" },
      { v: "10.0.19041.1", note: "Win10 2004" },
      { v: "10.0.22000.1", note: "Win11 21H2" },
      { v: "10.0.22621.1", note: "Win11 22H2" },
      { v: "10.0.26100.1", note: "Win11 24H2" },
    ],
  },
  {
    name: "api-ms-win-crt-runtime-l1-1-0.dll",
    pkg: "ucrt",
    desc: "UCRT API set forwarder — 'api-ms-win-crt-runtime-l1-1-0.dll is missing' means the Universal CRT is absent (old Windows, no redist).",
    bits: ["x86", "x64"],
    related: ["api-ms-win-crt-math-l1-1-0.dll", "api-ms-win-crt-string-l1-1-0.dll", "api-ms-win-crt-heap-l1-1-0.dll"],
    versions: [
      { v: "10.0.10240.16384", note: "Win10 1507" },
      { v: "10.0.17763.1", note: "Win10 1809" },
      { v: "10.0.18362.1", note: "Win10 1903" },
      { v: "10.0.19041.1", note: "Win10 2004" },
      { v: "10.0.22000.1", note: "Win11 21H2" },
      { v: "10.0.22621.1", note: "Win11 22H2" },
      { v: "10.0.26100.1", note: "Win11 24H2" },
    ],
  },
  {
    name: "api-ms-win-crt-math-l1-1-0.dll",
    pkg: "ucrt",
    desc: "UCRT math API set forwarder.",
    bits: ["x86", "x64"],
    related: ["api-ms-win-crt-runtime-l1-1-0.dll"],
    versions: [
      { v: "10.0.10240.16384", note: "Win10 1507" },
      { v: "10.0.17763.1", note: "Win10 1809" },
      { v: "10.0.19041.1", note: "Win10 2004" },
      { v: "10.0.26100.1", note: "Win11 24H2" },
    ],
  },
  {
    name: "api-ms-win-crt-string-l1-1-0.dll",
    pkg: "ucrt",
    desc: "UCRT string API set forwarder.",
    bits: ["x86", "x64"],
    related: ["api-ms-win-crt-runtime-l1-1-0.dll"],
    versions: [
      { v: "10.0.10240.16384", note: "Win10 1507" },
      { v: "10.0.17763.1", note: "Win10 1809" },
      { v: "10.0.19041.1", note: "Win10 2004" },
      { v: "10.0.26100.1", note: "Win11 24H2" },
    ],
  },

  // ---- Audio / misc --------------------------------------------------------
  {
    name: "openal32.dll",
    pkg: "openal",
    desc: "OpenAL audio library. Games expect the Creative/OpenAL-Soft build; openal-soft is the maintained replacement.",
    bits: ["x86", "x64"],
    related: ["wrap_oal.dll"],
    versions: [
      { v: "6.14.357.25", note: "Creative OpenAL 1.1" },
      { v: "1.15.1", note: "OpenAL Soft (2015)" },
      { v: "1.18.2", note: "OpenAL Soft (2018)" },
      { v: "1.19.1", note: "OpenAL Soft (2019)" },
      { v: "1.20.1", note: "OpenAL Soft (2020)" },
      { v: "1.21.1", note: "OpenAL Soft (2021)" },
      { v: "1.22.2", note: "OpenAL Soft (2022)" },
      { v: "1.23.1", note: "OpenAL Soft (2023)" },
    ],
  },
  {
    name: "wrap_oal.dll",
    pkg: "openal",
    desc: "OpenAL wrapper — installs alongside openal32.dll.",
    bits: ["x86", "x64"],
    related: ["openal32.dll"],
    versions: [
      { v: "2.3.1", note: "Creative OpenAL" },
      { v: "1.23.1", note: "OpenAL Soft (2023)" },
    ],
  },
  {
    name: "PhysXLoader.dll",
    pkg: "physx",
    desc: "NVIDIA PhysX loader — old games using PhysX 2.x runtime.",
    bits: ["x86", "x64"],
    related: ["nvphysx.dll", "PhysXCore.dll"],
    versions: [
      { v: "2.8.4", note: "PhysX 2.8.4" },
      { v: "2.8.3", note: "PhysX 2.8.3" },
      { v: "2.7.6", note: "PhysX 2.7.6" },
      { v: "9.09.0408", note: "PhysX 9.09.0408 (3.x)" },
      { v: "9.13.0604", note: "PhysX 9.13.0604" },
      { v: "9.14.0702", note: "PhysX 9.14.0702" },
    ],
  },
  {
    name: "steam_api.dll",
    pkg: "netfx",
    desc: "Steamworks client API — shipped inside each game's folder by Steam. Never download standalone.",
    bits: ["x86", "x64"],
    related: ["steam_api64.dll"],
    versions: [
      { v: "in-game", note: "Always use the copy from the game folder" },
    ],
  },
  {
    name: "d3dxof.dll",
    pkg: "dxruntime",
    desc: "DirectX X-file (.x) loader — needed by some older 3D titles.",
    bits: ["x86", "x64"],
    related: [],
    versions: [{ v: "9.29.952.3111", note: "Jun 2010 runtime" }],
  },
  {
    name: "dsetup.dll",
    pkg: "dxruntime",
    desc: "DirectX setup DLL used by old installers.",
    bits: ["x86"],
    related: [],
    versions: [{ v: "9.29.952.3111", note: "Jun 2010 runtime" }],
  },
  {
    name: "dinput8.dll",
    pkg: "dxruntime",
    desc: "DirectInput 8 — system component since DX8; only missing on corrupted systems.",
    bits: ["x86", "x64"],
    related: ["dinput.dll"],
    versions: [
      { v: "5.3.2600.0", note: "XP-era (DirectInput legacy)" },
      { v: "6.0.6001.18000", note: "Vista-era" },
      { v: "6.1.7601.17514", note: "Win7" },
      { v: "10.0.19041.1", note: "Win10 2004" },
    ],
  },
  {
    name: "dinput.dll",
    pkg: "dxruntime",
    desc: "DirectInput (legacy, DX1–7).",
    bits: ["x86"],
    related: ["dinput8.dll"],
    versions: [
      { v: "5.3.2600.0", note: "XP-era" },
      { v: "6.0.6001.18000", note: "Vista-era" },
    ],
  },
];

function d3dx9family() {
  const names = [];
  for (let i = 24; i <= 43; i++) names.push(`d3dx9_${i}.dll`);
  return names;
}

/* ---- helpers ------------------------------------------------------------- */

function segs(v) {
  return String(v)
    .replace(/^v/i, "")
    .split(/[._-]/)
    .map((s) => (/^\d+$/.test(s) ? parseInt(s, 10) : s));
}

export function cmpVersions(a, b) {
  const sa = segs(a);
  const sb = segs(b);
  const n = Math.max(sa.length, sb.length);
  for (let i = 0; i < n; i++) {
    const x = sa[i] ?? 0;
    const y = sb[i] ?? 0;
    if (typeof x === "number" && typeof y === "number") {
      if (x !== y) return x < y ? -1 : 1;
    } else if (String(x) !== String(y)) {
      return String(x) < String(y) ? -1 : 1;
    }
  }
  return 0;
}

export function latestOf(dll) {
  if (!dll || !dll.versions || !dll.versions.length) return null;
  let best = dll.versions[0];
  for (const v of dll.versions) if (cmpVersions(v.v, best.v) > 0) best = v;
  return best;
}

export function findDll(name) {
  const want = String(name).toLowerCase();
  return DLL_CATALOG.find((d) => d.name.toLowerCase() === want) || null;
}

export function searchDll(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return DLL_CATALOG;
  return DLL_CATALOG.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.desc.toLowerCase().includes(q) ||
      (PACKAGES[d.pkg]?.name || "").toLowerCase().includes(q)
  );
}

export function packageOf(dll) {
  return PACKAGES[dll.pkg] || null;
}

export function dllNameToPatterns() {
  return new Set(DLL_CATALOG.map((d) => d.name.toLowerCase()));
}

/** All DLL names that a given package installs (catalog coverage). */
export function dllsInPackage(pkgId) {
  return DLL_CATALOG.filter((d) => d.pkg === pkgId);
}

/** Which catalog DLLs are missing from a set of present filenames. */
export function missingDlls(presentNames, { families } = {}) {
  const present = new Set(Array.from(presentNames, (n) => String(n).toLowerCase()));
  const out = [];
  for (const dll of DLL_CATALOG) {
    const inFamily = !families || families.includes(dll.pkg);
    if (!inFamily) continue;
    const p = present.has(dll.name.toLowerCase()) ||
      dll.related.some((r) => present.has(r.toLowerCase()));
    if (!p) out.push(dll);
  }
  return out;
}
