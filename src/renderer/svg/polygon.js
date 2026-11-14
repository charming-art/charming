import {append, paint} from "./create.js";

export function svg$polygon({x: X, y: Y, ...options}) {
  const points = X.map((x, i) => `${x},${Y[i]}`).join(" ");
  append(this, "polygon", {points, ...paint(options)});
  return this;
}
