import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

// @see https://asciinema.org/a/19919
export async function terminalWhiteNoise() {
  const app = cc.app({
    renderer: await cc.terminal(),
    frameRate: 20,
  });

  const w = app.prop("width");
  const h = app.prop("height");

  const characters = cc.cross(cc.range(w), cc.range(h)).map((d) => ({ x: d[0], y: d[1] }));

  const textOptions = {
    text: cc.figlet("Ccomp"),
    x: w / 2,
    y: h / 2,
    textAlign: "center",
    textBaseline: "middle",
    fill: cc.gradientRainBowX(),
  };
  const bbox = app.textBBox(textOptions);
  const { x: tx, y: ty, width: tw, height: th } = bbox;
  const outside = ({ x, y }) => x < tx || x > tx + tw || y < ty || y > ty + th;

  function update() {
    app.append(cc.clear, { fill: "black" });

    app.append(cc.text, textOptions);

    app
      .data(characters)
      .process(cc.each, (d) => {
        if (d.lifespan) return d.lifespan--;
        d.ch = cc.randomChar();
        d.lifespan = cc.randomInt(3, 10);
      })
      .process(cc.filter, (d) => {
        if (outside(d)) return true;
        const p = cc.random(10);
        if (p < 0.5) return true;
        return false;
      })
      .append(cc.point, {
        x: (d) => d.x,
        y: (d) => d.y,
        stroke0: (d) => d.ch,
      });
  }

  return app.on("update", update).call(dispose).call(stats).start().node();
}
