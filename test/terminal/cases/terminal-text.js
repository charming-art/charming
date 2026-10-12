import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalText() {
  return renderTerminal(
    (root, width) => {
      root.data(["start", "center", "end"]).append(cm.text, {
        text: (d) => d,
        x: width / 2,
        y: (_, i) => i * 2,
        textAlign: (d) => d,
        fill: "white",
      });
    },
    {cols: 20, rows: 5},
  );
}
