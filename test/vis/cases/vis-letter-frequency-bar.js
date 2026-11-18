import * as d3 from "d3";
import * as cm from "../../../src/index.js";

// Plot's letterFrequencyBar: a horizontal bar chart, on a renderer that cm.plane sizes.
export async function visLetterFrequencyBar() {
  const alphabet = await d3.csv("data/alphabet.csv", d3.autoType);
  const renderer = cm.svg();
  const root = cm.flow().renderer(renderer);
  root
    .data(alphabet)
    .transform(cm.encode, {x: "frequency", y: "letter"})
    .transform(cm.spreadY)
    .transform(cm.plane)
    .add(cm.rect);
  root.render();
  return renderer.node();
}
