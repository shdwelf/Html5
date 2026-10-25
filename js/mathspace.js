// KeyViewer math library — trigonometry, geometry and complex numbers.
//
// Pure functions plus the compendium data the viewer renders. Every
// identity carries executable lhs/rhs forms and every geometry formula a
// compute() with a worked sample, so tests/keyviewer.test.mjs can verify
// the whole compendium numerically instead of trusting the printed text.
// Content is standard mathematics, cross-checked against the public-domain
// texts cited in keyviewer.html (Blackburn, Gutenberg #32973; Singmaster,
// archive.org planetrigonomet01lonegoog; Hobson, 7th ed. 1928). Nothing is
// fetched at runtime and no text is copied from those works.

export const TAU = Math.PI * 2;
export const deg2rad = (d) => (d * Math.PI) / 180;
export const rad2deg = (r) => (r * 180) / Math.PI;
export const normDeg = (d) => ((d % 360) + 360) % 360;
export const sind = (d) => Math.sin(deg2rad(d));
export const cosd = (d) => Math.cos(deg2rad(d));
export const tand = (d) => Math.tan(deg2rad(d));

/* ------------------------------------------------- special-angle table */
const SQ = "√"; // √
export const SPECIAL_ANGLES = [
  { deg: 0, sin: "0", cos: "1", tan: "0" },
  { deg: 30, sin: "1/2", cos: `${SQ}3/2`, tan: `1/${SQ}3` },
  { deg: 45, sin: `${SQ}2/2`, cos: `${SQ}2/2`, tan: "1" },
  { deg: 60, sin: `${SQ}3/2`, cos: "1/2", tan: SQ + "3" },
  { deg: 90, sin: "1", cos: "0", tan: "undefined" },
  { deg: 120, sin: `${SQ}3/2`, cos: "-1/2", tan: "-" + SQ + "3" },
  { deg: 135, sin: `${SQ}2/2`, cos: `-${SQ}2/2`, tan: "-1" },
  { deg: 150, sin: "1/2", cos: `-${SQ}3/2`, tan: `-1/${SQ}3` },
  { deg: 180, sin: "0", cos: "-1", tan: "0" },
  { deg: 210, sin: "-1/2", cos: `-${SQ}3/2`, tan: `1/${SQ}3` },
  { deg: 225, sin: `-${SQ}2/2`, cos: `-${SQ}2/2`, tan: "1" },
  { deg: 240, sin: `-${SQ}3/2`, cos: "-1/2", tan: SQ + "3" },
  { deg: 270, sin: "-1", cos: "0", tan: "undefined" },
  { deg: 300, sin: `-${SQ}3/2`, cos: "1/2", tan: "-" + SQ + "3" },
  { deg: 315, sin: `-${SQ}2/2`, cos: `${SQ}2/2`, tan: "-1" },
  { deg: 330, sin: "-1/2", cos: `${SQ}3/2`, tan: `-1/${SQ}3` },
];

