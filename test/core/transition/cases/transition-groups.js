import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// Groups that move to random places, each carrying its square and its dot: the group's
// translation is interpolated, and its children follow.
export function transitionGroups() {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow({transition: {duration: 800}}).renderer(renderer);
  const groups = ["red", "green", "blue", "orange"].map((color) => ({color}));
  const frame = () => {
    const cells = root
      .data(groups)
      .append(cm.g, {x: () => 40 + Math.random() * 520, y: () => 40 + Math.random() * 300});
    cells.append(cm.rect, {x: 0, y: 0, width: 60, height: 60, fill: (d) => d.color, fillOpacity: 0.3});
    cells.append(cm.circle, {x: 30, y: 30, r: 10, fill: (d) => d.color});
    root.render();
  };
  frame();
  return loop(
    renderer.node(),
    async () => {
      frame();
      await root.transition();
    },
    400,
  );
}
