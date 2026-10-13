import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

test("polygon with no data draws nothing", () => {
  const renderer = cm.canvas({width: 10, height: 10, dpi: 1});
  cm.flow()
    .renderer(renderer)
    .data([])
    .append(cm.polygon, {x: (d) => d, y: (d) => d, stroke: "black"})
    .render();
  assert.doesNotMatch(renderer.node().toString(), /moveTo|lineTo|stroke/);
});
