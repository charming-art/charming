import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function vectorMoveLink() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  app.on("update", () => {
    const center = cc.vec(app.prop("width") / 2, app.prop("height") / 2);
    const mouse = cc.vec(app.prop("mouseX"), app.prop("mouseY"));
    const dir = cc.vecSub(mouse, center);
    app.append(cc.clear, { fill: cc.rgb(255) });
    app.append(cc.link, {
      x: center.x,
      y: center.y,
      x1: center.x + dir.x,
      y1: center.y + dir.y,
    });
  });

  return app.call(dispose).call(stats).call(frame).start().node();
}
