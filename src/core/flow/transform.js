import {Flow} from "./index.js";
import {Node} from "../node.js";
import {appendNode} from "./append.js";
import {failed, step} from "./step.js";

// A transform may return contexts with new rows, such as one row per unit of a count: the new flow
// takes its groups from the contexts, so that later transforms and shapes use the new rows. The
// branches of a joined flow are kept, as transforms keep one context per context. The transform runs
// when the flow is needed, after the steps built before it.
export function flow$transform(transform, ...params) {
  const flow = this._data ? this : this.data((d) => [d]);
  const context = flow._context;
  // A transform may come with the marks that draw what it resolved, such as the axes of cm.plane:
  // transform.marks returns them as [shape, options] pairs, which are added right after it, before
  // the shapes added to the flow, marked implicit, so that a shape may tell when one of its kind,
  // added explicitly, replaces it. A pair may end with {front: true}, such as the tick labels of an
  // axis: that mark is drawn in front, after the shapes added to the flow, rather than under them.
  // How many marks depends on the contexts, so a slot keeps their place among the shapes until the
  // transform runs.
  const children = transform.marks ? flow._parent._children : null;
  const slot = children ? new Node(null, [], flow._parent) : null;
  if (slot) children.push(slot);
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
  if (slot) {
    // The slot is replaced by the marks, or, if they fail, by a node that throws their error again
    // when it's drawn, so that the render fails as the transform did.
    const replace = (...nodes) => {
      const i = children.indexOf(slot);
      if (i >= 0) children.splice(i, 1, ...nodes);
    };
    step(context, () => {
      try {
        const values = transformed._values;
        const marks = (values && transform.marks(values, ...params)) || [];
        const nodes = [];
        for (const [shape, options, {front} = {}] of marks) {
          // In a joined flow, a mark is added in every branch, such as an axis for all the layers.
          for (const branch of transformed) {
            const node = appendNode(branch, shape, {...options, implicit: true});
            if (front) Object.defineProperty(node, "_front", {value: true});
            nodes.push(node);
          }
        }
        replace(...nodes);
      } catch (error) {
        replace(new Node(failed(error), [], flow._parent));
        throw error;
      }
    });
  }
  return transformed;
}
