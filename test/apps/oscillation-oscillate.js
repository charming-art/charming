import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function oscillationOscillate() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      const amplitude = 100;
      const period = 120;
      const group = app.append(cc.group, {
        x: app.prop("width") / 2,
        y: app.prop("height") / 2,
      });
      const x = amplitude * Math.cos((cc.TWO_PI * app.prop("frameCount")) / period);
      const y = 0;
      group.append(cc.link, { x: 0, y: 0, x1: x, y1: y });
      group.append(cc.circle, { x, y, r: 16, fill: "black" });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
