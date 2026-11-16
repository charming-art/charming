import {center} from "./box.js";
import {define} from "./define.js";

// Like cm.rect, a circle can span from x to x1 and from y to y1, in either order: it's centered in
// that box, and without r, it fits the box.
function maybeBox(value, options) {
  const {value: centered, spanX, spanY} = center(value, options);
  if ((!spanX && !spanY) || value.r !== undefined) return centered;
  const {x: X, x1: X1, y: Y, y1: Y1} = value;
  const n = (spanX ? X1 : Y1).length;
  centered.r = Array.from({length: n}, (_, i) => {
    const w = spanX ? Math.abs(X1[i] - X[i]) : Infinity;
    const h = spanY ? Math.abs(Y1[i] - Y[i]) : Infinity;
    return Math.min(w, h) / 2;
  });
  return centered;
}

export const circle = define((renderer, I, value, options, group) => {
  value = maybeBox(value, options);
  if (renderer.circles) return renderer.circles(I, value, group);
  const {
    x: X = [],
    y: Y = [],
    r: R = [],
    fill: F = [],
    stroke: S = [],
    strokeWidth: SW = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
  } = value;
  for (const i of I) {
    renderer.circle({
      x: X[i],
      y: Y[i],
      r: R[i],
      fill: F[i],
      stroke: S[i],
      strokeWidth: SW[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
    });
  }
});
