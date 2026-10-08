#!/bin/bash
# setup_warrick_perl.sh - Ensure Perl dependency chain for Warrick is satisfied.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PERL5_DIR="${HOME}/perl5"

mkdir -p "$PERL5_DIR/lib/perl5"

# Verification function
verify_deps() {
  perl -I"$PERL5_DIR/lib/perl5" -I"$PERL5_DIR/lib/perl5/x86_64-linux-gnu-thread-multi" -e '
    my @mods = qw(
      LWP::UserAgent LWP::Simple URI URI::Escape HTTP::Cookies HTTP::Date
      HTTP::Status HTML::LinkExtractor HTML::Parser HTML::TagParser CSS
      Clone Encode::Locale IO::HTML
    );
    my $missing = 0;
    for my $m (@mods) {
      if (eval "use $m; 1;") {
        # ok
      } else {
        warn "Missing: $m ($@)\n";
        $missing++;
      }
    }
    exit($missing > 0 ? 1 : 0);
  ' 2>&1
}

echo "Checking Warrick Perl dependencies..."
if verify_deps > /dev/null 2>&1; then
  echo "All Warrick Perl dependencies are satisfied!"
  exit 0
fi

echo "Some dependencies missing. Installing via gitpan / GitHub mirrors into $PERL5_DIR..."

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

clone_or_copy() {
  local repo="$1"
  local dest="$TMP_DIR/$(basename "$repo")"
  if [ ! -d "$dest" ]; then
    git clone --depth 1 "https://github.com/$repo" "$dest"
  fi
}

# Clone essential repos
clone_or_copy "libwww-perl/URI"
clone_or_copy "libwww-perl/HTTP-Date"
clone_or_copy "libwww-perl/HTTP-Message"
clone_or_copy "libwww-perl/HTTP-Cookies"
clone_or_copy "libwww-perl/libwww-perl"
clone_or_copy "libwww-perl/LWP-MediaTypes"
clone_or_copy "doy/try-tiny"
clone_or_copy "kawanet/HTML-TagParser"
clone_or_copy "gitpan/Encode-Locale"
clone_or_copy "gitpan/IO-HTML"
clone_or_copy "gitpan/HTML-LinkExtractor"
clone_or_copy "gitpan/CSS"
clone_or_copy "gitpan/HTML-Tagset"
clone_or_copy "gitpan/Clone"
clone_or_copy "gitpan/HTML-Parser"

# Copy pure perl libraries
for dir in "$TMP_DIR"/*; do
  if [ -d "$dir/lib" ]; then
    cp -r "$dir/lib/"* "$PERL5_DIR/lib/perl5/"
  fi
done

# Copy single file / subfolder modules
[ -f "$TMP_DIR/HTML-Tagset/Tagset.pm" ] && cp "$TMP_DIR/HTML-Tagset/Tagset.pm" "$PERL5_DIR/lib/perl5/HTML/"
[ -f "$TMP_DIR/HTML-LinkExtractor/LinkExtractor.pm" ] && mkdir -p "$PERL5_DIR/lib/perl5/HTML" && cp "$TMP_DIR/HTML-LinkExtractor/LinkExtractor.pm" "$PERL5_DIR/lib/perl5/HTML/"
[ -f "$TMP_DIR/CSS/CSS.pm" ] && cp "$TMP_DIR/CSS/CSS.pm" "$PERL5_DIR/lib/perl5/" && cp -r "$TMP_DIR/CSS/CSS" "$PERL5_DIR/lib/perl5/"

# Compile XS modules if not already compiled
if [ ! -f "$PERL5_DIR/lib/perl5/x86_64-linux-gnu-thread-multi/auto/Clone/Clone.so" ]; then
  cd "$TMP_DIR/Clone" && perl Makefile.PL INSTALL_BASE="$PERL5_DIR" && make && make install
fi

if [ ! -f "$PERL5_DIR/lib/perl5/x86_64-linux-gnu-thread-multi/auto/HTML/Parser/Parser.so" ]; then
  cd "$TMP_DIR/HTML-Parser" && perl Makefile.PL INSTALL_BASE="$PERL5_DIR" && make && make install
fi

echo "Re-checking dependencies..."
verify_deps
echo "Warrick Perl dependency chain verified successfully."
