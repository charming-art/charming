import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalShapes() {
  return renderTerminal(
    (root) => {
      root.append(cm.clear, {fill: "#000"});
      root.append(cm.rect, {x: 1, y: 1, width: 6, height: 3, fill: {ch: "#", fg: "orange"}});
      root.append(cm.rect, {x: 9, y: 1, width: 6, height: 3, stroke: {ch: "+"}});
      root.append(cm.link, {x: 1, y: 6, x1: 14, y1: 6, stroke: {ch: "-"}});
      root.append(cm.link, {x: 1, y: 8, x1: 6, y1: 11, stroke: {ch: "\\"}});
    },
    {cols: 16, rows: 12},
  );
}