/* ------------------------------------------------------- identities */
// Each entry: lhs(a, b) and rhs(a, b) in radians (b unused for one-angle
// forms). Tests evaluate both at several (a, b) pairs and require
// agreement to 1e-9, so a typo in the printed form fails the suite.
const SIN = Math.sin, COS = Math.cos, TAN = Math.tan;
export const TRIG_IDENTITIES = [
  { family: "Pythagorean", name: "Pythagorean identity", display: "sin²θ + cos²θ = 1", lhs: (a) => SIN(a) ** 2 + COS(a) ** 2, rhs: () => 1 },
  { family: "Pythagorean", name: "Tangent form", display: "1 + tan²θ = sec²θ", lhs: (a) => 1 + TAN(a) ** 2, rhs: (a) => 1 / COS(a) ** 2 },
  { family: "Pythagorean", name: "Cotangent form", display: "1 + cot²θ = csc²θ", lhs: (a) => 1 + 1 / TAN(a) ** 2, rhs: (a) => 1 / SIN(a) ** 2 },
  { family: "Fundamental", name: "Tangent as quotient", display: "tanθ = sinθ / cosθ", lhs: (a) => TAN(a), rhs: (a) => SIN(a) / COS(a) },
  { family: "Fundamental", name: "Reciprocal pair", display: "sinθ · cscθ = 1", lhs: (a) => SIN(a) * (1 / SIN(a)), rhs: () => 1 },
  { family: "Even–odd", name: "Sine is odd", display: "sin(−θ) = −sinθ", lhs: (a) => SIN(-a), rhs: (a) => -SIN(a) },
  { family: "Even–odd", name: "Cosine is even", display: "cos(−θ) = cosθ", lhs: (a) => COS(-a), rhs: (a) => COS(a) },
  { family: "Even–odd", name: "Tangent is odd", display: "tan(−θ) = −tanθ", lhs: (a) => TAN(-a), rhs: (a) => -TAN(a) },
  { family: "Cofunction", name: "Sine of complement", display: "sin(π/2 − θ) = cosθ", lhs: (a) => SIN(Math.PI / 2 - a), rhs: (a) => COS(a) },
  { family: "Cofunction", name: "Cosine of complement", display: "cos(π/2 − θ) = sinθ", lhs: (a) => COS(Math.PI / 2 - a), rhs: (a) => SIN(a) },
  { family: "Cofunction", name: "Tangent of complement", display: "tan(π/2 − θ) = cotθ", lhs: (a) => TAN(Math.PI / 2 - a), rhs: (a) => 1 / TAN(a) },
  { family: "Angle sum", name: "Sine of sum", display: "sin(α+β) = sinα·cosβ + cosα·sinβ", lhs: (a, b) => SIN(a + b), rhs: (a, b) => SIN(a) * COS(b) + COS(a) * SIN(b) },
  { family: "Angle sum", name: "Sine of difference", display: "sin(α−β) = sinα·cosβ − cosα·sinβ", lhs: (a, b) => SIN(a - b), rhs: (a, b) => SIN(a) * COS(b) - COS(a) * SIN(b) },
  { family: "Angle sum", name: "Cosine of sum", display: "cos(α+β) = cosα·cosβ − sinα·sinβ", lhs: (a, b) => COS(a + b), rhs: (a, b) => COS(a) * COS(b) - SIN(a) * SIN(b) },
  { family: "Angle sum", name: "Cosine of difference", display: "cos(α−β) = cosα·cosβ + sinα·sinβ", lhs: (a, b) => COS(a - b), rhs: (a, b) => COS(a) * COS(b) + SIN(a) * SIN(b) },
  { family: "Angle sum", name: "Tangent of sum", display: "tan(α+β) = (tanα + tanβ) / (1 − tanα·tanβ)", lhs: (a, b) => TAN(a + b), rhs: (a, b) => (TAN(a) + TAN(b)) / (1 - TAN(a) * TAN(b)) },
  { family: "Angle sum", name: "Tangent of difference", display: "tan(α−β) = (tanα − tanβ) / (1 + tanα·tanβ)", lhs: (a, b) => TAN(a - b), rhs: (a, b) => (TAN(a) - TAN(b)) / (1 + TAN(a) * TAN(b)) },
  { family: "Multiple angle", name: "Double-angle sine", display: "sin2θ = 2·sinθ·cosθ", lhs: (a) => SIN(2 * a), rhs: (a) => 2 * SIN(a) * COS(a) },
  { family: "Multiple angle", name: "Double-angle cosine", display: "cos2θ = cos²θ − sin²θ", lhs: (a) => COS(2 * a), rhs: (a) => COS(a) ** 2 - SIN(a) ** 2 },
  { family: "Multiple angle", name: "Double-angle cosine (cos form)", display: "cos2θ = 2cos²θ − 1", lhs: (a) => COS(2 * a), rhs: (a) => 2 * COS(a) ** 2 - 1 },
  { family: "Multiple angle", name: "Double-angle cosine (sin form)", display: "cos2θ = 1 − 2sin²θ", lhs: (a) => COS(2 * a), rhs: (a) => 1 - 2 * SIN(a) ** 2 },
  { family: "Multiple angle", name: "Double-angle tangent", display: "tan2θ = 2tanθ / (1 − tan²θ)", lhs: (a) => TAN(2 * a), rhs: (a) => (2 * TAN(a)) / (1 - TAN(a) ** 2) },
  { family: "Multiple angle", name: "Triple-angle sine", display: "sin3θ = 3sinθ − 4sin³θ", lhs: (a) => SIN(3 * a), rhs: (a) => 3 * SIN(a) - 4 * SIN(a) ** 3 },
  { family: "Multiple angle", name: "Triple-angle cosine", display: "cos3θ = 4cos³θ − 3cosθ", lhs: (a) => COS(3 * a), rhs: (a) => 4 * COS(a) ** 3 - 3 * COS(a) },
  { family: "Half-angle & power", name: "Power reduction (sine)", display: "sin²θ = (1 − cos2θ) / 2", lhs: (a) => SIN(a) ** 2, rhs: (a) => (1 - COS(2 * a)) / 2 },
  { family: "Half-angle & power", name: "Power reduction (cosine)", display: "cos²θ = (1 + cos2θ) / 2", lhs: (a) => COS(a) ** 2, rhs: (a) => (1 + COS(2 * a)) / 2 },
  { family: "Half-angle & power", name: "Half-angle tangent I", display: "tan(θ/2) = (1 − cosθ) / sinθ", lhs: (a) => TAN(a / 2), rhs: (a) => (1 - COS(a)) / SIN(a) },
  { family: "Half-angle & power", name: "Half-angle tangent II", display: "tan(θ/2) = sinθ / (1 + cosθ)", lhs: (a) => TAN(a / 2), rhs: (a) => SIN(a) / (1 + COS(a)) },
  { family: "Product & sum", name: "Product to sum (sin·cos)", display: "sinα·cosβ = ½[sin(α+β) + sin(α−β)]", lhs: (a, b) => SIN(a) * COS(b), rhs: (a, b) => 0.5 * (SIN(a + b) + SIN(a - b)) },
  { family: "Product & sum", name: "Product to sum (cos·cos)", display: "cosα·cosβ = ½[cos(α−β) + cos(α+β)]", lhs: (a, b) => COS(a) * COS(b), rhs: (a, b) => 0.5 * (COS(a - b) + COS(a + b)) },
  { family: "Product & sum", name: "Product to sum (sin·sin)", display: "sinα·sinβ = ½[cos(α−β) − cos(α+β)]", lhs: (a, b) => SIN(a) * SIN(b), rhs: (a, b) => 0.5 * (COS(a - b) - COS(a + b)) },
  { family: "Product & sum", name: "Sum to product (sines)", display: "sinα + sinβ = 2·sin((α+β)/2)·cos((α−β)/2)", lhs: (a, b) => SIN(a) + SIN(b), rhs: (a, b) => 2 * SIN((a + b) / 2) * COS((a - b) / 2) },
  { family: "Product & sum", name: "Sum to product (cosines)", display: "cosα + cosβ = 2·cos((α+β)/2)·cos((α−β)/2)", lhs: (a, b) => COS(a) + COS(b), rhs: (a, b) => 2 * COS((a + b) / 2) * COS((a - b) / 2) },
  { family: "Product & sum", name: "Difference of cosines", display: "cosα − cosβ = −2·sin((α+β)/2)·sin((α−β)/2)", lhs: (a, b) => COS(a) - COS(b), rhs: (a, b) => -2 * SIN((a + b) / 2) * SIN((a - b) / 2) },
  { family: "Shifts", name: "Supplementary sine", display: "sin(π − θ) = sinθ", lhs: (a) => SIN(Math.PI - a), rhs: (a) => SIN(a) },
  { family: "Shifts", name: "Supplementary cosine", display: "cos(π − θ) = −cosθ", lhs: (a) => COS(Math.PI - a), rhs: (a) => -COS(a) },
  { family: "Shifts", name: "Half-turn sine", display: "sin(π + θ) = −sinθ", lhs: (a) => SIN(Math.PI + a), rhs: (a) => -SIN(a) },
  { family: "Shifts", name: "Quarter-turn sine", display: "sin(π/2 + θ) = cosθ", lhs: (a) => SIN(Math.PI / 2 + a), rhs: (a) => COS(a) },
  { family: "Shifts", name: "Full period", display: "sin(θ + 2π) = sinθ", lhs: (a) => SIN(a + TAU), rhs: (a) => SIN(a) },
];

