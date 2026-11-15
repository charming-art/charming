import {Flow} from "./index.js";

// The first row of each group of a node, across all its groups: the groups of a child flow, such
// as flow.data((d) => d.children), are numbered across the rows of all the parent's groups.
const offsetsOf = new WeakMap();

function offsets(node) {
  let O = offsetsOf.get(node);
  if (O) return O;
  O = [0];
  for (const {group} of node._data) O.push(O[O.length - 1] + group.length);
  offsetsOf.set(node, O);
  return O;
}

// The group of a child under row k of a node's group: the row's position across the node's
// groups, or the only group of a shared child.
function childIndex(child, node, index, k) {
  return child._shared ? 0 : offsets(node)[index] + k;
}

function renderNode(renderer, node, index, context) {
  const data = node._data[index];
  const {render, I, value, options, group, context: bound} = data;
  const {builtin} = render;
  const children = node._children;
  if (!builtin) {
    // A composite shape makes its own children, such as the ticks of an axis, which are drawn once.
    // They're kept apart from the children appended to it, which are drawn for each of its rows,
    // so that a composite drawn for several groups draws only the children it made for each one.
    node._children = [];
    const flow = new Flow([I], I, node, context);
    // A composite shape also receives the context of its flow, such as the scales recorded by
    // transforms, and its options as given.
    render(flow, value, {...bound, options});
    const made = node._children;
    node._children = children;
    for (const child of made) renderNode(renderer, child, 0, context);
  }
  if (builtin) render(renderer, I, value, options, group);
  if (!children.length) return;
  for (let i = 0; i < I.length; i++) {
    const k = I[i];
    if (value) {
      const {x: X = [], y: Y = [], rotate: R = []} = value;
      const x = X[k] ?? 0;
      const y = Y[k] ?? 0;
      const r = R[k];
      renderer.save();
      renderer.translate(x, y);
      if (r !== undefined) renderer.rotate(r);
    }
    for (const child of children) renderNode(renderer, child, childIndex(child, node, index, k), context);
    if (value) renderer.restore();
  }
}

export function flow$render() {
  const context = this._context;
  const {root, renderer} = context;
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before flow.render().");
  root._children.forEach((d) => renderNode(renderer, d, 0, context));
  root._children = [];
  if (renderer.render) renderer.render();
  return this;
}
