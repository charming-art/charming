import {Flow} from "./index.js";
import {concrete, step} from "./step.js";

export function flow$data(data) {
  if (arguments.length === 0) return this._groups;

  // A function nests data in each row, which must be numbered per branch, so a joined flow is split
  // first; an array starts a new flow at the same level.
  if (typeof data === "function" && this._join) {
    throw new Error("Split a joined flow before nesting data in it: const [a, b] = flow.");
  }

  if (typeof data !== "function") {
    return new Flow(concrete([data]), data, this._parent, this._context);
  }

  // The data of each row, numbered across the groups, computed when the flow is needed.
  const flow = this;
  const state = step(this._context, () => {
    const groups = flow._groups;
    const newGroups = [];
    for (const group of groups) {
      const n = group.length;
      for (let i = 0; i < n; i++) newGroups.push(data.call(flow, group[i], i, group, flow));
    }
    return {groups: newGroups, values: null, branches: null};
  });
  return new Flow(state, data, this._parent, this._context);
}
