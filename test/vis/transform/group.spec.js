import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../../src/index.js";

const penguins = [
  {island: "Biscoe", species: "Adelie", mass: 3},
  {island: "Dream", species: "Adelie", mass: 4},
  {island: "Biscoe", species: "Gentoo", mass: 5},
  {island: "Biscoe", species: "Adelie", mass: 6},
];

function grouped(channels, transform, outputs) {
  const flow = cm.flow().data(penguins).transform(cm.encode, channels);
  return flow.transform((flow, data) => transform(flow, data, outputs))._values[0];
}

test("cm.groupX counts the rows of each x by default, and labels the count Frequency, like Plot", () => {
  const {value, hints, group} = grouped({x: "island"}, cm.groupX);
  assert.deepStrictEqual(value, {x: ["Biscoe", "Dream"], y: [3, 1]});
  assert.deepStrictEqual(hints, {x: {label: "island"}, y: {label: "Frequency"}});
  assert.deepStrictEqual(group, [[penguins[0], penguins[2], penguins[3]], [penguins[1]]]);
});

test("cm.groupX groups each x by series, the first of z, fill and stroke", () => {
  const {value, I} = grouped({x: "island", fill: "species"}, cm.groupX);
  assert.deepStrictEqual(value, {x: ["Biscoe", "Biscoe", "Dream"], fill: ["Adelie", "Gentoo", "Adelie"], y: [2, 1, 1]});
  assert.deepStrictEqual(I, [0, 1, 2]);
});

test("cm.groupX reduces the input channel of an output, and drops the other channels", () => {
  const {value, hints} = grouped({x: "island", y: "mass", z: "species"}, cm.groupX, {y: "max"});
  assert.deepStrictEqual(value, {x: ["Biscoe", "Biscoe", "Dream"], z: ["Adelie", "Gentoo", "Adelie"], y: [6, 5, 4]});
  assert.strictEqual(hints.y.label, "mass");
  const sum = grouped({x: "island", y: "mass"}, cm.groupX, {y: "sum"}).value.y;
  assert.deepStrictEqual(sum, [14, 4]);
  const mean = grouped({x: "island", y: "mass"}, cm.groupX, {y: (values) => values.length / 2}).value.y;
  assert.deepStrictEqual(mean, [1.5, 0.5]);
});

test("cm.groupY counts the rows of each y in x", () => {
  const {value} = grouped({y: "island"}, cm.groupY);
  assert.deepStrictEqual(value, {y: ["Biscoe", "Dream"], x: [3, 1]});
});

test("cm.group groups on x and y, with counts in fill by default, and an output fill isn't a series", () => {
  const {value} = grouped({x: "island", y: "species"}, cm.group);
  assert.deepStrictEqual(value, {x: ["Biscoe", "Biscoe", "Dream"], y: ["Adelie", "Gentoo", "Adelie"], fill: [2, 1, 1]});
  const max = grouped({x: "island", y: "species", fill: "mass"}, cm.group, {fill: "max"}).value;
  assert.deepStrictEqual(max.fill, [6, 5, 4]);
});

test("cm.group throws an error for an unknown reducer", () => {
  assert.throws(() => grouped({x: "island"}, cm.groupX, {y: "nope"}), /Unknown reducer: nope/);
});

test("cm.groupX keeps the key and group key of each group's first row, for transitions", () => {
  const {value} = grouped({x: "island", key: "island", groupKey: "species"}, cm.groupX);
  assert.deepStrictEqual(value.key, ["Biscoe", "Dream"]);
  assert.deepStrictEqual(value.groupKey, ["Adelie", "Adelie"]);
});
