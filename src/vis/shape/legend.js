import {circle} from "../../core/shape/circle.js";
import {rect} from "../../core/shape/rect.js";
import {text} from "../../core/shape/text.js";
import {font} from "../font.js";
import {scaleOf} from "../transform/scales.js";
import {formatOf, ticksOf} from "./axisUtils.js";

// The scales that have legends, in order: colors, then radii, then opacities.
const keys = ["fill", "stroke", "r", "fillOpacity", "strokeOpacity"];

const lineHeight = 14;
const swatchSize = 10;
const rampHeight = 10;

// The width of a text in the legend's font, approximated like a monospace font of 0.6em, so that
// legends lay out the same in every environment.
function widthOf(value) {
  return `${value}`.length * font.fontSize * 0.6;
}

// The items of a legend are keyed apart from the keys of marks and ticks, like ticks.
const keyOf = (key) => (d) => `legend\0${key}\0${d instanceof Date ? +d : d}`;

const title = {...font, fontWeight: "bold", textBaseline: "top"};

// A text shortened with an ellipsis to fit a width, such as a long label in a narrow margin.
function fit(value, width) {
  const string = `${value}`;
  if (widthOf(string) <= width) return string;
  const n = Math.max(0, Math.floor(width / (font.fontSize * 0.6)) - 1);
  return `${string.slice(0, n)}…`;
}

// The title of a legend, if any, shortened to fit the column.
function labelOf(scale, options, maxWidth) {
  const label = options.label !== undefined ? options.label : scale.label;
  return label == null ? label : fit(label, maxWidth);
}

// A categorical color: its title, then a swatch per value with its label, one per line, shortened
// to fit the column.
function swatches(key, scale, options, maxWidth) {
  const {domain, range} = scale;
  const color = (d) => range[domain.indexOf(d) % range.length];
  const formatValue = typeof options.tickFormat === "function" ? options.tickFormat : (d) => `${d}`;
  const format = (d) => fit(formatValue(d), maxWidth - swatchSize - 4);
  const label = labelOf(scale, options, maxWidth);
  const top = label == null ? 0 : lineHeight;
  const items = domain.map((d, i) => ({d, y: top + i * lineHeight}));
  return {
    height: top + domain.length * lineHeight,
    draw(flow, x0, y0) {
      if (label != null) flow.datum(label).append(text, {...title, text: label, x: x0, y: y0});
      const k = keyOf(key);
      flow.data(items).append(rect, {
        key: ({d}) => k(d),
        x: x0,
        y: ({y}) => y0 + y + 1,
        width: swatchSize,
        height: swatchSize,
        fill: ({d}) => color(d),
      });
      flow.data(items).append(text, {
        ...font,
        key: ({d}) => k(d),
        text: ({d}) => format(d),
        x: x0 + swatchSize + 4,
        y: ({y}) => y0 + y,
        textBaseline: "top",
      });
    },
  };
}

// A continuous color or an opacity: its title, then a ramp of slices painted through the scale, as
// the renderers have no gradients, with ticks under it, like a small axis. A scale to numbers, such
// as a log opacity, places its ticks and samples its slices through the scale itself, so that
// they share its axis; a scale to colors, such as a sequential one, is linear in its domain.
function ramp(key, scale, options, maxWidth) {
  const s = scaleOf(scale);
  const [d0, d1] = [scale.domain[0], scale.domain[scale.domain.length - 1]];
  const opacity = key.endsWith("Opacity");
  const label = labelOf(scale, options, maxWidth);
  const top = label == null ? 0 : lineHeight;
  const width = Math.max(0, Math.min(options.width ?? 240, maxWidth));
  const count = typeof options.ticks === "number" ? options.ticks : Math.max(2, width / 50);
  const ticks = ticksOf(s, options, count);
  const format = formatOf(s, options, count);
  // Ticks without a label, such as the minor ticks of a log scale, aren't drawn.
  const labeled = ticks.filter((d) => `${format(d) ?? ""}` !== "");
  const n = 64;
  const slices = Array.from({length: n}, (_, i) => i);
  const numeric = !s.interpolator && typeof s.range?.()[0] === "number" && typeof s.invert === "function";
  const p = numeric ? s.copy().range([0, width]) : null;
  const at = p ?? ((d) => ((d - d0) / (d1 - d0 || 1)) * width);
  const value = p ? (i) => p.invert(((i + 0.5) * width) / n) : (i) => d0 + ((d1 - d0) * (i + 0.5)) / n;
  // The labels at the ends are aligned inward, so that they stay within the ramp's width.
  const alignOf = (d) => (at(d) <= 0.5 ? "start" : at(d) >= width - 0.5 ? "end" : "center");
  return {
    height: top + rampHeight + 4 + lineHeight,
    draw(flow, x0, y0) {
      if (label != null) flow.datum(label).append(text, {...title, text: label, x: x0, y: y0});
      flow.data(slices).append(rect, {
        key: (i) => `legend\0${key}\0slice\0${i}`,
        x: (i) => x0 + (i * width) / n,
        y: y0 + top,
        // Slices overlap the next by a pixel, so that no seam shows between them; the last doesn't,
        // so that the ramp ends within its width.
        width: (i) => width / n + (i < n - 1 ? 1 : 0),
        height: rampHeight,
        ...(opacity ? {fill: "currentColor", fillOpacity: (i) => s(value(i))} : {fill: (i) => s(value(i))}),
      });
      flow.data(labeled).append(text, {
        ...font,
        key: keyOf(key),
        text: format,
        x: (d) => x0 + at(d),
        y: y0 + top + rampHeight + 4,
        textAlign: alignOf,
        textBaseline: "top",
      });
    },
  };
}

