import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeLinkStrokeOpacity() {
  return renderFlow((root) => {
    root.append(cm.link, {x: 20, y: 50, x1: 180, y1: 50, stroke: "black", strokeWidth: 10, strokeOpacity: 0.2});
    root.append(cm.link, {x: 20, y: 100, x1: 180, y1: 100, stroke: "black", strokeWidth: 10});
  });
}
