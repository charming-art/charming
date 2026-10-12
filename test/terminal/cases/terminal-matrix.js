import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalMatrix() {
  return renderTerminal(
    (root) => {
      root
        .data([
          [" +", "-", "+ "],
          [" |", cm.wch("🚀"), "| "],
          [" +", "-", "+ "],
        ])
        .append(cm.group, {y: (_, i) => i})
        .data((d) => d)
        .append(cm.point, {y: 0, x: (_, i) => i, stroke0: (d) => d});
    },
    {cols: 3, rows: 3, mode: "double"},
  );
}
