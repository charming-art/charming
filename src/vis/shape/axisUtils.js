import {scaleOf} from "../transform/scales.js";

// The helpers shared by the axes of cm.plane and cm.polar.

export const font = {fill: "currentColor", fontSize: 10, fontFamily: "system-ui, sans-serif"};

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
  const offset = scale.bandwidth ? scale.bandwidth() / 2 : 0;
  return (d) => scale(d) + offset;
}
