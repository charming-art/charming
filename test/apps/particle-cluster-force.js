import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { object, location, force } from "../utils/force.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function particleClusterForce() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const particles = [];
  const repeller = {
    location: cc.vec(app.prop("width") / 2, app.prop("height") - 50),
    power: 150,
  };

  const update = location();
  const fadeOut = (d, i, array) => {
    if (d.lifespan < 0) array.splice(i, 1);
    d.lifespan -= 2;
  };
  const applyGravity = force((d) => cc.vec(0, 0.1).mult(d.mass));
  const applyRepeller = force((d) => {
    const force = cc.vecSub(repeller.location, d.location);
    const distance = cc.clamp(force.mag(), 5, 50);
    const strength = (-1 * repeller.power) / (distance * distance);
    force.mag(strength);
    return force;
  });

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      app.datum(repeller).append(cc.circle, {
        x: (d) => d.location.x,
        y: (d) => d.location.y,
        r: 16,
        stroke: "black",
        fill: cc.rgb(127),
      });

      app
        .data(particles)
        .process(
          cc.push,
          object({
            location: cc.vec(app.prop("width") / 2, 50),
            lifespan: 255,
            velocity: cc.vec(cc.random(-1, 1), cc.random(-2, 0)),
          }),
        )
        .process(cc.eachRight, fadeOut)
        .process(cc.each, applyRepeller)
        .process(cc.each, applyGravity)
        .process(cc.each, update)
        .append(cc.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          r: 5,
          fill: cc.rgb(0),
          stroke: cc.rgb(0),
          fillOpacity: (d) => d.lifespan,
          strokeOpacity: (d) => d.lifespan,
        })
        .transform(cc.mapAttrs, {
          fillOpacity: { domain: [0, 255], range: [0, 0.6] },
          strokeOpacity: { domain: [0, 255], range: [0, 1] },
        });
    });

  return app.call(dispose).call(frame).call(stats).start().node();
}
