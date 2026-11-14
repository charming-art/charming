import {scaleBand, scaleLinear, scalePoint} from "d3-scale";
import {link} from "../../core/shape/link.js";
import {text} from "../../core/shape/text.js";

const font = {fill: "currentColor", fontSize: 10, fontFamily: "system-ui, sans-serif"};

// Rebuilds a d3 scale from a scale recorded by cm.plane, for its ticks and tick format.
function scaleOf({scale, domain, range, paddingInner, paddingOuter, align}) {
  if (typeof scale === "function") return scale;
  if (scale === "band")
    return scaleBand(domain, range).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  if (scale === "point") return scalePoint(domain, range);
  return scaleLinear(domain, range);
}

function ticksOf(scale, {ticks}, count) {
  if (Array.isArray(ticks)) return ticks;
  return scale.ticks ? scale.ticks(ticks ?? count) : scale.domain();
}

function formatOf(scale, {tickFormat}, count) {
  if (typeof tickFormat === "function") return tickFormat;
  if (scale.tickFormat) return scale.tickFormat(count, tickFormat);
  return (d) => `${d}`;
}

// Ticks are at the middle of the bands of a band scale.
function positionOf(scale) {
  const offset = scale.bandwidth ? scale.bandwidth() / 2 : 0;
  return (d) => scale(d) + offset;
}

// Like Plot, the label of a continuous scale has an arrow for the direction of increasing values,
// unless the label is given explicitly or already has one.
function labelOf({label, domain, range}, scale, axis, options) {
  if (options.label !== undefined) return options.label;
  if (label == null) return null;
  if (!scale.ticks || /[↑↓→←]/.test(label)) return `${label}`;
  const order = Math.sign(domain[domain.length - 1] - domain[0]) * Math.sign(range[range.length - 1] - range[0]);
  if (!order) return `${label}`;
  if (axis === "x") return order > 0 ? `${label} →` : `← ${label}`;
  return order < 0 ? `↑ ${label}` : `↓ ${label}`;
}

function extentOf(range) {
  return [Math.min(...range), Math.max(...range)];
}

// Draws the x axis of the scales recorded by cm.plane, at the bottom of the chart, like Plot.
export function axisX(flow, value, {scales = {}, options = {}} = {}) {
  const {x, y} = scales;
  if (!x) return;
  const {tickSize = 6, tickPadding = 3, grid = false} = options;
  const {width, height} = flow.renderer()._props;
  const scale = scaleOf(x);
  const [left, right] = extentOf(x.range);
  const [top, bottom] = y ? extentOf(y.range) : [0, height];
  const count = (right - left) / 80;
  const ticks = ticksOf(scale, options, count);
  const X = positionOf(scale);
  const stroke = "currentColor";
  if (grid) flow.data(ticks).append(link, {x: X, x1: X, y: top, y1: bottom, stroke, strokeOpacity: 0.1});
  flow.data(ticks).append(link, {x: X, x1: X, y: bottom, y1: bottom + tickSize, stroke});
  flow.data(ticks).append(text, {
    ...font,
    text: formatOf(scale, options, count),
    x: X,
    y: bottom + tickSize + tickPadding,
    textAlign: "center",
    textBaseline: "top",
  });
  const label = labelOf(x, scale, "x", options);
  if (label == null) return;
  const center = !scale.ticks;
  flow.datum(label).append(text, {
    ...font,
    text: label,
    x: center ? (left + right) / 2 : width - 3,
    // On the baseline, 3px above the bottom, so that it stays below the tick labels.
    y: height - 3,
    textAlign: center ? "center" : "end",
  });
}

// Draws the y axis of the scales recorded by cm.plane, on the left of the chart, like Plot.
export function axisY(flow, value, {scales = {}, options = {}} = {}) {
  const {x, y} = scales;
  if (!y) return;
  const {tickSize = 6, tickPadding = 3, grid = false} = options;
  const {width} = flow.renderer()._props;
  const scale = scaleOf(y);
  const [left, right] = x ? extentOf(x.range) : [0, width];
  const [top, bottom] = extentOf(y.range);
  const count = (bottom - top) / 35;
  const ticks = ticksOf(scale, options, count);
  const Y = positionOf(scale);
  const stroke = "currentColor";
  if (grid) flow.data(ticks).append(link, {x: left, x1: right, y: Y, y1: Y, stroke, strokeOpacity: 0.1});
  flow.data(ticks).append(link, {x: left, x1: left - tickSize, y: Y, y1: Y, stroke});
  flow.data(ticks).append(text, {
    ...font,
    text: formatOf(scale, options, count),
    x: left - tickSize - tickPadding,
    y: Y,
    textAlign: "end",
    textBaseline: "middle",
  });
  const label = labelOf(y, scale, "y", options);
  if (label == null) return;
  flow.datum(label).append(text, {...font, text: label, x: 3, y: 3, textAlign: "start", textBaseline: "top"});
}

// Draws both axes. The options x and y are the options of each axis, or false to skip it; the
// other options apply to both.
export function axis(flow, value, {options = {}, ...context} = {}) {
  const {x = {}, y = {}, ...shared} = options;
  if (x !== false) axisX(flow, value, {...context, options: {...shared, ...x}});
  if (y !== false) axisY(flow, value, {...context, options: {...shared, ...y}});
}

// Axes receive their options as they are, such as a tickFormat function, not per datum.
axis.raw = axisX.raw = axisY.raw = true;
