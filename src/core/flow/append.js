import {Flow} from "./index.js";
import {Node} from "../node.js";

export function valueOf(data, options) {
  const values = Object.entries(options).map(([key, value]) => {
    if (value !== null && typeof value === "object" && value.constant) return [key, value.value];
    if (value !== null && typeof value === "object" && value.preserve) return [key, value];
    if (Array.isArray(value)) return [key, data.map((d, i) => value[+d || i])];
    const v = typeof value === "function" ? value : () => value;
    const V = data.map(v);
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
  const empty = Object.keys(options).length === 0;
  const values = groups.map((group, j) => {
    const context = data?.[j];
    const bound = context?.value;
    const I = context?.I ?? group.map((_, i) => i);
    if (empty) return {I, render, options, value: {...bound}, group};
    const value = valueOf(bound ? rowsOf(bound, group) : group, options);
    return {I, render, options, value: {...bound, ...value}, group};
  });
  const node = new Node(values, [], parent);
  parent._children.push(node);
  return new Flow(groups, null, node, this._context);
}
