import { Flow } from "./index.js";
import { valueOf } from "./_valueOf.js";

export function flow$append(render, options) {
  const values = valueOf(this._data, options);
  const flow = new Flow({
    data: this._shape ? [0] : this._data,
    app: this._app,
    shape: { render, options },
    parent: this,
    value: Object.fromEntries(values),
  });
  this._children.push(flow);
  return flow;
}