# SITE-K calculator port — one core, five targets.
#
#   make -C calc          host build + transpiled web core
#   make -C calc test     host self test, C/JS differential test, container selftest
#   make -C calc preview  PBM frames for every device (calc/preview/*.pbm)
#   make -C calc all      the above plus any calculator target whose toolchain exists
#   make -C calc ti83     TI-83 build (needs sdcc + ti83plus.inc)
#
# The host build and the tests need nothing but gcc, python3 and node.
# The calculator builds need sdcc (Z80) and/or tigcc (68k); missing toolchains
# are reported and skipped, never faked.

PY      ?= python3
NODE    ?= node
CC      ?= gcc
CFLAGS  ?= -std=c89 -Wall -Wextra -pedantic -O2
BUILD   := build
PREVIEW := build/preview   # generated frames: not committed
OUT_JS  := ../js/calc-core.js

CORE_H  := core/sitek.h
CORE_C  := core/tables.c core/util.c core/fb.c core/keys.c core/grid.c core/app.c
CORE    := $(CORE_H) $(CORE_C)

.PHONY: all host web test preview pack clean devices ti83 ti85 ti89 ti90 ti92

all: host web test preview pack

host: $(BUILD)/sitek-host

$(BUILD)/sitek-host: host/main.c host/tests.c $(CORE)
	@mkdir -p $(BUILD)
	$(CC) $(CFLAGS) -Icore -o $@ host/main.c host/tests.c $(CORE_C)

$(BUILD)/calc-core.mjs: $(CORE) tools/c2js.py
	@mkdir -p $(BUILD)
	$(PY) tools/c2js.py $(CORE) --out $@

web: $(BUILD)/calc-core.mjs
	cp $(BUILD)/calc-core.mjs $(OUT_JS)
	@echo "wrote $(OUT_JS) — generated from calc/core, do not edit"

test: host $(BUILD)/calc-core.mjs web
	$(BUILD)/sitek-host selftest
	$(PY) tools/difftest.py --host $(BUILD)/sitek-host --core $(BUILD)/calc-core.mjs
	$(PY) tools/ti_pack.py selftest

preview: host
	@mkdir -p $(PREVIEW)
	@for d in ti83 ti85 ti89 ti90 ti92 host; do $(BUILD)/sitek-host render $$d $(PREVIEW) | tail -6; done

pack:
	$(PY) tools/build_device.py --all

devices:
	$(PY) tools/ti_pack.py info

ti83: ; $(PY) tools/build_device.py --device ti83 --strict
ti85: ; $(PY) tools/build_device.py --device ti85 --strict
ti90: ; $(PY) tools/build_device.py --device ti90 --strict
ti89: ; $(PY) tools/build_device.py --device ti89 --strict
ti92: ; $(PY) tools/build_device.py --device ti92 --strict

clean:
	rm -rf $(BUILD)
	rm -f $(PREVIEW)/*.pbm
