import * as cm from "./_cm.js";
import { dispose } from "./_dispose.js";
import { frame } from "./_frame.js";
import { stats } from "./_stats.js";

export function particleCluster() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  const particles = [];

  app
    .frame(() => app.append(cm.background, { fill: cm.rgb(255) }))
    .frame(() => {
      app
        .data(particles)
        .push({
          location: cm.vec(app.width() / 2, 50),
          velocity: cm.vec(cm.random(-1, 1), cm.random(-2, 0)),
          acceleration: cm.vec(0, 0.05),
          lifespan: 255,
        })
        .each((d, { index, flow }) => d.lifespan < 0 && flow.pull(index))
        .each((d) => (d.lifespan -= 2))
        .each((d) => {
          d.velocity.add(d.acceleration);
          d.location.add(d.velocity);
        })
        .append(cm.circle, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          r: 5,
          fill: cm.rgb(0),
          stroke: cm.rgb(0),
          fillOpacity: {
            value: (d) => d.lifespan,
            domain: [0, 255],
            range: [0, 0.6],
          },
          strokeOpacity: {
            value: (d) => d.lifespan,
            domain: [0, 255],
            range: [0, 1],
          },
        });
    });

  return app.call(dispose).call(frame).call(stats).start();
}