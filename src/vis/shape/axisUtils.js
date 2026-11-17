import {scaleOf} from "../transform/scales.js";

// The helpers shared by the axes of cm.plane and cm.polar.

export const font = {fill: "currentColor", fontSize: 10, fontFamily: "system-ui, sans-serif"};

// Tick marks are keyed by their values, so that transitions match ticks from render to render;
// dates by their times, as keys compare as strings, which drop milliseconds. The keys are set apart
// from the keys of marks, so that a mark whose group key is a tick's value splits from or merges
// into the mark keyed by it, not the tick.
export const key = (d) => `tick\0${d instanceof Date ? +d : d}`;

// The count of ticks: the ticks option if it's a number, or one tick per spacing pixels along the
// length of the axis, like Plot.
export function countOf({ticks}, length, spacing) {
  return typeof ticks === "number" ? ticks : length / spacing;
}

// Like Plot, the label of a continuous scale has an arrow for the direction of increasing values,
// unless the label is given explicitly or already has one.
export function labelOf({label, domain, range}, scale, axis, options) {
  if (options.label !== undefined) return options.label;
  if (label == null) return null;
  if (!scale.ticks || /[↑↓→←]/.test(label)) return `${label}`;
  const order = Math.sign(domain[domain.length - 1] - domain[0]) * Math.sign(range[range.length - 1] - range[0]);
  if (!order) return `${label}`;
  if (axis === "x") return order > 0 ? `${label} →` : `← ${label}`;
  return order < 0 ? `↑ ${label}` : `↓ ${label}`;
}

export {scaleOf};

export function ticksOf(scale, {ticks}, count) {
  if (Array.isArray(ticks)) return ticks;
  return scale.ticks ? scale.ticks(count) : scale.domain();
}

export function formatOf(scale, {tickFormat}, count) {
  if (typeof tickFormat === "function") return tickFormat;
  if (scale.tickFormat) return scale.tickFormat(count, tickFormat);
  return (d) => `${d}`;
}

// Ticks are at the middle of the bands of a band scale.
export function positionOf(scale) {
  if (scale.middle) return scale.middle; // bands of unequal widths, with flex
  const offset = scale.bandwidth ? scale.bandwidth() / 2 : 0;
  return (d) => scale(d) + offset;
}
