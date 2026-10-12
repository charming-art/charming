import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePolygon() {
  return renderFlow((root) => {
    root
      .data([
        [100, 20],
        [180, 100],
        [100, 180],
        [20, 100],
      ])
      .append(cm.polygon, {x: (d) => d[0], y: (d) => d[1], fill: "steelblue", stroke: "black"});
  });
}
