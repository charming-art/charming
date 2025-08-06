import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { force, object, location } from "../utils/force.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

function update(app, context) {
  const { target, a2 } = context;

  const update = location();

  const arrive = force((d) => {
    const desired = cc.vecSub(target.location, a2.location);

    // The closer, the slower.
    const distance = desired.mag();
    const scale = cc.scaleLinear([0, 100], [0, d.maxSpeed]);
    if (distance > 100) desired.mag(d.maxSpeed);
    else desired.mag(scale(distance));

    const steer = cc.vecSub(desired, d.velocity);
    steer.clamp(d.maxForce);
    return steer;
  });

  app.append(cc.clear, { fill: cc.rgb(255) });

  app
    .datum(target)
    .process(cc.each, (d) => d.location.set(app.prop("mouseX"), app.prop("mouseY")))
    .append(cc.circle, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      r: 24,
      stroke: "black",
      fill: cc.rgb(175),
      strokeWidth: 2,
    });

  app
    .datum(a2)
    .process(cc.each, arrive)
    .process(cc.each, update)
    .append(cc.group, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      rotate: (d) => d.velocity.angle(),
    })
    .append(cc.triangle, {
      x: (d) => d.r * 2,
      y: 0,
      x1: (d) => -d.r * 2,
      y1: (d) => -d.r,
      x2: (d) => -d.r * 2,
      y2: (d) => d.r,
      fill: cc.rgb(175),
      stroke: cc.rgb(0),
      strokeWidth: 2,
    })
    .append(cc.circle, {
      x: 0,
      y: 0,
      r: 5,
      fill: "red",
    });
}

export function a2Arriving() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const context = {
    target: object({
      location: cc.vec(app.prop("mouseX"), app.prop("mouseY")),
    }),
    a2: object({
      location: cc.vec(app.prop("width") / 2, app.prop("height") / 2),
      velocity: cc.vec(),
      acceleration: cc.vec(),
      maxSpeed: 4,
      maxForce: 0.1,
      r: 6,
    }),
  };

  return app
    .on("update", () => update(app, context))
    .call(dispose)
    .call(stats)
    .call(frame)
    .start()
    .node();
}
