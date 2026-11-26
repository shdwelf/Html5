#!/usr/bin/env bash
# Disposable, loopback-only SSH integration fixture on a GitHub hosted runner.
# Never contact SDF or any other provider; never reuse a person's credentials.
set -euo pipefail
FIXTURE=/tmp/html5-putty-ci
mkdir -p "$FIXTURE"
chmod 755 "$FIXTURE"
command -v sshd >/dev/null || { sudo apt-get update -qq; sudo apt-get install -y openssh-server; }
sudo install -d -m 755 /run/sshd
sudo useradd --create-home --shell /bin/bash puttyci
PASSWORD="ci-only-$(python3 -c 'import secrets; print(secrets.token_hex(18))')"
echo "::add-mask::$PASSWORD"
printf 'puttyci:%s\n' "$PASSWORD" | sudo chpasswd
ssh-keygen -q -t ed25519 -N '' -f "$FIXTURE/host"
PIN="$(ssh-keygen -lf "$FIXTURE/host.pub" -E sha256 | awk '{print $2}')"
cat > "$FIXTURE/shell" <<'SH'
#!/bin/bash
set -eu
stty -echo
printf 'PUTTY_ANDROID_READY\n'
IFS= read -r line
if [[ "$line" == 'run-self-test' ]]; then
  printf 'PUTTY_ANDROID_SSH_OK\n'
  exit 0
fi
exit 7
SH
chmod 755 "$FIXTURE/shell"
cat > "$FIXTURE/sshd_config" <<CONF
Port 2222
ListenAddress 127.0.0.1
HostKey $FIXTURE/host
PidFile $FIXTURE/sshd.pid
AuthorizedKeysFile none
PasswordAuthentication yes
PubkeyAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
UsePAM no
AllowUsers puttyci
AllowTcpForwarding no
AllowAgentForwarding no
X11Forwarding no
PermitTTY yes
MaxAuthTries 2
LoginGraceTime 30
PrintMotd no
PrintLastLog no
LogLevel VERBOSE
ForceCommand $FIXTURE/shell
CONF
sudo /usr/sbin/sshd -t -f "$FIXTURE/sshd_config"
sudo /usr/sbin/sshd -f "$FIXTURE/sshd_config" -E "$FIXTURE/sshd.log"
{
  printf 'CI_SSH_USER=puttyci\n'
  printf 'CI_SSH_PIN=%s\n' "$PIN"
  printf 'CI_SSH_PASSWORD=%s\n' "$PASSWORD"
} >> "${GITHUB_ENV:?This fixture is for the ephemeral CI runner only}"
printf 'Loopback-only disposable SSH fixture ready. No public shell account contacted.\n'
