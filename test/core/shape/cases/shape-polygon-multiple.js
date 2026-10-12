import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePolygonMultiple() {
  return renderFlow((root) => {
    root
      .data([
        {x: [20, 90, 20], y: [20, 20, 90], fill: "steelblue"},
        {x: [110, 180, 180], y: [180, 180, 110], fill: "orange"},
      ])
      .append(cm.polygon, {x: (d) => d.x, y: (d) => d.y, fill: (d) => d.fill});
  });
}
