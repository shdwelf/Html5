/** Small, auditable ring arithmetic for educational lattice demonstrations.
 *
 * This is deliberately schoolbook arithmetic, not a production ML-KEM/ML-DSA
 * implementation. Coefficients live in Z_q[x]/(x^n + 1).
 */

export type Polynomial = number[];
export type Matrix = Polynomial[][];

export interface Ring {
  readonly n: number;
  readonly q: number;
  reduce(value: number): number;
  poly(values?: Polynomial): Polynomial;
  add(a: Polynomial, b: Polynomial): Polynomial;
  sub(a: Polynomial, b: Polynomial): Polynomial;
  mul(a: Polynomial, b: Polynomial): Polynomial;
  dot(row: Polynomial[], vector: Polynomial[]): Polynomial;
  matVec(matrix: Matrix, vector: Polynomial[]): Polynomial[];
}

function assertRing(n: number, q: number): void {
  if (!Number.isInteger(n) || n < 1) throw new Error("n must be a positive integer");
  if (!Number.isInteger(q) || q < 2) throw new Error("q must be an integer greater than 1");
}

export function createRing(n: number, q: number): Ring {
  assertRing(n, q);
  const check = (p: Polynomial): void => {
    if (p.length !== n) throw new Error(`polynomial must have exactly ${n} coefficients`);
  };
  const reduce = (value: number) => ((value % q) + q) % q;
  const poly = (values: Polynomial = []) => {
    if (values.length > n) throw new Error(`polynomial has more than ${n} coefficients`);
    return Array.from({ length: n }, (_, i) => reduce(values[i] ?? 0));
  };
  const add = (a: Polynomial, b: Polynomial) => {
    check(a); check(b); return a.map((x, i) => reduce(x + b[i]));
  };
  const sub = (a: Polynomial, b: Polynomial) => {
    check(a); check(b); return a.map((x, i) => reduce(x - b[i]));
  };
  const mul = (a: Polynomial, b: Polynomial) => {
    check(a); check(b);
    const out = Array(n).fill(0) as number[];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const degree = i + j;
      // x^n = -1, so terms crossing the modulus receive a sign flip.
      out[degree % n] += (degree >= n ? -1 : 1) * a[i] * b[j];
    }
    return out.map(reduce);
  };
  const dot = (row: Polynomial[], vector: Polynomial[]) => {
    if (row.length !== vector.length) throw new Error("matrix/vector dimensions do not match");
    return row.reduce((sum, value, i) => add(sum, mul(value, vector[i])), poly());
  };
  const matVec = (matrix: Matrix, vector: Polynomial[]) => matrix.map(row => dot(row, vector));
  return { n, q, reduce, poly, add, sub, mul, dot, matVec };
}

/** Computes t = A*s + e, the basic educational Module-LWE relation. */
export function moduleLweSample(ring: Ring, A: Matrix, secret: Polynomial[], error: Polynomial[]): Polynomial[] {
  const product = ring.matVec(A, secret);
  if (product.length !== error.length) throw new Error("error vector dimension does not match A");
  return product.map((value, i) => ring.add(value, error[i]));
}

/** Syndrome H*y^T over the same ring; code-based and lattice tracks remain distinct. */
export function syndrome(ring: Ring, H: Matrix, word: Polynomial[]): Polynomial[] {
  return ring.matVec(H, word);
}
