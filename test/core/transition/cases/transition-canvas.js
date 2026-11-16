import * as cm from "../../../../src/index.js";
import {bars} from "./transition-bars.js";

// The keyed bars on a Canvas: each frame clears the pixels and draws again.
export function transitionCanvas() {
  return bars(cm.canvas({width: 640, height: 300}));
}
