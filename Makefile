XDC_NAME := dist/sneakers-press-kit.xdc
XDC_FILES := index.html styles.css app.js manifest.toml icon.png README.md

.PHONY: webxdc clean

# A webxdc is a deflated ZIP with an .xdc extension. The package deliberately
# excludes downloaded archival media and generated third-party graphics.
webxdc:
	@mkdir -p dist
	@rm -f $(XDC_NAME)
	@zip -q -9 $(XDC_NAME) $(XDC_FILES)
	@echo "Created $(XDC_NAME)"
	@unzip -t $(XDC_NAME) >/dev/null

clean:
	@rm -rf dist
