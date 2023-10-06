import * as cm from "./_cm.js";
import { dispose } from "./_dispose.js";
import { frame } from "./_frame.js";
import { stats } from "./_stats.js";

export function oscillationSpring() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  const pendulum = { angle: 60, aVelocity: 0, r: 150, damping: 0.995 };
  const update = (d) => {
    const aAcceleration = -1 * 0.4 * Math.sin(cm.radian(d.angle));
    d.aVelocity += aAcceleration;
    d.aVelocity *= d.damping;
    d.angle += d.aVelocity;
  };
  const x = (d) => d.r * Math.sin(cm.radian(d.angle));
  const y = (d) => d.r * Math.cos(cm.radian(d.angle));

  app
    .frame(() => app.append(cm.background, { fill: cm.rgb(255) }))
    .frame(() => {
      const group = app.append(cm.group, { x: app.width() / 2, y: 0 });
      group
        .datum(pendulum)
        .each(update)
        .call((d) => d.append(cm.link, { x: 0, y: 0, x1: x, y1: y }))
        .call((d) =>
          d.append(cm.circle, {
            x,
            y,
            r: 20,
            fill: cm.rgb(175),
            stroke: cm.rgb(0),
          })
        );
    });

  return app.call(dispose).call(stats).call(frame).start();
}