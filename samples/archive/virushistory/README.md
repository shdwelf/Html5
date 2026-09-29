# virushistory samples — provenance & safety

Source: [SnorreFagerland/virushistory](https://github.com/SnorreFagerland/virushistory)
("THE VIRUS HISTORY PROJECT", 66,043 samples; the collection publishes these
freely for research with a clear safety statement). The seven files below are
the curated DOS classics analyzed in `docs/virus-encyclopedia.md`.

Conventions of that corpus: `.boo` = raw 512-byte boot sector, `.vom` = COM
infector mounted on a goat file, `.vxe` = EXE infector mounted on a goat EXE.

| file | bytes | sha256 |
|---|---|---|
| stoned-standard.boo | 512 | da680c8f9edeec4e3282eb3be47a571f3841fd56ef33654af612520b9981770d |
| michelangelo.boo | 512 | 00255ba82f053206ca778f7498417c9936e1640675e02aa42b1dd4d6b42ada0d |
| cascade1701a.vom | 1801 | 004e8e4bbd3e814fe76754891ca6b032d84b72b1270809f1b6aadf986a41f953 |
| cascade1701b.vom | 1774 | 53e736180e0f7ccb4e8bee485a6253ce9d5b218c5fe3045f048c186c8ddd2953 |
| jerusalem664.vom | 764 | 72ed6c7f5d52b60fb0fd89351733f579c2e9e6defb3d0176901b8ac014f57c82 |
| whale.vom | 9218 | c6ee5863bb9a6835a33078c055699d03cb0238152149b4649ece8de466fbf659 |
| whale.vxe | 9802 | 4f5aeab55eba29ef189c60de21adf6852ecb2a0f3eb32b067729a8c73a52261f |

## Safety

These are **live, historical malware**. They are committed for *static*
analysis (disassembly, decompilation, signature verification) only.

- Never execute any of these files, on bare metal or in a shared VM.
- Never write a `.boo` sector to real media or mount it in a loopback.
- Analysis tooling (`tools/decompile_boot.mjs`, the CyberChef ops) treats
  them as inert byte arrays; nothing in this repo emulates them.

Verifications and findings: `docs/virus-encyclopedia.md`.
