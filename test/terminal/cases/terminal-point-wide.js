import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalPointWide() {
  return renderTerminal(
    (root) => {
      root.append(cm.point, {x: 0, y: 0, stroke: {ch: "A"}});
      root.append(cm.point, {x: 1, y: 0, stroke: {ch: "中"}});
      root.append(cm.point, {x: 2, y: 0, stroke: {ch: "中", wide: true}});
      root.append(cm.point, {x: 3, y: 0, stroke: {ch: "🚀", wide: true}});
    },
    {cols: 4, rows: 1, mode: "double"},
  );
}
