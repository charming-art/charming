import {define} from "./define.js";

// Like cm.rect, a circle can span from x to x1 and from y to y1, in either order: it's centered in
// that box, and without r, it fits the box. A position set in the options without its pair, such as
// {y: "v2"} over a bound y1, is a point, not a box.
function maybeBox(value, options = {}) {
  const span = (key, key1) => value[key1] !== undefined && (options[key] === undefined || options[key1] !== undefined);
  const spanX = span("x", "x1");
  const spanY = span("y", "y1");
  if (!spanX && !spanY) return value;
  const {x: X, x1: X1, y: Y, y1: Y1, r: R} = value;
  value = {...value};
  if (spanX) value.x = X.map((x, i) => (x + X1[i]) / 2);
  if (spanY) value.y = Y.map((y, i) => (y + Y1[i]) / 2);
  if (R === undefined) {
    const n = (spanX ? X1 : Y1).length;
    value.r = Array.from({length: n}, (_, i) => {
      const w = spanX ? Math.abs(X1[i] - X[i]) : Infinity;
      const h = spanY ? Math.abs(Y1[i] - Y[i]) : Infinity;
      return Math.min(w, h) / 2;
    });
  }
  return value;
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
