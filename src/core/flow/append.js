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
    const row = (rows[i] = {datum: group[i]});
    for (const key in value) row[key] = Array.isArray(value[key]) ? value[key][i] : value[key];
  }
  return rows;
}

export function flow$append(render, options = {}) {
  const flow = this._data ? this : this.data((d) => [d]);
  const groups = flow._groups;
  const parent = this._parent;
  const data = flow._values;
  const values = groups.map((group, j) => {
    const bound = data?.[j].value;
    const value = valueOf(bound ? rowsOf(bound, group) : group, options);
    return {I: group.map((_, i) => i), render, options, value: {...bound, ...value}, group};
  });
  const node = new Node(values, [], parent);
  parent._children.push(node);
  return new Flow(groups, null, node, this._context);
}
