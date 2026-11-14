import {create} from "./create.js";

export function svg$init({width, height}) {
  const node = create("svg", {xmlns: "http://www.w3.org/2000/svg", width, height, viewBox: `0 0 ${width} ${height}`});
  Object.assign(this, {_node: node, _group: node, _stack: []});
  Object.assign(this._props, {width, height});
  return this;
}
