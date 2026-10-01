# SOCAL SUBSURFACE calculator port — one core, three targets.
#
#   make -C socal-calc          host build + transpiled web core
#   make -C socal-calc test     host self test, C/JS differential test, containers
#   make -C socal-calc preview  PBM frames for every device (build/preview/*.pbm)
#   make -C socal-calc data     re-extract the tables from socal-subsurface.xdc
#   make -C socal-calc ti83     TI-83 build (needs sdcc + ti83plus.inc)
#
# The host build and the tests need nothing but gcc, python3 and node.
# The calculator builds need sdcc (Z80) and/or tigcc (68k); missing toolchains
# are reported and skipped, never faked.
#
# tables.c, util.c and fb.c come from ../calc/core unmodified — this port
# shares SITE-K's 1-bit runtime rather than forking it. tools/ is shared too:
# c2js.py, ti_pack.py, build_device.py and difftest.py all take the flags that
# point them at this directory.

PY      ?= python3
NODE    ?= node
CC      ?= gcc
CFLAGS  ?= -std=c89 -Wall -Wextra -pedantic -O2
BUILD   := build
PREVIEW := build/preview       # generated frames: not committed
OUT_JS  := ../js/socal-core.js
TOOLS   := ../calc/tools
XDC     := ../socal-subsurface.xdc

SHARED_C := ../calc/core/tables.c ../calc/core/util.c ../calc/core/fb.c
PORT_C   := core/sctables.c core/geo.c core/socaldata.c core/app.c
CORE_C   := $(SHARED_C) $(PORT_C)
# c2js.py needs the headers too — that is where the #defines live. Order is
# significant: a constant has to be seen before the code that uses it.
CORE_H   := ../calc/core/sitek.h core/socaldata.h core/socal.h
CORE     := $(CORE_H) $(CORE_C)
INC      := -Icore -I../calc/core

.PHONY: all host web test preview pack clean devices data ti83 ti89 ti92

all: host web test preview pack

host: $(BUILD)/socal-host

$(BUILD)/socal-host: host/main.c host/tests.c $(CORE)
	@mkdir -p $(BUILD)
	$(CC) $(CFLAGS) $(INC) -o $@ host/main.c host/tests.c $(CORE_C)

$(BUILD)/socal-core.mjs: $(CORE) $(TOOLS)/c2js.py
	@mkdir -p $(BUILD)
	$(PY) $(TOOLS)/c2js.py $(CORE_H) $(CORE_C) --out $@ \
	  --globals SK_FB,SK_W,SK_H,SK_ROWB,SK_FBB,SK_DEV,SK_TICK,SK_QUIT,SC_SCREEN,SC_SEL,SC_ZOOM,SC_DEPTHX,SC_PROFMODE,SC_LAYCUR,SC_DOSLINE,SC_LAYON \
	  --banner "SOCAL SUBSURFACE core — generated from socal-calc/core by c2js.py. Do not edit."

web: $(BUILD)/socal-core.mjs
	cp $(BUILD)/socal-core.mjs $(OUT_JS)
	@echo "wrote $(OUT_JS) — generated from socal-calc/core, do not edit"

test: host $(BUILD)/socal-core.mjs web
	$(BUILD)/socal-host selftest
	$(PY) $(TOOLS)/difftest.py --host $(BUILD)/socal-host --core $(BUILD)/socal-core.mjs \
	  --devices ti83,ti89,ti92 --jsdump tools/js_dump.mjs
	$(PY) $(TOOLS)/ti_pack.py --devices devices.json --app SOCAL selftest

preview: host
	@mkdir -p $(PREVIEW)
	@for d in ti83 ti89 ti92; do $(BUILD)/socal-host render $$d $(PREVIEW) | tail -8; done

pack:
	$(PY) $(TOOLS)/build_device.py --root . --all

devices:
	$(PY) $(TOOLS)/ti_pack.py --devices devices.json --app SOCAL info

# Re-derive core/socaldata.c and core/scdata.h from the .xdc. Only needed when
# the source app changes; the generated files are committed.
data:
	$(PY) tools/xdc2c.py --xdc $(XDC)
	$(PY) tools/gen_tables.py > core/sctables.c

ti83: ; $(PY) $(TOOLS)/build_device.py --root . --device ti83 --strict
ti89: ; $(PY) $(TOOLS)/build_device.py --root . --device ti89 --strict
ti92: ; $(PY) $(TOOLS)/build_device.py --root . --device ti92 --strict

clean:
	rm -rf $(BUILD)
