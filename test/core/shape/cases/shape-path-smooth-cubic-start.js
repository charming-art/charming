import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePathSmoothCubicStart() {
  return renderFlow((root) => {
    root.append(cm.path, {
      // A relative smooth cubic with no cubic before it: its first control point is the current point.
      d: () => [
        ["M", 10, 10],
        ["s", 40, 20, 60, 0],
      ],
      stroke: "black",
    });
  });
}
