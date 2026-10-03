
## The one metric false positive

The sole metric survivor was formed from the ordered poem words:

```text
THE + TOWN + A + TWICE + AND + OF + WE
= THETOWNATWICEANDOFWE
```

Its metrics were:

```text
IoC:          0.1127
chi-squared: 243.5
bigram:      -0.066
```

Those numbers pass the screening thresholds, but the decoded output begins:

```text
EYIEKAAE2ECSKE0TI380EEK24E27BGSI1ITENITE3S3TITAN18SLZ8STLEA...
```

It contains a structural `?` decode marker and is visibly not English plaintext. It is therefore a false positive caused by checkerboard frequency bias, not a Crow solution. The implementation now prints metric-survivor plaintext and marker count so a statistical survivor cannot be mistaken for a solve.

This is a useful result: the larger word-position search confirms that the IoC/bigram ladder is a lead filter only. Exact checkerboard validity, readable plaintext, and re-encryption are required.
