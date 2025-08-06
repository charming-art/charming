import * as cc from "../../src/index.js";
import { interpolateCool } from "d3-scale-chromatic";
import { dispose } from "../utils/dispose.js";
import { stats } from "../utils/stats.js";

function updateFire(fire) {
  const h = fire.length;
  const w = fire[0].length;
  const max = h;
  const noise = cc.randomNoise(0, max);

  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w; x++) {
      const decay = cc.randomInt(0, 3);
      const spread = cc.randomInt(-1, 1);
      const index = Math.min(Math.max(0, x - spread), w - 1);
      const target = fire[y + 1][index];
      fire[y][x] = Math.max(0, target - decay);
    }
  }

  for (let x = 0; x < w; x++) {
    fire[h - 1][x] = noise(x / 10) | 0;
  }
}

function drawFire(app, fire) {
  const max = fire.length;

  app.append(cc.clear, { fill: "black" });

  app
    .data(fire)
    .append(cc.group, { x: 0, y: (_, i) => i })
    .data((d) => d)
    .append(cc.point, {
      y: 0,
      x: (_, i) => i,
      stroke0: (d) => (d === 0 ? " " : cc.randomChar()),
      stroke2: (d) => (d === 0 ? null : d),
    })
    .transform(cc.mapAttrs, {
      stroke2: {
        domain: [0, max],
        range: [0, 1],
        interpolate: interpolateCool,
      },
    });
}

function createFire(width, height) {
  return cc.range(height).map(() => cc.range(width).map(() => 0));
}

// @see https://asciinema.org/a/28404
export async function terminalFire() {
  let fire = null;

  function update(app) {
    const width = app.prop("width");
    const height = app.prop("height");
    if (!fire) fire = createFire(width, height);
    updateFire(fire);
    drawFire(app, fire);
  }

  const app = cc.app({
    renderer: await cc.terminal(),
    frameRate: 15,
  });

  return app.on("update", update).call(dispose).call(stats).start().node();
}
