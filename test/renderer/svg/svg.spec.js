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

test("svg.circle(options) replaces the alpha of a color with an explicit opacity, like Canvas", () => {
  const renderer = cm.svg();
  renderer.circle({
    x: 0,
    y: 0,
    r: 5,
    fill: "rgba(255, 0, 0, 0.8)",
    fillOpacity: 0.5,
    stroke: "none",
    strokeOpacity: 0.5,
  });
  renderer.circle({x: 0, y: 0, r: 5, fill: "rgba(255, 0, 0, 0.8)"});
  assert.strictEqual(
    markup(renderer),
    '<circle cx="0" cy="0" r="5" fill="rgb(255, 0, 0)" fill-opacity="0.5" stroke="none" stroke-opacity="0.5"></circle>' +
      '<circle cx="0" cy="0" r="5" fill="rgba(255, 0, 0, 0.8)"></circle>',
  );
});

test("svg.text(options) preserves repeated, leading and trailing spaces, like Canvas", () => {
  const renderer = cm.svg();
  renderer.text({text: " A  B", x: 0, y: 0});
  renderer.text({text: "A B", x: 0, y: 0});
  assert.strictEqual(
    markup(renderer),
    '<text x="0" y="0" font-size="14" style="white-space: pre"> A  B</text><text x="0" y="0" font-size="14">A B</text>',
  );
});

test("cm.svg(options) records which dimensions are auto", () => {
  assert.deepStrictEqual(cm.svg()._props.auto, {width: true, height: true});
  assert.deepStrictEqual(cm.svg({height: 100})._props.auto, {width: true, height: false});
});

test("svg.resize(width, height) resizes the svg and its viewBox", () => {
  const renderer = cm.svg({width: 100, height: 50});
  renderer.resize(300, 60);
  const node = renderer.node();
  assert.strictEqual(node.getAttribute("width"), "300");
  assert.strictEqual(node.getAttribute("height"), "60");
  assert.strictEqual(node.getAttribute("viewBox"), "0 0 300 60");
  assert.deepStrictEqual([renderer._props.width, renderer._props.height], [300, 60]);
});

test("svg.path(options) sets the cap and join of its stroke", () => {
  const renderer = cm.svg({width: 10, height: 10});
  renderer.path({d: "M0,0L5,5L10,0", stroke: "red", strokeCap: "round", strokeJoin: "bevel"});
  const path = renderer.node().querySelector("path");
  assert.strictEqual(path.getAttribute("stroke-linecap"), "round");
  assert.strictEqual(path.getAttribute("stroke-linejoin"), "bevel");
});

test("svg.text(options) rotates text around its position, in radians", () => {
  const renderer = cm.svg({width: 10, height: 10});
  renderer.text({text: "a", x: 5, y: 6, rotate: -Math.PI / 2});
  renderer.text({text: "b", x: 5, y: 6});
  const [a, b] = renderer.node().querySelectorAll("text");
  assert.strictEqual(a.getAttribute("transform"), "rotate(-90,5,6)");
  assert.strictEqual(b.getAttribute("transform"), null);
});

test("svg.erase() and svg.render() reuse the elements drawn before, and remove the ones not drawn again", () => {
  const renderer = cm.svg({width: 100, height: 100});
  const frame = (rects) => {
    renderer.erase();
    for (const x of rects) {
      renderer.save();
      renderer.translate(x, 0);
      renderer.rect({x: 0, y: 0, width: 10, height: 10, fill: x ? "red" : null});
      renderer.restore();
    }
    renderer.render();
  };
  frame([0, 20]);
  const [a, b] = renderer.node().querySelectorAll("rect");
  frame([5, 25, 45]);
  const rects = renderer.node().querySelectorAll("rect");
  // The first two are the same elements, with their new attributes; the third is new.
  assert.strictEqual(rects[0], a);
  assert.strictEqual(rects[1], b);
  assert.strictEqual(a.getAttribute("fill"), "red");
  assert.match(a.parentNode.getAttribute("transform"), /^translate\(5,\s*0\)$/);
  frame([0]);
  assert.strictEqual(renderer.node().querySelectorAll("rect").length, 1);
  assert.strictEqual(renderer.node().querySelector("rect"), a);
  // An attribute no longer given is removed.
  assert.strictEqual(a.getAttribute("fill"), null);
});
