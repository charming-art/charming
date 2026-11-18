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

test("cm.keyframe draws the first moment as it is, and only enters marks from the second, unless they appear", () => {
  const [root, renderer] = chart();
  const ys = () => Array.from(renderer.node().querySelectorAll("rect"), (r) => +r.getAttribute("y"));
  root
    .data([0, 100])
    .append(cm.keyframe)
    .append(cm.rect, {x: (d) => d, y: 0, width: 10, height: 10, enter: {y: 200}});
  root.render();
  // The enter state is for marks entering a later moment: the first is drawn, and the next starts.
  assert.deepStrictEqual(ys(), [0]);
  vi.advanceTimersByTime(80);
  assert.deepStrictEqual(xs(renderer), [50]);
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

test("keyframes without rows draw nothing, without an error", async () => {
  const [root, renderer] = chart();
  root.append(cm.text, {x: 0, y: 0, text: "title"});
  root.data([]).append(cm.keyframe).append(cm.rect, {x: 0, y: 0, width: 10, height: 10});
  assert.doesNotThrow(() => root.render());
  await root.finished();
  assert.deepStrictEqual(xs(renderer), []);
  assert.strictEqual(renderer.node().querySelector("text").textContent, "title");
});

test("a long sequence of moments without duration plays without overflowing the stack", async () => {
  const [root, renderer] = chart();
  const steps = Array.from({length: 5000}, (_, i) => i % 100);
  moments(root, steps, {duration: 0});
  await root.finished();
  assert.deepStrictEqual(xs(renderer), [steps[steps.length - 1]]);
});

test("a scene takes its timing from the sequences that move into it, the longest of them", () => {
  const [root, renderer] = chart();
  root
    .append(cm.g)
    .data([0])
    .append(cm.keyframe, {duration: 0})
    .append(cm.rect, {x: (d) => d, y: 0, width: 10, height: 10});
  root
    .append(cm.g)
    .data([0, 100])
    .append(cm.keyframe, {duration: 400})
    .append(cm.rect, {x: (d) => d, y: 0, width: 10, height: 10});
  root.render();
  vi.advanceTimersByTime(208);
  // The second sequence moves over 400ms; the first holds its only row.
  assert.deepStrictEqual(xs(renderer), [0, 52]);
});

test("keyframes nested in keyframes throw an error, rather than skipping rows", () => {
  const [root] = chart();
  root
    .data([0, 1])
    .append(cm.keyframe)
    .data((d) => (d === 0 ? [0, 10, 20] : [100]))
    .append(cm.keyframe)
    .append(cm.rect, {x: (d) => d, y: 0, width: 10, height: 10});
  assert.throws(() => root.render(), /Keyframes nested in keyframes aren't supported yet/);
});

test("a render with transitions off stops a sequence of keyframes", async () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow().renderer(renderer);
  moments(root, [0, 100]);
  root.append(cm.rect, {x: 7, y: 0, width: 10, height: 10});
  root.render();
  await root.finished();
  vi.advanceTimersByTime(2000);
  assert.ok(xs(renderer).includes(7), xs(renderer));
  assert.ok(!xs(renderer).includes(100), xs(renderer));
});

test("a sequence whose playback fails to start doesn't leave the flow stuck", async () => {
  const renderer = cm.svg({width: 200, height: 200});
  const root = cm.flow({transition: {duration: 160, ease: "linear"}}).renderer({});
  root
    .data([0, 100])
    .append(cm.keyframe)
    .append(cm.rect, {x: (d) => d, y: 0, width: 10, height: 10});
  assert.throws(() => root.render(), /only support the SVG and Canvas renderers/);
  // The same flow, on an SVG renderer, renders and finishes.
  root.renderer(renderer);
  root.append(cm.rect, {x: 0, y: 0, width: 10, height: 10});
  root.render();
  vi.advanceTimersByTime(0);
  await root.finished();
  assert.deepStrictEqual(xs(renderer), [0]);
});

test("keyframes repeat forever with iterations Infinity, until a render stops them", async () => {
  const [root, renderer] = chart({direction: "alternate", iterations: Infinity});
  moments(root, [0, 100]);
  vi.advanceTimersByTime(160 * 3 + 80);
  // Back and forth: 0 → 100 → 0 → 100, and halfway back.
  assert.deepStrictEqual(xs(renderer), [50]);
  root.append(cm.rect, {x: 7, y: 0, width: 10, height: 10});
  root.render();
  vi.advanceTimersByTime(176);
  await root.finished();
  assert.deepStrictEqual(xs(renderer), [7]);
});

test("a mark drawn at every moment matches the same mark in a render after the keyframes", async () => {
  const [root, renderer] = chart();
  root.append(cm.rect, {x: 50, y: 0, width: 10, height: 10});
  root
    .data([0, 100])
    .append(cm.keyframe)
    .append(cm.circle, {x: (d) => d, y: 0, r: 5});
  root.render();
  vi.advanceTimersByTime(400);
  await root.finished();
  root.append(cm.rect, {x: 150, y: 0, width: 10, height: 10});
  root.render();
  vi.advanceTimersByTime(80);
  // The rect moves halfway, rather than entering at its new place.
  assert.deepStrictEqual(xs(renderer), [100]);
});
