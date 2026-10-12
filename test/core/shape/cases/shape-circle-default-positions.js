import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeCircleDefaultPositions() {
  return renderFlow((root) => {
    root.append(cm.circle, {r: 100});
  });
}
