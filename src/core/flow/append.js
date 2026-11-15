import {Flow} from "./index.js";
import {Node} from "../node.js";
import {isColor} from "../color.js";

// Whether a string option names a bound channel. Like cm.encode, a color for fill or stroke is a
// constant, even if a channel has its name.
function isChannel(key, value, channels) {
  if (typeof value !== "string" || !channels || !Object.hasOwn(channels, value)) return false;
  return !((key === "fill" || key === "stroke") && isColor(value));
}

// Channels are plain arrays, even for typed array data, so they can hold any value. A string that
// names a bound channel takes its values, such as {y: "v2"}; other strings are constants.
export function valueOf(data, options, channels) {
  const values = Object.entries(options).map(([key, value]) => {
    if (value !== null && typeof value === "object" && value.preserve) return [key, value];
    if (isChannel(key, value, channels)) {
      return [key, Array.from(data, (d) => d[value])];
    }
    if (Array.isArray(value)) return [key, Array.from(data, (d, i) => value[+d || i])];
    const v = typeof value === "function" ? value : () => value;
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
    const value = valueOf(bound ? rowsOf(bound, group) : group, options, bound);
    return {I, render, options, value: {...bound, ...value}, group, context};
  });
  const node = new Node(values, [], parent);
  parent._children.push(node);
  return new Flow(groups, null, node, this._context);
}
