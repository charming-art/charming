import {append, degrees, paint} from "./create.js";

export function svg$rect({x, y, width, height, rotate, anchor, ...options}) {
  if (anchor === "center") {
    x = x - width / 2;
    y = y - height / 2;
  }
  // SVG doesn't draw rects with a negative size, unlike Canvas.
  if (width < 0) {
    x += width;
    width = -width;
  }
  if (height < 0) {
    y += height;
    height = -height;
  }
  const transform = rotate ? `rotate(${degrees(rotate)},${x + width / 2},${y + height / 2})` : null;
  append(this, "rect", {x, y, width, height, transform, ...paint(options)});
  return this;
}
