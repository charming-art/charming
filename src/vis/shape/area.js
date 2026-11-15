import {ascending} from "d3-array";
import {area as d3area} from "d3-shape";
import {define} from "../../core/shape/define.js";
import {curveOf, polarContext, seriesOf} from "./curve.js";

// The points of a series, sorted along the position it runs on, such as x for cm.areaY. A row with a
// band on that position, such as a bar of cm.spreadX, has a point at each edge, so that the area is
// flat across the bar and curved between bars, like a ribbon. The points are sorted, not the rows,
// so that the edges stay in order if the scale is reversed. Missing positions go last.
function pointsOf(I, P, P1, V, V1) {
  const points = [];
  for (const i of I) {
    points.push([P[i], V[i], V1[i]]);
    if (P1) points.push([P1[i], V[i], V1[i]]);
  }
  return points.sort(([a], [b]) => !isFinite(a) - !isFinite(b) || ascending(a, b));
}

const defined = ([x, y, y1]) => isFinite(x) && isFinite(y) && isFinite(y1);

// Draws one area per series: along the position p, from v1 to v, such as along x from y1 to y.
function drawArea(renderer, I, value, options, shape, [p, p1, v, v1], center) {
  const {
    [p]: P = [],
    [p1]: P1,
    [v]: V = [],
    // The baseline, such as y1, comes from cm.stackY or cm.spreadX; without it, the area is empty.
    [v1]: V1 = V,
    cx: CX = [],
    cy: CY = [],
    fill: F = [],
    stroke: S = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
    strokeWidth: SW = [],
  } = value;
  const path = shape.curve(curveOf(options.curve)).defined(defined);
  for (const series of seriesOf(I, value)) {
    const [i] = series;
    if (i === undefined) continue;
    renderer.path({
      ...(center && {x: CX[i], y: CY[i]}),
      d: path(pointsOf(series, P, P1, V, V1)),
      fill: F[i],
      stroke: S[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
      strokeWidth: SW[i],
    });
  }
}

// Draws one area per series along x, from y1 to y, such as the bands of a stacked area chart. Over
// the bands of cm.spreadX, it's flat across each bar, so that with curve "bump-x" it's a ribbon
// between bars. The curve option names a curve of Plot, such as "step" or "bump-x".
export const areaY = define((renderer, I, value, options = {}) =>
  drawArea(
    renderer,
    I,
    value,
    options,
    d3area()
      .x((d) => d[0])
      .y0((d) => d[2])
      .y1((d) => d[1]),
    ["x", "x1", "y", "y1"],
  ),
);

// Draws one area per series along y, from x1 to x, such as the halves of a population pyramid.
// It mirrors cm.areaY: over the bands of cm.spreadY, it's flat across each bar.
export const areaX = define((renderer, I, value, options = {}) =>
  drawArea(
    renderer,
    I,
    value,
    options,
    d3area()
      .y((d) => d[0])
      .x0((d) => d[2])
      .x1((d) => d[1]),
    ["y", "y1", "x", "x1"],
  ),
);

// Draws the areas of cm.polar around the center cx and cy: x is the angle and y the outer radius,
// y1 the inner radius, as for cm.arc. The curve applies in angle and radius, and edges follow the
// circle, so that a "bump-x" ribbon spirals between the arcs of its bars.
export const areaRadial = define((renderer, I, value, options = {}) => {
  const shape = d3area()
    .x((d) => d[0])
    .y0((d) => d[2])
    .y1((d) => d[1]);
  const radial = (points) => {
    const context = polarContext();
    shape.context(context)(points);
    return context.toString();
  };
  radial.curve = (curve) => (shape.curve(curve), radial);
  radial.defined = (defined) => (shape.defined(defined), radial);
  drawArea(renderer, I, value, options, radial, ["x", "x1", "y", "y1"], true);
});
