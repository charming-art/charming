import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function particleClusterShapes() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const options = {
    x: (d) => d.location.x,
    y: (d) => d.location.y,
    fill: cc.rgb(0),
    stroke: cc.rgb(0),
    rotate: (d) => d.location.x,
    fillOpacity: (d) => d.lifespan,
    strokeOpacity: (d) => d.lifespan,
  };

  const scaleOptions = {
    fillOpacity: { domain: [0, 255], range: [0, 0.6] },
    strokeOpacity: { domain: [0, 255], range: [0, 1] },
    rotate: { domain: [0, app.prop("width")], range: [0, cc.TWO_PI * 2] },
  };

  const particles = [];

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      const flow = app
        .data(particles)
        .process(cc.push, {
          location: cc.vec(app.prop("width") / 2, 50),
          velocity: cc.vec(cc.random(-1, 1), cc.random(-2, 0)),
          acceleration: cc.vec(0, 0.05),
          lifespan: 255,
          type: Math.random() < 0.5 ? 1 : 0,
        })
        .process(cc.eachRight, (d, i, array) => d.lifespan < 0 && array.splice(i, 1))
        .process(cc.each, (d) => (d.lifespan -= 2))
        .process(cc.each, (d) => {
          d.velocity.add(d.acceleration);
          d.location.add(d.velocity);
        });

      flow
        .process(cc.filter, (d) => d.type === 1)
        .append(cc.circle, { ...options, r: 5 })
        .transform(cc.mapAttrs, scaleOptions);

      flow
        .process(cc.filter, (d) => d.type === 0)
        .append(cc.rect, {
          ...options,
          width: 10,
          height: 10,
          anchor: "center",
        })
        .transform(cc.mapAttrs, scaleOptions);
    });

  return app.call(dispose).call(frame).call(stats).start().node();
}
