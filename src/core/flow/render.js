import {Flow} from "./index.js";
import {animate, transitionOptions} from "../transition/index.js";
import {recorder} from "../transition/record.js";

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

// A number for each datum object, so that rows are identified by their data from render to render.
const ids = new WeakMap();
let nextId = 0;

function idOf(datum) {
  if (!ids.has(datum)) ids.set(datum, nextId++);
  return ids.get(datum);
}

// The identity of a row among the rows of its group: its key, else its datum if it's an object,
// else its index.
function rowOf(value, group, index, k) {
  const key = value?.key?.[k];
  if (key !== undefined) return `k${key}`;
  const datum = group?.[k];
  if (datum !== null && typeof datum === "object") return `d${idOf(datum)}`;
  return `i${index}:${k}`;
}

// The path of a node identifies its shape in the flow, and the scope the rows of the parents it's
// drawn under, so that transitions match what each shape draws from one render to the next.
function renderNode(renderer, node, index, context, path, scope) {
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
    for (let c = 0; c < made.length; c++) renderNode(renderer, made[c], 0, context, `${path}/m${c}`, scope);
  }
  if (builtin) {
    renderer.begin?.({path: `${scope}${path}`, scope, index, I, value, group});
    render(renderer, I, value, options, group);
    renderer.end?.();
  }
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
    const rowScope = `${scope}${path}[${rowOf(value, group, index, k)}]`;
    for (let c = 0; c < children.length; c++) {
      const child = children[c];
      renderNode(renderer, child, childIndex(child, node, index, k), context, `${path}/${c}`, rowScope);
    }
    if (value) renderer.restore();
  }
}

export function flow$render() {
  const context = this._context;
  const {root, renderer} = context;
  if (!renderer) throw new Error("No renderer: call flow.renderer(renderer) before flow.render().");
  // With transitions, what's drawn is recorded, then animated from what the renderer shows.
  const transition = transitionOptions(context.transition);
  const target = transition ? recorder() : renderer;
  const children = root._children;
  for (let i = 0; i < children.length; i++) renderNode(target, children[i], 0, context, `${i}`, "");
  root._children = [];
  if (transition) {
    if (!context.transitionState) context.transitionState = {};
    animate(context.transitionState, renderer, target.recorded, transition);
  } else if (renderer.render) renderer.render();
  return this;
}