// A radius: its title, then circles at a few ticks of the scale, side by side, aligned at their
// tops, each labeled in a row under the largest. If they're wider than the column, the ticks in the
// middle are dropped, keeping the smallest and the largest, then the largest only.
function sizes(key, scale, options, maxWidth) {
  const s = scaleOf(scale);
  const label = labelOf(scale, options, maxWidth);
  const top = label == null ? 0 : lineHeight;
  const count = typeof options.ticks === "number" ? options.ticks : 3;
  const ticks = ticksOf(s, options, count).filter((d) => s(d) > 0);
  const format = formatOf(s, options, count);
  const layout = (values) => {
    const items = [];
    let x = 0;
    for (const d of values) {
      const r = s(d);
      const w = Math.max(2 * r, widthOf(format(d)));
      items.push({d, x: x + w / 2, r});
      x += w + 8;
    }
    return [items, x - 8];
  };
  const candidates = [ticks, ticks.length > 2 ? [ticks[0], ticks[ticks.length - 1]] : null, ticks.slice(-1)];
  let [items] = layout(ticks);
  for (const values of candidates) {
    if (!values) continue;
    const [fitted, width] = layout(values);
    items = fitted;
    if (width <= maxWidth) break;
  }
  const radius = Math.max(0, ...items.map(({r}) => r));
  return {
    height: top + 1 + 2 * radius + 4 + lineHeight,
    draw(flow, x0, y0) {
      if (label != null) flow.datum(label).append(text, {...title, text: label, x: x0, y: y0});
      const k = keyOf(key);
      const y1 = y0 + top + 1;
      flow.data(items).append(circle, {
        key: ({d}) => k(d),
        x: ({x}) => x0 + x,
        y: ({r}) => y1 + r,
        r: ({r}) => r,
        fill: "none",
        stroke: "currentColor",
      });
      flow.data(items).append(text, {
        ...font,
        key: ({d}) => k(d),
        text: ({d}) => format(d),
        x: ({x}) => x0 + x,
        y: y1 + 2 * radius + 4,
        textAlign: "center",
        textBaseline: "top",
      });
    },
  };
}

function legendOf(key, scale, options, maxWidth) {
  if (key === "r") return sizes(key, scale, options, maxWidth);
  if (scale.type === "ordinal") return swatches(key, scale, options, maxWidth);
  return ramp(key, scale, options, maxWidth);
}

// Draws the legends of the scales recorded by cm.plane or cm.polar besides positions: swatches for
// categorical colors, a ramp for continuous colors and opacities, and circles for radii, each under
// its title. Like Vega-Lite's, they're in a column right of the frame, from its top, where the
// margins of the chart leave the most room clear of the axes; the room is given to cm.plane, such
// as marginRight: 140. The frame of cm.polar is its disc, from its right and its top. The names of scales, such as {fill: {label: "Species"}}, take the options
// of each legend, or false to skip it; the other options apply to all of them. Charts nested in a
// chart, such as facets, have no legends yet.
export function legend(flow, value, {scales = {}, frame, options = {}} = {}) {
  if (frame?.nested) return;
  const shared = Object.fromEntries(Object.entries(options).filter(([key]) => !keys.includes(key)));
  const {width} = flow.renderer()._props;
  const polar = frame?.type === "polar";
  const right = polar ? frame.cx + frame.outerRadius : (frame?.right ?? width);
  const x = right + 12;
  const maxWidth = Math.max(0, width - 3 - x);
  let y = polar ? frame.cy - frame.outerRadius : (frame?.top ?? 3);
  for (const key of keys) {
    const scale = scales[key];
    if (!scale || options[key] === false) continue;
    const block = legendOf(key, scale, {...shared, ...options[key]}, maxWidth);
    block.draw(flow, x, y);
    y += block.height + 10;
  }
}

// Legends receive their options as they are, such as a tickFormat function, not per datum.
legend.raw = true;
