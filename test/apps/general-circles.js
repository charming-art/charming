import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function generalCircles() {
  const width = 700;
  const height = 700;
  const count = 5500;
  const theta = cc.range(count, 0, cc.TWO_PI);

  function update(app) {
    const time = app.prop("frameCount") / 50;
    const dist = (d) => 0.6 + 0.2 * Math.cos(d * 6.0 + Math.cos(d * 8.0 + time));

    app.append(cc.clear, { fill: "black" });

    app
      .data(theta)
      .append(cc.circle, {
        x: (d) => Math.cos(d) * dist(d),
        y: (d) => Math.sin(d) * dist(d),
        r: (d) => 0.2 + 0.12 * Math.cos(d * 9.0 - time * 2.0),
        stroke: (d) => {
          const th = 8.0 * d + time * 2.0;
          const r = 0.6 + 0.4 * Math.cos(th);
          const g = 0.6 + 0.4 * Math.cos(th - Math.PI / 3);
          const b = 0.6 + 0.4 * Math.cos(th - (Math.PI * 2.0) / 3.0);
          return cc.rgb(r * 255, g * 255, b * 255);
        },
        fill: "transparent",
        strokeOpacity: (0.15 * 2000) / count,
      })
      .transform(cc.mapPosition, { padding: 100 })
      .transform(cc.mapAttrs, { r: { range: [24, 96] } });
  }

  return cc.app({ width, height }).on("update", update).call(dispose).call(stats).call(frame).start().node();
}
