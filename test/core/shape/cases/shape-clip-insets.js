import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

// Clip insets cut a fraction of a shape's own box from each side: four bars, each with half cut
// from another side, under the name of the inset; a text with its right half cut, as a wipe from
// the left shows it halfway; and a circle and a stroked rect with their top halves cut.
export function shapeClipInsets() {
  return renderFlow(
    (root) => {
      const sides = ["clipTop", "clipRight", "clipBottom", "clipLeft"];
      root.data(sides).append(cm.rect, {
        x: (d, i) => 20 + i * 70,
        y: 20,
        width: 50,
        height: 100,
        fill: "steelblue",
        clipTop: (d) => (d === "clipTop" ? 0.5 : 0),
        clipRight: (d) => (d === "clipRight" ? 0.5 : 0),
        clipBottom: (d) => (d === "clipBottom" ? 0.5 : 0),
        clipLeft: (d) => (d === "clipLeft" ? 0.5 : 0),
      });
      root.data(sides).append(cm.text, {
        x: (d, i) => 45 + i * 70,
        y: 135,
        text: (d) => `${d}: 0.5`,
        textAlign: "center",
        textBaseline: "top",
        fontSize: 10,
        fill: "black",
      });
      root.data([0]).append(cm.text, {
        x: 20,
        y: 180,
        text: "Charming",
        fontSize: 32,
        fontWeight: "bold",
        textBaseline: "top",
        fill: "black",
        clipRight: 0.5,
      });
      root.data([0]).append(cm.circle, {x: 220, y: 200, r: 30, fill: "orange", clipTop: 0.5});
      root.data([0]).append(cm.rect, {
        x: 270,
        y: 170,
        width: 60,
        height: 60,
        fill: "none",
        stroke: "black",
        strokeWidth: 4,
        clipTop: 0.5,
      });
    },
    {width: 320, height: 250},
  );
}
