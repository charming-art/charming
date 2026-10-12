import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePointDefaults() {
  return renderFlow((root) => {
    root.append(cm.point, {});
  });
}
