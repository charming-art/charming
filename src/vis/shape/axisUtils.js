import {scaleOf} from "../transform/scales.js";

// The helpers shared by the axes of cm.plane and cm.polar.

import {font} from "../font.js";

export {font};

// The widths of characters in hundredths of an em, measured at 10px system-ui, from Plot's
// defaultWidthMap (https://github.com/observablehq/plot, ISC License). Other characters are as wide
// as an e, and pictographs, such as emojis, 1.2em.
// prettier-ignore
const widths = {
  a: 56, b: 63, c: 57, d: 63, e: 58, f: 37, g: 62, h: 60, i: 26, j: 26, k: 55, l: 26, m: 88,
  n: 60, o: 60, p: 62, q: 62, r: 39, s: 54, t: 38, u: 60, v: 55, w: 79, x: 54, y: 55, z: 55,
  A: 69, B: 67, C: 73, D: 74, E: 61, F: 58, G: 76, H: 75, I: 28, J: 55, K: 67, L: 58, M: 89,
  N: 75, O: 78, P: 65, Q: 78, R: 67, S: 65, T: 65, U: 75, V: 69, W: 98, X: 69, Y: 67, Z: 67,
  0: 64, 1: 48, 2: 62, 3: 64, 4: 66, 5: 63, 6: 65, 7: 58, 8: 65, 9: 65,
  " ": 29, "!": 32, '"': 49, "'": 31, "(": 39, ")": 39, ",": 31, "-": 48, ".": 31, "/": 32,
  ":": 31, ";": 31, "?": 52, "\u2018": 31, "\u2019": 31, "\u201c": 47, "\u201d": 47, "\u2026": 82,
};

const pictographic = /\p{Extended_Pictographic}/u;

// The width of a text in the font of axes and legends, estimated like Plot's from the widths of its
// characters, so that they lay out the same in every environment.
export function widthOf(value, fontSize = font.fontSize) {
  let sum = 0;
  for (const c of `${value}`) sum += widths[c] ?? (pictographic.test(c) ? 120 : widths.e);
  return (sum * fontSize) / 100;
}

// The gap between an axis, its tick marks and labels, and its title.
export const titleGap = 6;

// How far an axis reaches from the plot, across it: its tick marks, then, if any of its labels
// shows, the padding and the size of the labels across the axis, rotated by radians, with the pad
// of rotated labels. The size of a label along the axis is its width, and across it its height,
// the font size; across is the size across the axis of a label of width w, unrotated.
export function reachOf(labels, {tickSize, tickPadding, radians, pad, across}) {
  const shown = labels.filter((label) => `${label ?? ""}` !== "");
  if (!shown.length) return tickSize;
  const size = Math.max(...shown.map((label) => across(widthOf(label), font.fontSize, radians)));
  return tickSize + tickPadding + pad + size;
}

// Labels that stay horizontal are aligned by a direction, such as of a polar tick from the center:
// a label to the right of its point starts there, one above it sits on it, and so on.
export function alignOf(dx, dy) {
  return {
    textAlign: dx > 0.3 ? "start" : dx < -0.3 ? "end" : "center",
    textBaseline: dy < -0.3 ? "bottom" : dy > 0.3 ? "top" : "middle",
  };
}

// Tick marks are keyed by their values, so that transitions match ticks from render to render;
// dates by their times, as keys compare as strings, which drop milliseconds. The keys are set apart
// from the keys of marks, so that a mark whose group key is a tick's value splits from or merges
// into the mark keyed by it, not the tick.
export const key = (d) => `tick\0${d instanceof Date ? +d : d}`;

// The count of ticks: the ticks option if it's a number, or one tick per spacing pixels along the
// length of the axis, like Plot.
export function countOf({ticks}, length, spacing) {
  return typeof ticks === "number" ? ticks : length / spacing;
}

// Like Plot, the label of a continuous scale has an arrow for the direction of increasing values,
// unless the label is given explicitly or already has one. A y title turned to read along its axis,
// bottom to top, takes the arrows of an x title, so that once turned they point along the axis.
export function labelOf({label, domain, range}, scale, axis, options, turned = false) {
  if (options.label !== undefined) return options.label;
  if (label == null) return null;
  if (!scale.ticks || /[↑↓→←]/.test(label)) return `${label}`;
  const order = Math.sign(domain[domain.length - 1] - domain[0]) * Math.sign(range[range.length - 1] - range[0]);
  if (!order) return `${label}`;
  if (axis === "x") return order > 0 ? `${label} →` : `← ${label}`;
  if (turned) return order < 0 ? `${label} →` : `← ${label}`;
  return order < 0 ? `↑ ${label}` : `↓ ${label}`;
}

export {scaleOf};

export function ticksOf(scale, {ticks}, count) {
  if (Array.isArray(ticks)) return ticks;
  return scale.ticks ? scale.ticks(count) : scale.domain();
}

export function formatOf(scale, {tickFormat}, count) {
  if (typeof tickFormat === "function") return tickFormat;
  if (scale.tickFormat) return scale.tickFormat(count, tickFormat);
  return (d) => `${d}`;
}

// Ticks are at the middle of the bands of a band scale.
export function positionOf(scale) {
  if (scale.middle) return scale.middle; // bands of unequal widths, with flex
  const offset = scale.bandwidth ? scale.bandwidth() / 2 : 0;
  return (d) => scale(d) + offset;
}

// Whether an implicit guide, drawn by cm.plane or cm.polar for the context of the given guides,
// isn't drawn: if a guide of the given shapes for the same scale of the same chart draws in the
// same cell, added explicitly in any of its layers, or implicitly before it, such as in the first
// of the layers sharing x. A guide draws in a cell if its layer has rows there; same tells from the
// context and the options of another guide whether it's for the same scale, and draws.
export function replaced(flow, shapes, same, guides) {
  const node = flow._parent;
  const siblings = node._parent._children;
  const index = siblings.indexOf(node);
  const j = node._data.findIndex(({context}) => context?.guides === guides);
  return siblings.some((sibling, i) => {
    if (sibling === node) return false;
    const d = sibling._data[sibling._shared ? 0 : j];
    if (d === undefined || !shapes.includes(d.render) || d.context?.guides === undefined) return false;
    if (d.context.frame?.empty || !same(d.context, d.options ?? {})) return false;
    return !d.options?.implicit || i < index;
  });
}

// The options of an axis, from the guides of its context and the options given to it: an implicit
// axis draws the side of its guide, and an explicit one its anchor, else the first side of its
// guide. Like Plot's, only the first side has a grid and a title. Null if an implicit axis has no
// such side, or isn't drawn.
export function axisOptions(flow, guides, axis, options, shapes) {
  const {anchors = [], name, ...guided} = guides?.[axis] ?? {};
  if (options.implicit) {
    const {side} = options;
    const same = ({guides: other, scales = {}}, {implicit, side: otherSide}) =>
      other.id === guides.id &&
      other[axis].name === name &&
      scales[axis] !== undefined &&
      (!implicit || otherSide === side);
    if (side >= anchors.length || replaced(flow, shapes, same, guides)) return null;
    return {...guided, anchor: anchors[side], ...(side > 0 && {grid: false, label: null})};
  }
  const anchor = options.anchor ?? anchors[0];
  return {...guided, ...options, ...(anchor !== undefined && {anchor})};
}
