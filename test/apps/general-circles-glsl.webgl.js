import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

export function generalCirclesGLSLWebGL() {
  const width = 700;
  const height = 700;
  const count = 22000;
  const theta = cc.range(count, 0, cc.TWO_PI);

  function update(app) {
    const time = app.prop("frameCount") / 50;
    const scale = 300;

    app.append(cc.clear, { fill: "black" });

    app
      .data(theta) // Bind Data.
      .append(cc.circle, {
        position: cc.glsl`vec2 position(float theta) {
          vec2 xy = vec2(cos(theta), sin(theta)) * (0.6 + 0.2 * cos(theta * 6.0 + cos(theta * 8.0 + ${time})));
          return xy * ${scale} + vec2(${width / 2}, ${height / 2});
        }`,
        r: cc.glsl`float r(float theta) {
          float d = 0.2 + 0.12 * cos(theta * 9.0 - ${time} * 2.0);
          return d * ${scale};
        }`,
        stroke: cc.glsl`vec4 stroke(float theta) {
          float th = 8.0 * theta + ${time} * 2.0;
          vec3 rgb = 0.6 + 0.4 * vec3(
            cos(th),
            cos(th - ${Math.PI} / 3.0),
            cos(th - ${Math.PI} * 2.0 / 3.0)
          );
          return vec4(rgb, 0.0);
        }`,
        strokeOpacity: cc.glsl`float strokeOpacity(float theta) {
          return 0.15 * 2000.0 / ${count};
        }`,
      });
  }

  return cc.app({ width, height, renderer: cc.webgl() }).on("update", update).call(dispose).call(stats).start().node();
}
