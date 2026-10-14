import assert from "node:assert";
import {test, vi} from "vitest";
import * as cm from "../../src/index.js";

function sample(noise, n = 500) {
  return Array.from({length: n}, (_, i) => noise(i / 37, i / 53, i / 71));
}

test("noise() returns a function of (x, y, z) with values in [0, 1]", () => {
  const values = sample(cm.noise());
  assert.ok(values.every((v) => v >= 0 && v <= 1));
});

test("noise(lo, hi) maps the values to [lo, hi]", () => {
  const values = sample(cm.noise(10, 20, {seed: 1}));
  assert.ok(values.every((v) => v >= 10 && v <= 20));
});

test("noise(lo, hi) supports a reversed range", () => {
  const values = sample(cm.noise(6, 2, {seed: 1}));
  assert.ok(values.every((v) => v >= 2 && v <= 6));
});

test("noise(lo, hi, {seed}) returns the same values for the same seed", () => {
  assert.deepStrictEqual(sample(cm.noise(0, 1, {seed: 42})), sample(cm.noise(0, 1, {seed: 42})));
  assert.notDeepStrictEqual(sample(cm.noise(0, 1, {seed: 42})), sample(cm.noise(0, 1, {seed: 43})));
});

test("noise()(x) is smooth: nearby inputs give nearby values", () => {
  const noise = cm.noise(0, 1, {seed: 7});
  for (let x = 0; x < 10; x += 0.25) {
    assert.ok(Math.abs(noise(x) - noise(x + 0.001)) < 0.01);
  }
});

test("noise()(x, y, z) defaults y and z to 0", () => {
  const noise = cm.noise(0, 1, {seed: 7});
  assert.strictEqual(noise(0.3), noise(0.3, 0, 0));
  assert.strictEqual(noise(0.3, 0.6), noise(0.3, 0.6, 0));
});

test("noise()(x) mirrors negative inputs", () => {
  const noise = cm.noise(0, 1, {seed: 7});
  assert.strictEqual(noise(-0.3, -0.6), noise(0.3, 0.6));
});

test("noise(lo, hi, {octaves, falloff}) changes the detail of the noise", () => {
  const one = sample(cm.noise(0, 1, {seed: 9, octaves: 1}));
  const four = sample(cm.noise(0, 1, {seed: 9, octaves: 4}));
  const steep = sample(cm.noise(0, 1, {seed: 9, falloff: 0.9}));
  assert.notDeepStrictEqual(one, four);
  assert.notDeepStrictEqual(four, steep);
});

test("noise(lo, hi, {seed}) truncates the seed to an integer", () => {
  assert.deepStrictEqual(sample(cm.noise(0, 1, {seed: 3.2})), sample(cm.noise(0, 1, {seed: 3.9})));
  assert.notDeepStrictEqual(sample(cm.noise(0, 1, {seed: 3})), sample(cm.noise(0, 1, {seed: 4})));
});

test("noise() without a seed uses a random 32-bit seed", () => {
  const random = vi.spyOn(Math, "random");
  try {
    random.mockReturnValue(0.25);
    const a = sample(cm.noise());
    random.mockReturnValue(0.75);
    const b = sample(cm.noise());
    assert.deepStrictEqual(a, sample(cm.noise(0, 1, {seed: 0.25 * 2 ** 32})));
    assert.deepStrictEqual(b, sample(cm.noise(0, 1, {seed: 0.75 * 2 ** 32})));
  } finally {
    random.mockRestore();
  }
});

test("noise(lo, hi, {falloff}) can exceed hi when falloff is greater than 0.5", () => {
  const values = sample(cm.noise(0, 1, {seed: 3, falloff: 0.9}));
  assert.ok(Math.max(...values) > 1);
});
