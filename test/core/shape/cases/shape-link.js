import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeLink() {
  return renderFlow((root) => {
    root.data(["butt", "round", "square"]).append(cm.link, {
      x: 40,
      y: (_, i) => 50 + i * 50,
      x1: 160,
      y1: (_, i) => 50 + i * 50,
      stroke: "steelblue",
      strokeWidth: 16,
      strokeCap: (d) => d,
    });
  });
}
