import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { location, object, attraction, rotation } from "../utils/force.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function oscillationSquareAttract() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const centerX = app.prop("width") / 2;
  const centerY = app.prop("height") / 2;

  const attractor = object({
    mass: 10,
    location: cc.vec(centerX, centerY),
    G: 1,
  });

  const movers = cc.range(20).map(() =>
    object({
      location: cc.vec(cc.random(app.prop("width")), cc.random(app.prop("height"))),
      velocity: cc.vec(cc.random(), cc.random()),
      mass: cc.random(2, 5),
    }),
  );

  const applyAttraction = attraction(attractor);
  const rotate = rotation();
  const move = location();

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      app
        .data(movers)
        .process(cc.each, applyAttraction)
        .process(cc.each, rotate)
        .process(cc.each, move)
        .append(cc.rect, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          width: (d) => d.mass * 5,
          height: (d) => d.mass * 5,
          rotate: (d) => d.rotation,
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
          r: (d) => d.mass * 2,
          fill: cc.rgb(175),
          stroke: "#000",
          strokeWidth: 5,
        });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
