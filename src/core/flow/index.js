import {flow$add} from "./add.js";
import {flow$branch, flow$iterator} from "./branch.js";
import {flow$append} from "./append.js";
import {flow$call} from "./call.js";
import {flow$data} from "./data.js";
import {flow$datum} from "./datum.js";
import {flow$transform} from "./transform.js";
import {flow$renderer} from "./renderer.js";
import {flow$render} from "./render.js";
import {flow$finished} from "./finished.js";
import {Node} from "../node.js";
import {concrete, force} from "./step.js";

// A flow: where the next shape is added, its parent, and the step that computes its rows, which runs
// when the flow is drawn or its rows are read, such as by a transform after it. What's known as it's
// built stays as it is: its data, an array or a function, and for a joined flow the data of its
// branches, join, which splits it.
export function Flow(state, data = null, parent = null, context = null, join = null) {
  Object.defineProperties(this, {
    _state: {value: state},
    _data: {value: data},
    _parent: {value: parent},
    _context: {value: context},
    _join: {value: join},
  });
}

// The rows of a flow by group, the contexts of its transforms, and the branches of a joined flow,
// computed by its step.
Object.defineProperties(Flow.prototype, {
  _groups: {
    get() {
      return force(this._state).groups;
    },
  },
  _values: {
    get() {
      return force(this._state).values;
    },
  },
  _branches: {
    get() {
      return force(this._state).branches;
    },
  },
});

Object.defineProperties(Flow.prototype, {
  call: {value: flow$call},
  append: {value: flow$append},
  add: {value: flow$add},
  branch: {value: flow$branch},
  [Symbol.iterator]: {value: flow$iterator},
  data: {value: flow$data},
  datum: {value: flow$datum},
  transform: {value: flow$transform},
  renderer: {value: flow$renderer},
  render: {value: flow$render},
  finished: {value: flow$finished},
});

// A flow takes options: transition, to animate from each render to the next, true or defaults such
// as {duration: 500, ease: "linear"}.
export function flow({transition} = {}) {
  const root = new Node();
  // The steps built and not yet run, in order, and how deep the steps running or the render are, while
  // which the steps built run right away.
  const context = {root, renderer: null, transition, queue: [], depth: 1};
  return new Flow(concrete([[0]]), [0], root, context);
}
