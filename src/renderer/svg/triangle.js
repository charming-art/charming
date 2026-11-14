import {append, degrees, paint} from "./create.js";

export function svg$triangle({x, y, x1, y1, x2, y2, rotate, ...options}) {
  const transform = rotate ? `rotate(${degrees(rotate)})` : null;
  append(this, "polygon", {points: `${x},${y} ${x1},${y1} ${x2},${y2}`, transform, ...paint(options)});
  return this;
}
