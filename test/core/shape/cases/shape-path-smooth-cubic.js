import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePathSmoothCubic() {
  return renderFlow((root) => {
    root.append(cm.path, {
      // A relative cubic, then a relative smooth cubic that reflects its second control point.
      d: () => [
        ["M", 10, 10],
        ["c", 20, -20, 40, -20, 60, 0],
        ["s", 40, 20, 60, 0],
      ],
      stroke: "black",
    });
  });
}
