import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeLineClose() {
  return renderFlow((root) => {
    root
      .data([
        [100, 20],
        [180, 180],
        [20, 180],
      ])
      .append(cm.line, {x: (d) => d[0], y: (d) => d[1], stroke: "black", close: true});
  });
}
