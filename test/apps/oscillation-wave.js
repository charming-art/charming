import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function oscillationWave() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const X = cc.range(50, cc.TWO_PI);

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      app
        .data(X)
        .append(cc.circle, {
          x: (d) => d,
          y: (d) => Math.sin(d + app.prop("frameCount") / 30),
          r: 20,
          fill: "rgba(175, 175, 175, 0.5)",
          stroke: "#000",
          strokeWidth: 1,
        })
        .transform(cc.mapAttrs, {
          x: { range: [0, app.prop("width")] },
          y: { range: [0, app.prop("height")] },
        });
    });

  return app.call(dispose).call(frame).call(stats).start().node();
}
