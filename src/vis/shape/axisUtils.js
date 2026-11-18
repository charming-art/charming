import {scaleOf} from "../transform/scales.js";

// The helpers shared by the axes of cm.plane and cm.polar.

export {font} from "../font.js";

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
// isn't drawn: if a guide of the given shapes for the same scale of the same chart is added
// explicitly, in any of its layers, or the same implicit one is drawn before it in the same cell,
// such as in the first of the layers sharing x, unless that layer has no rows there. Same tells
// from the guides and the options of another guide whether it's for the same scale.
export function replaced(flow, shapes, same, guides) {
  const node = flow._parent;
  const siblings = node._parent._children;
  const index = siblings.indexOf(node);
  const j = node._data.findIndex(({context}) => context?.guides === guides);
  const of = ({render, options, context}) =>
    shapes.includes(render) && context?.guides !== undefined && same(context.guides, options);
  return siblings.some((sibling, i) => {
    if (sibling === node) return false;
    if (sibling._data.some((d) => !d.options?.implicit && of(d))) return true;
    const d = sibling._data[sibling._shared ? 0 : j];
    return i < index && d !== undefined && of(d) && !d.context.frame?.empty;
  });
}

// The options of an axis, from the guides of its context and the options given to it: an implicit
// axis draws the side of its guide, and an explicit one its anchor, else the first side of its
// guide. Null if an implicit axis has no such side, or isn't drawn.
export function axisOptions(flow, guides, axis, options, shapes) {
  const {anchors = [], name, ...guided} = guides?.[axis] ?? {};
  if (options.implicit) {
    const same = (other, {implicit, side} = {}) =>
      other.id === guides.id && other[axis].name === name && (!implicit || side === options.side);
    if (options.side >= anchors.length || replaced(flow, shapes, same, guides)) return null;
    return {...guided, anchor: anchors[options.side]};
  }
  const anchor = options.anchor ?? anchors[0];
  return {...guided, ...options, ...(anchor !== undefined && {anchor})};
}
