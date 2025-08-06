import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function oscillationDone() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      const r = 75;
      const theta = app.prop("frameCount") / 50;
      const group = app.append(cc.group, {
        x: app.prop("width") / 2,
        y: app.prop("height") / 2,
      });
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      group.append(cc.link, { x: 0, y: 0, x1: x, y1: y });
      group.append(cc.circle, { x, y, r: 16, fill: "#000" });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
