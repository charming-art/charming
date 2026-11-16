import assert from "node:assert";
import {afterEach, beforeEach, test, vi} from "vitest";
import * as cm from "../../../src/index.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// A flow with linear transitions of 160ms on a 200 × 200 SVG, so that 80ms is halfway.
function chart(options) {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow({transition: {duration: 160, ease: "linear", ...options}}).renderer(renderer);
  return [root, renderer];
}

const xs = (renderer) => Array.from(renderer.node().querySelectorAll("rect"), (r) => +r.getAttribute("x"));

// One keyframe per row: a rect at x.
function moments(root, steps, options) {
  root
    .data(steps)
    .append(cm.keyframe, options)
    .append(cm.rect, {x: (d) => d, y: 0, width: 10, height: 10});
  root.render();
}

test("cm.keyframe draws the rows of the parent as moments, one after another", async () => {
  const [root, renderer] = chart();
  moments(root, [0, 100, 40]);
  assert.deepStrictEqual(xs(renderer), [0]);
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(xs(renderer), [50]);
  // The next moment starts as soon as the one before ends, at 160ms.
  vi.advanceTimersByTime(160);
  assert.deepStrictEqual(xs(renderer), [70]);
  vi.advanceTimersByTime(96);
  await root.finished();
  assert.deepStrictEqual(xs(renderer), [40]);
});

test("cm.keyframe plays keyframes even with transitions off", () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  moments(root, [0, 100]);
  assert.deepStrictEqual(xs(renderer), [0]);
  vi.advanceTimersByTime(2000);
  assert.deepStrictEqual(xs(renderer), [100]);
});

test("sibling keyframes form one sequence, and other marks are drawn at every moment", () => {
  const [root, renderer] = chart();
  root.append(cm.text, {x: 0, y: 0, text: "title"});
  root.append(cm.keyframe).append(cm.rect, {x: 0, y: 0, width: 10, height: 10, key: "a"});
  root.append(cm.keyframe).append(cm.rect, {x: 100, y: 0, width: 10, height: 10, key: "a"});
  root.render();
  vi.advanceTimersByTime(80);
  // The rect of the first keyframe moves to the second's, and the title stays.
  assert.deepStrictEqual(xs(renderer), [50]);
  assert.strictEqual(renderer.node().querySelector("text").textContent, "title");
});

test("cm.keyframe times the transition into each moment with its options", () => {
  const [root, renderer] = chart();
  moments(root, [0, 100], {duration: (d) => (d ? 320 : 0)});
  vi.advanceTimersByTime(80);
  // A quarter of 320ms.
  assert.deepStrictEqual(xs(renderer), [25]);
});

test("keyframes alternate, iterations times", async () => {
  const [root, renderer] = chart({direction: "alternate", iterations: 2});
  moments(root, [0, 100]);
  vi.advanceTimersByTime(160);
  assert.deepStrictEqual(xs(renderer), [100]);
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(xs(renderer), [50]);
  vi.advanceTimersByTime(96);
  await root.finished();
  assert.deepStrictEqual(xs(renderer), [0]);
});

test("marks match across moments by datum, as in a bubble sort", () => {
  const [root, renderer] = chart();
  const [a, b] = [{v: 10}, {v: 20}];
  root
    .data([
      [a, b],
      [b, a],
    ])
    .append(cm.keyframe)
    .data((step) => step)
    .append(cm.rect, {x: (d, i) => i * 100, y: 0, width: 10, height: (d) => d.v});
  root.render();
  vi.advanceTimersByTime(80);
  // Each bar is halfway to the other's place, keeping its height.
  const bars = Array.from(renderer.node().querySelectorAll("rect"), (r) => [
    +r.getAttribute("x"),
    +r.getAttribute("height"),
  ]);
  // In the order of the new step: b, then a.
  assert.deepStrictEqual(bars, [
    [50, 20],
    [50, 10],
  ]);
});

test("a shorter sequence holds its last moment while a longer one plays", () => {
  const [root, renderer] = chart();
  // Two sequences, one per parent group: three moments, and two.
  root
    .data([
      [0, 100, 100],
      [50, 60],
    ])
    .append(cm.g, {x: 0, y: (d, i) => i * 50})
    .data((sequence) => sequence)
    .append(cm.keyframe)
    .append(cm.rect, {x: (d) => d, y: 0, width: 10, height: 10});
  root.render();
  vi.advanceTimersByTime(240);
  // The first is halfway through its last transition; the second holds at 60.
  assert.deepStrictEqual(xs(renderer), [100, 60]);
});

test("a render during keyframes stops them, and finished resolves", async () => {
  const [root, renderer] = chart();
  moments(root, [0, 100, 200]);
  vi.advanceTimersByTime(80);
  root.append(cm.rect, {x: 0, y: 0, width: 10, height: 10});
  root.render();
  vi.advanceTimersByTime(1000);
  await root.finished();
  assert.strictEqual(renderer.node().querySelectorAll("rect").length, 1);
});
