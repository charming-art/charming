import {Flow} from "./index.js";
import {Node} from "../node.js";
import {isColor} from "../color.js";

// Whether a string option names a bound channel. Like cm.encode, a color for fill or stroke is a
// constant, even if a channel has its name.
function isChannel(key, value, channels) {
  if (typeof value !== "string" || !channels || !Object.hasOwn(channels, value)) return false;
  return !((key === "fill" || key === "stroke") && isColor(value));
}

// The states of a mark as it appears, enters or exits, such as enter: {y: 200, delay: 100}, are
// channels of their own, enterY and enterDelay, so that they move with their rows like any other.
// Appear: true is a channel of its own too, which reuses the enter state on the first render.
const states = new Set(["appear", "enter", "exit"]);

function isState(key, value) {
  return states.has(key) && value !== null && typeof value === "object" && !Array.isArray(value);
}

function flatten(options) {
  const entries = [];
  for (const [key, value] of Object.entries(options)) {
    if (!isState(key, value)) entries.push([key, value]);
    else for (const name in value) entries.push([key + name[0].toUpperCase() + name.slice(1), value[name]]);
  }
  return entries;
}

// Options whose values are functions themselves, such as the format of a text or an easing, rather
// than functions of each row, or strings that aren't the names of channels, such as the d3 format
// "x" of a text, rather than the values of a channel x.
const functions = new Set(["format", "ease", "appearEase", "enterEase", "exitEase"]);

// Options whose strings are literal, the style of a shape rather than its data, such as the
// alignment or the font of a text, the curve of a line or the position of a label.
const literals = new Set([
  "anchor",
  "contrast",
  "curve",
  "d",
  "fontFamily",
  "fontStyle",
  "fontWeight",
  "paintOrder",
  "position",
  "strokeCap",
  "strokeJoin",
  "textAlign",
  "textBaseline",
  "transformOrigin",
]);

// Whether a string option names a field of the data, like a channel in cm.encode, in the flows it
// encodes: an option of a channel, such as text or x, rather than of style, and other than a color
// for fill or stroke, also in a state, such as enter: {fill: "red"}.
export function isField(key, value) {
  if (typeof value !== "string" || functions.has(key)) return false;
  const name = key.replace(/^(appear|enter|exit)([A-Z])/, (_, stage, c) => c.toLowerCase());
  if (literals.has(name)) return false;
  return !((name === "fill" || name === "stroke") && isColor(value));
}

// Channels are plain arrays, even for typed array data, so they can hold any value. A string that
// names a bound channel takes its values, such as {y: "v2"}; in a flow encoded by cm.encode, a
// string option of a channel names a field of the datum otherwise, such as {text: "name"}, like in
// cm.encode; other strings are constants.
export function valueOf(data, options, channels, encoded = false) {
  const values = flatten(options).map(([key, value]) => {
    if (value !== null && typeof value === "object" && value.preserve) return [key, value];
    if (!functions.has(key) && isChannel(key, value, channels)) {
      return [key, Array.from(data, (d) => d[value])];
    }
    if (encoded && isField(key, value)) return [key, Array.from(data, (d) => d.datum?.[value])];
    if (Array.isArray(value)) return [key, Array.from(data, (d, i) => value[+d || i])];
    const v = typeof value === "function" && !functions.has(key) ? value : () => value;
    const V = Array.from(data, (d, i) => v(d, i, data));
    return [key, V];
  });
  return Object.fromEntries(values);
}

function rowsOf(value, group) {
  const n = group.length;
  const rows = new Array(n);
  for (let i = 0; i < n; i++) {
    const row = (rows[i] = {});
    for (const key in value) row[key] = Array.isArray(value[key]) ? value[key][i] : value[key];
    row.datum = group[i];
  }
  return rows;
}

export function flow$append(render, options = {}) {
  // Each branch nests under its own shape, so a joined flow is split first.
  if (this._branches) throw new Error("Split a joined flow before appending into it: const [a, b] = flow.");
  const flow = this._data ? this : this.data((d) => [d]);
  const groups = flow._groups;
  const parent = this._parent;
  const data = flow._values;
  // A shape marked raw, such as an axis, receives its options as they are, not per datum.
  const empty = render.raw || Object.keys(options).length === 0;
  const values = groups.map((group, j) => {
    const context = data?.[j];
    const bound = context?.value;
    const I = context?.I ?? group.map((_, i) => i);
    if (empty) return {I, render, options, value: {...bound}, group, context};
    const value = valueOf(bound ? rowsOf(bound, group) : group, options, bound, context?.encoded);
    return {I, render, options, value: {...bound, ...value}, group, context};
  });
  // A flow of an array has one group, drawn under every parent row; a flow of a function, such as
  // flow.data((d) => d.children), has one group per parent row, across the parent's groups.
  const node = new Node(values, [], parent, typeof flow._data !== "function");
  parent._children.push(node);
  return new Flow(groups, null, node, this._context);
}
