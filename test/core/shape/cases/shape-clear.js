import * as cm from "../../../../src/index.js";
import {renderFlow} from "../../../helpers.js";

export function shapeClear() {
  return renderFlow((root) => {
    root.append(cm.clear, {fill: "black"});
    root.append(cm.circle, {x: 100, y: 100, r: 50, fill: "white"});
  });
}
