#!/usr/bin/env python3
"""Read-only Android profile summary without retaining profile names or admin IDs.

Runs only three fixed adb read commands, locally and on an already authorized
connection. No profile creation/removal, policy changes, provisioning, dumpsys,
root, unlocking or account access. Raw output is parsed in memory, never printed.
"""
import argparse
import json
import re
import subprocess
import sys

COMMANDS = (
    ('shell', 'getprop', 'ro.build.version.sdk'),
    ('shell', 'pm', 'list', 'features'),
    ('shell', 'pm', 'list', 'users'),
)
FLAG_MANAGED_PROFILE = 0x20
FLAG_QUIET_MODE = 0x80
MAX_OUTPUT = 256 * 1024


def summarize(sdk_text, features_text, users_text):
    for text in (sdk_text, features_text, users_text):
        if not isinstance(text, str) or len(text.encode('utf-8')) > MAX_OUTPUT:
            raise ValueError('Read-only response bound exceeded')
    if not re.fullmatch(r'\s*\d{1,3}\s*', sdk_text):
        raise ValueError('Invalid Android API level')
    sdk = int(sdk_text.strip())
    if sdk < 21 or sdk > 100:
        raise ValueError('Unsupported Android API value')
    features = set(features_text.splitlines())
    managed_feature = 'feature:android.software.managed_users' in features
    flags = []
    ids_seen = set()
    for line in users_text.splitlines():
        line = line.strip()
        if not line or line == 'Users:':
            continue
        # The name may include colons. Only the last field is interpreted as
        # AOSP UserInfo flags. No name, user ID or account string is returned.
        match = re.fullmatch(r'UserInfo\{(\d+):[^\r\n}]*:([0-9a-fA-F]{1,8})\}(?:\s+running)?', line)
        if match is None:
            raise ValueError('Unrecognized user-list format; no raw text retained')
        uid, encoded = match.groups()
        if uid in ids_seen:
            raise ValueError('Duplicate user record')
        ids_seen.add(uid)
        flags.append(int(encoded, 16))
    if not flags:
        raise ValueError('User records unavailable; absence of output is not absence of profiles')
    managed = [value for value in flags if value & FLAG_MANAGED_PROFILE]
    return {
        'schema': 1,
        'androidApiLevel': sdk,
        'managedUsersSystemFeatureAdvertised': managed_feature,
        'userOrProfileRecordCount': len(flags),
        'managedProfileFlagCount': len(managed),
        'quietManagedProfileFlagCount': sum(bool(value & FLAG_QUIET_MODE) for value in managed),
        'privateSpaceMeetsAndroidVersionMinimum': sdk >= 35,
        'privateSpaceAvailabilityConfirmed': False,
        'samsungSecureFolderSupportConfirmed': False,
        'profileAdministratorIdentified': False,
        'organizationOrPersonalOwnershipDetermined': False,
        'profileNamesUserIdsAdminComponentsOrAccountsPublished': False,
        'rawOutputSavedOrPrinted': False,
        'profileOrPolicyModified': False,
        'rootOrBootloaderUnlockVerified': False,
        'vpnProtectionVerified': False,
        'zshaolinCompatibleBuildSupportsWorkProfileInstall': False,
        'limits': [
            'A managed-profile bit is not an attribution to an employer, spyware, a named DPC or a specific Samsung container.',
            'Samsung vendor containers and device policy require separate confirmation; standard flags alone do not classify them all.',
            'The managed-users feature is a platform capability, not permission to create a profile or proof that one is active.',
            'Android 15/API 35 is only a minimum version gate for Private Space, not complete support detection.',
            'Pausing and deleting a profile are different actions; deletion loses the profile data. This collector performs neither.',
            'The approved Termux-compatible native package prefix is primary-user-only. Do not use a work profile to work around a Termux package-ID conflict.',
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', default='adb', help='Path to your local adb executable')
    args = parser.parse_args()
    results = []
    for command in COMMANDS:
        result = subprocess.run([args.adb, *command], check=True, text=True,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)
        if len(result.stdout.encode('utf-8')) > MAX_OUTPUT:
            raise ValueError('Read-only response bound exceeded')
        results.append(result.stdout)
    print(json.dumps(summarize(*results), indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError):
        # Never include an exception payload: adb errors can contain identifiers.
        print('Profile inspection stopped. No raw device output, profile labels or identifiers were printed.', file=sys.stderr)
        sys.exit(1)
