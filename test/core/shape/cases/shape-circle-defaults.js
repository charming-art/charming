import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeCircleDefaults() {
  return renderFlow((root) => {
    root.append(cm.circle, {});
  });
}
