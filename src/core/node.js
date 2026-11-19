import {force} from "./flow/step.js";

// A node of the tree: the values of a shape for each group, computed by its step, and its children.
// A shared node, from a flow of an array such as flow.data([1, 2]), has one group drawn under every
// parent row.
export function Node(state = null, children = [], parent = null, shared = false) {
  Object.defineProperties(this, {
    _state: {value: state},
    _children: {value: children, writable: true},
    _parent: {value: parent},
    _shared: {value: shared},
  });
}

Object.defineProperty(Node.prototype, "_data", {
  get() {
    return this._state ? force(this._state) : null;
  },
});
