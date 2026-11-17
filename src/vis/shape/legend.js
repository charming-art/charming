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

// A categorical color: a swatch per value with its label, in lines that wrap within the width, or
// one per line in a column.
function swatches(key, scale, options, maxWidth, column) {
  const {domain, range} = scale;
  const color = (d) => range[domain.indexOf(d) % range.length];
  const format = typeof options.tickFormat === "function" ? options.tickFormat : (d) => `${d}`;
  const label = options.label !== undefined ? options.label : scale.label;
  const items = [];
  const head = label == null ? 0 : widthOf(label) + 8;
  let x = column ? 0 : head;
  let y = column && label != null ? lineHeight : 0;
  let width = head;
  for (const d of domain) {
    const w = swatchSize + 4 + widthOf(format(d));
    if (column) {
      if (items.length) y += lineHeight;
      x = 0;
    } else if (x > head && x + w > maxWidth) {
      x = head;
      y += lineHeight;
    }
    items.push({d, x, y});
    width = Math.max(width, x + w);
    x += w + 10;
  }
  return {
    width,
    height: y + lineHeight,
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

// A continuous color or an opacity: a ramp of slices painted through the scale, as the renderers
// have no gradients, with ticks under it, like a small axis.
function ramp(key, scale, options, maxWidth, column) {
  const s = scaleOf(scale);
  const [d0, d1] = [scale.domain[0], scale.domain[scale.domain.length - 1]];
  const opacity = key.endsWith("Opacity");
  const label = options.label !== undefined ? options.label : scale.label;
  // In a row, the title comes first, beside the ramp; in a column, above it.
  const head = column || label == null ? 0 : widthOf(label) + 8;
  const top = column && label != null ? lineHeight : 0;
  const width = Math.max(0, Math.min(options.width ?? 240, maxWidth - head));
  const count = typeof options.ticks === "number" ? options.ticks : Math.max(2, width / 50);
  const ticks = ticksOf(s, options, count);
  const format = formatOf(s, options, count);
  const n = 64;
  const slices = Array.from({length: n}, (_, i) => i);
  const at = (d) => ((d - d0) / (d1 - d0 || 1)) * width;
  return {
    width: head + width,
    height: top + rampHeight + 4 + lineHeight,
    draw(flow, x0, y0) {
      if (label != null) flow.datum(label).append(text, {...title, text: label, x: x0, y: y0});
      const x1 = x0 + head;
      const value = (i) => d0 + ((d1 - d0) * (i + 0.5)) / n;
      flow.data(slices).append(rect, {
        key: (i) => `legend\0${key}\0slice\0${i}`,
        x: (i) => x1 + (i * width) / n,
        y: y0 + top,
        // Slices overlap by a pixel, so that no seam shows between them.
        width: width / n + 1,
        height: rampHeight,
        ...(opacity ? {fill: "currentColor", fillOpacity: (i) => s(value(i))} : {fill: (i) => s(value(i))}),
      });
      const k = keyOf(key);
      flow.data(ticks).append(text, {
        ...font,
        key: k,
        text: format,
        x: (d) => x1 + at(d),
        y: y0 + top + rampHeight + 4,
        textAlign: "center",
        textBaseline: "top",
      });
    },
  };
}

// A radius: circles at a few ticks of the scale, side by side, each labeled under it. In a row,
// the title comes first, beside the circles; in a column, above them.
function sizes(key, scale, options, column) {
  const s = scaleOf(scale);
  const label = options.label !== undefined ? options.label : scale.label;
  const count = typeof options.ticks === "number" ? options.ticks : 3;
  const values = ticksOf(s, options, count).filter((d) => s(d) > 0);
  const format = formatOf(s, options, count);
  const radius = Math.max(0, ...values.map((d) => s(d)));
  const head = column || label == null ? 0 : widthOf(label) + 8;
  const top = column && label != null ? lineHeight : 0;
  const items = [];
  let x = head;
  for (const d of values) {
    const r = s(d);
    const w = Math.max(2 * r, widthOf(format(d)));
    items.push({d, x: x + w / 2, r});
    x += w + 8;
  }
  return {
    width: Math.max(head, x - 8, column && label != null ? widthOf(label) : 0),
    height: top + 1 + 2 * radius + 4 + lineHeight,
    draw(flow, x0, y0) {
      // Like swatches, the title hangs from the top, and the circles are aligned at their tops, the
      // top of a swatch, with their labels in a row under the largest.
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

function legendOf(key, scale, options, maxWidth, column) {
  if (key === "r") return sizes(key, scale, options, column);
  if (scale.type === "ordinal") return swatches(key, scale, options, maxWidth, column);
  return ramp(key, scale, options, maxWidth, column);
}

// Draws the legends of the scales recorded by cm.plane or cm.polar besides positions: swatches for
// categorical colors, a ramp for continuous colors and opacities, and circles for radii. Like
// Plot's legends above its charts, they're in rows at the top left of the chart by default; with
// anchor "right", they're in a column right of the frame. The room for them is given to cm.plane,
// such as marginTop: 70, and the titles of the axes stay by the frame, below the legends. The
// names of scales, such as {fill: {label: "Species"}}, take the options of each legend, or false
// to skip it; the other options apply to all of them. Charts nested in a chart, such as facets,
// have no legends yet.
export function legend(flow, value, {scales = {}, frame, options = {}} = {}) {
  if (frame?.nested) return;
  const {anchor = "top", ...rest} = options;
  const shared = Object.fromEntries(Object.entries(rest).filter(([key]) => !keys.includes(key)));
  const {width} = flow.renderer()._props;
  const column = anchor === "right";
  const left = column ? (frame?.right ?? width) + 12 : 3;
  const maxWidth = Math.max(0, width - 3 - left);
  const blocks = [];
  for (const key of keys) {
    const scale = scales[key];
    if (!scale || rest[key] === false) continue;
    blocks.push(legendOf(key, scale, {...shared, ...rest[key]}, maxWidth, column));
  }
  if (column) {
    let y = frame?.top ?? 3;
    for (const block of blocks) {
      block.draw(flow, left, y);
      y += block.height + 10;
    }
    return;
  }
  // Rows of legends from the left of the chart, wrapping within its width.
  const rows = [];
  for (const block of blocks) {
    const row = rows[rows.length - 1];
    if (row && row.width + 16 + block.width <= maxWidth) {
      row.blocks.push(block);
      row.width += 16 + block.width;
    } else rows.push({blocks: [block], width: block.width});
  }
  let y = 3;
  for (const row of rows) {
    let x = left;
    for (const block of row.blocks) {
      block.draw(flow, x, y);
      x += block.width + 16;
    }
    y += Math.max(...row.blocks.map((block) => block.height)) + 6;
  }
}

// Legends receive their options as they are, such as a tickFormat function, not per datum.
legend.raw = true;
