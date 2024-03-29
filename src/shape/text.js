import { define } from "./define.js";

export const text = define((renderer, I, value) => {
  const {
    text: T = [],
    x: X = [],
    y: Y = [],
    fill: F = [],
    stroke: S = [],
    fillOpacity: FO = [],
    strokeOpacity: SO = [],
    strokeWidth: SW = [],
    textBaseline: TB = [],
    textAlign: TA = [],
    fontFamily: FF = [],
    fontSize: FS = [],
  } = value;
  for (const i of I) {
    renderer.text({
      x: X[i],
      y: Y[i],
      text: T[i],
      stroke: S[i],
      fill: F[i],
      fillOpacity: FO[i],
      strokeOpacity: SO[i],
      strokeWidth: SW[i],
      textBaseline: TB[i],
      textAlign: TA[i],
      fontFamily: FF[i],
      fontSize: FS[i],
    });
  }
});
