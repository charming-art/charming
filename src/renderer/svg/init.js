import {create} from "./create.js";

// A width or height that isn't given is auto: a transform such as cm.plane may resize it.
export function svg$init({width, height}) {
  const auto = {width: width === undefined, height: height === undefined};
  width ??= 640;
  height ??= 480;
  const node = create("svg", {xmlns: "http://www.w3.org/2000/svg", width, height, viewBox: `0 0 ${width} ${height}`});
  Object.assign(this, {_node: node, _group: node, _stack: []});
  Object.assign(this._props, {width, height, auto});
  return this;
}
