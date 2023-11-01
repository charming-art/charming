import * as cm from "../../src/index.js";
import { frame } from "./_frame.js";
import { dispose } from "./_dispose.js";
import { stats } from "./_stats.js";

export function randomNormal() {
  const app = cm.app({
    width: 640,
    height: 240,
  });

  const random = cm.randomNormal(app.prop("width") / 2, 60);

  function update() {
    app.append(cm.circle, {
      x: random(),
      y: app.prop("height") / 2,
      r: 16,
      fill: "#000",
      fillOpacity: 0.1,
    });
  }

  app.on("update", update);

  return app.call(dispose).call(stats).call(frame).start();
}