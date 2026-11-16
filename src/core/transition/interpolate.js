import {color} from "d3-color";
import * as eases from "d3-ease";
import {interpolateRgb} from "d3-interpolate";

// The default of an attribute that a primitive doesn't give, for interpolating to and from it.
const defaults = {fillOpacity: 1, strokeOpacity: 1};

// Interpolates the attributes of a primitive: numbers linearly, colors in RGB, and anything else,
// such as the d of a path or a text, jumps at the end.
export function interpolateAttrs(from, to) {
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  const fns = Array.from(keys, (key) => {
    // An attribute neither gives stays unset, as without transitions.
    if (from[key] === undefined && to[key] === undefined) return [key, () => undefined];
    const a = from[key] ?? defaults[key];
    const b = to[key] ?? defaults[key];
    if (typeof a === "number" && typeof b === "number") return [key, (t) => a + (b - a) * t];
    if (typeof a === "string" && typeof b === "string" && a !== b && color(a) && color(b)) {
      return [key, interpolateRgb(a, b)];
    }
    return [key, (t) => (t < 1 && a !== undefined ? a : b)];
  });
  return (t) => Object.fromEntries(fns.map(([key, f]) => [key, f(t)]));
}

// Interpolates the translations and rotations of a primitive, if they have the same structure,
// such as a group moving its children; otherwise they jump at the end.
export function interpolateOps(from, to) {
  const same = from.length === to.length && from.every((op, i) => op[0] === to[i][0]);
  if (!same) return (t) => (t < 1 ? from : to);
  return (t) => from.map((op, i) => op.map((v, j) => (j === 0 ? v : v + (to[i][j] - v) * t)));
}

// An easing function by name, such as "cubic-in-out" for d3's easeCubicInOut, or as given.
export function easeOf(ease) {
  if (typeof ease === "function") return ease;
  const name = `ease${`${ease}`.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`;
  const fn = eases[name];
  if (!fn) throw new Error(`Unknown ease: ${ease}.`);
  return fn;
}
