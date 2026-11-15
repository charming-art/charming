import {ascending} from "d3-array";
import {line as d3line} from "d3-shape";
import {define} from "../../core/shape/define.js";
import {curveOf, polarContext, seriesOf} from "./curve.js";

// The points of a series, sorted along the position it runs on, such as x for cm.lineY. A row with
// a band on that position, such as a bar of cm.spreadX, is at the middle of its band, as Plot puts
// points on band scales. Missing positions go last.
function pointsOf(I, P, P1, V) {
  const mid = (a, b) => (Number.isFinite(a) && Number.isFinite(b) ? (a + b) / 2 : a);
  const points = I.map((i) => [P1 ? mid(P[i], P1[i]) : P[i], V[i]]);
  return points.sort(([a], [b]) => !Number.isFinite(a) - !Number.isFinite(b) || ascending(a, b));
}

// Number.isFinite doesn't coerce, so null isn't taken for 0.
const defined = ([p, v]) => Number.isFinite(p) && Number.isFinite(v);

// Draws one line per series: along the position p, at the values of v, such as along x at y. Like
// Plot, a line is stroked with the current color, 1.5px wide, with round caps and joins, so that
// sharp reversals don't grow miter spikes, and isn't filled.
function drawLine(renderer, I, value, options, shape, [p, p1, v], center) {
  const {
    [p]: P = [],
    [p1]: P1,
    [v]: V = [],
    cx: CX = [],
    cy: CY = [],
    stroke: S = [],
    strokeOpacity: SO = [],
    strokeWidth: SW = [],
    strokeCap: SC = [],
    strokeJoin: SJ = [],
  } = value;
  const path = shape.curve(curveOf(options.curve)).defined(defined);
  for (const series of seriesOf(I, value)) {
    const [i] = series;
    if (i === undefined) continue;
    renderer.path({
      ...(center && {x: CX[i], y: CY[i]}),
      d: path(pointsOf(series, P, P1, V)),
      stroke: S[i] ?? "currentColor",
      strokeOpacity: SO[i],
      strokeWidth: SW[i] ?? 1.5,
      strokeCap: SC[i] ?? "round",
      strokeJoin: SJ[i] ?? "round",
    });
  }
}

// Draws one line per series along x, at y, such as a time series. The curve option names a curve
// of Plot, such as "step" or "monotone-x".
export const lineY = define((renderer, I, value, options = {}) =>
  drawLine(
    renderer,
    I,
    value,
    options,
    d3line()
      .x((d) => d[0])
      .y((d) => d[1]),
    ["x", "x1", "y"],
  ),
);

// Draws one line per series along y, at x. It mirrors cm.lineY.
export const lineX = define((renderer, I, value, options = {}) =>
  drawLine(
    renderer,
    I,
    value,
    options,
    d3line()
      .y((d) => d[0])
      .x((d) => d[1]),
    ["y", "y1", "x"],
  ),
);

// Draws the lines of cm.polar around the center cx and cy: x is the angle and y the radius. As for
// cm.areaRadial, the curve applies in angle and radius, and straight segments follow the circle.
export const lineRadial = define((renderer, I, value, options = {}) => {
  const shape = d3line()
    .x((d) => d[0])
    .y((d) => d[1]);
  const radial = (points) => {
    const context = polarContext();
    shape.context(context)(points);
    return context.toString();
  };
  radial.curve = (curve) => (shape.curve(curve), radial);
  radial.defined = (defined) => (shape.defined(defined), radial);
  drawLine(renderer, I, value, options, radial, ["x", "x1", "y"], true);
});
