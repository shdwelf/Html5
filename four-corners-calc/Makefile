# FOUR CORNERS calculator port — one core, three targets.
#
#   make -C four-corners-calc          host build + transpiled web core
#   make -C four-corners-calc test     host self test, C/JS differential test, containers
#   make -C four-corners-calc preview  PBM frames for every device (build/preview/*.pbm)
#   make -C four-corners-calc data     re-extract the tables from four-corners.xdc
#   make -C four-corners-calc ti83     TI-83 build (needs sdcc + ti83plus.inc)
#
# The host build and the tests need nothing but gcc, python3 and node.
# The calculator builds need sdcc (Z80) and/or tigcc (68k); missing toolchains
# are reported and skipped, never faked.
#
# tables.c, util.c and fb.c come from ../calc/core unmodified — this port
# shares SITE-K's 1-bit runtime (as does socal-calc) rather than forking it.
# tools/ is shared too: c2js.py, ti_pack.py, build_device.py and difftest.py
# all take the flags that point them at this directory.

PY      ?= python3
NODE    ?= node
CC      ?= gcc
CFLAGS  ?= -std=c89 -Wall -Wextra -pedantic -O2
BUILD   := build
PREVIEW := build/preview       # generated frames: not committed
OUT_JS  := ../js/four-corners-core.js
TOOLS   := ../calc/tools
XDC     := ../four-corners.xdc

SHARED_C := ../calc/core/tables.c ../calc/core/util.c ../calc/core/fb.c
PORT_C   := core/fctables.c core/geo.c core/fcdata.c core/app.c
CORE_C   := $(SHARED_C) $(PORT_C)
# c2js.py needs the headers too — that is where the #defines live. Order is
# significant: a constant has to be seen before the code that uses it.
CORE_H   := ../calc/core/sitek.h core/fcdata.h core/fourcorners.h
CORE     := $(CORE_H) $(CORE_C)
INC      := -Icore -I../calc/core

.PHONY: all host web test preview pack clean devices data ti83 ti89 ti92

all: host web test preview pack

host: $(BUILD)/fcorner-host

$(BUILD)/fcorner-host: host/main.c host/tests.c $(CORE)
	@mkdir -p $(BUILD)
	$(CC) $(CFLAGS) $(INC) -o $@ host/main.c host/tests.c $(CORE_C)

$(BUILD)/four-corners-core.mjs: $(CORE) $(TOOLS)/c2js.py Makefile
	@mkdir -p $(BUILD)
	$(PY) $(TOOLS)/c2js.py $(CORE_H) $(CORE_C) --out $@ \
	  --globals SK_FB,SK_W,SK_H,SK_ROWB,SK_FBB,SK_DEV,SK_TICK,SK_QUIT,FC_SCREEN,FC_SEL,FC_ZOOM,FC_DEPTHX,FC_PROFMODE,FC_LAYCUR,FC_LAYON,FC_TER \
	  --banner "FOUR CORNERS core — generated from four-corners-calc/core by c2js.py. Do not edit."

web: $(BUILD)/four-corners-core.mjs
	cp $(BUILD)/four-corners-core.mjs $(OUT_JS)
	@echo "wrote $(OUT_JS) — generated from four-corners-calc/core, do not edit"

test: host $(BUILD)/four-corners-core.mjs web
	$(BUILD)/fcorner-host selftest
	$(PY) $(TOOLS)/difftest.py --host $(BUILD)/fcorner-host --core $(BUILD)/four-corners-core.mjs \
	  --devices ti83,ti89,ti92 --jsdump tools/js_dump.mjs
	$(PY) $(TOOLS)/ti_pack.py --devices devices.json --app FCORNER selftest

preview: host
	@mkdir -p $(PREVIEW)
	@for d in ti83 ti89 ti92; do $(BUILD)/fcorner-host render $$d $(PREVIEW) | tail -8; done

pack:
	$(PY) $(TOOLS)/build_device.py --root . --all

devices:
	$(PY) $(TOOLS)/ti_pack.py --devices devices.json --app FCORNER info

# Re-derive core/fcdata.c, core/fcdata.h and host/elevfix.h from the .xdc.
# Only needed when the source app changes; the generated files are committed.
data:
	$(PY) tools/xdc2c.py --xdc $(XDC)
	$(PY) tools/gen_tables.py > core/fctables.c

ti83: ; $(PY) $(TOOLS)/build_device.py --root . --device ti83 --strict
ti89: ; $(PY) $(TOOLS)/build_device.py --root . --device ti89 --strict
ti92: ; $(PY) $(TOOLS)/build_device.py --root . --device ti92 --strict

clean:
	rm -rf $(BUILD)
