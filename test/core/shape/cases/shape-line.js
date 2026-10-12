import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeLine() {
  return renderFlow((root) => {
    root
      .data([
        [20, 150],
        [70, 50],
        [120, 120],
        [180, 30],
      ])
      .append(cm.line, {x: (d) => d[0], y: (d) => d[1], stroke: "steelblue", strokeWidth: 2});
  });
}
