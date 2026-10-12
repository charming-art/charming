import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeRect() {
  return renderFlow((root) => {
    root
      .data([
        [10, 10, 60, 40],
        [90, 30, 80, 120],
      ])
      .append(cm.rect, {
        x: (d) => d[0],
        y: (d) => d[1],
        width: (d) => d[2],
        height: (d) => d[3],
        fill: "steelblue",
        stroke: "black",
        strokeWidth: 2,
      });
  });
}
