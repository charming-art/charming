import * as cm from "../../../../src/index.js";
import {loop} from "./loop.js";

// The four wipes, in and out: each bar enters from its state, a clip inset of 1 on one side, and
// exits to it, so it's revealed from the opposite side and hidden toward it; its label wipes in
// from the left with clipRight.
export function transitionWipe() {
  const renderer = cm.svg({width: 640, height: 300});
  const root = cm.flow({transition: {duration: 800}}).renderer(renderer);
  const wipes = [
    {name: "clipTop: 1", state: {clipTop: 1}},
    {name: "clipBottom: 1", state: {clipBottom: 1}},
    {name: "clipRight: 1", state: {clipRight: 1}},
    {name: "clipLeft: 1", state: {clipLeft: 1}},
  ];
  let shown = true;
  const frame = () => {
    if (shown) {
      for (const [i, {name, state}] of wipes.entries()) {
        root.data([0]).append(cm.rect, {
          x: 40 + i * 150,
          y: 40,
          width: 100,
          height: 180,
          fill: "steelblue",
          enter: state,
          exit: state,
        });
        root.data([0]).append(cm.text, {
          x: 90 + i * 150,
          y: 240,
          text: name,
          textAlign: "center",
          textBaseline: "top",
          fontSize: 14,
          fill: "black",
          enter: {clipRight: 1},
          exit: {clipRight: 1},
        });
      }
    }
    root.render();
  };
  frame();
  return loop(
    renderer.node(),
    async () => {
      shown = !shown;
      frame();
      await root.finished();
    },
    500,
  );
}
