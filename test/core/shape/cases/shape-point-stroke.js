import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePointStroke() {
  return renderFlow((root) => {
    root.append(cm.point, {x: 100, y: 100, strokeWidth: 50, stroke: "orange"});
  });
}
