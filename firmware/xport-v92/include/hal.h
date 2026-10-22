/*
 * hal.h — the only hardware-dependent surface.
 *
 * Everything else in this tree compiles and is tested on the host against this
 * interface. Two UARTs and a millisecond clock is the whole contract:
 *   UART A — Nucleo USART2 (PA2/PA3, D1/D0) to the xPort Pro
 *   UART B — Nucleo USART1 (PA9/PA10, D8/D2) to the V.92 modem
 * Both run 3.3 V TTL. No flow control is wired; see the board README.
 */
#ifndef HAL_H
#define HAL_H

#include <stddef.h>
#include <stdint.h>

typedef enum { HAL_UART_XPORT = 0, HAL_UART_MODEM = 1 } hal_uart_t;

void hal_init(void);
uint32_t hal_millis(void);

/* Non-blocking. Returns the octet and sets *ok, or leaves *ok clear. */
int hal_uart_get(hal_uart_t u, uint8_t *byte);

/* Non-blocking best-effort. Returns how many octets were accepted. */
size_t hal_uart_put(hal_uart_t u, const uint8_t *p, size_t n);

/* Write a NUL-terminated AT command, appending CR if it does not have one. */
void hal_at_send(const char *cmd);

/* Line indicators from the modem module. */
int hal_dcd(void);
int hal_ri(void);
void hal_dtr(int assert);

#endif /* HAL_H */
