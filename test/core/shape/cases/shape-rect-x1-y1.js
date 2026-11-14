import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeRectX1Y1() {
  return renderFlow((root) => {
    root
      .data([
        [10, 10, 70, 50],
        [170, 190, 90, 60],
      ])
      .append(cm.rect, {
        x: (d) => d[0],
        y: (d) => d[1],
        x1: (d) => d[2],
        y1: (d) => d[3],
        fill: "steelblue",
      });
  });
}
