XDC_NAME := sneakers-press-kit.xdc

.PHONY: webxdc clean

# Build the self-contained DOSBox/WASM player from its canonical shell, the
# local reconstructed press-kit bundle, and the vendored js-dos runtime.
webxdc:
	@node scripts/build-sneakers-press-kit-xdc.mjs

clean:
	@rm -f $(XDC_NAME)
