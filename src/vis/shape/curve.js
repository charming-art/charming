import {InternMap} from "d3-array";
import {
  curveBasis,
  curveBasisClosed,
  curveBumpX,
  curveBumpY,
  curveCardinal,
  curveCardinalClosed,
  curveCatmullRom,
  curveCatmullRomClosed,
  curveLinear,
  curveLinearClosed,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
} from "d3-shape";
import {pathRound} from "d3-path";

// The curves, series and polar paths shared by the areas and lines.

// The curves of Plot, by name.
const curves = new Map([
  ["basis", curveBasis],
  ["basis-closed", curveBasisClosed],
  ["bump-x", curveBumpX],
  ["bump-y", curveBumpY],
  ["cardinal", curveCardinal],
  ["cardinal-closed", curveCardinalClosed],
  ["catmull-rom", curveCatmullRom],
  ["catmull-rom-closed", curveCatmullRomClosed],
  ["linear", curveLinear],
  ["linear-closed", curveLinearClosed],
  ["monotone-x", curveMonotoneX],
  ["monotone-y", curveMonotoneY],
  ["natural", curveNatural],
  ["step", curveStep],
  ["step-after", curveStepAfter],
  ["step-before", curveStepBefore],
]);

export function curveOf(curve = "linear") {
  return typeof curve === "function" ? curve : curves.get(`${curve}`.toLowerCase());
}

// The rows of each series, by z, else fill, else stroke, in order of first appearance.
export function seriesGroups(I, {z, fill, stroke}) {
  const Z = z ?? fill ?? stroke;
  if (!Z) return [I];
  const series = new InternMap();
  for (const i of I) {
    const k = Z[i];
    if (series.has(k)) series.get(k).push(i);
    else series.set(k, [i]);
  }
  return series.values();
}

// A path context that takes points as angle and radius, and draws them around (0, 0): lines are
// split into steps of at most 0.02 radians, so that they follow the circle, and curves are sampled,
// so that a curve such as "bump-x" bends along the angle, like a ribbon around a circle.
export function polarContext() {
  // Rounded to 3 decimals, like the paths of d3-shape, so that they don't depend on the last digit
  // of Math.sin and Math.cos, which varies across versions of Node.
  const path = pathRound(3);
  let a0, r0;
  const point = (a, r) => [r * Math.sin(a), -r * Math.cos(a)];
  const to = (a, r) => (path.lineTo(...point(a, r)), (a0 = a), (r0 = r));
  return {
    moveTo(a, r) {
      path.moveTo(...point(a, r));
      ((a0 = a), (r0 = r));
    },
    lineTo(a, r) {
      const n = Math.max(1, Math.ceil(Math.abs(a - a0) / 0.02));
      const [sa, sr] = [a0, r0];
      for (let k = 1; k <= n; k++) to(sa + ((a - sa) * k) / n, sr + ((r - sr) * k) / n);
    },
    bezierCurveTo(a1, r1, a2, r2, a, r) {
      // Control points can go past the ends, as for "natural" or "cardinal", so the steps cover the
      // whole span of the curve, in angle and in radius (a step per 2px).
      const A = [a0, a1, a2, a];
      const R = [r0, r1, r2, r];
      const da = Math.max(...A) - Math.min(...A);
      const dr = Math.max(...R) - Math.min(...R);
      const n = Math.max(8, Math.ceil(da / 0.02), Math.ceil(dr / 2));
      const [sa, sr] = [a0, r0];
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const u = 1 - t;
        const b = (p0, p1, p2, p3) => u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
        to(b(sa, a1, a2, a), b(sr, r1, r2, r));
      }
    },
    // d3.area closes an area at a single angle, so the closing edge is radial: a straight line.
    closePath() {
      path.closePath();
    },
    toString() {
      return path.toString();
    },
  };
}
