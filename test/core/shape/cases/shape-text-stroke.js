import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeTextStroke() {
  return renderFlow((root) => {
    root.append(cm.text, {
      text: "outline",
      x: 20,
      y: 100,
      stroke: "black",
      fontSize: 32,
      fontWeight: "bold",
      fontFamily: "sans-serif",
    });
    root.append(cm.text, {
      text: "both",
      x: 20,
      y: 150,
      fill: "orange",
      stroke: "black",
      fontSize: 32,
      fontFamily: "sans-serif",
    });
  });
}
