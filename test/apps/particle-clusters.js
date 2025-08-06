import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

function updateParticles(flow) {
  flow
    .process(cc.push, () => ({
      location: cc.vec(0, 0),
      velocity: cc.vec(cc.random(-1, 1), cc.random(-2, 0)),
      acceleration: cc.vec(0, 0.05),
      lifespan: 255,
    }))
    .process(cc.eachRight, (d, i, array) => d.lifespan < 0 && array.splice(i, 1))
    .process(cc.each, (d) => (d.lifespan -= 2))
    .process(cc.each, (d) => {
      d.velocity.add(d.acceleration);
      d.location.add(d.velocity);
    });
}

function drawParticles(flow) {
  flow
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
}

export function particleClusters() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const PS = [];

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      const groups = app.data(PS).append(cc.group, {
        x: (d) => d.origin.x,
        y: (d) => d.origin.y,
      });

      groups
        .data((d) => d.particles)
        .call(updateParticles)
        .call(drawParticles);
    })
    .on("mouseDown", () => {
      PS.push({
        origin: cc.vec(app.prop("mouseX"), app.prop("mouseY")),
        particles: [],
      });
    });

  return app.call(dispose).call(frame).call(stats).start().node();
}
