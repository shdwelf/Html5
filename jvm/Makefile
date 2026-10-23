# cfjvm - a small Java class-file interpreter.
#
# `make test` is a DIFFERENTIAL test: the same .class files are run on the real
# JDK and under cfjvm, and the two outputs are diffed. Expected output is
# therefore produced by Java itself rather than typed in by hand, so it cannot
# silently drift.
#
# JAVAC is auto-detected. Nothing is faked if it is missing - the target stops
# and says so, because a skipped differential test is not a passed one.

CC      ?= gcc
CFLAGS  ?= -std=c99 -O2 -g -Wall -Wextra -Werror -Wno-overlength-strings
BUILD   := build

# Locate a JDK: explicit JAVA_HOME first, then the cached Zulu trees, then PATH.
# Paths are relative to this Makefile's directory.
JDK_GLOB := \
  $(wildcard ../.cache/jdk/adopt/tool/software/zulu_jdks/zulu8*/bin/javac) \
  $(wildcard ../.cache/jdk/adopt/tool/software/zulu_jdks/zulu11*/bin/javac) \
  $(wildcard ../.cache/applet-toolchain/*/bin/javac)
JAVAC := $(if $(JAVA_HOME),$(wildcard $(JAVA_HOME)/bin/javac),$(firstword $(JDK_GLOB)))
ifeq ($(JAVAC),)
JAVAC := $(shell command -v javac 2>/dev/null)
endif
JAVA := $(if $(JAVAC),$(dir $(JAVAC))java,)

# The differential test is the whole point of this target. If there is no JDK to
# produce the reference output, fail loudly - a silently skipped differential
# test would look exactly like a passing one.
ifeq ($(JAVAC),)
$(warning no javac found: set JAVA_HOME, put a JDK on PATH, or populate .cache/jdk)
endif

.PHONY: all test clean
all: $(BUILD)/cfjvm

$(BUILD):
	@mkdir -p $(BUILD)

$(BUILD)/cfjvm: cfjvm.c cfjvm_port.h | $(BUILD)
	$(CC) $(CFLAGS) -o $@ cfjvm.c

# A stamp file, not the directory itself: a directory target is considered up
# to date as soon as it exists, so a compile that failed after mkdir would never
# be retried. Compile as Java 8 (class-file 52) even when the reference
# compiler is Temurin 21: cfjvm deliberately targets class files 45..52.
$(BUILD)/classes.stamp: tests/Smoke.java | $(BUILD)
	@rm -rf $(BUILD)/classes
	@mkdir -p $(BUILD)/classes
	$(JAVAC) -encoding UTF-8 -nowarn -source 1.8 -target 1.8 -d $(BUILD)/classes tests/Smoke.java
	@touch $@

test: $(BUILD)/cfjvm $(BUILD)/classes.stamp
	@if [ -z "$(JAVAC)" ]; then echo "FAIL: no javac available, cannot produce reference output"; exit 1; fi
	@echo "== cfjvm differential test =="
	@echo "javac: $(JAVAC)"
	@$(JAVA) -version 2>&1 | head -1
	@$(JAVA) -cp $(BUILD)/classes Smoke one two three > $(BUILD)/expected.txt
	@./$(BUILD)/cfjvm $(BUILD)/classes/Smoke.class $(BUILD)/classes/Base.class \
	    $(BUILD)/classes/Derived.class -- one two three > $(BUILD)/actual.txt
	@if diff -u $(BUILD)/expected.txt $(BUILD)/actual.txt > $(BUILD)/diff.txt; then \
	  echo "OK - cfjvm output is byte-identical to the JDK ($$(wc -l < $(BUILD)/expected.txt) lines)"; \
	else \
	  echo "FAIL - output differs:"; cat $(BUILD)/diff.txt; exit 1; \
	fi

clean:
	rm -rf $(BUILD)
