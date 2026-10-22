XDC_NAME := sneakers-press-kit.xdc

.PHONY: webxdc webxdc-exact clean

# Build the self-contained DOSBox/WASM player from the reconstructed bundle.
webxdc:
	@node scripts/build-sneakers-press-kit-xdc.mjs

# Build a distinct player that preserves and launches the original ZIP files.
webxdc-exact:
	@node scripts/build-sneakers-press-kit-exact-xdc.mjs

clean:
	@rm -f $(XDC_NAME) sneakers-press-kit-exact.xdc
