import * as cc from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { location, attraction, object } from "../utils/force.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function forceEverything() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const movers = Array.from({ length: 20 }, () =>
    object({
      location: cc.vec(cc.random(app.prop("width")), cc.random(app.prop("height"))),
      velocity: cc.vec(cc.random(-1, 1), cc.random(-1, 1)),
      acceleration: cc.vec(),
      mass: cc.random(2, 5),
      G: 0.4,
    }),
  );

  const update = location();

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      app
        .data(movers)
        .process(cc.each, (i) =>
          app
            .data(movers)
            .process(cc.filter, (j) => i !== j)
            .process(cc.each, (j) => attraction(j)(i)),
        )
        .process(cc.each, update)
        .append(cc.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          r: (d) => d.mass * 2,
          fill: cc.rgb(175),
          stroke: "#000",
          strokeWidth: 2,
        });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
