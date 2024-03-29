import * as cm from "../../src/index.js";
import { frame } from "../utils/frame.js";
import { location, attraction, object } from "../utils/force.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function forceEverything() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  const movers = Array.from({ length: 20 }, () =>
    object({
      location: cm.vec(cm.random(app.prop("width")), cm.random(app.prop("height"))),
      velocity: cm.vec(cm.random(-1, 1), cm.random(-1, 1)),
      acceleration: cm.vec(),
      mass: cm.random(2, 5),
      G: 0.4,
    }),
  );

  const update = location();

  app
    .on("update", () => app.append(cm.clear, { fill: cm.rgb(255) }))
    .on("update", () => {
      app
        .data(movers)
        .process(cm.each, (i) =>
          app
            .data(movers)
            .process(cm.filter, (j) => i !== j)
            .process(cm.each, (j) => attraction(j)(i)),
        )
        .process(cm.each, update)
        .append(cm.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          r: (d) => d.mass * 2,
          fill: cm.rgb(175),
          stroke: "#000",
          strokeWidth: 2,
        });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
