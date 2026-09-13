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
| `makinterface/MAKI_DE.ZIP` | 3054667 | `5612061590f8d613e632c41a23433b48fd1d4cf7de95138a38b2226110feead2` | `GZ2ZTSW3CDIW43QOLTEXI3IXX64WMSDQ` | index had none | [20020316224210id_/http://www.makinterface.de:80/MAKI_DE.ZIP](https://web.archive.org/web/20020316224210id_/http://www.makinterface.de:80/MAKI_DE.ZIP) |
| `makinterface/MAKI_EN.ZIP` | 2607414 | `e38f4c6725cd097884165736b1fd8a163495b1776a0987e8a9f64f82ba1d3f3b` | `JOXDCFX5QJIM5OCHVDDRC3PM4X2O2FDI` | index had none | [20020618170559id_/http://makinterface.de:80/MAKI_EN.ZIP](https://web.archive.org/web/20020618170559id_/http://makinterface.de:80/MAKI_EN.ZIP) |
| `makinterface/MAKS_DE.ZIP` | 285089 | `03402504f9d23a30159f45099c0190ebe04e7fd2a66e28804e75ff66e5b90d1b` | `ASRM2T7VZPJM6TCIEQMFAFDVG54GH52O` | index had none | [20011120042845id_/http://www.makinterface.de:80/MAKS_DE.ZIP](https://web.archive.org/web/20011120042845id_/http://www.makinterface.de:80/MAKS_DE.ZIP) |
| `makinterface/MAKS_EN.ZIP` | 951039 | `5d5e52c30cb202f78c99d474704c404c68e4574829eae1c535b2ebb1ef6ab8a9` | `4RHBQSVIAOP4MQCJKOIVOYA4TYL55DR3` | index had none | [20020618165158id_/http://makinterface.de:80/MAKS_EN.ZIP](https://web.archive.org/web/20020618165158id_/http://makinterface.de:80/MAKS_EN.ZIP) |
| `makinterface/MANUAL-D.ZIP` | 566887 | `dca29e3959ac90ddeca2d03e61a4f8fd018c4ecccadeec6fd7a60ac7470be83a` | `MYQUWP3TW26KNZ6XBSZ4AAFOJJNHHHXF` | index had none | [20011120044350id_/http://www.makinterface.de:80/MANUAL-D.ZIP](https://web.archive.org/web/20011120044350id_/http://www.makinterface.de:80/MANUAL-D.ZIP) |
| `makinterface/MANUAL.ZIP` | 385763 | `948e7310f105047d16b80567a6c06aff6dd9b02cf95fc55368b2aa7249c3fdf0` | `3HEWZXXWX4Y2ZGEUV4YY4M3PUICBEGUO` | index had none | [20000830072825id_/http://www.makinterface.de:80/MANUAL.ZIP](https://web.archive.org/web/20000830072825id_/http://www.makinterface.de:80/MANUAL.ZIP) |
| `makinterface/MaksAct.zip` | 1692002 | `41cfc2b27805746d48e50c74e256306c3c9eff2a0424605b6078be418215f6d1` | `ALM5LHEYGZFES7XMAKRWRHZ3LKHFM47K` | index had none | [20051028062138id_/http://www.makinterface.de:80/MaksAct.zip](https://web.archive.org/web/20051028062138id_/http://www.makinterface.de:80/MaksAct.zip) |
| `makinterface/PONYPROG.ZIP` | 93213 | `910745d4966cd0a60da645b1313e9212d2a544c3eef4b3800b4a703e3b2e4bfd` | `TZOFNHMWL7YWVNTSPYQNXCOB55FHIJQL` | index had none | [20011120045326id_/http://www.makinterface.de:80/PONYPROG.ZIP](https://web.archive.org/web/20011120045326id_/http://www.makinterface.de:80/PONYPROG.ZIP) |
| `makinterface/PRSC.ZIP` | 2223763 | `bb75a1cd4d84b5f305f03498ac26b6eabb1507787a335c7df4f736e50db540a3` | `4OIYHEDGZD62BCFIKOEEX2JJMDGX2SPW` | index had none | [20021213134525id_/http://www.makinterface.de:80/PRSC.ZIP](https://web.archive.org/web/20021213134525id_/http://www.makinterface.de:80/PRSC.ZIP) |
| `makinterface/Pinout.zip` | 7109 | `30234d80e3b60cfb92b6a4061ca1d72a3eb9f60d73828d63c8fb584fb9c5a888` | `GOBEFEPET63CQHNJNPO6LCEX2JC5L646` | index had none | [20000830072841id_/http://www.makinterface.de:80/Pinout.zip](https://web.archive.org/web/20000830072841id_/http://www.makinterface.de:80/Pinout.zip) |
| `makinterface/SCPROG.ZIP` | 2223763 | `bb75a1cd4d84b5f305f03498ac26b6eabb1507787a335c7df4f736e50db540a3` | `4OIYHEDGZD62BCFIKOEEX2JJMDGX2SPW` | index had none | [20011029161123id_/http://www.makinterface.de:80/SCPROG.ZIP](https://web.archive.org/web/20011029161123id_/http://www.makinterface.de:80/SCPROG.ZIP) |
| `makinterface/SMARTCRD.ZIP` | 329575 | `a6369879cd71624325745b1ac896336c925da3e3b4c17816b0e90987b759bc30` | `DXGG25SY32DGG67FPO4UU3WSTEYP6D7J` | index had none | [20010914164750id_/http://www.makinterface.de:80/SMARTCRD.ZIP](https://web.archive.org/web/20010914164750id_/http://www.makinterface.de:80/SMARTCRD.ZIP) |
| `makinterface/dms.zip` | 1456901 | `39087786951df397183278283bedf74a5ef6837c1e2db946694aa1272802bd18` | `MKU573ISDNMH7NJFCCWI64NFXQ7GVPRK` | index had none | [20051028062659id_/http://www.makinterface.de:80/dms.zip](https://web.archive.org/web/20051028062659id_/http://www.makinterface.de:80/dms.zip) |
| `makinterface/makstripe.zip` | 2340397 | `4b63cbe7f271c3c27215142085813970a3b5129d7b3024f2bb6f4073d3f9698c` | `K65J3QAURDS37Z4KLYCDEUBMHVKSK3YK` | **no** | [20051210081704id_/http://www.makinterface.de/makstripe.zip](https://web.archive.org/web/20051210081704id_/http://www.makinterface.de/makstripe.zip) |

## Re-fetching

`python3 .arena-archive/fetch.py` re-runs every request; an unchanged line in
`requests.txt` is idempotent, and a size mismatch aborts that file instead of
writing a corrupt one. To add a URL, append it (with its expected size, from
the CDX index) and push — the workflow triggers on that path.
