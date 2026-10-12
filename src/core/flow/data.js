import {Flow} from "./index.js";

export function flow$data(data) {
  if (arguments.length === 0) return this._groups;

  if (typeof data !== "function") {
    return new Flow([data], data, this._parent, this._context);
  }

  const groups = this._groups;
  const context = this._context;
  const m = groups.length;
  const newGroups = [];

  for (let j = 0; j < m; j++) {
    const group = groups[j];
    const n = group.length;
    for (let i = 0; i < n; i++) {
      const newGroup = data.call(this, group[i], i, group, this);
      newGroups.push(newGroup);
    }
  }

  return new Flow(newGroups, data, this._parent, context);
}
