import * as cm from "./_cm.js";
import { frame } from "./_frame.js";
import { force, location, collision, object } from "./_force.js";
import { dispose } from "./_dispose.js";
import { stats } from "./_stats.js";

export function forceDancing() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  const movers = cm.range(25, () =>
    object({
      location: cm.vec(),
      velocity: cm.vec(),
      acceleration: cm.vec(),
      mass: cm.random(0.1, 5),
    })
  );

  const applyGravity = force(cm.vec(0, 0.2));
  const applyWind = force(cm.vec(0.02, 0));
  const update = location();
  const detect = collision();

  app
    .on("update", () => app.append(cm.background, { fill: cm.rgb(255) }))
    .on("update", () => {
      app
        .data(movers)
        .process(cm.each, applyGravity)
        .process(cm.each, applyWind)
        .process(cm.each, update)
        .process(cm.each, detect)
        .append(cm.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          fill: "rgba(175, 175, 175, 0.5)",
          stroke: cm.rgb(0),
          r: {
            scale: cm.scaleSqrt,
            value: (d) => d.mass,
            range: [2, 20],
          },
        });
    });

  return app.call(dispose).call(stats).call(frame).start();
}
