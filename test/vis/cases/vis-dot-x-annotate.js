import * as cm from "../../../src/index.js";

// The one-dimensional dot plot with an annotation: a red rule at 174, drawn with cm.link in data
// units through cm.annotate. Its y isn't given, so it spans the frame.
export function visDotXAnnotate() {
  const numbers = [170.16, 172.53, 172.54, 173.44, 174.35, 174.55, 173.16, 174.59, 176.18, 177.9, 176.15, 179.37];
  const renderer = cm.svg();
  const root = cm.flow().renderer(renderer);
  root
    .data(numbers)
    .transform(cm.encode, {x: (d) => d})
    .transform(cm.plane)
    .add(cm.circle, {r: 3, fill: "none", stroke: "currentColor", strokeWidth: 1.5})
    .add(cm.axis)
    .add(cm.annotate(cm.link), {x: 174, stroke: "red"});
  root.render();
  return renderer.node();
}
