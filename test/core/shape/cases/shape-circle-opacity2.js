import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeCircleOpacity2() {
  return renderFlow((root, width, height) => {
    root.append(cm.circle, {
      x: width / 2,
      y: height / 2,
      r: 50,
      fill: "rgba(85, 128, 176, 0.8)",
      stroke: "rgba(255, 165, 0, 0.8)",
      strokeWidth: 10,
    });
  });
}
