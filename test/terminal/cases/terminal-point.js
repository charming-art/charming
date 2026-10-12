import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalPoint() {
  return renderTerminal(
    (root) => {
      root.append(cm.clear, {fill: "#000"});
      root.append(cm.point, {x: 3, y: 1, stroke0: "@"});
      root
        .data([0, 1, 2, 3])
        .append(cm.point, {x: (d) => d * 2, y: 3, stroke: (d) => ({ch: "*", fg: d % 2 ? "orange" : "steelblue"})});
    },
    {cols: 8, rows: 5},
  );
}
