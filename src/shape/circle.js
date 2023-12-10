export function circle(renderer, I, value) {
  const {
    x: X,
    y: Y,
    r: R,
    fill: F = [],
    stroke: S = [],
    strokeWidth: SW = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
    fontWeight: FW = [],
    fontFamily: FF = [],
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
      fontWeight: FW[i],
      fontFamily: FF[i],
    });
  }
}
