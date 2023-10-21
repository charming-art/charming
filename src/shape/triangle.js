export function triangle(renderer, I, value) {
  if (renderer.triangles) {
    renderer.triangles(I, value);
    return;
  }
  const {
    x: X,
    y: Y,
    x1: X1,
    y1: Y1,
    x2: X2,
    y2: Y2,
    fill: F = [],
    stroke: S = [],
    strokeWidth: SW = [],
    rotate: R = [],
    translateX: TX = [],
    translateY: TY = [],
  } = value;
  for (const i of I) {
    renderer.triangle({
      x: X[i],
      y: Y[i],
      x1: X1[i],
      y1: Y1[i],
      x2: X2[i],
      y2: Y2[i],
      fill: F[i],
      stroke: S[i],
      strokeWidth: SW[i],
      translateX: TX[i],
      translateY: TY[i],
      rotate: R[i],
    });
  }
}
