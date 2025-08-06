import * as cc from "../../src/index.js";
import { dispose } from "../utils/dispose.js";

export async function terminalText() {
  const app = cc.app({
    width: 1200,
    renderer: await cc.terminal(),
  });

  app.append(cc.text, {
    text: cc.figlet("hello world"),
    x: app.prop("width") / 2,
    y: app.prop("height") / 2,
    textAlign: "center",
    textBaseline: "middle",
    fontFamily: cc.fontGhost(),
  });

  return app.call(dispose).start().node();
}
