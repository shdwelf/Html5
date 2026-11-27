#!/usr/bin/env python3
"""Read only a whitelist of Android properties; never collect device identifiers.

No adb root/su, boot-mode changes, unlocking, flashing, exploits, key input or
account requests. OEM-unlock availability is not evidence of an unlocked bootloader.
"""
import argparse
import json
import re
import subprocess
import sys

PROPERTIES = (
    'ro.product.model', 'ro.product.device', 'ro.product.cpu.abilist',
    'ro.build.version.release', 'ro.build.version.sdk',
    'ro.build.version.security_patch', 'ro.build.display.id',
    'ro.build.version.incremental', 'ro.bootloader',
    'ro.oem_unlock_supported', 'sys.oem_unlock_allowed',
    'ro.boot.flash.locked', 'ro.boot.vbmeta.device_state',
    'ro.boot.verifiedbootstate', 'ro.boot.warranty_bit',
)
CANDIDATE_BUILD = 'A037U1UESBDYI1'


def assess(properties, oem_lock=None, knoxguard=None):
    if set(properties) - set(PROPERTIES):
        raise ValueError('Only the fixed non-identifying property whitelist is accepted')
    if any(not isinstance(x, str) or len(x) > 180 or '\n' in x or '\r' in x for x in properties.values()):
        raise ValueError('Invalid property value')
    # Guard against accidentally pasted device IDs even under a whitelisted key.
    if any(re.search(r'(?<!\d)\d{14,16}(?!\d)', v) for v in properties.values()):
        raise ValueError('Possible device identifier detected; do not save this output')
    model = properties.get('ro.product.model', '')
    build = properties.get('ro.build.version.incremental', '')
    is_model = model.upper() in ('SM-A037U1', 'SM-A037U1/DS')
    flashed_lock = properties.get('ro.boot.flash.locked')
    state = properties.get('ro.boot.vbmeta.device_state')
    bootloader_unlocked = flashed_lock == '0' and state == 'unlocked' and oem_lock == 'OFF (U)'
    kg_ok = knoxguard in ('Checking', 'Completed', 'Broken')
    reasons = []
    if not is_model:
        reasons.append('Exact SM-A037U1 identity is not confirmed; do not substitute international A037F/G/M firmware.')
    if build != CANDIDATE_BUILD:
        reasons.append('Candidate firmware build does not exactly match a measured incremental build.')
    if not bootloader_unlocked:
        reasons.append('An actually unlocked bootloader is not confirmed by both read-only properties and Download Mode OEM Lock OFF (U).')
    if not kg_ok:
        reasons.append('Download Mode KnoxGuard must be checked. Do not bypass Active/Locked/Prenormal or account/management controls.')
    eligible = is_model and build == CANDIDATE_BUILD and bootloader_unlocked and kg_ok
    return {
        'schema': 1, 'model': 'SM-A037U1', 'properties': properties,
        'candidateFirmware': CANDIDATE_BUILD, 'candidateFirmwareConfirmed': build == CANDIDATE_BUILD,
        'downloadMode': {'oemLock': oem_lock, 'knoxGuard': knoxguard},
        'bootloaderUnlockConfirmed': bootloader_unlocked,
        'magiskPrerequisitesAppearSatisfied': eligible,
        'workingRootVerified': False, 'physicalDeviceTested': False,
        'stockFirmwareAcquiredAndAuthenticated': False,
        'patchedFirmwareProduced': False, 'flashingPerformed': False,
        'identifierCollection': False, 'blockers': reasons,
        'nextStep': 'Review the official Magisk Samsung instructions and obtain an exact, authenticated stock AP on this same device; do not flash a shared patched image.' if eligible else 'Stop before patching or flashing. Resolve the listed prerequisites first.',
        'warnings': ['OEM unlocking enabled is not the same as bootloader unlocked.',
                     'Samsung Magisk installation can require multiple full data wipes and irreversibly trip the Knox Warranty Bit.',
                     'SIM/network-unlocked U1 does not establish bootloader-unlocked status.',
                     'Ghidra static inspection cannot prove root compatibility, safety or successful installation.'],
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--adb', default='adb', help='Path to your locally installed adb executable')
    p.add_argument('--from-json', help='Re-assess a properties-only JSON file without any device commands')
    p.add_argument('--oem-lock', choices=['ON (L)', 'ON (U)', 'OFF (U)', 'not-shown'])
    p.add_argument('--knoxguard', choices=['Active', 'Locked', 'Prenormal', 'Checking', 'Completed', 'Broken', 'not-shown'])
    args = p.parse_args()
    if args.from_json:
        with open(args.from_json) as f:
            properties = json.load(f)
    else:
        properties = {}
        for key in PROPERTIES:
            result = subprocess.run([args.adb, 'shell', 'getprop', key], check=True,
                                    text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)
            properties[key] = result.stdout.strip()
    print(json.dumps(assess(properties, args.oem_lock, args.knoxguard), indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError, json.JSONDecodeError) as e:
        # Do not print raw adb output: some failure modes include a serial number.
        print('Read-only assessment stopped: ' + type(e).__name__ + '. No identifier or raw adb error was printed.', file=sys.stderr)
        sys.exit(1)
