import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeText() {
  return renderFlow((root) => {
    root.data(["start", "center", "end"]).append(cm.text, {
      text: (d) => d,
      x: 100,
      y: (_, i) => 50 + i * 50,
      textAlign: (d) => d,
      textBaseline: "middle",
      fontSize: 20,
      fontFamily: "sans-serif",
      fill: "black",
    });
  });
}
