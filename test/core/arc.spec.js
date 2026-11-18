import assert from "node:assert";
import {arc} from "d3-shape";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("renderer.arc draws a wedge around x and y as a path, like d3.arc", () => {
  const renderer = cm.svg({width: 200, height: 200});
  renderer.arc({x: 100, y: 100, innerRadius: 20, outerRadius: 80, startAngle: 0, endAngle: Math.PI / 2, fill: "red"});
  const path = renderer.node().querySelector("path");
  const d = arc()({innerRadius: 20, outerRadius: 80, startAngle: 0, endAngle: Math.PI / 2});
  assert.strictEqual(path.getAttribute("d"), d);
  assert.strictEqual(path.getAttribute("transform"), "translate(100,100)");
  assert.strictEqual(path.getAttribute("fill"), "red");
});

test("renderer.arc draws a fraction of a wedge from its start angle with sweep", () => {
  const renderer = cm.svg({width: 200, height: 200});
  renderer.arc({outerRadius: 80, startAngle: 1, endAngle: 3, sweep: 0.5});
  const d = arc()({innerRadius: 0, outerRadius: 80, startAngle: 1, endAngle: 2});
  assert.strictEqual(renderer.node().querySelector("path").getAttribute("d"), d);
});
