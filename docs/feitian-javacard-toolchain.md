# Feitian Java Card toolchain, and the meal-plan applet built with it

This corrects something I said earlier in this branch. I reported that no JDK was
obtainable in this sandbox and therefore that a Java Card applet could not be
compiled. **That was wrong.** The method was wrong, not the conclusion's premise:
I looked for *download* routes (Adoptium, Temurin, GraalVM — all on hosts this
sandbox cannot reach) and searched repositories by description. I did not search
GitHub *code* for the marker file that every JRE and JDK contains.

## What is actually reachable

### A JDK, from GitHub

`MR-Adopt/MR-Adopt.github.io` has eight complete Linux x64 JDKs committed
in-tree under `tool/software/zulu_jdks/`:

```
zulu8.68.0.19-ca-jdk8.0.362-linux_x64     zulu17.40.19-ca-jdk17.0.6-linux_x64
zulu11.62.17-ca-jdk11.0.18-linux_x64      zulu18.32.13-ca-jdk18.0.2.1-linux_x64
zulu13.54.17-ca-jdk13.0.14-linux_x64      zulu19.32.13-ca-jdk19.0.2-linux_x64
zulu15.46.17-ca-jdk15.0.10-linux_x64      zulu21.32.17-ca-jdk21.0.2-linux_x64
```

A blobless sparse clone fetches one of them without pulling the 1 GB repository:

```sh
git clone --filter=blob:none --sparse --depth 1 \
  https://github.com/MR-Adopt/MR-Adopt.github.io.git
git sparse-checkout set tool/software/zulu_jdks/zulu8.68.0.19-ca-jdk8.0.362-linux_x64
```

204 MB, about six seconds. `javac 1.8.0_362` runs.

**JDK 8 is the right choice, not the newest.** The Java Card 3.0.3 converter
rejects class file version 51 (`unsupported class file format of version 51.0`),
so the applet must be compiled with `-target 1.6` — and JDK 17 and later have
dropped support for that source level.

### Feitian's developer package, on GitHub

`github.com/FeitianSmartcardReader` is Feitian Technologies' own account, 67
repositories. Most are PC/SC reader SDKs and drivers:

| | |
| --- | --- |
| `CCID_Driver`, `Win7_CCID_Driver`, `CCID` | Windows CCID drivers |
| `feitian-osx-ccid-installer`, `ccid-driver-mac-os-x-yosemite` | macOS |
| `Feitian-PCSC-SDK`, `android-pcsc`, `dummy_ifdh` | Android / IFD handler |
| `FEITIAN_MOBILE_READERS`, `bR301_SDK_Latest`, `iR301_SDK_Latest`, `R301`, `R320`, `R502_SDK_Latest`, `vR504_SDK_Latest`, `BR500_AND_BR301BLE_SDK_Latest`, `BioR502_SDK_Latest`, `aR530-Audiojack-NFC-Reader` | per-reader SDKs |
| `OpenSC`, `cardpeek`, `libnfc`, `libfreefare`, `liblogicalaccess`, `pcsc-sharp` | third-party tooling |

The one that matters here is **`AppletPlayground`**, which ships Oracle's Java
Card development kits verbatim:

```
ext/java_card_kit-2_2_1/lib/{api.jar, converter.jar, offcardverifier.jar, jcwde.jar, ...}
ext/java_card_kit-2_2_2/lib/{api.jar, api_16.jar, converter.jar, ...}
ext/java_card_kit-3_0_3/lib/{api_classic.jar, api_connected.jar, tools.jar}
ext/java_card_kit-3_0_3/api_export_files/          # the .exp files the converter needs
ext/ant-javacard.jar                               # Ant tasks for Java Card builds
lib/vjcre.jar                                      # the off-card runtime simulator
ext/globalplatform-2_1_1/gp211.jar
```

Also useful: `CardApplet-PayPass`, `eid-applet`, `GlobalPlatformPro`,
`javacard-curated-list`.

The website side is `ftsafe.com/Support/Resources` — 79 items across SDK,
datasheet, video and FAQ, with a **Java Card & OS** category, behind a
JS-driven filter. FT-JCOS is the product: Feitian's own Java Card OS, GlobalPlatform
compliant, **CC EAL5+**, FIPS 140-2 Level 3, EMVCo approved; the A40CR card is
Infineon SLE77-based, dual interface, **Java Card 3.0.4**.

