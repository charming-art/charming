import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function oscillationSpring() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const pendulum = { angle: Math.PI / 4, aVelocity: 0, r: 150, damping: 0.995 };
  const update = (d) => {
    const aAcceleration = -1 * (0.4 / d.r) * Math.sin(d.angle);
    d.aVelocity += aAcceleration;
    d.aVelocity *= d.damping;
    d.angle += d.aVelocity;
  };
  const x = (d) => d.r * Math.sin(d.angle);
  const y = (d) => d.r * Math.cos(d.angle);

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      const group = app.append(cc.group, { x: app.prop("width") / 2, y: 0 });
      group
        .datum(pendulum)
        .process(cc.each, update)
        .call((d) => d.append(cc.link, { x: 0, y: 0, x1: x, y1: y }))
        .call((d) =>
          d.append(cc.circle, {
            x,
            y,
            r: 20,
            fill: cc.rgb(175),
            stroke: cc.rgb(0),
          }),
        );
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
