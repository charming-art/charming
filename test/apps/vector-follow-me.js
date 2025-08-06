import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function vectorFollowMe() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const movers = cc.range(20).map(() => ({
    location: cc.vec(cc.random(app.prop("width")), cc.random(app.prop("height"))),
    velocity: cc.vec(),
    acceleration: cc.vec(),
    speed: 8,
  }));

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      app
        .data(movers)
        .process(cc.each, ({ location, velocity, acceleration, speed }) => {
          const dir = cc.vec(app.prop("mouseX"), app.prop("mouseY")).sub(location).norm().mult(0.5);

          acceleration.set(dir);

          location.add(velocity.add(acceleration).clamp(speed)).clampX(app.prop("width")).clampY(app.prop("height"));
        })
        .append(cc.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          fill: "rgba(175, 175, 175, 0.5)",
          stroke: cc.rgb(0),
          r: 16,
        });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
