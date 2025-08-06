import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { force, object, location } from "../utils/force.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function oscillationCar() {
  const app = cc.app({
    width: 600,
    height: 200,
  });

  const mover = object();

  const update = location();
  const toMouse = (d, i, _, flow) => {
    const app = flow.app();
    const mouse = cc.vec(app.prop("mouseX"), app.prop("mouseY"));
    return mouse.sub(d.location).mag(0.5);
  };
  const constrain = (d) => {
    d.location.clampX(app.prop("width")).clampY(app.prop("height"));
    d.velocity.clamp(4);
  };

  app
    .on("update", () => app.append(cc.clear, { fill: cc.rgb(255) }))
    .on("update", () => {
      app
        .datum(mover)
        .process(cc.each, force(toMouse))
        .process(cc.each, update)
        .process(cc.each, constrain)
        .append(cc.rect, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          width: 30,
          height: 10,
          fill: cc.rgb(175),
          stroke: cc.rgb(0),
          rotate: (d) => d.velocity.angle(),
        });
    });

  return app.call(dispose).call(stats).call(frame).start().node();
}
