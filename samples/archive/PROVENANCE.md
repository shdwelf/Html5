# Archived vendor files — what these are and exactly where they came from

Retrieved by `.github/workflows/arena-archive-fetch.yml` from the Internet
Archive, byte-for-byte, using the `id_` URL modifier (which returns the
original response rather than the Archive's rewritten copy). Each file's
sha256 below is over the bytes as received; the size is checked against the
length the CDX index recorded for that capture, and a mismatch is a
failure rather than a warning.

The development sandbox cannot reach archive.org (its egress is allowlisted
to GitHub/PyPI/npm), which is why this runs on a GitHub Actions runner and
commits the bytes back to the branch instead of downloading them locally.

| file | bytes | sha256 | CDX digest (sha1 base32) | verified | source |
| --- | --- | --- | --- | --- | --- |
| `makinterface/Adapter.zip` | 365821 | `877b87601508d4db081b7ca242d9d56de66787caaa7959f53220171dacae28f7` | `SUCVBLCB4WLPO4YZ5RBTH4B7VFJ2BPP2` | index had none | [20000830072837id_/http://www.makinterface.de:80/Adapter.zip](https://web.archive.org/web/20000830072837id_/http://www.makinterface.de:80/Adapter.zip) |
| `makinterface/DMS_DE.ZIP` | 218633 | `5f362a26cef10543f271715773cf0148bae2fb1c69e9d6689e86a99afd44d348` | `J2LPENYTU5NJYPJPNNTKXTENOFJ3W3ZK` | index had none | [20011120041300id_/http://www.makinterface.de:80/DMS_DE.ZIP](https://web.archive.org/web/20011120041300id_/http://www.makinterface.de:80/DMS_DE.ZIP) |
| `makinterface/DMS_EN.ZIP` | 217895 | `11781ec733ccb80a65d34af6bbde232c7be0b1aabfe08d921863771b5123dd79` | `ZKNXAD3CUT5R4UELGWZX62S2IZO4MYTL` | index had none | [20020822020619id_/http://www.makinterface.de:80/DMS_EN.ZIP](https://web.archive.org/web/20020822020619id_/http://www.makinterface.de:80/DMS_EN.ZIP) |
| `makinterface/IC-PROG.ZIP` | 112982 | `c0b196c637886b632ba315ea1a7aac81adb0f52e0cc5212539318e4fb19d5549` | `FTYMHXKDW2L5OPVJNWPRSBVO7WMXP5WM` | index had none | [20011120041757id_/http://www.makinterface.de:80/IC-PROG.ZIP](https://web.archive.org/web/20011120041757id_/http://www.makinterface.de:80/IC-PROG.ZIP) |
| `makinterface/MAKI-PRO.ZIP` | 22789 | `ff118d9a85fca23a5f6b6f2b56d24b56b5aaa1bf5ab72c51032fc7ded8417bc0` | `HCKZSMNLKGLCOVXHDXONN7DXKLBGYE4H` | index had none | [20000830072829id_/http://www.makinterface.de:80/MAKI-PRO.ZIP](https://web.archive.org/web/20000830072829id_/http://www.makinterface.de:80/MAKI-PRO.ZIP) |
| `makinterface/MAKITEST.ZIP` | 378036 | `c2edd734aab88b9557fff57b5a9ae0652b83586b5e12a0435ffb125c07b850ee` | `NP3QRR7WYNTMSNX6ZWMJ6JNG2EGAJJRR` | index had none | [20011108012902id_/http://www.makinterface.de:80/MAKITEST.ZIP](https://web.archive.org/web/20011108012902id_/http://www.makinterface.de:80/MAKITEST.ZIP) |
| `makinterface/PONYPROG.ZIP` | 93213 | `910745d4966cd0a60da645b1313e9212d2a544c3eef4b3800b4a703e3b2e4bfd` | `TZOFNHMWL7YWVNTSPYQNXCOB55FHIJQL` | index had none | [20011120045326id_/http://www.makinterface.de:80/PONYPROG.ZIP](https://web.archive.org/web/20011120045326id_/http://www.makinterface.de:80/PONYPROG.ZIP) |
| `makinterface/Pinout.zip` | 7109 | `30234d80e3b60cfb92b6a4061ca1d72a3eb9f60d73828d63c8fb584fb9c5a888` | `GOBEFEPET63CQHNJNPO6LCEX2JC5L646` | index had none | [20000830072841id_/http://www.makinterface.de:80/Pinout.zip](https://web.archive.org/web/20000830072841id_/http://www.makinterface.de:80/Pinout.zip) |
| `makinterface/SMARTCRD.ZIP` | 329575 | `a6369879cd71624325745b1ac896336c925da3e3b4c17816b0e90987b759bc30` | `DXGG25SY32DGG67FPO4UU3WSTEYP6D7J` | index had none | [20010914164750id_/http://www.makinterface.de:80/SMARTCRD.ZIP](https://web.archive.org/web/20010914164750id_/http://www.makinterface.de:80/SMARTCRD.ZIP) |
| `makinterface/dms.zip` | 1456901 | `39087786951df397183278283bedf74a5ef6837c1e2db946694aa1272802bd18` | `MKU573ISDNMH7NJFCCWI64NFXQ7GVPRK` | index had none | [20051028062659id_/http://www.makinterface.de:80/dms.zip](https://web.archive.org/web/20051028062659id_/http://www.makinterface.de:80/dms.zip) |

## Re-fetching

`python3 .arena-archive/fetch.py` re-runs every request; an unchanged line in
`requests.txt` is idempotent, and a size mismatch aborts that file instead of
writing a corrupt one. To add a URL, append it (with its expected size, from
the CDX index) and push — the workflow triggers on that path.
