import {append, degrees} from "./create.js";

export function svg$line({stroke, strokeWidth, strokeCap, x, y, x1, y1, rotate, transformOrigin = "start"}) {
  let transform = null;
  if (rotate) {
    const [mx, my] =
      transformOrigin === "center" ? [(x + x1) / 2, (y + y1) / 2] : transformOrigin === "end" ? [x1, y1] : [x, y];
    transform = `rotate(${degrees(rotate)},${mx},${my})`;
  }
  append(this, "line", {
    x1: x,
    y1: y,
    x2: x1,
    y2: y1,
    stroke: stroke,
    "stroke-width": strokeWidth,
    "stroke-linecap": strokeCap,
    transform: transform,
  });
  return this;
}
