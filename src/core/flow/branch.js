import {Flow} from "./index.js";
import {force, step} from "./step.js";

// Branches the flow into pipelines and joins them: each branch is a function of the flow that
// returns its pipeline, such as its data and transforms, at the same level. The joined flow holds
// the contexts of every branch, in order, so that the next transform sees them all, such as
// cm.plane resolving scales across layers. Destructuring the joined flow, then or after more
// transforms, splits it into one flow per branch, which take their own shapes.
export function flow$branch(...branches) {
  const flows = branches.map((branch) => branch(this));
  const nested = this._parent !== this._context.root;
  for (const flow of flows) {
    if (!(flow instanceof Flow)) throw new Error("Each branch must return its flow, such as (flow) => flow.data(A).");
    if (flow._parent !== this._parent) {
      throw new Error("Each branch must end at its flow's level: append after the join and the split.");
    }
    // In a nested flow, each context is drawn under its parent row; an array would be drawn under
    // every row, with the frame of the first.
    if (nested && typeof flow._data !== "function") {
      throw new Error("A branch of a nested flow keeps its rows: nest data with a function, not an array.");
    }
  }
  const data = flows.map((flow) => flow._data);
  const state = step(this._context, () => {
    const groups = [];
    const values = [];
    const counts = [];
    for (const flow of flows) {
      const n = flow._groups.length;
      for (let j = 0; j < n; j++) {
        groups.push(flow._groups[j]);
        values.push(flow._values?.[j]);
      }
      counts.push({count: n, data: flow._data});
    }
    const hasValues = flows.some((flow) => flow._values);
    if (hasValues && !flows.every((flow) => flow._values)) {
      throw new Error("Either every branch or none binds channels, such as with cm.encode, before the join.");
    }
    return {groups, values: hasValues ? values : null, branches: counts};
  });
  return new Flow(state, data, this._parent, this._context, data);
}

// The flows of the branches of a joined flow, with their contexts; a flow without branches is its
// only flow. How many branches is known as the flow is built; their rows, when they're needed.
export function* flow$iterator() {
  const join = this._join;
  if (!join) return yield this;
  for (let b = 0; b < join.length; b++) {
    const state = step(this._context, () => {
      const {groups, values, branches} = force(this._state);
      let start = 0;
      for (let k = 0; k < b; k++) start += branches[k].count;
      const end = start + branches[b].count;
      return {groups: groups.slice(start, end), values: values ? values.slice(start, end) : null, branches: null};
    });
    yield new Flow(state, join[b], this._parent, this._context);
  }
}
