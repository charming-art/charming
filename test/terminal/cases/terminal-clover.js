import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalClover() {
  return renderTerminal(
    (root, width, height) => {
      root
        .data(Array.from({length: 240}, (_, i) => (i / 240) * Math.PI * 2))
        .append(cm.group, {x: width / 2, y: height / 2})
        .append(cm.point, {
          x: (t) => 10 * Math.cos(t) * Math.cos(t * 3),
          y: (t) => 10 * Math.sin(t) * Math.cos(t * 3),
          stroke: {ch: "🌟", wide: true},
        });
    },
    {cols: 24, rows: 24, mode: "double"},
  );
}
