import {color} from "d3-color";
import * as eases from "d3-ease";
import {interpolateRgb} from "d3-interpolate";

// The default of an attribute that a primitive doesn't give, for interpolating to and from it.
const defaults = {fillOpacity: 1, strokeOpacity: 1};

// The attributes that are colors, which interpolate in RGB.
const paints = new Set(["fill", "stroke"]);

// Interpolates the attributes of a primitive: numbers linearly, colors in RGB, and anything else,
// such as the d of a path or a text, jumps at the end.
export function interpolateAttrs(from, to) {
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  const fns = Array.from(keys, (key) => {
    // An attribute neither gives stays unset, as without transitions.
    if (from[key] === undefined && to[key] === undefined) return [key, () => undefined];
    const a = from[key] ?? defaults[key];
    const b = to[key] ?? defaults[key];
    // A numeric text only interpolates with a format, which writes it; otherwise it switches at the end.
    if (key === "text" && !to.format) return [key, (t) => (t < 1 ? a : b)];
    if (typeof a === "number" && typeof b === "number") return [key, (t) => a + (b - a) * t];
    if (paints.has(key) && typeof a === "string" && typeof b === "string" && a !== b && color(a) && color(b)) {
      return [key, interpolateRgb(a, b)];
    }
    return [key, (t) => (t < 1 ? a : b)];
  });
  return (t) => Object.fromEntries(fns.map(([key, f]) => [key, f(t)]));
}

// Interpolates the translations and rotations of a primitive: the operations they share at the
// start, such as the translation of a group, interpolate, and the ones added or removed after them,
// such as a new rotation, jump at the end.
export function interpolateOps(from, to) {
  let shared = 0;
  while (shared < from.length && shared < to.length && from[shared][0] === to[shared][0]) shared++;
  return (t) => {
    if (t >= 1) return to;
    const ops = from.slice();
    for (let i = 0; i < shared; i++) {
      const a = from[i];
      const b = to[i];
      ops[i] = a.map((v, j) => (j === 0 ? v : v + (b[j] - v) * t));
    }
    return ops;
  };
}

// An easing function by name, such as "cubic-in-out" for d3's easeCubicInOut, or as given.
export function easeOf(ease) {
  if (typeof ease === "function") return ease;
  const name = `ease${`${ease}`.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`;
  const fn = eases[name];
  if (!fn) throw new Error(`Unknown ease: ${ease}.`);
  return fn;
}
