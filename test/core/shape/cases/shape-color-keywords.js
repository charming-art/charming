import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeColorKeywords() {
  return renderFlow((root) => {
    root.append(cm.rect, {x: 20, y: 20, width: 70, height: 70, fill: "steelblue", stroke: "none", strokeWidth: 4});
    root.append(cm.circle, {x: 145, y: 55, r: 35, fill: "currentColor", stroke: "none"});
    root.append(cm.text, {text: "none", x: 20, y: 150, fill: "currentColor", stroke: "none", fontSize: 20});
  });
}
