import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { attraction, object, location } from "../utils/force.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function forceAttract() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const centerX = app.prop("width") / 2;
  const centerY = app.prop("height") / 2;

  const attractor = object({
    mass: 20,
    G: 1,
    location: cc.vec(centerX, centerY),
  });

  const mover = object({
    location: cc.vec(centerX, centerY - 50),
    velocity: cc.vec(1, 0),
    acceleration: cc.vec(),
    mass: 5,
  });

  const update = location();
  const applyAttraction = attraction(attractor);

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      app
        .datum(mover)
        .process(cc.each, applyAttraction)
        .process(cc.each, update)
        .append(cc.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          r: (d) => d.mass,
          fill: cc.rgb(175),
          stroke: "#000",
          strokeWidth: 2,
        });
    })
    .on("update", () => {
      app
        .datum(attractor) // Convert to an array.
        .append(cc.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          r: (d) => d.mass,
          fill: cc.rgb(175),
          stroke: "#000",
          strokeWidth: 5,
        });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
