import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

function markup(renderer) {
  return renderer.node().innerHTML;
}

test("cm.svg(options) returns a renderer with a standalone svg node", () => {
  const node = cm.svg({width: 100, height: 50}).node();
  assert.strictEqual(node.tagName, "svg");
  assert.strictEqual(node.getAttribute("xmlns"), "http://www.w3.org/2000/svg");
  assert.strictEqual(node.getAttribute("viewBox"), "0 0 100 50");
});

test("svg.save() and svg.restore() nest groups and remove empty ones", () => {
  const renderer = cm.svg();
  renderer.save();
  renderer.translate(10, 20);
  renderer.circle({x: 0, y: 0, r: 5});
  renderer.restore();
  renderer.save();
  renderer.restore();
  assert.strictEqual(markup(renderer), '<g transform="translate(10,20)"><circle cx="0" cy="0" r="5"></circle></g>');
});

test("svg.translate(x, y) does not move shapes that are already drawn", () => {
  const renderer = cm.svg();
  renderer.save();
  renderer.circle({x: 0, y: 0, r: 5});
  renderer.translate(10, 0);
  renderer.circle({x: 0, y: 0, r: 5});
  renderer.restore();
  assert.strictEqual(
    markup(renderer),
    '<g><circle cx="0" cy="0" r="5"></circle><g transform="translate(10,0)"><circle cx="0" cy="0" r="5"></circle></g></g>',
  );
});

test("svg.restore() without a matching save does nothing", () => {
  const renderer = cm.svg();
  renderer.translate(10, 0);
  renderer.restore();
  renderer.circle({x: 0, y: 0, r: 5});
  assert.strictEqual(markup(renderer), '<g transform="translate(10,0)"><circle cx="0" cy="0" r="5"></circle></g>');
});

test("svg.rect(options) normalizes a negative width and height", () => {
  const renderer = cm.svg();
  renderer.rect({x: 50, y: 40, width: -20, height: -10});
  assert.strictEqual(markup(renderer), '<rect x="30" y="30" width="20" height="10"></rect>');
});

test("svg.path(options) writes arc rotations in degrees and flags as numbers", () => {
  const renderer = cm.svg();
  renderer.path({d: [["M", 0, 0], ["A", 10, 5, Math.PI / 2, true, false, 20, 0], ["Z"]], stroke: "black"});
  assert.strictEqual(markup(renderer), '<path d="M0,0A10,5,90,1,0,20,0Z" fill="none" stroke="black"></path>');
});

test("svg.clear(options) removes what was drawn before", () => {
  const renderer = cm.svg({width: 100, height: 50});
  renderer.circle({x: 0, y: 0, r: 5});
  renderer.clear({fill: "white"});
  assert.strictEqual(markup(renderer), '<rect width="100" height="50" fill="white"></rect>');
});
