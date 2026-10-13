import assert from "node:assert";
import {test} from "vitest";
import "../install-canvas-mock.js";
import * as cm from "../../src/index.js";

test("point without a stroke draws nothing", () => {
  const renderer = cm.terminal({cols: 3, rows: 1});
  const root = cm.flow().renderer(renderer);
  root.append(cm.point, {x: 0, y: 0});
  root.append(cm.point, {x: 1, y: 0, stroke: {ch: "@"}});
  assert.doesNotThrow(() => root.render());
  assert.strictEqual(renderer.toString(), "·@·");
});
