import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapePath() {
  return renderFlow((root) => {
    root.append(cm.path, {
      d: () => {
        const context = cm.pathContext();
        context.moveTo(20, 100);
        context.quadraticCurveTo(100, 0, 180, 100);
        context.lineTo(180, 180);
        context.arc(100, 180, 80, 0, Math.PI);
        context.closePath();
        return context.toArray();
      },
      fill: "steelblue",
      stroke: "black",
      strokeWidth: 2,
    });
  });
}
