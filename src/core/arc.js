import {arc} from "d3-shape";

const wedge = arc()
  .startAngle((d) => d.startAngle)
  .endAngle((d) => d.endAngle)
  .innerRadius((d) => d.innerRadius)
  .outerRadius((d) => d.outerRadius)
  .padAngle((d) => d.padAngle)
  .cornerRadius((d) => d.cornerRadius);

// The path of an arc, a wedge around x and y between two radii, from its start angle to its end
// angle, clockwise from 12 o'clock, with d3.arc; sweep draws a fraction of it from its start angle,
// such as 0 for none, so that a wedge can open like a wheel. Renderers that draw paths draw arcs as
// paths, while transitions keep their numbers, so that arcs interpolate in angle and radius.
export function arcPath({
  x = 0,
  y = 0,
  innerRadius = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
  padAngle = 0,
  cornerRadius = 0,
  sweep = 1,
  ...options
}) {
  const end = startAngle + (endAngle - startAngle) * sweep;
  const d = wedge({innerRadius, outerRadius, startAngle, endAngle: end, padAngle, cornerRadius});
  return {...options, x, y, d};
}
