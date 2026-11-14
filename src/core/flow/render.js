import {Flow} from "./index.js";

function renderNode(renderer, node, index, context) {
  const data = node._data[index];
  const {render, I, value, options, group} = data;
  const {builtin} = render;
  const children = node._children;
  if (!builtin) {
    node._children = [];
    const flow = new Flow([I], I, node, context);
    render(flow, value);
    const children = node._children;
    if (!children.length) return;
    for (const child of children) renderNode(renderer, child, 0, context);
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
    for (const child of children) renderNode(renderer, child, k, context);
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
