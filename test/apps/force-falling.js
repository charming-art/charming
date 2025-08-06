import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { force, location, collision, object } from "../utils/force.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function forceFalling() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const movers = Array.from({ length: 25 }, () =>
    object({
      location: cc.vec(cc.random(0, app.prop("width")), 0),
      velocity: cc.vec(),
      acceleration: cc.vec(),
      mass: cc.random(1, 5),
    }),
  );

  const applyGravity = force((d) => cc.vec(0, 0.1).mult(d.mass));
  const applyFriction = force((d) => cc.vecNeg(d.velocity).mag(0.05));
  const applyWind = force(cc.vec(0.001, 0));
  const update = location();
  const detect = collision();

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      app
        .data(movers)
        .process(cc.each, applyFriction)
        .process(cc.each, applyGravity)
        .process(cc.each, applyWind)
        .process(cc.each, update)
        .process(cc.each, detect)
        .append(cc.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          fill: "rgba(175, 175, 175, 0.5)",
          stroke: cc.rgb(0),
          r: (d) => d.mass,
        })
        .transform(cc.mapAttrs, {
          r: { scale: cc.scaleSqrt, range: [2, 20] },
        });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