/* ------------------------------------------------- geometry formulas */
// Every entry is executable: compute() over named inputs + a worked
// sample whose expected value the test suite reproduces. Angles are in
// degrees wherever a variable is named like an angle (A, C, theta).
export const GEOMETRY_FORMULAS = [
  { family: "Triangles", name: "Triangle area (base × height)", display: "A = ½·b·h", inputs: ["b", "h"], compute: ({ b, h }) => 0.5 * b * h, sample: { b: 10, h: 4 }, expect: 20 },
  { family: "Triangles", name: "Triangle area (two sides + included angle)", display: "A = ½·a·b·sinC", inputs: ["a", "b", "C"], compute: ({ a, b, C }) => 0.5 * a * b * sind(C), sample: { a: 5, b: 6, C: 90 }, expect: 15 },
  { family: "Triangles", name: "Triangle area (Heron)", display: "A = √[s(s−a)(s−b)(s−c)], s = (a+b+c)/2", inputs: ["a", "b", "c"], compute: ({ a, b, c }) => { const s = (a + b + c) / 2; return Math.sqrt(s * (s - a) * (s - b) * (s - c)); }, sample: { a: 3, b: 4, c: 5 }, expect: 6 },
  { family: "Triangles", name: "Equilateral triangle area", display: "A = (√3/4)·s²", inputs: ["s"], compute: ({ s }) => (Math.sqrt(3) / 4) * s * s, sample: { s: 2 }, expect: 1.7320508075688772 },
  { family: "Triangles", name: "Law of cosines", display: "c = √(a² + b² − 2ab·cosC)", inputs: ["a", "b", "C"], compute: ({ a, b, C }) => Math.sqrt(a * a + b * b - 2 * a * b * cosd(C)), sample: { a: 3, b: 4, C: 90 }, expect: 5 },
  { family: "Triangles", name: "Law of sines ratio", display: "a / sinA", inputs: ["a", "A"], compute: ({ a, A }) => a / sind(A), sample: { a: 10, A: 30 }, expect: 20 },
  { family: "Triangles", name: "Inradius from sides", display: "r = A / s (A by Heron)", inputs: ["a", "b", "c"], compute: ({ a, b, c }) => { const s = (a + b + c) / 2; return Math.sqrt(s * (s - a) * (s - b) * (s - c)) / s; }, sample: { a: 3, b: 4, c: 5 }, expect: 1 },
  { family: "Triangles", name: "Circumradius from sides", display: "R = abc / (4A) (A by Heron)", inputs: ["a", "b", "c"], compute: ({ a, b, c }) => { const s = (a + b + c) / 2; return (a * b * c) / (4 * Math.sqrt(s * (s - a) * (s - b) * (s - c))); }, sample: { a: 3, b: 4, c: 5 }, expect: 2.5 },
  { family: "Right triangles", name: "Pythagoras (hypotenuse)", display: "c = √(a² + b²)", inputs: ["a", "b"], compute: ({ a, b }) => Math.hypot(a, b), sample: { a: 3, b: 4 }, expect: 5 },
  { family: "Right triangles", name: "Pythagoras (leg)", display: "b = √(c² − a²)", inputs: ["c", "a"], compute: ({ c, a }) => Math.sqrt(c * c - a * a), sample: { c: 5, a: 3 }, expect: 4 },
  { family: "Quadrilaterals", name: "Square area", display: "A = s²", inputs: ["s"], compute: ({ s }) => s * s, sample: { s: 7 }, expect: 49 },
  { family: "Quadrilaterals", name: "Square perimeter", display: "P = 4s", inputs: ["s"], compute: ({ s }) => 4 * s, sample: { s: 7 }, expect: 28 },
  { family: "Quadrilaterals", name: "Rectangle area", display: "A = l·w", inputs: ["l", "w"], compute: ({ l, w }) => l * w, sample: { l: 8, w: 5 }, expect: 40 },
  { family: "Quadrilaterals", name: "Parallelogram area", display: "A = b·h", inputs: ["b", "h"], compute: ({ b, h }) => b * h, sample: { b: 7, h: 3 }, expect: 21 },
  { family: "Quadrilaterals", name: "Trapezoid area", display: "A = ½(a + b)·h", inputs: ["a", "b", "h"], compute: ({ a, b, h }) => 0.5 * (a + b) * h, sample: { a: 4, b: 6, h: 5 }, expect: 25 },
  { family: "Quadrilaterals", name: "Rhombus / kite area", display: "A = ½·d₁·d₂", inputs: ["d1", "d2"], compute: ({ d1, d2 }) => 0.5 * d1 * d2, sample: { d1: 6, d2: 8 }, expect: 24 },
  { family: "Polygons", name: "Interior angle sum", display: "Σ = (n − 2)·180°", inputs: ["n"], compute: ({ n }) => (n - 2) * 180, sample: { n: 5 }, expect: 540 },
  { family: "Polygons", name: "Regular polygon interior angle", display: "θ = (n − 2)·180° / n", inputs: ["n"], compute: ({ n }) => ((n - 2) * 180) / n, sample: { n: 6 }, expect: 120 },
  { family: "Polygons", name: "Regular polygon area (side)", display: "A = n·s² / (4·tan(180°/n))", inputs: ["n", "s"], compute: ({ n, s }) => (n * s * s) / (4 * tand(180 / n)), sample: { n: 6, s: 2 }, expect: 10.392304845413264 },
  { family: "Polygons", name: "Polygon area (perimeter × apothem)", display: "A = ½·P·a", inputs: ["P", "a"], compute: ({ P, a }) => 0.5 * P * a, sample: { P: 30, a: 4 }, expect: 60 },
  { family: "Polygons", name: "Pick's theorem (lattice area)", display: "A = I + B/2 − 1", inputs: ["I", "B"], compute: ({ I, B }) => I + B / 2 - 1, sample: { I: 8, B: 6 }, expect: 10 },
  { family: "Circles", name: "Circumference", display: "C = 2πr", inputs: ["r"], compute: ({ r }) => TAU * r, sample: { r: 3 }, expect: 18.84955592153876 },
  { family: "Circles", name: "Circle area", display: "A = πr²", inputs: ["r"], compute: ({ r }) => Math.PI * r * r, sample: { r: 3 }, expect: 28.274333882308138 },
  { family: "Circles", name: "Arc length", display: "L = (θ/360°)·2πr", inputs: ["theta", "r"], compute: ({ theta, r }) => (theta / 360) * TAU * r, sample: { theta: 90, r: 2 }, expect: 3.141592653589793 },
  { family: "Circles", name: "Sector area", display: "A = (θ/360°)·πr²", inputs: ["theta", "r"], compute: ({ theta, r }) => (theta / 360) * Math.PI * r * r, sample: { theta: 90, r: 2 }, expect: 3.141592653589793 },
  { family: "Circles", name: "Segment area", display: "A = ½r²(θrad − sinθ)", inputs: ["theta", "r"], compute: ({ theta, r }) => 0.5 * r * r * (deg2rad(theta) - sind(theta)), sample: { theta: 90, r: 2 }, expect: 1.1415926535897931 },
  { family: "Circles", name: "Annulus area", display: "A = π(R² − r²)", inputs: ["R", "r"], compute: ({ R, r }) => Math.PI * (R * R - r * r), sample: { R: 3, r: 2 }, expect: 15.707963267948966 },
  { family: "Circles", name: "Ellipse area", display: "A = πab", inputs: ["a", "b"], compute: ({ a, b }) => Math.PI * a * b, sample: { a: 3, b: 2 }, expect: 18.84955592153876 },
  { family: "Circles", name: "Ellipse circumference (Ramanujan, approximation)", display: "C ≈ π[3(a+b) − √((3a+b)(a+3b))]", inputs: ["a", "b"], compute: ({ a, b }) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))), sample: { a: 3, b: 2 }, expect: 15.865437575563961 },
  { family: "Analytic", name: "Distance between points", display: "d = √((x₂−x₁)² + (y₂−y₁)²)", inputs: ["x1", "y1", "x2", "y2"], compute: ({ x1, y1, x2, y2 }) => Math.hypot(x2 - x1, y2 - y1), sample: { x1: 0, y1: 0, x2: 3, y2: 4 }, expect: 5 },
  { family: "Analytic", name: "Slope", display: "m = (y₂ − y₁) / (x₂ − x₁)", inputs: ["x1", "y1", "x2", "y2"], compute: ({ x1, y1, x2, y2 }) => (y2 - y1) / (x2 - x1), sample: { x1: 1, y1: 2, x2: 3, y2: 6 }, expect: 2 },
  { family: "Analytic", name: "Ellipse focal distance", display: "c = √(a² − b²) (a > b)", inputs: ["a", "b"], compute: ({ a, b }) => Math.sqrt(a * a - b * b), sample: { a: 5, b: 3 }, expect: 4 },
  { family: "Analytic", name: "Hyperbola focal distance", display: "c = √(a² + b²)", inputs: ["a", "b"], compute: ({ a, b }) => Math.sqrt(a * a + b * b), sample: { a: 3, b: 4 }, expect: 5 },
  { family: "Analytic", name: "Conic eccentricity", display: "e = c / a (ellipse < 1, parabola = 1, hyperbola > 1)", inputs: ["c", "a"], compute: ({ c, a }) => c / a, sample: { c: 4, a: 5 }, expect: 0.8 },
  { family: "Solids", name: "Cube volume", display: "V = s³", inputs: ["s"], compute: ({ s }) => s ** 3, sample: { s: 3 }, expect: 27 },
  { family: "Solids", name: "Cube surface area", display: "SA = 6s²", inputs: ["s"], compute: ({ s }) => 6 * s * s, sample: { s: 3 }, expect: 54 },
  { family: "Solids", name: "Cuboid volume", display: "V = l·w·h", inputs: ["l", "w", "h"], compute: ({ l, w, h }) => l * w * h, sample: { l: 2, w: 3, h: 4 }, expect: 24 },
  { family: "Solids", name: "Cuboid surface area", display: "SA = 2(lw + wh + hl)", inputs: ["l", "w", "h"], compute: ({ l, w, h }) => 2 * (l * w + w * h + h * l), sample: { l: 2, w: 3, h: 4 }, expect: 52 },
  { family: "Solids", name: "Cylinder volume", display: "V = πr²h", inputs: ["r", "h"], compute: ({ r, h }) => Math.PI * r * r * h, sample: { r: 2, h: 5 }, expect: 62.83185307179586 },
  { family: "Solids", name: "Cylinder surface area", display: "SA = 2πr(r + h)", inputs: ["r", "h"], compute: ({ r, h }) => TAU * r * (r + h), sample: { r: 2, h: 5 }, expect: 87.96459430051421 },
  { family: "Solids", name: "Cone volume", display: "V = ⅓πr²h", inputs: ["r", "h"], compute: ({ r, h }) => (Math.PI * r * r * h) / 3, sample: { r: 3, h: 4 }, expect: 37.69911184307752 },
  { family: "Solids", name: "Cone slant height", display: "l = √(r² + h²)", inputs: ["r", "h"], compute: ({ r, h }) => Math.hypot(r, h), sample: { r: 3, h: 4 }, expect: 5 },
  { family: "Solids", name: "Cone lateral area", display: "A = πrl", inputs: ["r", "l"], compute: ({ r, l }) => Math.PI * r * l, sample: { r: 3, l: 5 }, expect: 47.1238898038469 },
  { family: "Solids", name: "Cone frustum volume", display: "V = (πh/3)(R² + Rr + r²)", inputs: ["h", "R", "r"], compute: ({ h, R, r }) => ((Math.PI * h) / 3) * (R * R + R * r + r * r), sample: { h: 3, R: 4, r: 2 }, expect: 87.96459430051421 },
  { family: "Solids", name: "Sphere volume", display: "V = (4/3)πr³", inputs: ["r"], compute: ({ r }) => (4 / 3) * Math.PI * r ** 3, sample: { r: 3 }, expect: 113.09733552923255 },
  { family: "Solids", name: "Sphere surface area", display: "SA = 4πr²", inputs: ["r"], compute: ({ r }) => 4 * Math.PI * r * r, sample: { r: 3 }, expect: 113.09733552923255 },
  { family: "Solids", name: "Spherical cap volume", display: "V = (πh²/3)(3r − h)", inputs: ["r", "h"], compute: ({ r, h }) => ((Math.PI * h * h) / 3) * (3 * r - h), sample: { r: 5, h: 2 }, expect: 54.45427266222307 },
  { family: "Solids", name: "Pyramid volume", display: "V = ⅓·B·h", inputs: ["B", "h"], compute: ({ B, h }) => (B * h) / 3, sample: { B: 12, h: 6 }, expect: 24 },
  { family: "Solids", name: "Prism volume", display: "V = B·h", inputs: ["B", "h"], compute: ({ B, h }) => B * h, sample: { B: 10, h: 7 }, expect: 70 },
  { family: "Solids", name: "Torus volume", display: "V = 2π²Rr²", inputs: ["R", "r"], compute: ({ R, r }) => 2 * Math.PI * Math.PI * R * r * r, sample: { R: 5, r: 1 }, expect: 98.69604401089359 },
  { family: "Solids", name: "Torus surface area", display: "SA = 4π²Rr", inputs: ["R", "r"], compute: ({ R, r }) => 4 * Math.PI * Math.PI * R * r, sample: { R: 5, r: 1 }, expect: 197.39208802178717 },
];

