import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// 3,000 rects that move to random places, with the frames per second below, to see how SVG
// reuses its elements from frame to frame.
export function transitionManyRects() {
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow({transition: {duration: 1500}}).renderer(renderer);
  const frame = () => {
    root
      .data(Array.from({length: 3000}, (_, i) => i))
      .transform(cm.bind, {
        x: () => Math.random() * 636,
        y: () => Math.random() * 396,
        width: () => 4,
        height: () => 4,
        fill: (i) => `hsl(${i % 360}, 70%, 50%)`,
      })
      .append(cm.rect);
    root.render();
  };
  const node = document.createElement("div");
  const fps = document.createElement("p");
  node.append(renderer.node(), fps);
  let frames = 0;
  let last = performance.now();
  const count = (now) => {
    if (!node.isConnected && frames > 0) return;
    frames++;
    if (now - last >= 1000) {
      fps.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
      frames = 0;
      last = now;
    }
    requestAnimationFrame(count);
  };
  requestAnimationFrame(count);
  frame();
  return loop(
    node,
    async () => {
      frame();
      await root.finished();
    },
    300,
  );
}
