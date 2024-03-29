import * as cm from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function vectorMoveLink() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  app.on("update", () => {
    const center = cm.vec(app.prop("width") / 2, app.prop("height") / 2);
    const mouse = cm.vec(app.prop("mouseX"), app.prop("mouseY"));
    const dir = cm.vecSub(mouse, center);
    app.append(cm.clear, { fill: cm.rgb(255) });
    app.append(cm.link, {
      x: center.x,
      y: center.y,
      x1: center.x + dir.x,
      y1: center.y + dir.y,
    });
  });

  return app.call(dispose).call(stats).call(frame).start().node();
}
