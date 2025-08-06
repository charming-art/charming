import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function randomDistribution() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const N = cc.range(15).map(() => 0);
  const step = app.prop("width") / N.length;

  app.on("update", () => {
    const index = cc.random(N.length) | 0;
    N[index] += 1;

    app.data(N).append(cc.rect, {
      x: (_, i) => i * step,
      y: (d) => app.prop("height") - d,
      width: step - 2,
      height: (d) => d,
      fill: cc.rgb(127),
      stroke: "black",
    });
  });

  return app.call(dispose).call(stats).call(frame).start().node();
}
