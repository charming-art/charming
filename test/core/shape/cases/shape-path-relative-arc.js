import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePathRelativeArc() {
  return renderFlow((root) => {
    root.append(cm.path, {
      // A relative arc from (50, 100) to (150, 100): a half circle centered at (100, 100).
      d: () => [
        ["M", 50, 100],
        ["a", 50, 50, 0, 0, 1, 100, 0],
      ],
      stroke: "black",
    });
  });
}
