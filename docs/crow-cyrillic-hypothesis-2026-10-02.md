# Crow Cryptogram — Cyrillic hypothesis check

## Question

Could the Crow plaintext be Russian/Cyrillic rather than English?

## Source constraint

The primary Crow page explicitly describes the hidden text as English. Its published SECOM-style checkerboard is the English version with `ESTONIA` as the one-digit row and Latin letters, digits, and space. That means a Cyrillic plaintext would require a different agreed checkerboard/alphabet and cannot be recovered uniquely by running the published English model.

## Exploratory transliteration test

To avoid ignoring the hypothesis, a fixed Russian translation of the poem was transliterated into Latin and its contiguous 20-letter windows were tested as possible SECOM keys. Translation used for the experiment:

> Никогда не забывай город, который мы любили. Город, преданный чужаками. Не один и не дважды, а трижды. Чтобы раскрыть правду и запах горя. Мы нашли в священной земле.

Results:

- Transliteration length: 143 Latin letters
- Contiguous 20-letter windows: 124
- Calibrated SECOM survivors: 0
- Best rough candidate: `DPREDANNYYCHUZHAKAMI`
- Best candidate metrics: IoC 0.1619, chi-squared 451.1, bigram 0.0558

The best candidate fails the calibrated thresholds and is not evidence of a key. The experiment is also inherently weaker than the English search because Russian translation and transliteration are not uniquely specified.

## What a genuine Cyrillic solve would require

1. A primary source showing the Crow plaintext is Cyrillic, contradicting the publisher's English description; or
2. A published Cyrillic SECOM checkerboard specification, including alphabet ordering, row heads, treatment of `Ё`, `Й`, `Ъ`, `Ь`, digits, spaces, and punctuation; and
3. An exact re-encryption of all 600 Crow digits using that alphabet and a 20-letter Cyrillic key.

A Latin transliteration is not equivalent to a Cyrillic checkerboard: multiletter transliterations such as `Ж → ZH` and `Щ → SHCH` change the number of plaintext symbols and the key ranking. It can be used as a heuristic lead search, not as a decryption proof.

## Conclusion

No Russian/Cyrillic plaintext or key was found. The evidence still supports an English SECOM instance. `EN RT OS AI` remains an Enigma plugboard benchmark and is unrelated to this Cyrillic hypothesis.
