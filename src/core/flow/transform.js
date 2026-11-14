import {Flow} from "./index.js";

export function flow$transform(transform, ...params) {
  const flow = this._data ? this : this.data((d) => [d]);
  const values = transform(flow, flow._values, ...params);
  return new Flow(flow._groups, flow._data, flow._parent, flow._context, values);
}
