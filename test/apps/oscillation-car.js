import * as cm from "./_cm.js";
import { dispose } from "./_dispose.js";
import { force, object, location } from "./_force.js";
import { frame } from "./_frame.js";
import { stats } from "./_stats.js";

export function oscillationCar() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  const mover = object();

  const update = location();
  const toMouse = (d, i, _, flow) => {
    const app = flow.app();
    const mouse = cm.vec(app.prop("mouseX"), app.prop("mouseY"));
    return mouse.sub(d.location).mag(0.5);
  };
  const constrain = (d) => {
    d.location.clampX(app.prop("width")).clampY(app.prop("height"));
    d.velocity.clamp(4);
  };

  app
    .on("update", () => app.append(cm.background, { fill: cm.rgb(255) }))
    .on("update", () => {
      app
        .datum(mover)
        .each(force(toMouse))
        .each(update)
        .each(constrain)
        .append(cm.rect, {
          x: (d) => d.location.x,
          y: (d) => d.location.y,
          width: 30,
          height: 10,
          fill: cm.rgb(175),
          stroke: cm.rgb(0),
          rotate: (d) => d.velocity.angle(),
        });
    });

  return app.call(dispose).call(stats).call(frame).start();
}
