import * as cm from "../../../src/index.js";

// A one-dimensional dot plot on a renderer without a size, like Plot's shorthandDotX: cm.plane
// sizes it to 640×60, with the dots in the middle and the x axis below them.
export function visDotX() {
  const numbers = [170.16, 172.53, 172.54, 173.44, 174.35, 174.55, 173.16, 174.59, 176.18, 177.9, 176.15, 179.37];
  const renderer = cm.svg();
  const root = cm.flow().renderer(renderer);
  root
    .data(numbers)
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.plane)
    .add(cm.circle, {r: 3, fill: "none", stroke: "currentColor", strokeWidth: 1.5})
    .add(cm.axis);
  root.render();
  return renderer.node();
}
