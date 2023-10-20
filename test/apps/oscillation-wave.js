import * as cm from "./_cm.js";
import { dispose } from "./_dispose.js";
import { frame } from "./_frame.js";
import { stats } from "./_stats.js";

export function oscillationWave() {
  const app = cm.app({
    width: 600,
    height: 200,
  });

  const X = cm.range(50, cm.TWO_PI);

  app
    .on("update", () => app.append(cm.background, { fill: cm.rgb(255) }))
    .on("update", () => {
      app.data(X).append(cm.circle, {
        x: {
          value: (d) => d,
          range: [0, app.prop("width")],
        },
        y: {
          value: (d) => Math.sin(d + app.prop("frameCount") / 30),
          range: [0, app.prop("height")],
        },
        r: 20,
        fill: "rgba(175, 175, 175, 0.5)",
        stroke: "#000",
        strokeWidth: 1,
      });
    });

  return app.call(dispose).call(frame).call(stats).start();
}
