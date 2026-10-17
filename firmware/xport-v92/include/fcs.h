/*
 * fcs.h — HDLC FCS-16, the CRC T.30 frames are checked with.
 *
 * In Class 1 the DTE never computes the FCS for a frame it sends: the DCE
 * "adds start and end flags, performs zero-bit insertion, generates FCS".
 * But on +FRH the DCE hands the DTE the frame *including* the two FCS octets,
 * so the host has to be able to verify them — that is what this is for.
 *
 * CRC-16/X.25: poly 0x1021, init 0xFFFF, reflected in and out, xorout 0xFFFF.
 * Appended least-significant octet first. The residue of a good frame plus its
 * own FCS is FCS_GOOD_RESIDUE.
 */
#ifndef FCS_H
#define FCS_H

#include <stddef.h>
#include <stdint.h>

#define FCS_INIT         0xFFFFu
#define FCS_GOOD_RESIDUE 0xF0B8u

/* Running CRC, reflected. Feed octets in wire order. */
uint16_t fcs_update(uint16_t fcs, uint8_t octet);
uint16_t fcs_block(const uint8_t *p, size_t n);

/* Finalise for transmission: the value to append, LSB first. */
uint16_t fcs_final(uint16_t fcs);

/*
 * Verify a frame that already carries its two FCS octets. Returns 1 when the
 * residue is correct. `n` includes the two FCS octets.
 */
int fcs_check(const uint8_t *frame, size_t n);

#endif /* FCS_H */
