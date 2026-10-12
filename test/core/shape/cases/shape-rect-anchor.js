import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeRectAnchor() {
  return renderFlow((root) => {
    root.append(cm.rect, {
      x: 100,
      y: 100,
      width: 80,
      height: 40,
      anchor: "center",
      rotate: Math.PI / 4,
      fill: "orange",
    });
  });
}
