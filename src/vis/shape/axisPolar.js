import {link} from "../../core/shape/link.js";
import {path} from "../../core/shape/path.js";
import {text} from "../../core/shape/text.js";
import {alignOf, countOf, font, formatOf, key, positionOf, scaleOf, ticksOf, widthOf} from "./axisUtils.js";

const stroke = "currentColor";

// The point at the radius r and the angle a of a polar frame, clockwise from 12 o'clock.
function pointOf({cx, cy}, r, a) {
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

// A ring of radius r around (0, 0), drawn as a path so that it's only stroked.
function ringOf(r) {
  return `M${r},0A${r},${r},0,1,1,${-r},0A${r},${r},0,1,1,${r},0Z`;
}

// The title of a polar axis: the label option of the axis, else the label given to its scale in
// cm.polar's scales, recorded in titles, null for none; not in nested charts, which leave titles
// to the outer chart.
function titleOf(frame, titles = {}, axis, {label}) {
  if (frame.nested) return null;
  return label !== undefined ? label : (titles[axis] ?? null);
}

// The ticks of the angle axis of a polar frame on the ring of its anchor, with how they're placed:
// the radius of the ring, the direction of the ticks, out of the chart or into its hole, the
// count of ticks, and the angle of each.
function angleTicks(frame, x, options) {
  const {innerRadius, outerRadius, startAngle, endAngle} = frame;
  const {anchor = innerRadius > 0 ? "inner" : "outer"} = options;
  const scale = scaleOf(x);
  const [r, k] = anchor === "inner" ? [innerRadius, -1] : [outerRadius, 1];
  // One tick per 80px along the circle where the ticks are, such as the edge of the hole.
  const count = countOf(options, Math.abs(endAngle - startAngle) * r, 80);
  const A = positionOf(scale);
  // A full turn ends where it starts, so its last tick is dropped.
  const full = Math.abs(endAngle - startAngle) >= 2 * Math.PI - 1e-6;
  const ticks = ticksOf(scale, options, count).filter((d) => !full || Math.abs(A(d) - endAngle) > 1e-6);
  return {scale, r, k, count, A, ticks};
}

// The boxes of the tick labels of the angle axis of a polar frame, as polarAxisX draws them, as
// [x0, y0, x1, y1], measured like Plot's text, by the widths of their characters: for its margins.
export function polarLabelBoxes(frame, x, options = {}) {
  const {tickSize = 6, tickPadding = 3} = options;
  const {scale, r, k, count, A, ticks} = angleTicks(frame, x, options);
  const format = formatOf(scale, options, count);
  const r2 = r + k * (tickSize + tickPadding);
  return ticks.flatMap((d) => {
    const label = `${format(d) ?? ""}`;
    if (label === "") return [];
    const [px, py] = pointOf(frame, r2, A(d));
    const {textAlign, textBaseline} = alignOf(k * Math.sin(A(d)), -k * Math.cos(A(d)));
    const w = widthOf(label);
    const h = font.fontSize;
    const x0 = textAlign === "start" ? px : textAlign === "end" ? px - w : px - w / 2;
    const y0 = textBaseline === "top" ? py : textBaseline === "bottom" ? py - h : py - h / 2;
    return [[x0, y0, x0 + w, y0 + h]];
  });
}

// The angle axis of cm.polar. The ticks point into the hole, as in D3's radial stacked bar chart,
// or out of the chart, as in GoFish's donut chart. The anchor is inner if there's a hole. Its
// title is at the bottom right, like a plane's x axis.
export function polarAxisX(flow, frame, x, options, titles) {
  const {innerRadius, outerRadius} = frame;
  const {tickSize = 6, tickPadding = 3, grid = false} = options;
  const {scale, r, k, count, A, ticks} = angleTicks(frame, x, options);
  const at = (radius, i) => pointOf(frame, radius, A(ticks[i]));
  if (grid) {
    const spoke = (radius, j) => (d, i) => at(radius, i)[j];
    flow.data(ticks).append(link, {
      key,
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
    key,
    x: (d, i) => at(r, i)[0],
    y: (d, i) => at(r, i)[1],
    x1: (d, i) => at(r1, i)[0],
    y1: (d, i) => at(r1, i)[1],
    stroke,
  });
  const format = formatOf(scale, options, count);
  const align = ticks.map((d) => alignOf(k * Math.sin(A(d)), -k * Math.cos(A(d))));
  flow.data(ticks).append(text, {
    key,
    ...font,
    text: format,
    x: (d, i) => at(r2, i)[0],
    y: (d, i) => at(r2, i)[1],
    textAlign: (d, i) => align[i].textAlign,
    textBaseline: (d, i) => align[i].textBaseline,
  });
  const title = titleOf(frame, titles, "x", options);
  if (title == null) return;
  const {width, height} = flow.renderer()._props;
  flow.datum(title).append(text, {...font, text: title, x: width - 3, y: height - 3, textAlign: "end"});
}

// The radius axis of cm.polar, as in D3's radial stacked bar chart: a ring per tick, and tick
// labels with a halo along the line at 12 o'clock. A tick at the baseline is skipped, as in D3.
// Like D3's, the rings are drawn by default, with grid; there are no tick marks, so tickSize and
// tickPadding don't apply. Its title is at the top left, like a plane's y axis.
export function polarAxisY(flow, frame, y, options, titles) {
  const {cx, cy, innerRadius, outerRadius} = frame;
  const {grid = true} = options;
  const scale = scaleOf(y);
  const count = countOf(options, outerRadius - innerRadius, 35);
  const R = positionOf(scale);
  const ticks = ticksOf(scale, options, count).filter((d) => R(d) > innerRadius + 1e-6);
  if (grid) flow.data(ticks).append(path, {key, x: cx, y: cy, d: (d) => ringOf(R(d)), stroke, strokeOpacity: 0.1});
  const format = formatOf(scale, options, count);
  const label = {...font, key, text: format, x: cx, y: (d) => cy - R(d), textAlign: "center", textBaseline: "middle"};
  flow.data(ticks).append(text, {key, ...label, fill: null, stroke: "white", strokeWidth: 3});
  flow.data(ticks).append(text, label);
  const title = titleOf(frame, titles, "y", options);
  if (title == null) return;
  flow.datum(title).append(text, {...font, text: title, x: 3, y: 3, textAlign: "start", textBaseline: "top"});
}
