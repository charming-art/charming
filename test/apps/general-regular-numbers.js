import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";

// @see https://observablehq.com/@fil/regular-numbers
export function generalRegularNumbers() {
  const N = 511;
  const x = ([i, j, k]) => 0.5 * i + 2 * j - 3.6 * k;
  const value = ([i, j, k]) => 2 ** i * 3 ** j * 5 ** k;

  const numbers = cc
    .cross(
      cc.range(1 + Math.log(N) / Math.log(2)),
      cc.range(1 + Math.log(N) / Math.log(3)),
      cc.range(1 + Math.log(N) / Math.log(5)),
    )
    .filter((d) => value(d) <= N);

  const applyScale = (flow) => {
    flow.transform(cc.mapPosition, {
      scaleY: cc.scaleLog,
      padding: 15,
      domainX: cc.extent(numbers, x),
      domainY: cc.extent(numbers, value),
      reverseY: true,
    });
  };

  const app = cc.app();

  app
    .data(
      numbers
        .flatMap(([i, j, k]) => [
          [
            [i - 1, j, k],
            [i, j, k],
          ],
          [
            [i, j - 1, k],
            [i, j, k],
          ],
          [
            [i, j, k - 1],
            [i, j, k],
          ],
        ])
        .filter(([n]) => Math.min(...n) >= 0),
    )
    .append(cc.link, {
      x: ([n]) => x(n),
      y: ([n]) => value(n),
      x1: ([, n]) => x(n),
      y1: ([, n]) => value(n),
      stroke: "lightblue",
    })
    .call(applyScale);

  app
    .data(numbers)
    .append(cc.circle, {
      x: x,
      y: value,
      r: 12,
      fill: "white",
      stroke: "black",
    })
    .call(applyScale);

  app
    .data(numbers)
    .append(cc.text, {
      x: x,
      y: value,
      text: value,
      textAlign: "center",
      textBaseline: "middle",
    })
    .call(applyScale);

  return app.call(dispose).render().node();
}
