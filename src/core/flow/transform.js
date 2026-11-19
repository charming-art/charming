import {Flow} from "./index.js";
import {flow$add} from "./add.js";
import {force, step} from "./step.js";

// A transform may return contexts with new rows, such as one row per unit of a count: the new flow
// takes its groups from the contexts, so that later transforms and shapes use the new rows. The
// branches of a joined flow are kept, as transforms keep one context per context. The transform runs
// when the flow is needed, after the steps built before it.
export function flow$transform(transform, ...params) {
  const flow = this._data ? this : this.data((d) => [d]);
  const context = flow._context;
  // Its marks are known before it's queued, so that if they throw, nothing of it is left to run.
  const marks = transform.marks ? transform.marks(...params) : null;
  const state = step(context, () => {
    const values = transform(flow, flow._values, ...params);
    const branches = flow._branches;
    if (branches && values && values.length !== branches.reduce((n, {count}) => n + count, 0)) {
      throw new Error("A transform of a joined flow must keep one context per context: split the flow first.");
    }
    const groups = values ? values.map((context, j) => context.group ?? flow._groups[j]) : flow._groups;
    return {groups, values, branches};
  });
  const transformed = new Flow(state, flow._data, flow._parent, context, flow._join);
  // A transform may come with shapes of its own, such as the axes of a chart: transform.marks returns
  // them, given the transform's params, as [shape, options] pairs, which are added right after it,
  // before the shapes added to the flow, in every branch of a joined flow. A pair may end with
  // {front: true}: that shape is drawn in front, after the shapes added to the flow, rather than
  // under them. They draw what the transform resolved, its contexts: none if it returns none.
  if (marks) {
    const own = step(context, () => {
      const {groups, values, branches} = force(state);
      if (values) return {groups, values, branches};
      return {groups: [], values: null, branches: branches?.map((branch) => ({...branch, count: 0})) ?? null};
    });
    const marked = new Flow(own, flow._data, flow._parent, context, flow._join);
    const children = flow._parent._children;
    for (const [shape, options, {front} = {}] of marks) {
      const start = children.length;
      flow$add.call(marked, shape, options);
      if (front) for (const node of children.slice(start)) Object.defineProperty(node, "_front", {value: true});
    }
  }
  return transformed;
}
