// A node of the tree: the values of a shape for each group, and its children. A shared node, from
// a flow of an array such as flow.data([1, 2]), has one group drawn under every parent row.
export function Node(data = null, children = [], parent = null, shared = false) {
  Object.defineProperties(this, {
    _data: {value: data, writable: true},
    _children: {value: children, writable: true},
    _parent: {value: parent},
    _shared: {value: shared},
  });
}
