import {scaleBand, scaleLinear, scalePoint, scaleUtc} from "d3-scale";

// The helpers shared by the axes of cm.plane and cm.polar.

export const font = {fill: "currentColor", fontSize: 10, fontFamily: "system-ui, sans-serif"};

// Rebuilds a d3 scale from a scale recorded by cm.plane, for its ticks and tick format.
export function scaleOf({scale, domain, range, paddingInner, paddingOuter, align}) {
  if (typeof scale === "function") return scale;
  if (scale === "band")
    return scaleBand(domain, range).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  if (scale === "point") return scalePoint(domain, range);
  if (scale === "utc") return scaleUtc(domain, range);
  return scaleLinear(domain, range);
}

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