Neither the JDK nor the kit is committed here — Oracle's jars are Feitian's to
redistribute, not this repository's. `tools/build_mealplan_applet.sh` fetches
both into `.cache/` (gitignored) at build time.

## The applet

`smartcard/mealplan/` is a stored-value purse and door pass for a corporate meal
plan and company store. It is the Java counterpart of `js/mealplan-model.js`:
same APDU table, same status words, same security model.

```
tools/build_mealplan_applet.sh
>> javac 1.8.0_362   api_classic.jar from java_card_kit-3_0_3
INFO: conversion completed with 0 errors and 0 warnings.
>> CAP  build/mealplan/cap/com/shdwelf/mealplan/javacard/mealplan.cap (15335 bytes)
```

Ten components: Header, Directory, Applet, Import, ConstantPool, Class, Method,
StaticField, RefLocation, Descriptor.

The security model is in the source header, and the short version is: value only
moves with a MAC from the issuer; spend needs the cardholder PIN *and* a
terminal MAC; the door pass uses a different key from the purse; a monotonic
counter guards every value change and is mixed into the pass response; and hard
caps bound what one stolen card or one compromised till can cost. Over-cap
requests are refused rather than clamped, because a backend that asked for
500.00 and got 50.00 has a reconciliation bug it needs to hear about.

### Four Java Card constraints that bit

Each one is a compile or convert error, recorded here so the next applet does
not rediscover them:

1. **`-target 1.6`.** The 3.0.3 converter rejects class file version 51.
2. **`-encoding UTF-8`.** javac's default encoding is the platform's, which is
   ASCII here, and it fails on an em dash in a comment.
3. **No `int` locals at all.** `unsupported int type of local variable`. The
   4-byte balance arithmetic is written in `short`; the converter has an `-i`
   flag for 32-bit integers but that needs card support.
4. **Array indices must be `short` or `byte`.** `tag[tagOff + i]` promotes to
   `int` and is rejected; it has to be `tag[(short) (tagOff + i)]`.

Plus two API details: `HMACKey.setKey` takes `(data, off, len)` where
`AESKey.setKey` takes `(data, off)`, and `ALG_HMAC_SHA_256` **is** present in
`api_classic.jar` 3.0.3 (Signature constant 25) along with `HMACKey` — which is
why the card and the JS model can use the same primitive.

The converter also refuses to write into a directory that already holds output
for the package, and reports only a bare `Verification failed`. The build script
clears the output directory first.

## Verification

`tests/mealplan-applet.test.mjs` — 14 tests, all passing. It cannot run the
applet, so it does the next most useful thing: it parses the Java source and
checks it against `js/mealplan-model.js` on every constant they share — CLA, all
eight INS values, the auth-blocked status word, and the PIN, challenge, MAC and
key lengths. Then it asserts the Java Card rules that the compiler does not
enforce everywhere: no allocation outside `install()`, session state transient
with `CLEAR_ON_DESELECT`, `OwnerPIN` rather than a hand-rolled compare, the pass
response signed with the access key and never the issuer key, and no `int`
locals.

That cross-check earned its keep immediately: it caught `load()` passing a
vestigial local instead of naming `INS_LOAD` the way `unload()` does.

```
node --test tests/mealplan-applet.test.mjs      # 14 pass
node --test tests/mealplan-model.test.mjs       # 17 pass
```

## What is not done

- **The CAP has never been loaded on a card or in a simulator.** `lib/vjcre.jar`
  is in the kit and the off-card verifier is available, but nothing here has run
  the applet. "It converts" is not "it works".
- **The Java and the JS model are checked against each other on constants, not
  on behaviour.** They share no test vectors. A MAC computed over differently
  ordered bytes would pass the cross-check and fail on a real card.
- **Personalisation is described, not implemented.** The install-data layout is
  documented in the source; there is no issuer backend, no key diversification
  service, and no GlobalPlatform load script.
- **The AIDs are placeholders** in the `A0 00 00 06 17 ...` range. A real
  deployment needs registered ones.
- **Feitian's website downloads were not fetched.** `download.ftsafe.com` is not
  reachable from this sandbox; everything above came from GitHub.
