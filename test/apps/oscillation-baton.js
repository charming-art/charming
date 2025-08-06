import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function oscillationBaton() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      const group = app.append(cc.group, {
        x: app.prop("width") / 2,
        y: app.prop("height") / 2,
        rotate: app.prop("frameCount") / 50,
      });
      group.append(cc.link, { x: -80, y: 0, x1: 80, y1: 0 });
      group.append(cc.circle, { x: -80, y: 0, r: 5, fill: "black" });
      group.append(cc.circle, { x: 80, y: 0, r: 5, fill: "black" });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
