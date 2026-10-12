import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeCircleColors() {
  return renderFlow((root, width, height) => {
    root.append(cm.circle, {
      x: width / 2,
      y: height / 2,
      r: 50,
      fill: "steelblue",
      stroke: "orange",
    });
  });
}