/* Platonic solids — Euler's formula V − E + F = 2 holds for every row;
   the test suite checks it per row. */
export const PLATONIC_SOLIDS = [
  { name: "Tetrahedron", faces: 4, vertices: 4, edges: 6, face: "triangle" },
  { name: "Cube (hexahedron)", faces: 6, vertices: 8, edges: 12, face: "square" },
  { name: "Octahedron", faces: 8, vertices: 6, edges: 12, face: "triangle" },
  { name: "Dodecahedron", faces: 12, vertices: 20, edges: 30, face: "pentagon" },
  { name: "Icosahedron", faces: 20, vertices: 12, edges: 30, face: "triangle" },
];

/* --------------------------------------------------- triangle solver */
// Accepts any consistent known set among {a,b,c,A,B,C} (sides lower-case,
// angles upper-case, degrees): SSS, SAS, ASA/AAS, or SSA. SSA is the
// ambiguous case and honestly returns 0, 1 or 2 solutions. Each solution
// carries sides, angles, area, perimeter, circumradius R, inradius r.
export function solveTriangle(known) {
  const EPS = 1e-12;
  const has = (k) => typeof known[k] === "number" && Number.isFinite(known[k]);
  const sides = ["a", "b", "c"].filter(has);
  const angles = ["A", "B", "C"].filter(has);
  const finish = (a, b, c, A, B, C) => {
    const s = (a + b + c) / 2;
    const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    return { a, b, c, A, B, C, area, perimeter: a + b + c, R: (a * b * c) / (4 * area), r: area / s };
  };
  const fromAnglesSides = (A, B, C, sideKey, sideVal) => {
    // side = k·sin(opposite angle); recover k from the known side.
    const k = sideVal / sind(sideKey === "a" ? A : sideKey === "b" ? B : C);
    return finish(k * sind(A), k * sind(B), k * sind(C), A, B, C);
  };

  if (sides.length === 3) {
    const { a, b, c } = known;
    if (a + b <= c || a + c <= b || b + c <= a) return [];
    const C = rad2deg(Math.acos((a * a + b * b - c * c) / (2 * a * b)));
    const A = rad2deg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
    return [finish(a, b, c, A, 180 - A - C, C)];
  }
  if (sides.length === 2 && angles.length === 1) {
    const angKey = angles[0];
    const ang = known[angKey];
    const missSide = ["a", "b", "c"].find((k) => !has(k));
    const incSides = ["a", "b", "c"].filter(has);
    // Included angle? The known angle must sit between the two known sides:
    // angle A is between sides b,c; B between a,c; C between a,b.
    const between = { A: ["b", "c"], B: ["a", "c"], C: ["a", "b"] }[angKey];
    const included = between.every((k) => incSides.includes(k));
    if (included) {
      const [x, y] = between.map((k) => known[k]);
      const z = Math.sqrt(x * x + y * y - 2 * x * y * cosd(ang));
      const full = { ...known, [missSide]: z };
      return solveTriangle(full);
    }
    // SSA: known angle opposite one of the known sides.
    const oppKey = angKey.toLowerCase();
    if (!has(oppKey)) return []; // angle not opposite a known side — underdetermined here
    const opp = known[oppKey];
    const otherKey = incSides.find((k) => k !== oppKey);
    const other = known[otherKey];
    const otherAngKey = otherKey.toUpperCase();
    const sinOther = (other * sind(ang)) / opp;
    if (sinOther > 1 + EPS) return [];
    const sols = [];
    const base = rad2deg(Math.asin(Math.min(1, sinOther)));
    // Right-angle boundary: sinOther within float noise of 1 is ONE
    // solution (B = 90°), not two near-identical ones.
    const cand = Math.abs(base - 90) < 1e-4 ? [90] : [base, 180 - base];
    for (const oAng of cand) {
      if (oAng <= 0 || ang + oAng >= 180 - 1e-9) continue;
      const thirdAng = 180 - ang - oAng;
      const spec = { A: 0, B: 0, C: 0 };
      spec[angKey] = ang; spec[otherAngKey] = oAng;
      const thirdKey = ["A", "B", "C"].find((k) => k !== angKey && k !== otherAngKey);
      spec[thirdKey] = thirdAng;
      const sol = fromAnglesSides(spec.A, spec.B, spec.C, oppKey, opp);
      // dedupe the right-angle double-count
      if (!sols.some((s) => Math.abs(s[otherAngKey] - oAng) < 1e-9)) sols.push(sol);
    }
    return sols;
  }
  if (sides.length === 1 && angles.length === 2) {
    const sum = angles.reduce((t, k) => t + known[k], 0);
    if (sum >= 180) return [];
    const thirdKey = ["A", "B", "C"].find((k) => !has(k));
    const spec = { ...known, [thirdKey]: 180 - sum };
    const sideKey = sides[0];
    return [fromAnglesSides(spec.A, spec.B, spec.C, sideKey, known[sideKey])];
  }
  return [];
}

