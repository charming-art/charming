import {flow$append} from "./append.js";

export function flow$add(render, options) {
  flow$append.call(this, render, options);
  return this;
}
