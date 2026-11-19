import {Flow} from "./index.js";
import {Node} from "../node.js";
import {isColor} from "../color.js";
import {step} from "./step.js";

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

// Channels are plain arrays, even for typed array data, so they can hold any value. A string that
// names a bound channel takes its values, such as {y: "v2"}; other strings are constants.
export function valueOf(data, options, channels) {
  const values = flatten(options).map(([key, value]) => {
    if (value !== null && typeof value === "object" && value.preserve) return [key, value];
    if (!functions.has(key) && isChannel(key, value, channels)) {
      return [key, Array.from(data, (d) => d[value])];
    }
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
  if (this._join) throw new Error("Split a joined flow before appending into it: const [a, b] = flow.");
  const flow = this._data ? this : this.data((d) => [d]);
  const node = appendNode(flow, render, options);
  this._parent._children.push(node);
  const state = step(this._context, () => ({groups: flow._groups, values: null, branches: null}));
  return new Flow(state, null, node, this._context);
}

// The node of a shape added to a flow, whose values for each group are computed when it's needed. A
// flow of an array has one group, drawn under every parent row; a flow of a function, such as
// flow.data((d) => d.children), has one group per parent row, across the parent's groups.
export function appendNode(flow, render, options) {
  const state = step(flow._context, () => {
    const groups = flow._groups;
    const data = flow._values;
    // A shape marked raw, such as an axis, receives its options as they are, not per datum.
    const empty = render.raw || Object.keys(options).length === 0;
    return groups.map((group, j) => {
      const context = data?.[j];
      const bound = context?.value;
      const I = context?.I ?? group.map((_, i) => i);
      if (empty) return {I, render, options, value: {...bound}, group, context};
      // A context may resolve the options of the shapes added to it, such as a context whose
      // strings name the fields of its data.
      const resolved = context?.resolve ? context.resolve(options, context) : options;
      const value = valueOf(bound ? rowsOf(bound, group) : group, resolved, bound);
      return {I, render, options, value: {...bound, ...value}, group, context};
    });
  });
  return new Node(state, [], flow._parent, typeof flow._data !== "function");
}
