import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function randomNormal() {
  const app = cc.app({
    width: 640,
    height: 240,
  });

  const random = cc.randomNormal(app.prop("width") / 2, 60);

  function update() {
    app.append(cc.circle, {
      x: random(),
      y: app.prop("height") / 2,
      r: 16,
      fill: "#000",
      fillOpacity: 0.1,
    });
  }

  app.on("update", update);

  return app.call(dispose).call(stats).call(frame).start().node();
}
