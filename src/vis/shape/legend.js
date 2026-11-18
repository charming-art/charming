import {circle} from "../../core/shape/circle.js";
import {rect} from "../../core/shape/rect.js";
import {text} from "../../core/shape/text.js";
import {font} from "../font.js";
import {channelHints, labeled, legendsOf, resolve, scaleOf} from "../transform/scales.js";
import {formatOf, replaced, ticksOf, widthOf} from "./axisUtils.js";

// The scales that have legends, in order: colors, then radii, then opacities.
const keys = ["fill", "stroke", "r", "fillOpacity", "strokeOpacity"];

const lineHeight = 14;
const swatchSize = 10;
const rampHeight = 10;

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

// A radius at the top, like Vega-Lite's: its title, then circles at a few ticks of the scale, side by
// side, centered on one line, each labeled at its right, like a swatch. If they're wider than the
// chart, the ticks in the middle are dropped, keeping the smallest and the largest, then the largest.
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
      items.push({d, x, r});
      x += 2 * r + 4 + widthOf(format(d)) + 12;
    }
    return [items, x - 12];
  };
  const candidates = [ticks, ticks.length > 2 ? [ticks[0], ticks[ticks.length - 1]] : null, ticks.slice(-1)];
  let [items] = layout(ticks);
  for (const values of candidates) {
    if (!values) continue;
    const [fitted, width] = layout(values);
    items = fitted;
    if (width <= maxWidth) break;
  }
  // The row is as tall as the largest circle, with its stroke, or a line of text.
  const radius = Math.max(0, ...items.map(({r}) => r));
  const row = Math.max(2 * radius + 2, lineHeight);
  return {
    height: top + row,
    draw(flow, x0, y0) {
      if (label != null) flow.datum(label).append(text, {...title, text: label, x: x0, y: y0});
      const k = keyOf(key);
      const middle = y0 + top + row / 2;
      flow.data(items).append(circle, {
        key: ({d}) => k(d),
        x: ({x, r}) => x0 + x + r,
        y: middle,
        r: ({r}) => r,
        fill: "none",
        stroke: "currentColor",
      });
      flow.data(items).append(text, {
        ...font,
        key: ({d}) => k(d),
        text: ({d}) => format(d),
        x: ({x, r}) => x0 + x + 2 * r + 4,
        y: middle,
        textBaseline: "middle",
      });
    },
  };
}

// A categorical color at the top: its title, then a swatch per value with its label, side by side,
// wrapping to a new row past the width of the chart.
function swatchRow(key, scale, options, maxWidth) {
  const {domain, range} = scale;
  const color = (d) => range[domain.indexOf(d) % range.length];
  const formatValue = typeof options.tickFormat === "function" ? options.tickFormat : (d) => `${d}`;
  const format = (d) => fit(formatValue(d), maxWidth - swatchSize - 4);
  const label = labelOf(scale, options, maxWidth);
  const top = label == null ? 0 : lineHeight;
  const items = [];
  let [x, row] = [0, 0];
  for (const d of domain) {
    const w = swatchSize + 4 + widthOf(format(d));
    if (x > 0 && x + w > maxWidth) [x, row] = [0, row + 1];
    items.push({d, x, y: top + row * lineHeight});
    x += w + 12;
  }
  return {
    height: top + (domain.length ? row + 1 : 0) * lineHeight,
    draw(flow, x0, y0) {
      if (label != null) flow.datum(label).append(text, {...title, text: label, x: x0, y: y0});
      const k = keyOf(key);
      flow.data(items).append(rect, {
        key: ({d}) => k(d),
        x: ({x}) => x0 + x,
        y: ({y}) => y0 + y + 1,
        width: swatchSize,
        height: swatchSize,
        fill: ({d}) => color(d),
      });
      flow.data(items).append(text, {
        ...font,
        key: ({d}) => k(d),
        text: ({d}) => format(d),
        x: ({x}) => x0 + x + swatchSize + 4,
        y: ({y}) => y0 + y,
        textBaseline: "top",
      });
    },
  };
}

