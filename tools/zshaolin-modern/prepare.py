#!/usr/bin/env python3
"""Build inputs only: fetch pinned source, authenticate APT, stage offline .debs.

Never installs Android packages on the host or executes their maintainer scripts.
The APK installer runs dpkg in its own unprivileged sandbox on first launch.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tarfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SPEC = json.loads((ROOT / 'tools/zshaolin-modern/inputs.json').read_text())
BUILD = ROOT / 'build/zshaolin'
PREFIX = 'data/data/com.termux/files/usr'
ARCHES = {'arm': 'armeabi-v7a', 'aarch64': 'arm64-v8a', 'x86_64': 'x86_64'}


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for part in iter(lambda: f.read(1024 * 1024), b''):
            h.update(part)
    return h.hexdigest()


def safe_path(value):
    p = PurePosixPath(value)
    if not value or p.is_absolute() or '..' in p.parts or '\\' in value or '\x00' in value:
        raise ValueError('Unsafe archive path')
    return p


def download(url, dest, expected=None, maximum=1500 * 1024**2):
    if not url.startswith('https://'):
        raise ValueError('HTTPS required')
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.is_file() and expected and digest(dest) == expected:
        return
    temp = dest.with_suffix(dest.suffix + '.part')
    n = 0
    with urllib.request.urlopen(url, timeout=120) as response, temp.open('wb') as out:
        if not response.geturl().startswith('https://'):
            raise ValueError('Insecure redirect')
        while part := response.read(1024 * 1024):
            n += len(part)
            if n > maximum:
                raise ValueError('Download exceeds bound')
            out.write(part)
    if expected and digest(temp) != expected:
        temp.unlink()
        raise ValueError('Input SHA-256 mismatch')
    temp.replace(dest)


def pinned_source(which, destination):
    pin = SPEC[which]
    archive = BUILD / 'sources' / (which + '.tar.gz')
    download(pin['url'], archive, pin['sha256'], pin['bytes'])
    if archive.stat().st_size != pin['bytes']:
        raise ValueError('Source archive size mismatch')
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    with tarfile.open(archive) as tf:
        for m in tf:
            p = safe_path(m.name)
            rel = Path(*p.parts[1:])
            if str(rel) == '.':
                continue
            if m.isdir():
                (destination / rel).mkdir(parents=True, exist_ok=True)
            elif m.isfile():
                if m.size > 25 * 1024**2:
                    raise ValueError('Source member too large')
                f = destination / rel
                f.parent.mkdir(parents=True, exist_ok=True)
                f.write_bytes(tf.extractfile(m).read())
                f.chmod(0o755 if m.mode & 0o111 else 0o644)
            elif m.issym():
                # Recipes contain internal symlinks. They are not needed to
                # compile the terminal engine or authenticate the keyring.
                continue
            else:
                raise ValueError('Unexpected source member type')
    return archive


def run(args, **kwargs):
    return subprocess.run([str(x) for x in args], check=True, text=True, **kwargs)


def packages(arch):
    work = BUILD / arch
    assets = work / 'assets'
    assets.mkdir(parents=True, exist_ok=True)
    recipes = BUILD / 'package-recipes'
    pinned_source('packageRecipes', recipes)
    pinned_source('terminalSource', BUILD / 'terminal-source')
    keydir = recipes / 'packages/termux-keyring'
    keyring = work / 'termux-archive-keyring.gpg'
    keys = sorted(p for p in keydir.glob('*.gpg') if p.name != 'termux-pacman.gpg')
    if len(keys) < 6:
        raise ValueError('Missing pinned repository keys')
    keyring.write_bytes(b''.join(p.read_bytes() for p in keys))
    apt = work / 'apt'
    for d in ('lists/partial', 'archives/partial', 'etc/parts', 'state'):
        (apt / d).mkdir(parents=True, exist_ok=True)
    (apt / 'status').touch()
    (apt / 'etc/sources.list').write_text(
        f'deb [arch={arch} signed-by={keyring}] {SPEC["aptRepository"]} stable main\n'
        f'deb [arch={arch} signed-by={keyring}] https://packages.termux.dev/apt/termux-root root stable\n')
    opts = [
        '-o', f'Dir::State={apt}/state', '-o', f'Dir::State::status={apt}/status',
        '-o', f'Dir::State::lists={apt}/lists', '-o', f'Dir::Cache::archives={apt}/archives',
        '-o', f'Dir::Etc::sourcelist={apt}/etc/sources.list',
        '-o', f'Dir::Etc::sourceparts={apt}/etc/parts',
        '-o', 'Dir::Etc::main=/dev/null', '-o', f'Dir::Etc::parts={apt}/etc/parts',
        '-o', 'Dir::Etc::trusted=/dev/null', '-o', f'Dir::Etc::trustedparts={apt}/etc/parts',
        '-o', f'APT::Architecture={arch}', '-o', f'APT::Architectures::={arch}',
        '-o', 'APT::Install-Recommends=false', '-o', 'APT::Install-Suggests=false',
        '-o', 'Acquire::AllowInsecureRepositories=false', '-o', 'APT::Get::AllowUnauthenticated=false',
        '-o', 'Acquire::Check-Valid-Until=true', '-o', 'Acquire::ForceHash=SHA256', '-o', 'Acquire::Retries=3',
        '-o', 'Debug::NoLocking=true', '-o', f'Dir::Log={apt}',
        '-o', 'APT::Sandbox::User=root',
    ]
    run(['apt-get', *opts, 'update'])
    # Names are selected from one authenticated repository, without host dpkg
    # state. A missing old component fails instead of silently dropping it.
    requested = sorted({n for group in SPEC['packageGroups'].values() for n in group})
    plan = run(['apt-get', *opts, '--print-uris', '--yes', '--download-only',
                'install', *requested], stdout=subprocess.PIPE).stdout
    (work / 'apt-plan.txt').write_text(plan)
    uris = []
    for line in plan.splitlines():
        m = re.match(r"'([^']+)'\s+(\S+)\s+(\d+)\s+(\S+)", line)
        if m:
            uris.append(m.groups())
    if len(uris) < len(requested):
        raise ValueError('APT produced an unexpectedly incomplete dependency plan')
    run(['apt-get', *opts, '--yes', '--download-only', 'install', *requested])
    archives = sorted((apt / 'archives').glob('*.deb'))
    if len(archives) != len(uris):
        raise ValueError('Downloaded archive count does not match authenticated APT plan')
    expected_files = {name: (url, int(size), sha) for url, name, size, sha in uris}
    inventory = []
    owned = set()
    scripts = []
    for f in archives:
        uri, size, hashfield = expected_files[f.name]
        if not hashfield.startswith('SHA256:') or digest(f) != hashfield[7:] or f.stat().st_size != size:
            raise ValueError('Downloaded .deb does not match signed-index SHA-256')
        control = run(['dpkg-deb', '-f', f], stdout=subprocess.PIPE).stdout
        fields = {}
        for line in control.splitlines():
            if line and not line[0].isspace() and ': ' in line:
                k, v = line.split(': ', 1)
                fields[k] = v
        if fields['Architecture'] not in (arch, 'all'):
            raise ValueError('Unexpected binary architecture')
        listing = subprocess.Popen(['dpkg-deb', '--fsys-tarfile', str(f)], stdout=subprocess.PIPE)
        with tarfile.open(fileobj=listing.stdout, mode='r|') as tf:
            for m in tf:
                p = safe_path(m.name)
                if m.ischr() or m.isblk() or m.isfifo():
                    raise ValueError('Special files are not allowed in Android packages')
                rel = str(p)
                if rel.startswith(PREFIX + '/'):
                    owned.add(rel[len(PREFIX) + 1:])
                elif m.isfile() and m.size:
                    raise ValueError('Package file outside the Termux private prefix')
        if listing.wait() != 0:
            raise ValueError('Could not inventory package payload')
        ctar = subprocess.check_output(['dpkg-deb', '--ctrl-tarfile', str(f)])
        with tarfile.open(fileobj=io.BytesIO(ctar)) as tf:
            for m in tf:
                if m.isfile() and PurePosixPath(m.name).name in ('preinst', 'postinst', 'prerm', 'postrm', 'triggers'):
                    raw = tf.extractfile(m).read()
                    scriptname = PurePosixPath(m.name).name
                    scripts.append({'package': fields['Package'], 'script': scriptname,
                                    'sha256': hashlib.sha256(raw).hexdigest()})
                    # No network provisioning/listeners during offline setup.
                    if scriptname in ('preinst', 'postinst') and re.search(
                        rb'(?m)^\s*(?:exec\s+)?(?:[^\s]*\/)?(?:curl|wget|sshd|httpd|nc|ncat|socat)\s', raw):
                        raise ValueError('Network-command maintainer script requires explicit review: ' + fields['Package'])
        dest = assets / 'packages' / f.name
        dest.parent.mkdir(exist_ok=True)
        shutil.copyfile(f, dest)
        inventory.append({'package': fields['Package'], 'version': fields['Version'],
                          'architecture': fields['Architecture'], 'asset': 'packages/' + f.name,
                          'sha256': digest(f), 'bytes': size, 'url': uri})
    missing = [cmd for cmd in SPEC['requiredCommands'] if f'bin/{cmd}' not in owned]
    if missing:
        raise ValueError('Full-toolbox command coverage missing: ' + ', '.join(missing))
    version = urllib.parse.quote(SPEC['bootstrap']['version'], safe='')
    booturl = f'https://github.com/termux/termux-packages/releases/download/bootstrap-{version}/bootstrap-{arch}.zip'
    download(booturl, assets / 'bootstrap.zip', SPEC['bootstrap'][arch], 120 * 1024**2)
    shutil.copytree(ROOT / 'tools/zshaolin-modern/assets', assets, dirs_exist_ok=True)
    overlay = (ROOT / 'tools/zshaolin-legacy/overlay/z-ssh').read_text()
    (assets / 'z-ssh').write_text(overlay.replace('#!env zsh', '#!/data/data/com.termux/files/usr/bin/zsh', 1))
    indices = {p.name: digest(p) for p in (apt / 'lists').iterdir() if p.is_file()}
    receipt = {
        'schema': 1, 'sourceCommit': os.environ.get('GITHUB_SHA', 'local-uncommitted'),
        'runId': os.environ.get('GITHUB_RUN_ID'), 'arch': arch, 'abi': ARCHES[arch],
        'applicationId': SPEC['applicationId'], 'offline': True,
        'bootstrapSha256': SPEC['bootstrap'][arch], 'bootstrapUrl': booturl,
        'aptRepository': SPEC['aptRepository'], 'aptSignatureVerificationRequired': True,
        'repositoryKeyringSha256': digest(keyring), 'signedIndexFilesSha256': indices,
        'requestedPackages': requested, 'packages': inventory, 'maintainerScripts': scripts,
        'requiredCommands': SPEC['requiredCommands'], 'missingCommands': missing,
        'terminalSource': SPEC['terminalSource'], 'packageRecipes': SPEC['packageRecipes'],
        'legacyChanges': SPEC['legacyChanges'], 'rootRequired': False,
        'rootingTestedOnPhysicalDevice': False, 'vpnProtectionProvided': False,
        'nativePackagesSelfCompiled': False,
        'binaryProvenance': 'Authenticated upstream Android .debs; app and terminal JNI compiled from pinned source.',
    }
    (assets / 'toolbox.json').write_text(json.dumps(receipt, separators=(',', ':')) + '\n')
    (work / 'package-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(f'FULL_TOOLBOX_READY arch={arch} packages={len(inventory)} commands={len(SPEC["requiredCommands"])} bytes={sum(x["bytes"] for x in inventory)}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('arch', choices=ARCHES)
    args = parser.parse_args()
    packages(args.arch)
