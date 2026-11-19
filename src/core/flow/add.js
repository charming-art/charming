import {flow$append} from "./append.js";

// Adds a shape to the flow and returns the flow. In a joined flow, the shape is added in every
// branch, such as an axis for all the layers.
export function flow$add(render, options) {
  if (this._join) for (const flow of this) flow$append.call(flow, render, options);
  else flow$append.call(this, render, options);
  return this;
}