// A continuous color or an opacity on the right: its title, then a ramp standing up, low values at
// the bottom, with its ticks right of it, like a small axis of y. As for the ramp at the top, a scale
// to numbers places its ticks and samples its slices through the scale itself.
function rampY(key, scale, options, maxWidth) {
  const s = scaleOf(scale);
  const [d0, d1] = [scale.domain[0], scale.domain[scale.domain.length - 1]];
  const opacity = key.endsWith("Opacity");
  const label = labelOf(scale, options, maxWidth);
  const top = label == null ? 0 : lineHeight + 4;
  const height = Math.max(0, options.height ?? 120);
  const count = typeof options.ticks === "number" ? options.ticks : Math.max(2, height / 35);
  const ticks = ticksOf(s, options, count);
  const format = formatOf(s, options, count);
  const labeled = ticks.filter((d) => `${format(d) ?? ""}` !== "");
  const n = 64;
  const slices = Array.from({length: n}, (_, i) => i);
  const numeric = !s.interpolator && typeof s.range?.()[0] === "number" && typeof s.invert === "function";
  const p = numeric ? s.copy().range([0, height]) : null;
  const at = p ?? ((d) => ((d - d0) / (d1 - d0 || 1)) * height);
  const value = p ? (i) => p.invert(((i + 0.5) * height) / n) : (i) => d0 + ((d1 - d0) * (i + 0.5)) / n;
  // The labels at the ends are aligned inward, so that they stay within the ramp's height.
  const baselineOf = (d) => (at(d) <= 0.5 ? "bottom" : at(d) >= height - 0.5 ? "top" : "middle");
  return {
    height: top + height,
    draw(flow, x0, y0) {
      if (label != null) flow.datum(label).append(text, {...title, text: label, x: x0, y: y0});
      const bottom = y0 + top + height;
      flow.data(slices).append(rect, {
        key: (i) => `legend\0${key}\0slice\0${i}`,
        x: x0,
        // Slices overlap the next by a pixel, so that no seam shows between them, but the last.
        y: (i) => bottom - ((i + 1) * height) / n - (i < n - 1 ? 1 : 0),
        width: rampHeight,
        height: (i) => height / n + (i < n - 1 ? 1 : 0),
        ...(opacity ? {fill: "currentColor", fillOpacity: (i) => s(value(i))} : {fill: (i) => s(value(i))}),
      });
      flow.data(labeled).append(text, {
        ...font,
        key: keyOf(key),
        text: format,
        x: x0 + rampHeight + 4,
        y: (d) => bottom - at(d),
        textBaseline: baselineOf,
      });
    },
  };
}

// A radius on the right: its title, then circles at a few ticks of the scale, smallest first, from
// the top down, centered on one line, each labeled right of the largest.
function sizesY(key, scale, options, maxWidth) {
  const s = scaleOf(scale);
  const label = labelOf(scale, options, maxWidth);
  const top = label == null ? 0 : lineHeight;
  const count = typeof options.ticks === "number" ? options.ticks : 3;
  const ticks = ticksOf(s, options, count).filter((d) => s(d) > 0);
  const format = formatOf(s, options, count);
  const radius = Math.max(0, ...ticks.map((d) => s(d)));
  const items = [];
  let y = 0;
  for (const d of ticks) {
    const r = s(d);
    const h = Math.max(2 * r, lineHeight);
    items.push({d, r, y: y + h / 2});
    y += h + 4;
  }
  return {
    height: top + 1 + Math.max(0, y - 4),
    draw(flow, x0, y0) {
      if (label != null) flow.datum(label).append(text, {...title, text: label, x: x0, y: y0});
      const k = keyOf(key);
      const y1 = y0 + top + 1;
      flow.data(items).append(circle, {
        key: ({d}) => k(d),
        x: x0 + radius,
        y: ({y}) => y1 + y,
        r: ({r}) => r,
        fill: "none",
        stroke: "currentColor",
      });
      flow.data(items).append(text, {
        ...font,
        key: ({d}) => k(d),
        text: ({d}) => format(d),
        x: x0 + 2 * radius + 6,
        y: ({y}) => y1 + y,
        textBaseline: "middle",
      });
    },
  };
}

