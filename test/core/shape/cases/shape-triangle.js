import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeTriangle() {
  return renderFlow(
    (root) => {
      root
        .data([
          [10, 10, 100, 10, 100, 100],
          [210, 10, 300, 10, 300, 100],
        ])
        .transform(cm.bind, {
          x: (d) => d[0],
          y: (d) => d[1],
          x1: (d) => d[2],
          y1: (d) => d[3],
          x2: (d) => d[4],
          y2: (d) => d[5],
          fill: (_, i) => i,
        })
        .transform(cm.scale, {
          fill: {
            scale: "ordinal",
            range: ["steelblue", "orange"],
          },
        })
        .append(cm.triangle);
    },
    {width: 600, height: 200},
  );
}
