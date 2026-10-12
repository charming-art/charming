import {flow$append} from "./append.js";
import {flow$call} from "./call.js";
import {flow$data} from "./data.js";
import {flow$datum} from "./datum.js";
import {flow$process} from "./process.js";
import {flow$transform} from "./transform.js";
import {flow$renderer} from "./renderer.js";
import {flow$render} from "./render.js";
import {Node} from "../node.js";

export function Flow(groups = null, data = null, parent = null, context = null) {
  Object.defineProperties(this, {
    _groups: {value: groups},
    _parent: {value: parent},
    _context: {value: context},
    _data: {value: data},
  });
}

Object.defineProperties(Flow.prototype, {
  call: {value: flow$call},
  append: {value: flow$append},
  data: {value: flow$data},
  datum: {value: flow$datum},
  process: {value: flow$process},
  transform: {value: flow$transform},
  renderer: {value: flow$renderer},
  render: {value: flow$render},
});

export function flow() {
  const root = new Node();
  const context = {root, renderer: null};
  return new Flow([[0]], [0], root, context);
}
