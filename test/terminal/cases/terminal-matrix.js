import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalMatrix() {
  return renderTerminal(
    (root) => {
      root
        .data([
          [" +", "-", "+ "],
          [" |", {ch: "🚀", wide: true}, "| "],
          [" +", "-", "+ "],
        ])
        .append(cm.group, {y: (_, i) => i})
        .data((d) => d)
        .append(cm.point, {y: 0, x: (_, i) => i, stroke: (d) => (typeof d === "string" ? {ch: d} : d)});
    },
    {cols: 3, rows: 3, mode: "double"},
  );
}
