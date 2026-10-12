import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeCircleOpacity1() {
  return renderFlow((root, width, height) => {
    root.append(cm.circle, {
      x: width / 2,
      y: height / 2,
      r: 50,
      fill: "steelblue",
      stroke: "orange",
      strokeWidth: 10,
      strokeOpacity: 0.5,
      fillOpacity: 0.5,
    });
  });
}