/* ------------------------------------------------------ complex plane */
// “Unreal” numbers: i = √−1, i² = −1, powers cycle i, −1, −i, 1.
export const C = {
  add: (z, w) => ({ re: z.re + w.re, im: z.im + w.im }),
  sub: (z, w) => ({ re: z.re - w.re, im: z.im - w.im }),
  mul: (z, w) => ({ re: z.re * w.re - z.im * w.im, im: z.re * w.im + z.im * w.re }),
  div: (z, w) => {
    const d = w.re * w.re + w.im * w.im;
    if (d === 0) throw new Error("division by 0 + 0i");
    return { re: (z.re * w.re + z.im * w.im) / d, im: (z.im * w.re - z.re * w.im) / d };
  },
  conj: (z) => ({ re: z.re, im: -z.im }),
  abs: (z) => Math.hypot(z.re, z.im),
  argDeg: (z) => normDeg(rad2deg(Math.atan2(z.im, z.re))),
  fromPolar: (modulus, deg) => ({ re: modulus * cosd(deg), im: modulus * sind(deg) }),
  pow: (z, n) => { // integer powers via De Moivre
    if (!Number.isInteger(n)) throw new Error("pow here takes an integer exponent; use roots for fractions");
    if (n === 0) return { re: 1, im: 0 };
    const m = C.abs(z) ** n;
    const a = deg2rad(C.argDeg(z)) * n;
    return { re: m * Math.cos(a), im: m * Math.sin(a) };
  },
  roots: (z, n) => { // all n nth roots, principal first
    if (!Number.isInteger(n) || n < 1) throw new Error("roots needs a positive integer n");
    const m = C.abs(z) ** (1 / n);
    const a0 = deg2rad(C.argDeg(z));
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = (a0 + TAU * k) / n;
      out.push({ re: m * Math.cos(a), im: m * Math.sin(a) });
    }
    return out;
  },
  euler: (deg) => ({ re: cosd(deg), im: sind(deg) }), // e^{iθ}
  format: (z) => {
    const r = (x) => {
      const v = Math.abs(x) < 1e-12 ? 0 : x;
      return String(Math.round(v * 1e10) / 1e10);
    };
    if (z.im === 0) return r(z.re);
    if (z.re === 0) return z.im === 1 ? "i" : z.im === -1 ? "-i" : `${r(z.im)}i`;
    return `${r(z.re)} ${z.im < 0 ? "−" : "+"} ${Math.abs(z.im) === 1 ? "" : r(Math.abs(z.im))}i`;
  },
};
export const iPow = (n) => [{ re: 1, im: 0 }, { re: 0, im: 1 }, { re: -1, im: 0 }, { re: 0, im: -1 }][((n % 4) + 4) % 4];
