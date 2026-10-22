# Host build of the protocol core. The STM32 build compiles the same src/*.c
# against an STM32 hal.c; only hal.h is swapped.
CC      ?= gcc
CFLAGS  ?= -std=c11 -Wall -Wextra -Werror -O1 -g -Iinclude
CORE     = src/at.c src/dle.c src/fax1.c src/fcs.c src/xport.c
BUILD    = build

.PHONY: test compile-check clean

test: $(BUILD)/tests
	@./$(BUILD)/tests

$(BUILD)/tests: $(CORE) test/run_tests.c
	@mkdir -p $(BUILD)
	$(CC) $(CFLAGS) -o $@ $(CORE) test/run_tests.c

# bridge.c needs a hal implementation to link, so it is only type-checked here.
compile-check:
	@mkdir -p $(BUILD)
	$(CC) $(CFLAGS) -c -o $(BUILD)/bridge.o src/bridge.c
	@echo "bridge.c type-checks"

clean:
	rm -rf $(BUILD)
