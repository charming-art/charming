import {Flow} from "./index.js";

// A transform may return contexts with new rows, such as one row per unit of a count: the new flow
// takes its groups from the contexts, so that later transforms and shapes use the new rows. The
// branches of a joined flow are kept, as transforms keep one context per context.
export function flow$transform(transform, ...params) {
  const flow = this._data ? this : this.data((d) => [d]);
  const values = transform(flow, flow._values, ...params);
  const branches = flow._branches;
  if (branches && values && values.length !== branches.reduce((n, {count}) => n + count, 0)) {
    throw new Error("A transform of a joined flow must keep one context per context: split the flow first.");
  }
  const groups = values ? values.map((context, j) => context.group ?? flow._groups[j]) : flow._groups;
  return new Flow(groups, flow._data, flow._parent, flow._context, values, branches);
}
