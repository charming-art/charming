import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function randomDragon() {
  const width = 640,
    height = 640,
    x = cc.randomNoise(0, width),
    y = cc.randomNoise(0, height),
    size = cc.randomNoise(0, 100),
    rotate = cc.randomNoise(0, cc.TWO_PI),
    hue = cc.randomNoise(0, 360);

  function setup(app) {
    app.append(cc.clear, { fill: "orange" });
  }

  function update(app) {
    const t = app.prop("frameCount") / 100;
    app
      .append(cc.group, {
        rotate: rotate(t),
        x: x(t),
        y: y(t),
      })
      .append(cc.rect, {
        x: 0,
        y: 0,
        width: size(t),
        height: size(t),
        fill: cc.hsl(hue(t), 100, 50),
        stroke: "black",
        fillOpacity: 0.5,
      });
  }

  return cc
    .app({ width: 640, height: 640 })
    .on("beforeAll", setup)
    .on("update", update)
    .call(dispose)
    .call(stats)
    .start()
    .node();
}
