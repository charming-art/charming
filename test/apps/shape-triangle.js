import * as cm from "../../src/index.js";
import { frame } from "../frame.js";
import { dispose } from "../dispose.js";

export function shapeTriangle() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  app
    .data([
      [10, 10, 100, 10, 100, 100],
      [210, 10, 300, 10, 300, 100],
    ])
    .append(cm.triangle, {
      x: (d) => d[0],
      y: (d) => d[1],
      x1: (d) => d[2],
      y1: (d) => d[3],
      x2: (d) => d[4],
      y2: (d) => d[5],
      fill: (_, i) => i,
    })
    .transform(cm.mapAttrs, {
      fill: {
        scale: cm.scaleOrdinal,
        range: ["steelblue", "orange"],
      },
    });

  return app.call(dispose).call(frame).render().node();
}
