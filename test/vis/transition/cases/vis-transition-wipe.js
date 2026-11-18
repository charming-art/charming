import * as d3 from "d3";
import * as cm from "../../../../src/index.js";
import {loop} from "../../../core/transition/cases/loop.js";

// A column chart of letter frequencies, in and out: its bars enter with clipTop 1, so they're
// revealed from the bottom up, and exit to it, hidden from the top down. The axes are drawn as they
// are.
export async function visTransitionWipe() {
  const data = await d3.csv("data/alphabet.csv", d3.autoType);
  const renderer = cm.svg({width: 640, height: 400});
  const root = cm.flow({transition: {duration: 1000}}).renderer(renderer);
  let shown = true;
  const frame = () => {
    if (shown) {
      root
        .data(data)
        .transform(cm.encode, {x: "letter", y: "frequency"})
        .transform(cm.spreadX)
        .transform(cm.plane, {y: {percent: true}})
        .add(cm.rect, {fill: "steelblue", enter: {clipTop: 1}, exit: {clipTop: 1}});
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
    800,
  );
}
