import {define} from "../core/shape/define.js";

export const figlet = define((renderer, I, value) => {
  if (!renderer.figlet) throw new Error("cm.figlet requires the terminal renderer.");
  const {
    text: T = [],
    x: X = [],
    y: Y = [],
    fill: F = [],
    textAlign: TA = [],
    textBaseline: TB = [],
    fontFamily: FF = [],
  } = value;
  for (const i of I) {
    renderer.figlet({
      text: T[i],
      x: X[i],
      y: Y[i],
      fill: F[i],
      textAlign: TA[i],
      textBaseline: TB[i],
      fontFamily: FF[i],
    });
  }
});
