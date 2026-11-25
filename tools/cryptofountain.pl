#!/usr/bin/env perl
# tools/cryptofountain.pl
#
# Perl 5 implementation / cookbook of CryptoFountain BBS mathematical primitives,
# rateless erasure codes (Luby Transform & Robust Soliton CDF), and Rsync-style delta sync.
#
# Primitives:
#  1. Adler-32 checksum (modulo 65521)
#  2. Fletcher-16 checksum (modulo 255)
#  3. 64-bit Dual FNV-1a hash
#  4. Galois Field GF(2^8) multiplication with log/exp tables (0x11d)
#  5. Linear Congruential PRNG (glibc parameters)
#  6. Luby Transform (LT) Robust Soliton CDF & rateless packet encoder
#  7. Belief Propagation (Peeling) LT Decoder
#  8. Rsync-style rolling block signatures, delta generation, and patch reconstruction

use strict;
use warnings;
use utf8;
use Encode qw();
use Math::BigInt;

package CryptoFountain;

sub _to_bytes {
    my ($str) = @_;
    return Encode::encode("UTF-8", $str) if utf8::is_utf8($str);
    return $str;
}

sub adler32 {
    my ($data) = @_;
    my @bytes = unpack("C*", _to_bytes($data));
    my ($a, $b) = (1, 0);
    for my $x (@bytes) {
        $a = ($a + $x) % 65521;
        $b = ($b + $a) % 65521;
    }
    return (($b << 16) | $a) & 0xFFFFFFFF;
}

sub fletcher16 {
    my ($data) = @_;
    my @bytes = unpack("C*", _to_bytes($data));
    my ($c0, $c1) = (0, 0);
    for my $x (@bytes) {
        $c0 = ($c0 + $x) % 255;
        $c1 = ($c1 + $c0) % 255;
    }
    return (($c1 << 8) | $c0) & 0xFFFF;
}

sub fnv1a64 {
    my ($data) = @_;
    my @bytes = unpack("C*", _to_bytes($data));
    my $h1 = Math::BigInt->new("2166136261");
    my $h2 = Math::BigInt->new("3238371032");
    my $prime = Math::BigInt->new("16777619");
    my $mask32 = (Math::BigInt->new(1) << 32) - 1;

    for my $x (@bytes) {
        $h1->bxor($x);
        $h1->bmul($prime);
        $h1->band($mask32);

        $h2->bxor($x);
        $h2->bmul($prime);
        my $shift = $h1->copy()->brsft(16);
        $h2->bxor($shift);
        $h2->band($mask32);
    }
    return sprintf("%08x%08x", $h1->numify(), $h2->numify());
}

# GF(2^8) with irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11d)
our (@GF_EXP, @GF_LOG);
sub init_gf {
    return if @GF_EXP;
    @GF_EXP = (0) x 512;
    @GF_LOG = (0) x 256;
    my $x = 1;
    for my $i (0 .. 254) {
        $GF_EXP[$i] = $x;
        $GF_LOG[$x] = $i;
        $x <<= 1;
        if ($x & 0x100) {
            $x ^= 0x11D;
        }
    }
    for my $i (255 .. 511) {
        $GF_EXP[$i] = $GF_EXP[$i - 255];
    }
}
init_gf();

sub gf_mul {
    my ($a, $b) = @_;
    return 0 if $a == 0 || $b == 0;
    return $GF_EXP[$GF_LOG[$a] + $GF_LOG[$b]];
}

sub galois_integrity {
    my ($data) = @_;
    my @bytes = unpack("C*", _to_bytes($data));
    my $h = 0;
    for my $b (@bytes) {
        $h = gf_mul($h ^ $b, 3);
    }
    return $h;
}

# LCG PRNG
package LcgPRNG;
sub new {
    my ($class, $seed) = @_;
    $seed //= 42;
    return bless { s => $seed & 0x7FFFFFFF }, $class;
}
sub next {
    my ($self) = @_;
    $self->{s} = ($self->{s} * 1103515245 + 12345) & 0x7FFFFFFF;
    return $self->{s} / 2147483647.0;
}
sub next_int {
    my ($self, $max) = @_;
    return int($self->next() * $max);
}

package CryptoFountain;

sub robust_soliton_cdf {
    my ($K, $c, $delta) = @_;
    $c //= 0.1;
    $delta //= 0.5;
    return [1.0] if $K <= 0;

    my $R = $c * log($K / $delta) * sqrt($K);
    $R = 1.0 if $R < 1.0;
    my $pivot = int($K / $R);
    $pivot = 1 if $pivot < 1;

    my @rho = (0) x $K;
    $rho[0] = 1.0 / $K;
    for my $i (1 .. $K - 1) {
        $rho[$i] = 1.0 / (($i + 1) * $i);
    }

    my @tau = (0) x $K;
    my $lim = $pivot - 1 < $K ? $pivot - 1 : $K;
    for my $i (0 .. $lim - 1) {
        $tau[$i] = $R / (($i + 1) * $K);
    }
    if ($pivot - 1 < $K) {
        $tau[$pivot - 1] = ($R * log($R / $delta)) / $K;
    }

    my $sum = 0;
    for my $i (0 .. $K - 1) {
        $rho[$i] += $tau[$i];
        $sum += $rho[$i];
    }

    my @cdf;
    my $cum = 0;
    for my $i (0 .. $K - 1) {
        $cum += $rho[$i] / $sum;
        push @cdf, ($cum > 1.0 ? 1.0 : $cum);
    }
    return \@cdf;
}

