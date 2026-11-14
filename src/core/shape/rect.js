import {define} from "./define.js";

// A rect can span from x to x1 and from y to y1, in either direction.
function maybeSpan(value) {
  const {x: X, x1: X1, y: Y, y1: Y1} = value;
  if (X1 === undefined && Y1 === undefined) return value;
  value = {...value};
  if (X1 !== undefined) {
    value.x = X.map((x, i) => Math.min(x, X1[i]));
    value.width = X.map((x, i) => Math.abs(X1[i] - x));
  }
  if (Y1 !== undefined) {
    value.y = Y.map((y, i) => Math.min(y, Y1[i]));
    value.height = Y.map((y, i) => Math.abs(Y1[i] - y));
  }
  return value;
}

export const rect = define((renderer, I, value, options, group) => {
  value = maybeSpan(value);
  if (renderer.rects) return renderer.rects(I, value, group);
  const {
    x: X = [],
    y: Y = [],
    width: W = [],
    height: H = [],
    fill: F = [],
    stroke: S = [],
    rotate: R = [],
    anchor: A = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
    strokeWidth: SW = [],
  } = value;
  for (const i of I) {
    renderer.rect({
      x: X[i],
      y: Y[i],
      width: W[i],
      height: H[i],
      stroke: S[i],
      fill: F[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
      strokeWidth: SW[i],
      ...(A[i] && {anchor: A[i]}),
      ...(R[i] && {rotate: R[i]}),
    });
  }
});
