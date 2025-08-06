import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function vectorCircleBouncing() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const location = cc.vec(app.prop("width") / 2, app.prop("height") / 2);
  const velocity = cc.vec(1, 2.3);

  app
    .on("update", () => {
      location.add(velocity);
      if (!location.inX(app.prop("width"))) velocity.negX();
      if (!location.inY(app.prop("height"))) velocity.negY();
    })
    .on("update", () => {
      app.append(cc.clear, { fill: cc.rgb(255) });
      app.append(cc.circle, {
        x: location.x,
        y: location.y,
        r: 16,
        stroke: cc.rgb(0),
        fill: cc.rgb(175),
      });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
