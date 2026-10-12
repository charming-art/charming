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

// Linear interpolation from steelblue to orange.
function interpolateColor(t) {
  const r = Math.round(70 + (255 - 70) * t);
  const g = Math.round(130 + (165 - 130) * t);
  const b = Math.round(180 + (0 - 180) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function shapeLinkArrowColor() {
  return renderFlow(
    (root) => {
      root
        .data(fields)
        .append(arrow, {
          x: (d) => d.x * size + size / 2,
          y: (d) => d.y * size + size / 2,
          angle: Math.PI / 6,
          rotate: (d) => d.value,
          stroke: (d) => d.value,
          length: (d) => d.value,
        })
        .transform(cm.mapAttrs, {
          rotate: {range: [0, Math.PI * 2]},
          length: {range: [size * 0.3, size * 0.9]},
          stroke: {interpolate: interpolateColor},
        });
    },
    {width: cols * size, height: rows * size},
  );
}
