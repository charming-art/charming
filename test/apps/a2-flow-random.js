import * as cm from "./_cm.js";
import { dispose } from "./_dispose.js";
import { frame } from "./_frame.js";

function multiple(d, x) {
  if (typeof d === "function") return (...params) => d(...params) * x;
  else return d * x;
}

function arrow(flow, { length, angle, ...options }) {
  const group = flow.append(cm.group, options);
  const halfLength = multiple(length, 0.5);

  group.append(cm.link, {
    x: multiple(halfLength, -1),
    y: 0,
    x1: halfLength,
    y1: 0,
  });

  group.append(cm.link, {
    x: 0,
    y: 0,
    x1: halfLength,
    y1: 0,
    rotate: multiple(angle, -1),
    transformOrigin: "end",
  });

  group.append(cm.link, {
    x: 0,
    y: 0,
    x1: halfLength,
    y1: 0,
    rotate: angle,
    transformOrigin: "end",
  });
}

export function a2FlowRandom() {
  const app = cm.app({
    width: 640,
    height: 240,
  });

  const resolution = 16;
  const cols = Math.floor(app.prop("width") / resolution);
  const rows = Math.floor(app.prop("height") / resolution);
  const fields = cm.range(cols * rows, () =>
    cm.vec(cm.random(-1, 1), cm.random(-1, 1))
  );

  const cellWidth = app.prop("width") / cols;
  const cellHeight = app.prop("height") / rows;
  const x = (i) => (i % cols) * cellWidth;
  const y = (i) => ((i / cols) | 0) * cellHeight;

  app.data(fields).call(arrow, {
    x: (_, i) => x(i) + cellWidth / 2,
    y: (_, i) => y(i) + cellHeight / 2,
    length: cellWidth,
    rotate: (d) => d.angle(),
    angle: Math.PI / 6,
  });

  return app.call(dispose).call(frame).render();
}