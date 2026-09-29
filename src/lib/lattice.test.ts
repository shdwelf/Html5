import { describe, expect, it } from 'vitest';
import { createRing, moduleLweSample, syndrome } from './lattice';

describe('educational quotient polynomial ring', () => {
  const R = createRing(4, 17);
  it('reduces x^4 to -1', () => {
    expect(R.mul([0, 0, 0, 1], [0, 1, 0, 0])).toEqual([16, 0, 0, 0]);
  });
  it('satisfies a distributive identity', () => {
    const a = [1, 2, 3, 4], b = [4, 3, 2, 1], c = [2, 0, 1, 0];
    expect(R.mul(R.add(a, b), c)).toEqual(R.add(R.mul(a, c), R.mul(b, c)));
  });
  it('computes a module-LWE residual exactly', () => {
    const A = [[R.poly([1]), R.poly([2])]];
    const s = [R.poly([3]), R.poly([4])];
    const e = [R.poly([5])];
    expect(moduleLweSample(R, A, s, e)).toEqual([R.poly([16])]);
  });
  it('computes a zero syndrome for a codeword', () => {
    const H = [[R.poly([1]), R.poly([16])]];
    expect(syndrome(R, H, [R.poly([2]), R.poly([2])])).toEqual([R.poly([0])]);
  });
  it('rejects malformed polynomials and dimensions', () => {
    expect(() => R.mul([1], [1, 2, 3, 4])).toThrow();
    expect(() => R.dot([R.poly()], [])).toThrow();
  });
});
