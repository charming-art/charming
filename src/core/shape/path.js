import {define} from "./define.js";

export const path = define((renderer, I, value) => {
  const {
    x: X = [],
    y: Y = [],
    fill: F = [],
    stroke: S = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
    strokeWidth: SW = [],
    strokeCap: SC = [],
    strokeJoin: SJ = [],
    d: D = [],
  } = value;
  for (const i of I) {
    renderer.path({
      x: X[i],
      y: Y[i],
      d: D[i],
      stroke: S[i],
      fill: F[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
      strokeWidth: SW[i],
      strokeCap: SC[i],
      strokeJoin: SJ[i],
    });
  }
});
