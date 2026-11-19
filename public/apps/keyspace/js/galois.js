/** Small, vetted finite fields for visualisation, not wallet cryptography.
 * Binary values encode polynomial coefficients least-significant bit first.
 * Only irreducible, fixed moduli are offered; arbitrary Z/nZ is not a field.
 */
export const FIELDS = Object.freeze([
  Object.freeze({ id: "gf16", name: "GF(2⁴) · polynomial 0x13", order: 16, characteristic: 2, degree: 4, modulus: 0x13, polynomial: "x⁴ + x + 1" }),
  Object.freeze({ id: "aes", name: "GF(2⁸) · AES · 0x11b", order: 256, characteristic: 2, degree: 8, modulus: 0x11b, polynomial: "x⁸ + x⁴ + x³ + x + 1" }),
  Object.freeze({ id: "rs", name: "GF(2⁸) · Reed–Solomon basis · 0x11d", order: 256, characteristic: 2, degree: 8, modulus: 0x11d, polynomial: "x⁸ + x⁴ + x³ + x² + 1" }),
  Object.freeze({ id: "f17", name: "GF(17) · prime field", order: 17, characteristic: 17, degree: 1, modulus: 17, polynomial: "integers modulo 17" }),
]);

export function fieldById(id) {
  const field = FIELDS.find((item) => item.id === id);
  if (!field) throw new RangeError("Unknown finite-field preset");
  return field;
}

function element(field, value) {
  if (!FIELDS.includes(field)) throw new RangeError("Use a vetted finite-field preset");
  if (!Number.isInteger(value) || value < 0 || value >= field.order)
    throw new RangeError(`Field elements must be integers 0…${field.order - 1}`);
  return value;
}

export function fieldAdd(field, a, b) {
  element(field, a); element(field, b);
  return field.characteristic === 2 ? a ^ b : (a + b) % field.order;
}

export function fieldMultiply(field, a, b) {
  element(field, a); element(field, b);
  if (field.characteristic !== 2) return (a * b) % field.order;
  let out = 0;
  while (b) {
    if (b & 1) out ^= a;
    a <<= 1;
    if (a & field.order) a ^= field.modulus;
    b >>>= 1;
  }
  return out;
}

export function fieldPower(field, a, exponent) {
  element(field, a);
  if (!Number.isSafeInteger(exponent) || exponent < 0) throw new RangeError("Use a nonnegative integer exponent");
  let out = 1;
  while (exponent) {
    if (exponent % 2) out = fieldMultiply(field, out, a);
    a = fieldMultiply(field, a, a);
    exponent = Math.floor(exponent / 2);
  }
  return out;
}

/** Zero has no multiplicative inverse, in every field. */
export function fieldInverse(field, a) {
  element(field, a);
  return a === 0 ? null : fieldPower(field, a, field.order - 2);
}

export function fieldDivide(field, a, b) {
  element(field, a);
  const inverse = fieldInverse(field, b);
  return inverse === null ? null : fieldMultiply(field, a, inverse);
}

export function fieldElementText(field, a) {
  element(field, a);
  if (field.characteristic !== 2) return String(a);
  return `0x${a.toString(16).padStart(Math.ceil(field.degree / 4), "0")}`;
}

export function elementPolynomial(field, a) {
  element(field, a);
  if (field.characteristic !== 2) return `${a} mod ${field.order}`;
  return Array.from({ length: field.degree }, (_, bit) => bit)
    .reverse().filter((bit) => (a >> bit) & 1)
    .map((bit) => bit === 0 ? "1" : bit === 1 ? "x" : `x^${bit}`).join(" + ") || "0";
}
