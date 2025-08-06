import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";
import { force, location, object } from "../utils/force.js";
import { frame } from "../utils/frame.js";
import { stats } from "../utils/stats.js";

export function a2FlowNoise() {
  const app = cc.app({
    width: 640,
    height: 240,
  });

  const resolution = 20;
  const cols = Math.floor(app.prop("width") / resolution);
  const rows = Math.floor(app.prop("height") / resolution);
  const fields = cc.range(cols * rows);

  const cellWidth = app.prop("width") / cols;
  const cellHeight = app.prop("height") / rows;
  const x = (i) => (i % cols) * cellWidth + cellWidth / 2;
  const y = (i) => ((i / cols) | 0) * cellHeight + cellHeight / 2;

  const vertices = cc.range(120).map(() =>
    object({
      location: cc.vec(cc.random(app.prop("width")), cc.random(app.prop("height"))),
      velocity: cc.vec(),
      r: 4,
      maxSpeed: cc.random(2, 5),
      maxForce: cc.random(0.1, 0.5),
    }),
  );

  const initFields = () => {
    const noise = cc.randomNoise(0, cc.TWO_PI);
    for (let m = 0; m < fields.length; m++) {
      const i = m % cols;
      const j = (m / cols) | 0;
      fields[m] = noise(j * 0.1, i * 0.1);
    }
  };

  const lookup = (x, y) => {
    const i = cc.clamp((x / cellWidth) | 0, 0, cols - 1);
    const j = cc.clamp((y / cellHeight) | 0, 0, rows - 1);
    const angle = fields[j * cols + i];
    return cc.vecFromAngle(angle);
  };

  const updateLocation = location();

  const constrainX = (d) => {
    const width = app.prop("width");
    if (d.location.x < 0) d.location.x += width;
    if (d.location.x > width) d.location.x -= width;
  };

  const constrainY = (d) => {
    const height = app.prop("height");
    if (d.location.y < 0) d.location.y += height;
    if (d.location.y > height) d.location.y -= height;
  };

  const applyAuto = force((d) => {
    const desired = lookup(d.location.x, d.location.y);
    desired.mag(d.maxSpeed); // !!!Important
    const steer = cc.vecSub(desired, d.velocity);
    steer.clamp(d.maxForce); // !!!Important
    return steer;
  });

  initFields();

  function update() {
    app.append(cc.clear, { fill: "white" });

    app
      .data(fields)
      .append(cc.group, {
        x: (_, i) => x(i),
        y: (_, i) => y(i),
        rotate: (d) => d,
      })
      .append(cc.link, {
        x: (-cellWidth / 2) * 0.5,
        y: 0,
        x1: (cellWidth / 2) * 0.5,
        y1: 0,
      });

    app
      .data(vertices)
      .process(cc.each, applyAuto)
      .process(cc.each, updateLocation)
      .process(cc.each, constrainX)
      .process(cc.each, constrainY)
      .append(cc.group, {
        x: (d) => d.location.x,
        y: (d) => d.location.y,
        rotate: (d) => d.velocity.angle(),
      })
      .append(cc.triangle, {
        x: (d) => d.r * 2,
        y: 0,
        x1: (d) => -d.r * 2,
        y1: (d) => -d.r,
        x2: (d) => -d.r * 2,
        y2: (d) => d.r,
        fill: cc.rgb(175),
        stroke: cc.rgb(0),
        strokeWidth: 2,
      });
  }

  function mouseClick() {
    initFields();
  }

  return app.on("update", update).on("mouseClick", mouseClick).call(dispose).call(frame).call(stats).start().node();
}
