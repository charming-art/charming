import * as cc from "../../src/index.js";
import { interpolateRainbow } from "d3-scale-chromatic";
import { dispose } from "../utils/dispose.js";

export function generalCircleClover() {
  const app = cc.app({
    width: 640,
    height: 640,
  });

  app
    .data(cc.range(120))
    .process(cc.map, (_, i, a) => i * (Math.PI / a.length))
    .append(cc.circle, {
      x: (t) => Math.cos(t) * Math.cos(t * 3),
      y: (t) => Math.sin(t) * Math.cos(t * 3),
      r: (t) => t,
      fill: (t) => t,
    })
    .transform(cc.mapPosition, { padding: 20 })
    .transform(cc.mapAttrs, {
      r: { range: [8, 20] },
      fill: { interpolate: interpolateRainbow },
    });

  return app.call(dispose).render().node();
}
