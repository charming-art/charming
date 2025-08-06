import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

function noiseRadius(theta, radius, time, noise) {
  const s = noise(Math.cos(theta) + 1, Math.sin(theta) + 1, time) + 1;
  return radius * (1 + Math.cos(theta - Math.PI / 2)) * s;
}

function noiseAngle(theta, radius, time, noise) {
  const offset = 0.06;
  const theta1 = theta - offset;
  const theta2 = theta + offset;
  const a = noiseRadius(theta1, radius, time, noise);
  const b = noiseRadius(theta2, radius, time, noise);
  return Math.atan2(a * Math.sin(theta1) - b * Math.sin(theta2), a * Math.cos(theta1) - b * Math.cos(theta2)) + Math.PI;
}

function drawHeart(flow, { x, y, count, radius, noise, time }) {
  flow
    .append(cc.group, { x, y })
    .data(cc.range(count, 0, cc.TWO_PI))
    .process(cc.derive, {
      t: (d) => d,
      r: (d) => noiseRadius(d, radius, time, noise),
    })
    .append(cc.polygon, {
      x: (d) => Math.cos(d.t) * d.r,
      y: (d) => Math.sin(d.t) * d.r,
      fill: "red",
    });
}

function drawEyes(flow, { x, y, r, radius }) {
  const app = flow.app();
  const mouseX = app.prop("mouseX");
  const mouseY = app.prop("mouseY");
  const height = app.prop("height");

  const group = flow
    .data([-1, 1])
    .process(cc.derive, {
      x: (d) => x + (d * radius) / 1.8,
      y: y + height / 6,
    })
    .process(cc.derive, {
      rotate: (d) => Math.atan2(mouseY - d.y, mouseX - d.x),
    })
    .append(cc.group, {
      x: (d) => d.x,
      y: (d) => d.y,
    });

  group.append(cc.circle, {
    x: 0,
    y: 0,
    r: r,
    fill: "white",
  });

  group
    .append(cc.group, {
      rotate: (d) => d.rotate,
    })
    .append(cc.circle, {
      x: r / 3,
      y: 0,
      r: r / 2,
      fill: "black",
    });
}

function drawTexts(flow, { chars, x, y, radius, time, noise, ...font }) {
  const app = flow.app();
  const mouseX = app.prop("mouseX");
  const mouseY = app.prop("mouseY");
  const start = Math.atan2(mouseY - y, mouseX - x);

  flow
    .append(cc.group, { x, y })
    .data(chars)
    .process(cc.derive, {
      t: (d) => d.t + start,
    })
    .process(cc.derive, {
      r: (d) => noiseRadius(d.t, radius, time, noise),
      a: (d) => noiseAngle(d.t, radius, time, noise),
    })
    .append(cc.group, {
      x: (d) => Math.cos(d.t) * d.r,
      y: (d) => Math.sin(d.t) * d.r,
      rotate: (d) => d.a,
    })
    .append(cc.text, {
      x: 0,
      y: 0,
      text: (d) => d.c,
      fill: "#7214E3",
      ...font,
    });
}

export function generalBrokenHeart() {
  let width = 640,
    height = 640,
    count = 200,
    radius = 100,
    noise = cc.randomNoise(),
    string = "Sad News!!!",
    chars = null,
    font = { fontSize: 100 };

  function step(app) {
    let prev = 0;
    chars = string.split("").map((d) => {
      const { width } = app.textBBox({ text: d, ...font });
      const step = width / (radius * 1.8);
      const theta = prev + step / 2;
      prev += step;
      return { t: theta, c: d };
    });
  }

  function update(app) {
    const time = app.prop("frameCount") / 100;
    const x = width / 2;
    const y = height / 3;

    app.append(cc.clear, { fill: "black" });

    app
      .call(drawHeart, { x, y, count, radius, noise, time })
      .call(drawEyes, { x, y, r: radius / 2, radius })
      .call(drawTexts, { x, y, chars, radius, noise, time, ...font });
  }

  return cc
    .app({ width, height })
    .on("beforeAll", step)
    .on("update", update)
    .call(dispose)
    .call(stats)
    .call(frame)
    .start()
    .node();
}