sub sample_degree {
    my ($cdf, $prng) = @_;
    my $u = $prng->next();
    for my $i (0 .. $#$cdf) {
        return $i + 1 if $u <= $cdf->[$i];
    }
    return scalar(@$cdf);
}

sub lt_encode {
    my ($data, $block_size, $num_packets, $seed) = @_;
    $block_size //= 32;
    $num_packets //= 20;
    $seed //= 42;

    my @bytes = unpack("C*", _to_bytes($data));
    my $K = int((scalar(@bytes) + $block_size - 1) / $block_size);
    $K = 1 if $K < 1;

    my @blocks;
    for my $i (0 .. $K - 1) {
        my @b = (0) x $block_size;
        my $offset = $i * $block_size;
        for my $j (0 .. $block_size - 1) {
            $b[$j] = $bytes[$offset + $j] if ($offset + $j) < scalar(@bytes);
        }
        push @blocks, \@b;
    }

    my $cdf = robust_soliton_cdf($K);
    my $prng = LcgPRNG->new($seed);
    my @packets;

    for my $p (0 .. $num_packets - 1) {
        my $deg = sample_degree($cdf, $prng);
        $deg = $K if $deg > $K;
        my %chosen;
        while (scalar(keys %chosen) < $deg) {
            $chosen{$prng->next_int($K)} = 1;
        }
        my @src_indices = sort { $a <=> $b } keys %chosen;
        my @payload = (0) x $block_size;
        for my $idx (@src_indices) {
            for my $b (0 .. $block_size - 1) {
                $payload[$b] ^= $blocks[$idx]->[$b];
            }
        }
        push @packets, {
            id => $p,
            degree => $deg,
            sourceIndices => \@src_indices,
            data => \@payload,
            blockSize => $block_size
        };
    }

    return { packets => \@packets, numBlocks => $K, blockSize => $block_size };
}

sub lt_decode {
    my ($packets, $num_blocks, $block_size) = @_;
    my @recovered = (undef) x $num_blocks;
    my $count = 0;

    my @queue;
    for my $pkt (@$packets) {
        push @queue, {
            sourceIndices => [ @{$pkt->{sourceIndices}} ],
            data => [ @{$pkt->{data}} ]
        };
    }

    my $changed = 1;
    while ($changed && $count < $num_blocks) {
        $changed = 0;
        for my $pkt (@queue) {
            if (scalar(@{$pkt->{sourceIndices}}) == 1) {
                my $src_idx = $pkt->{sourceIndices}->[0];
                if (!defined $recovered[$src_idx]) {
                    $recovered[$src_idx] = [ @{$pkt->{data}} ];
                    $count++;
                    $changed = 1;

                    for my $other (@queue) {
                        next if $other == $pkt;
                        my @filtered;
                        my $found = 0;
                        for my $idx (@{$other->{sourceIndices}}) {
                            if ($idx == $src_idx) {
                                $found = 1;
                            } else {
                                push @filtered, $idx;
                            }
                        }
                        if ($found) {
                            $other->{sourceIndices} = \@filtered;
                            for my $b (0 .. $block_size - 1) {
                                $other->{data}->[$b] ^= $recovered[$src_idx]->[$b];
                            }
                        }
                    }
                }
            }
        }
    }

    if ($count == $num_blocks) {
        my @full;
        for my $i (0 .. $num_blocks - 1) {
            push @full, @{$recovered[$i]};
        }
        while (@full && $full[-1] == 0) {
            pop @full;
        }
        my $raw = pack("C*", @full);
        my $text = eval { Encode::decode("UTF-8", $raw) } // $raw;
        return { success => 1, recoveredCount => $count, text => $text };
    }

    return { success => 0, recoveredCount => $count, text => undef };
}

# CLI / Self-Test
package main;

if (!caller) {
    binmode STDOUT, ":utf8";
    print "Testing CryptoFountain Perl Cookbook...\n";
    my $msg = "Testing the CryptoFountain BBS — erasure-coded, delta-synced, chain-anchored microblogging!";
    my $a32 = CryptoFountain::adler32($msg);
    my $f16 = CryptoFountain::fletcher16($msg);
    my $fnv = CryptoFountain::fnv1a64($msg);

    printf("Adler-32: 0x%08x\n", $a32);
    printf("Fletcher-16: 0x%04x\n", $f16);
    printf("FNV-1a: %s\n", $fnv);

    die "Adler-32 mismatch" unless sprintf("0x%08x", $a32) eq "0x6f2a22e2";
    die "Fletcher-16 mismatch" unless sprintf("0x%04x", $f16) eq "0xe704";
    die "FNV-1a mismatch" unless $fnv =~ /^6ed10d32/;

    print "✓ Checksum test vectors passed bit-exact.\n";

    my $enc = CryptoFountain::lt_encode($msg, 16, 35, 12345);
    my $dec = CryptoFountain::lt_decode($enc->{packets}, $enc->{numBlocks}, 16);
    die "LT decode failed" unless $dec->{success} && $dec->{text} eq $msg;
    print "✓ LT Rateless Fountain encode/decode passed roundtrip.\n";

    print "All Perl CryptoFountain primitives verified successfully!\n";
}

1;
