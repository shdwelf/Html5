#!/usr/bin/env python3
"""Validate the built APK and store bounded, non-secret delivery evidence."""
import hashlib
import json
import os
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "build/putty-android"
PROJECT = ROOT / "apps/putty-android"
APK = PROJECT / "app/build/outputs/apk/debug/app-debug.apk"
OUT = ROOT / "research/putty-android"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    out = OUT
    out.mkdir(parents=True, exist_ok=True)
    source = json.loads((BUILD / "source-receipt.json").read_text())
    assert source["releaseSignatureVerified"] is True
    assert source["version"] == "0.85"
    assert source["archiveSha256"] == "13fd4db2936d03b73812a7bcc2a658e4dd29cc776a56c3670a7fc6f1a0ee8af8"
    assert source["releaseCertificateFingerprint"] == "1A07DAC0F220CF12248EA7195C67D0F88BC3E5B5"
    sdk = Path(os.environ["ANDROID_HOME"]) / "build-tools/35.0.0"
    signing = subprocess.check_output([str(sdk / "apksigner"), "verify", "--verbose", "--print-certs", str(APK)], text=True)
    assert "Verified using v2 scheme (APK Signature Scheme v2): true" in signing
    cert = re.search(r"Signer #1 certificate SHA-256 digest: ([0-9a-f]{64})", signing).group(1)
    badging = subprocess.check_output([str(sdk / "aapt"), "dump", "badging", str(APK)], text=True)
    assert "package: name='org.html5.putty'" in badging
    assert "sdkVersion:'28'" in badging and "targetSdkVersion:'35'" in badging
    assert "application-debuggable" not in badging
    assert "native-code: 'arm64-v8a' 'x86_64'" in badging
    permissions = re.findall(r"uses-permission: name='([^']+)'", badging)
    assert permissions == ["android.permission.INTERNET"], permissions
    tests = []
    for path in sorted((PROJECT / "app/build/outputs/androidTest-results/connected").rglob("TEST-*.xml")):
        tree = ET.parse(path)
        for case in tree.iter("testcase"):
            assert case.find("failure") is None and case.find("error") is None and case.find("skipped") is None
            tests.append(case.attrib["classname"] + "." + case.attrib["name"])
    assert len(tests) >= 8 and len(tests) == len(set(tests)), tests
    core = (BUILD / "core-tests.tap").read_text()
    planned = re.search(r"^1\.\.(\d+)$", core, re.M)
    assert planned and len(re.findall(r"^ok \d+ - ", core, re.M)) == int(planned[1])
    assert "not ok" not in core
    native = []
    with ZipFile(APK) as archive:
        assert json.loads(archive.read("assets/putty-source.json")) == source
        licence = archive.read("assets/PUTTY-LICENCE.txt")
        assert licence == (BUILD / "source/putty-0.85/LICENCE").read_bytes()
        for abi, machine in [("arm64-v8a", "AArch64"), ("x86_64", "Advanced Micro Devices X86-64")]:
            for name in ("libplink.so", "libputtypty.so"):
                path = PROJECT / "app/src/main/jniLibs" / abi / name
                content = archive.read(f"lib/{abi}/{name}")
                assert content == path.read_bytes(), "Packaged native bytes changed"
                headers = subprocess.check_output(["readelf", "-hlW", str(path)], text=True)
                assert machine in headers and "DYN (" in headers
                loads = [line.split()[-1] for line in headers.splitlines() if line.strip().startswith("LOAD ")]
                assert loads and all(int(value, 16) >= 16384 for value in loads), "16 KiB ELF page alignment required"
                if name == "libplink.so":
                    assert "/system/bin/linker64" in headers, "Packaged Plink must be an Android executable"
                native.append({"abi": abi, "file": name, "bytes": len(content), "sha256": digest(content), "loadAlignmentAtLeast16KiB": True})
    artifact = out / "unofficial-putty-0.85-review.apk"
    shutil.copyfile(APK, artifact)
    run_id = os.environ["GITHUB_RUN_ID"]
    receipt = {
        "schemaVersion": 1,
        "status": "built-apk-with-synthetic-android-integration-controls",
        "sourceCommit": os.environ["GITHUB_SHA"],
        "buildRun": f"https://github.com/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{run_id}",
        "buildRunAttempt": os.environ.get("GITHUB_RUN_ATTEMPT"),
        "applicationId": "org.html5.putty", "versionName": "0.1.0-putty0.85", "minSdk": 28, "targetSdk": 35,
        "apk": artifact.name, "apkBytes": artifact.stat().st_size, "apkSha256": digest(artifact.read_bytes()),
        "debugCertificateSha256": cert, "signing": "Disposable runner debug certificate; APK v2 verified; not a production identity",
        "androidDebuggable": False, "permissions": permissions, "source": source, "native": native,
        "coreControlsPassed": int(planned[1]), "androidInstrumentedControlsPassed": len(tests),
        "androidTests": tests, "testedAndroidEnvironment": "API 35 x86_64 emulator; 4 KiB pages",
        "notVerified": ["ARM64 runtime on a physical device", "16 KiB-page runtime (ELF alignment checked only)",
                        "API 28–34 and 36 runtime coverage", "Full-screen VT terminal functionality (not implemented)",
                        "User-owned or public shell logins", "SDF membership validation", "Production signing/release hardening"],
        "terminalScope": "Foreground-only line-oriented TERM=dumb; no SFTP, key import, tunnels, saved profiles or agent forwarding",
        "publicAccountActions": "No public signup, credential submission, login, validation, payment or host-key scan performed"
    }
    (out / "build-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    (out / "SHA256SUMS.txt").write_text(receipt["apkSha256"] + "  " + artifact.name + "\n")
    (out / "apk-signature.txt").write_text(signing)
    (out / "PUTTY-LICENCE.txt").write_bytes(licence)
    print(json.dumps({key: receipt[key] for key in ["sourceCommit", "apkBytes", "apkSha256", "coreControlsPassed", "androidInstrumentedControlsPassed", "buildRun"]}, indent=2))


if __name__ == "__main__":
    main()
