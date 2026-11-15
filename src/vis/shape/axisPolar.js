import {link} from "../../core/shape/link.js";
import {path} from "../../core/shape/path.js";
import {text} from "../../core/shape/text.js";
import {font, formatOf, positionOf, scaleOf, ticksOf} from "./axis.js";

const stroke = "currentColor";

// The point at the radius r and the angle a of a polar frame, clockwise from 12 o'clock.
function pointOf({cx, cy}, r, a) {
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

// A ring of radius r around (0, 0), drawn as a path so that it's only stroked.
function ringOf(r) {
  return `M${r},0A${r},${r},0,1,1,${-r},0A${r},${r},0,1,1,${r},0Z`;
}

// Labels stay horizontal, so they're aligned by the direction of their tick: a label to the right
// of its tick starts there, one above it sits on it, and so on.
function alignOf(dx, dy) {
  return {
    textAlign: dx > 0.3 ? "start" : dx < -0.3 ? "end" : "center",
    textBaseline: dy < -0.3 ? "bottom" : dy > 0.3 ? "top" : "middle",
  };
}

// The angle axis of cm.polar. The ticks point into the hole, as in D3's radial stacked bar chart,
// or out of the chart, as in GoFish's donut chart. The anchor is inner if there's a hole.
export function polarAxisX(flow, frame, x, options) {
  const {innerRadius, outerRadius, startAngle, endAngle} = frame;
  const {tickSize = 6, tickPadding = 3, grid = false, anchor = innerRadius > 0 ? "inner" : "outer"} = options;
  const scale = scaleOf(x);
  const [r, k] = anchor === "inner" ? [innerRadius, -1] : [outerRadius, 1];
  const count = countOf(options, Math.abs(endAngle - startAngle) * outerRadius, 80);
  const A = positionOf(scale);
  // A full turn ends where it starts, so its last tick is dropped.
  const full = Math.abs(endAngle - startAngle) >= 2 * Math.PI - 1e-6;
  const ticks = ticksOf(scale, options, count).filter((d) => !full || Math.abs(A(d) - endAngle) > 1e-6);
  const at = (radius, i) => pointOf(frame, radius, A(ticks[i]));
  if (grid) {
    const spoke = (radius, j) => (d, i) => at(radius, i)[j];
    flow.data(ticks).append(link, {
      x: spoke(innerRadius, 0),
      y: spoke(innerRadius, 1),
      x1: spoke(outerRadius, 0),
      y1: spoke(outerRadius, 1),
      stroke,
      strokeOpacity: 0.1,
    });
  }
  const r1 = r + k * tickSize;
  const r2 = r + k * (tickSize + tickPadding);
  flow.data(ticks).append(link, {
    x: (d, i) => at(r, i)[0],
    y: (d, i) => at(r, i)[1],
    x1: (d, i) => at(r1, i)[0],
    y1: (d, i) => at(r1, i)[1],
    stroke,
  });
  const format = formatOf(scale, options, count);
  flow.data(ticks).append(text, {
    ...font,
    text: format,
    x: (d, i) => at(r2, i)[0],
    y: (d, i) => at(r2, i)[1],
    textAlign: (d) => alignOf(k * Math.sin(A(d)), -k * Math.cos(A(d))).textAlign,
    textBaseline: (d) => alignOf(k * Math.sin(A(d)), -k * Math.cos(A(d))).textBaseline,
  });
}

// The radius axis of cm.polar, as in D3's radial stacked bar chart: a ring per tick, and tick
// labels with a halo along the line at 12 o'clock. A tick at the baseline is skipped, as in D3.
export function polarAxisY(flow, frame, y, options) {
  const {cx, cy, innerRadius, outerRadius} = frame;
  const {grid = true} = options;
  const scale = scaleOf(y);
  const count = countOf(options, outerRadius - innerRadius, 35);
  const R = positionOf(scale);
  const ticks = ticksOf(scale, options, count).filter((d) => R(d) > innerRadius + 1e-6);
  if (grid) flow.data(ticks).append(path, {x: cx, y: cy, d: (d) => ringOf(R(d)), stroke, strokeOpacity: 0.1});
  const format = formatOf(scale, options, count);
  const label = {...font, text: format, x: cx, y: (d) => cy - R(d), textAlign: "center", textBaseline: "middle"};
  flow.data(ticks).append(text, {...label, fill: null, stroke: "white", strokeWidth: 3});
  flow.data(ticks).append(text, label);
}

function countOf({ticks}, length, spacing) {
  return typeof ticks === "number" ? ticks : length / spacing;
}
