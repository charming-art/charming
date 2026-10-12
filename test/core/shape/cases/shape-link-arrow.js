import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

const size = 16;
const cols = 10;
const rows = 6;
const fields = Array.from({length: cols * rows}, (_, i) => {
  const x = i % cols;
  const y = (i / cols) | 0;
  return {x, y, value: (Math.sin(x * 0.5) * Math.cos(y * 0.5) + 1) / 2};
});

function arrow(flow, {length, angle, x, y, rotate, ...options}) {
  const group = flow.append(cm.group, {x, y, rotate});
  const halfLengthPos = length.map((d) => d / 2);
  const halfLengthNeg = length.map((d) => -d / 2);
  const anglePos = angle.map((d) => d);
  const angleNeg = angle.map((d) => -d);
  group.append(cm.link, {x: halfLengthNeg, y: 0, x1: halfLengthPos, y1: 0, ...options});
  group.append(cm.link, {x: 0, y: 0, x1: halfLengthPos, y1: 0, rotate: angleNeg, transformOrigin: "end", ...options});
  group.append(cm.link, {x: 0, y: 0, x1: halfLengthPos, y1: 0, rotate: anglePos, transformOrigin: "end", ...options});
}

function arrowRed(flow, options) {
  flow.append(arrow, {...options, stroke: "red"});
}

export function shapeLinkArrow() {
  return renderFlow(
    (root) => {
      root
        .data(fields)
        .append(arrow, {
          x: (d) => d.x * size + size / 2,
          y: (d) => d.y * size + size / 2,
          length: size * 0.8,
          angle: Math.PI / 6,
          rotate: (d) => d.value,
        })
        .transform(cm.mapAttrs, {rotate: {domain: [0, 1], range: [0, Math.PI * 2]}})
        .append(cm.circle, {x: 0, y: 0, fill: "blue", r: 2});

      root
        .data(fields)
        .process(cm.filter, (d) => d.value > 0.5)
        .append(arrowRed, {
          x: (d) => d.x * size + size / 2,
          y: (d) => d.y * size + size / 2,
          length: size * 0.8,
          angle: Math.PI / 6,
          rotate: (d) => d.value,
        })
        .transform(cm.mapAttrs, {rotate: {domain: [0, 1], range: [0, Math.PI * 2]}});
    },
    {width: cols * size, height: rows * size},
  );
}
