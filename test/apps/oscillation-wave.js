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
      app
        .data(X)
        .append(cm.circle, {
          x: (d) => d,
          y: (d) => Math.sin(d + app.prop("frameCount") / 30),
          r: 20,
          fill: "rgba(175, 175, 175, 0.5)",
          stroke: "#000",
          strokeWidth: 1,
        })
        .transform(cm.scale, {
          x: { range: [0, app.prop("width")] },
          y: { range: [0, app.prop("height")] },
        });
    });

  return app.call(dispose).call(frame).call(stats).start();
}
