import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";

export async function terminalPoint() {
  const app = cc.app({
    renderer: await cc.terminal(),
  });

  let x = 0;

  app.on("update", () => {
    const i = x % app.prop("width");
    const j = (x / app.prop("width")) | 0;
    app.append(cc.clear, { fill: "#000" });
    app.append(cc.point, { x: i, y: j, stroke0: "@" });
    x += 1;
  });

  return app.call(dispose).start().node();
}
