import {arc as d3arc} from "d3-shape";
import {define} from "../../core/shape/define.js";

// Draws the wedges of cm.polar around the center cx and cy, with d3.arc, which also rounds the
// corners with cornerRadius and separates the wedges with padAngle. The channels follow the
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
  } = value;
  const path = d3arc()
    .startAngle((i) => X[i])
    .endAngle((i) => X1[i])
    .innerRadius((i) => Y1[i])
    .outerRadius((i) => Y[i])
    .padAngle((i) => PA[i] ?? 0)
    .cornerRadius((i) => CR[i] ?? 0);
  for (const i of I) {
    renderer.path({
      x: CX[i],
      y: CY[i],
      d: path(i),
      stroke: S[i],
      fill: F[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
      strokeWidth: SW[i],
    });
  }
});
