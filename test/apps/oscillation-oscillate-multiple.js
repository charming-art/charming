import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function oscillationOscillateMultiple() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const oscillators = cc.range(20).map(() => ({
    angle: cc.vec(),
    velocity: cc.vec(cc.random(-0.05, 0.05), cc.random(-0.05, 0.05)),
    amplitude: cc.vec(cc.random(app.prop("width") / 2), cc.random(app.prop("height") / 2)),
  }));

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      const group = app.append(cc.group, {
        x: app.prop("width") / 2,
        y: app.prop("height") / 2,
      });
      const x = (d) => Math.sin(d.angle.x) * d.amplitude.x;
      const y = (d) => Math.sin(d.angle.y) * d.amplitude.y;
      group
        .data(oscillators)
        .process(cc.each, (d) => d.angle.add(d.velocity))
        .call((d) => d.append(cc.link, { x: 0, y: 0, x1: x, y1: y }))
        .call((d) =>
          d.append(cc.circle, {
            x,
            y,
            r: 16,
            stroke: "#000",
            fill: cc.rgb(175),
            fillOpacity: 0.5,
          }),
        );
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
