import * as cm from "../../../src/index.js";
import {renderTerminal} from "../../helpers.js";

export function terminalTextFiglet() {
  return renderTerminal(
    (root, width, height) => {
      root.append(cm.text, {
        text: cm.figlet("hello world"),
        x: width / 2,
        y: height / 2,
        textAlign: "center",
        textBaseline: "middle",
        fontFamily: "ghost",
      });
    },
    {cols: 130, rows: 12},
  );
}
