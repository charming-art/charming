import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// Circles moving between a line and a ring, each starting 30ms after the one before.
export function transitionStagger() {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow({transition: {duration: 600}}).renderer(renderer);
  const n = 24;
  let ring = false;
  const frame = () => {
    const angle = (i) => (i / n) * 2 * Math.PI;
    root
      .data(Array.from({length: n}, (_, i) => i))
      .transform(cm.bind, {
        x: (i) => (ring ? 320 + Math.cos(angle(i)) * 150 : 40 + i * 24),
        y: (i) => (ring ? 200 + Math.sin(angle(i)) * 150 : 200),
        r: () => 8,
        delay: (i) => i * 30,
      })
      .append(cm.circle, {fill: "steelblue"});
    root.render();
  };
  frame();
  return loop(
    renderer.node(),
    async () => {
      ring = !ring;
      frame();
      await root.finished();
    },
    300,
  );
}
