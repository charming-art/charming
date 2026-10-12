import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePointStrokeWidth() {
  return renderFlow((root) => {
    root.append(cm.point, {x: 100, y: 100, strokeWidth: 50});
  });
}