// The block of a legend: horizontal at the top of the chart, vertical on its right.
function legendOf(key, scale, options, maxWidth, anchor = "top") {
  const right = anchor === "right";
  if (key === "r") return (right ? sizesY : sizes)(key, scale, options, maxWidth);
  if (scale.type === "ordinal") return (right ? swatches : swatchRow)(key, scale, options, maxWidth);
  return (right ? rampY : ramp)(key, scale, options, maxWidth);
}

// The gap between legends, and between the legends at the top and the chart under them.
const legendGap = 10;

// The height of the legends at the top of a chart, stacked, given the scales, the options of their
// legends by name, and the width of the chart: for its default top margin. The legends start 3px
// from the top, and leave a gap over what's under them.
function legendsHeight(scales, legends, maxWidth) {
  const heights = keys
    .filter((key) => key in legends && scales[key] && legends[key].anchor !== "right")
    .map((key) => legendOf(key, scales[key], legends[key], maxWidth).height);
  return heights.length ? 3 + heights.reduce((a, b) => a + b + legendGap) + legendGap : 0;
}

// The room of the legends at the top of a chart, for the top margin of cm.plane or cm.polar, from
// the contexts, their colors, radii and opacities, resolved, and the options of their scales: those
// given legend: true or "top", recorded with their labels as the legends draw them, in the width
// from the left of the plot to the right of the chart.
export function topLegends(data, colors, options, maxWidth) {
  const hints = channelHints(data);
  const scales = Object.fromEntries(Object.keys(colors).map((key) => [key, labeled(resolve(colors[key]), hints[key])]));
  return legendsHeight(scales, legendsOf(options), maxWidth);
}

// Draws the legends of the scales recorded by cm.plane or cm.polar besides positions: swatches for
// categorical colors, a ramp for continuous colors and opacities, and circles for radii, each under
// its title. Like Plot's, they're at the top of the chart by default, stacked, horizontal, from the
// left of the plot, 3px from the top; with anchor "right", they're vertical, in a column right of
// the frame from its top, like Vega-Lite's. The frame of cm.polar is its disc. Like Plot's, a chart
// draws the legends of the scales given legend: true, or a side, such as {fill: {legend: "right"}},
// whose options default to those of the scale; the default margins of cm.plane leave room for those
// at the top. A legend added explicitly to the chart replaces them, and takes their options and
// sides; the names of scales, such as {fill: {label: "Species"}}, take the options of each legend,
// or false to skip it, and the other options apply to all of them, such as anchor. Charts nested in
// a chart, such as facets, have no legends yet.
export function legend(flow, value, {scales = {}, frame, guides, options = {}} = {}) {
  if (frame?.nested) return;
  const legends = guides?.legends ?? {};
  let entries;
  if (options.implicit) {
    if (replaced(flow, [legend], ({guides: other}) => other.id === guides.id, guides)) return;
    entries = keys.filter((key) => key in legends).map((key) => [key, legends[key]]);
  } else {
    const shared = Object.fromEntries(Object.entries(options).filter(([key]) => !keys.includes(key)));
    entries = keys
      .filter((key) => options[key] !== false)
      .map((key) => {
        const own = {...legends[key], ...shared, ...options[key]};
        return [key, {...own, anchor: options[key]?.anchor ?? options.anchor ?? legends[key]?.anchor ?? "top"}];
      });
  }
  entries = entries.filter(([key]) => scales[key]);
  const {width} = flow.renderer()._props;
  const polar = frame?.type === "polar";
  const left = polar ? frame.cx - frame.outerRadius : (frame?.left ?? 3);
  const right = polar ? frame.cx + frame.outerRadius : (frame?.right ?? width);
  let y = 3;
  for (const [key, options] of entries.filter(([, {anchor}]) => anchor !== "right")) {
    const block = legendOf(key, scales[key], options, Math.max(0, width - 3 - left), "top");
    block.draw(flow, left, y);
    y += block.height + legendGap;
  }
  const x = right + 12;
  y = polar ? frame.cy - frame.outerRadius : (frame?.top ?? 3);
  for (const [key, options] of entries.filter(([, {anchor}]) => anchor === "right")) {
    const block = legendOf(key, scales[key], options, Math.max(0, width - 3 - x), "right");
    block.draw(flow, x, y);
    y += block.height + legendGap;
  }
}

// Legends receive their options as they are, such as a tickFormat function, not per datum.
legend.raw = true;
