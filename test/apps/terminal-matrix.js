import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";

export async function terminalMatrix() {
  const app = cc.app({
    cols: 3,
    rows: 3,
    mode: "double",
    renderer: await cc.terminal(),
  });

  app
    .data([
      [" +", "-", "+ "],
      [" |", cc.wch("🚀"), "| "],
      [" +", "-", "+ "],
    ])
    .append(cc.group, { y: (_, i) => i })
    .data((d) => d)
    .append(cc.point, {
      y: 0,
      x: (_, i) => i,
      stroke0: (d) => d,
    });

  return app.call(dispose).render().node();
}
