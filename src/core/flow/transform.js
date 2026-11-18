import {Flow} from "./index.js";
import {flow$add} from "./add.js";

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
  const transformed = new Flow(groups, flow._data, flow._parent, flow._context, values, branches);
  // A transform may come with the marks that draw what it resolved, such as the axes of cm.plane:
  // transform.marks returns them as [shape, options] pairs, which are added right after it, before
  // the shapes added to the flow, marked implicit, so that a shape may tell when one of its kind,
  // added explicitly, replaces it. A pair may end with {front: true}, such as the tick labels of an
  // axis: that mark is drawn in front, after the shapes added to the flow, rather than under them.
  const marks = values && transform.marks?.(values, ...params);
  if (marks) {
    const children = flow._parent._children;
    for (const [shape, options, {front} = {}] of marks) {
      const start = children.length;
      flow$add.call(transformed, shape, {...options, implicit: true});
      if (front) for (const node of children.slice(start)) Object.defineProperty(node, "_front", {value: true});
    }
  }
  return transformed;
}
