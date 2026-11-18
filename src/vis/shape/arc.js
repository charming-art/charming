import {define} from "../../core/shape/define.js";

// Draws the wedges of cm.polar around the center cx and cy, as arcs, drawn with d3.arc, which also
// rounds the corners with cornerRadius and separates the wedges with padAngle; sweep draws a
// fraction of a wedge from its start angle, such as enter: {sweep: 0} for a wedge that opens like
// a wheel. As arcs, wedges interpolate in angle and radius. The channels follow the
// positions of cm.polar:
// - x and x1 are the angles of the wedge, clockwise from 12 o'clock, in either order: a band of
//   cm.spreadX goes from x to x1, and a stack of cm.stackX from x1 to x, so its sweep is negative.
// - y is the outer radius and y1 the inner radius, its baseline, as in cm.stackY and cm.spreadX.
export const arc = define((renderer, I, value) => {
  const {
    x: X = [],
    x1: X1 = X,
    y: Y = [],
    y1: Y1 = Y,
    cx: CX = [],
    cy: CY = [],
    fill: F = [],
    stroke: S = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
    strokeWidth: SW = [],
    padAngle: PA = [],
    cornerRadius: CR = [],
    sweep: SP = [],
  } = value;
  for (const i of I) {
    renderer.arc({
      x: CX[i],
      y: CY[i],
      startAngle: X[i],
      endAngle: X1[i],
      innerRadius: Y1[i],
      outerRadius: Y[i],
      padAngle: PA[i] ?? 0,
      cornerRadius: CR[i] ?? 0,
      ...(SP[i] !== undefined && {sweep: SP[i]}),
      stroke: S[i],
      fill: F[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
      strokeWidth: SW[i],
    });
  }
});
