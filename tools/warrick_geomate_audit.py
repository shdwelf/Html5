#!/usr/bin/env python3
"""
tools/warrick_geomate_audit.py

Executes Warrick / Memento recovery attempts on the Geomate target suite,
analyzes CDX index captures, and generates a structured research audit.
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime

TARGETS = [
    {
        "url": "http://mygeomate.com/",
        "label": "Geomate Main Site Root",
        "cdx_pattern": "http://mygeomate.com/*",
        "expected_type": "text/html",
        "notes": "Original company homepage (Apisphere / Brand 44).",
    },
    {
        "url": "http://mygeomate.com/updates",
        "label": "Geomate Web Update Portal",
        "cdx_pattern": "http://mygeomate.com/updates*",
        "expected_type": "text/html",
        "notes": "Historical web-based update portal for loading regional cache databases.",
    },
    {
        "url": "http://mygeomate.com/GeomateandUpdateKit.zip",
        "label": "Geomate & Update Kit Zip Package",
        "cdx_pattern": "http://mygeomate.com/GeomateandUpdateKit.zip",
        "expected_type": "application/zip",
        "expected_size": 1618659,
        "cdx_digest": "I5UJVNM2EXSSQ7OJZQOFUHPXJQHHEBX6",
        "notes": "Archived 2011-10-11 in CDX. Web asset / media archive candidate.",
    },
    {
        "url": "http://mygeomate.com/UpdateKit.zip",
        "label": "Update Kit Zip Package",
        "cdx_pattern": "http://mygeomate.com/UpdateKit.zip",
        "expected_type": "application/zip",
        "expected_size": 727077,
        "cdx_digest": "NU2RTCTP6PWJ7QVF5CYKQWMOFSG4JVS3",
        "notes": "Archived 2011-10-11 in CDX. Documentation / media bundle candidate.",
    },
    {
        "url": "http://geomatejr.appspot.com/",
        "label": "Geomate.jr AppEngine Shutdown Portal",
        "cdx_pattern": "http://geomatejr.appspot.com/*",
        "expected_type": "text/html",
        "notes": "2012 shutdown notice and community GPX loader distribution page.",
    },
    {
        "url": "http://geomatejr.appspot.com/geomateQtGuiApp.exe",
        "label": "Geomate Qt GUI App Executable",
        "cdx_pattern": "http://geomatejr.appspot.com/geomateQtGuiApp.exe",
        "expected_type": "application/x-msdos-program",
        "notes": "Standalone GPX pocket query loader binary for Update Kit USB dongle.",
    },
    {
        "url": "http://dl.dropbox.com/u/6158332/geomateQtGuiApp.exe.zip",
        "label": "Community Dropbox Mirror of geomateQtGuiApp",
        "cdx_pattern": "http://dl.dropbox.com/u/6158332/geomateQtGuiApp.exe.zip",
        "expected_type": "application/zip",
        "notes": "Darren Osborne / Spindocbob 2012 community emergency backup link.",
    },
    {
        "url": "https://geomate-loader.software.informer.com/download/",
        "label": "Geomate Loader 1.3 Installer (Software Informer)",
        "cdx_pattern": "geomateloadersetup.exe*",
        "expected_type": "application/zip",
        "notes": "Advertised filename: geomateloadersetup.exe.zip (~9.7 MB).",
    },
    {
        "url": "https://support.geomate.sg/portal/en/kb/articles/sg6-1-3-5-20241015",
        "label": "GEOMATE SG6 Survey Receiver Firmware (Disambiguation Target)",
        "cdx_pattern": "support.geomate.sg/*",
        "expected_type": "text/html",
        "notes": "Singapore land-surveying GNSS RTK hardware (SG6 v1.5.2) - NOT Geomate.jr.",
    },
]

def run_warrick(target_url, workdir):
    os.makedirs(workdir, exist_ok=True)
    logfile = os.path.join(workdir, "warrick.log")
    script_path = os.path.join(os.path.dirname(__file__), "run_warrick.sh")
    
    cmd = [
        script_path,
        "-nr",
        "-D", workdir,
        "-o", logfile,
        target_url
    ]
    try:
        proc = subprocess.run(
            cmd,
            cwd=workdir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=25
        )
        return {
            "exit_code": proc.returncode,
            "stdout": proc.stdout,
            "logfile_exists": os.path.isfile(logfile),
        }
    except subprocess.TimeoutExpired as e:
        return {
            "exit_code": -1,
            "stdout": e.stdout or "Command timed out",
            "logfile_exists": os.path.isfile(logfile),
        }
    except Exception as e:
        return {
            "exit_code": -2,
            "stdout": str(e),
            "logfile_exists": False,
        }

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_dir = os.path.join(root_dir, "research", "warrick_geomate_audit")
    os.makedirs(out_dir, exist_ok=True)

    results = []
    print(f"Starting Warrick audit over {len(TARGETS)} Geomate targets...")

    for i, target in enumerate(TARGETS):
        url = target["url"]
        slug = "".join(c if c.isalnum() else "_" for c in target["label"]).lower()
        print(f"[{i+1}/{len(TARGETS)}] Warrick testing {target['label']} ({url})...")
        target_dir = os.path.join(out_dir, slug)
        res = run_warrick(url, target_dir)
        
        # Analyze outcome
        status = "failed_timegate_reachability"
        if "Frontier Exhausted" in res.get("stdout", ""):
            status = "memento_frontier_exhausted_zero_bytes"
        
        target_result = {
            "target": target,
            "status": status,
            "warrick_exit_code": res["exit_code"],
            "warrick_stdout_snippet": res["stdout"][:400] if res["stdout"] else "",
        }
        results.append(target_result)

    report_path = os.path.join(out_dir, "audit_summary.json")
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Audit completed. Summary saved to {report_path}")

if __name__ == "__main__":
    main()
