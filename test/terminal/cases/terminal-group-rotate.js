import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalGroupRotate() {
  return renderTerminal(
    (root) => {
      root
        .data([0, Math.PI / 2])
        .append(cm.group, {x: 1, y: 1, rotate: (d) => d})
        .append(cm.link, {x: 0, y: 0, x1: 4, y1: 0, stroke: (d) => ({ch: d ? "|" : "-"})});
    },
    {cols: 7, rows: 7},
  );
}
