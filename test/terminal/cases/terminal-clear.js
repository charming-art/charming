import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalClear() {
  return renderTerminal(
    (root) => {
      // A previous frame, then a point drawn before the clear: both are cleared.
      root.append(cm.point, {x: 0, y: 0, stroke: {ch: "A"}});
      root.render();
      root.append(cm.point, {x: 1, y: 0, stroke: {ch: "B"}});
      root.append(cm.clear, {fill: "#000"});
      root.append(cm.point, {x: 2, y: 0, stroke: {ch: "C"}});
    },
    {cols: 4, rows: 1},
  );
}
