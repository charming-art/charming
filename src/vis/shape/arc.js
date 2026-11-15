import {arc as d3arc} from "d3-shape";
import {define} from "../../core/shape/define.js";

// Draws the wedges of cm.polar: from the angle x to x1, clockwise from 12 o'clock, and from the
// radius y to y1, around the center cx and cy. The path is built with d3.arc, which also rounds
// the corners with cornerRadius and separates the wedges with padAngle.
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
