import * as cm from "../../src/index.js";
import { dispose } from "../dispose.js";
import { stats } from "../stats.js";

// @see https://asciinema.org/a/19919
export async function terminalWhiteNoise() {
  const app = cm.app({
    renderer: await cm.terminal(),
    frameRate: 20,
  });

  const w = app.prop("width");
  const h = app.prop("height");

  const characters = cm.cross(cm.range(w), cm.range(h)).map((d) => ({ x: d[0], y: d[1] }));

  const textOptions = {
    text: "Charming",
    x: w / 2,
    y: h / 2,
    textAlign: "center",
    textBaseline: "middle",
    fill: cm.gradientRainBowX(),
  };
  const bbox = app.textBBox(textOptions);
  const { x: tx, y: ty, width: tw, height: th } = bbox;
  const outside = ({ x, y }) => x < tx || x > tx + tw || y < ty || y > ty + th;

  function update() {
    app.append(cm.clear, { fill: "black" });

    app.append(cm.text, textOptions);

    app
      .data(characters)
      .process(cm.each, (d) => {
        if (d.lifespan) return d.lifespan--;
        const seed = cm.random(32, 127);
        const ch = String.fromCharCode(seed);
        d.stroke = cm.cfb(ch);
        d.lifespan = cm.random(3, 10) | 0;
      })
      .process(cm.filter, (d) => {
        if (outside(d)) return true;
        const p = cm.random(10);
        if (p < 0.5) return true;
        return false;
      })
      .append(cm.point, {
        x: (d) => d.x,
        y: (d) => d.y,
        stroke: (d) => d.stroke,
      });
  }

  return app.on("update", update).call(dispose).call(stats).start().node();
}
