import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// A star's points, for a polygon.
function star(cx, cy, outer, inner, n = 5) {
  const X = [];
  const Y = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / (n * 2)) * 2 * Math.PI - Math.PI / 2;
    X.push(cx + r * Math.cos(a));
    Y.push(cy + r * Math.sin(a));
  }
  return {x: X, y: Y};
}

// One mark, keyed a, morphing from a rect into a circle, a triangle and a star, and back: shapes of
// different types morph through their outlines.
export function transitionMorph() {
  const renderer = cm.svg({width: 400, height: 400});
  const root = cm.flow({transition: {duration: 1000}}).renderer(renderer);
  const shapes = [
    () => root.append(cm.rect, {x: 100, y: 100, width: 200, height: 200, fill: "steelblue", key: "a"}),
    () => root.append(cm.circle, {x: 200, y: 200, r: 110, fill: "orange", key: "a"}),
    () => root.append(cm.triangle, {x: 200, y: 70, x1: 330, y1: 310, x2: 70, y2: 310, fill: "seagreen", key: "a"}),
    () => {
      // A polygon takes its points from a function: an array option would give one value per row.
      const {x, y} = star(200, 210, 140, 60);
      root.append(cm.polygon, {x: () => x, y: () => y, fill: "crimson", key: "a"});
    },
  ];
  let i = 0;
  shapes[i]();
  root.render();
  return loop(
    renderer.node(),
    async () => {
      i = (i + 1) % shapes.length;
      shapes[i]();
      root.render();
      await root.finished();
    },
    600,
  );
}
