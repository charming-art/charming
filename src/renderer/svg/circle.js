import {append, paint} from "./create.js";

export function svg$circle({x = 0, y = 0, r = 0, ...options}) {
  append(this, "circle", {cx: x, cy: y, r, ...paint(options)});
  return this;
}
