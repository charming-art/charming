import assert from "node:assert";
import {test} from "vitest";
import "../../install-canvas-mock.js";
import * as cm from "../../../src/index.js";

function units(data, channels, transform, options) {
  return cm.flow().data(data).transform(cm.encode, channels).transform(transform, options)._values[0];
}

const counts = [
  {lake: "A", species: "bass", count: 3},
  {lake: "A", species: "trout", count: 2},
  {lake: "B", species: "bass", count: 1},
];

test("cm.unitY turns each count into that many rows, one per unit", () => {
  const {I, group, value} = units(counts, {x: "lake", y: "count", fill: "species"}, cm.unitY);
  assert.deepStrictEqual(I, [0, 1, 2, 3, 4, 5]);
  assert.deepStrictEqual(value.x, ["A", "A", "A", "A", "A", "B"]);
  assert.deepStrictEqual(value.fill, ["bass", "bass", "bass", "trout", "trout", "bass"]);
  assert.deepStrictEqual(value.y, [1, 1, 1, 1, 1, 1]);
  assert.deepStrictEqual(group[0], [counts[0]]);
  assert.deepStrictEqual(group[5], [counts[2]]);
});

test("cm.unitY divides the amounts by unit and rounds them", () => {
  const {value} = units([{n: 24}, {n: 26}], {x: (_, i) => i, y: "n"}, cm.unitY, {unit: 10});
  assert.deepStrictEqual(value.x, [0, 0, 1, 1, 1]);
  assert.deepStrictEqual(value.y, [10, 10, 10, 10, 10]);
});

test("cm.unitY counts the rows of each group without y, so that many rows become few", () => {
  const rows = Array.from({length: 7}, (_, i) => ({island: i < 4 ? "A" : "B", species: "x"}));
  const {group, value} = units(rows, {x: "island", fill: "species"}, cm.unitY, {unit: 2});
  assert.deepStrictEqual(value.x, ["A", "A", "B", "B"]);
  assert.deepStrictEqual(value.y, [2, 2, 2, 2]);
  assert.deepStrictEqual(group[0], rows.slice(0, 4));
});

test("cm.unitY keeps the sign of the amount of each group", () => {
  const rows = [{sex: "f"}, {sex: "m"}, {sex: "m"}];
  const {value} = units(rows, {y: (d) => (d.sex === "f" ? 1 : -1), fill: "sex"}, cm.unitY);
  assert.deepStrictEqual(value.fill, ["f", "m", "m"]);
  assert.deepStrictEqual(value.y, [1, -1, -1]);
});

test("cm.unitY orders the units of each group by series, and keeps the hints", () => {
  const context = units(counts, {x: "lake", y: "count", fill: {value: "species", domain: ["trout", "bass"]}}, cm.unitY);
  assert.deepStrictEqual(context.value.fill, ["trout", "trout", "bass", "bass", "bass", "bass"]);
  assert.deepStrictEqual(context.hints.fill.domain, ["trout", "bass"]);
});

test("cm.unitX mirrors cm.unitY", () => {
  const {value} = units(counts, {y: "lake", x: "count", fill: "species"}, cm.unitX);
  assert.deepStrictEqual(value.y, ["A", "A", "A", "A", "A", "B"]);
  assert.deepStrictEqual(value.x, [1, 1, 1, 1, 1, 1]);
});

test("cm.unitX and cm.unitY throw an error without channels", () => {
  assert.throws(() => cm.flow().data([1]).transform(cm.unitY), /No channels.*cm.unitY/);
  assert.throws(() => cm.flow().data([1]).transform(cm.unitX), /No channels.*cm.unitX/);
});

test("cm.unitY groups by position and series, even if their values contain commas", () => {
  // As strings, "W,X" with "a" and "W" with "X,a" would both be "W,X,a".
  const rows = [
    {place: "W,X", kind: "a"},
    {place: "W", kind: "X,a"},
  ];
  const {value} = units(rows, {x: "place", fill: "kind"}, cm.unitY);
  assert.deepStrictEqual(value.x, ["W,X", "W"]);
  assert.deepStrictEqual(value.fill, ["a", "X,a"]);
});

test("cm.unitY counts only the rows of the index", () => {
  const data = [
    {lake: "A", count: 3},
    {lake: "B", count: 2},
    {lake: "A", count: 1},
  ].map((d) => d);
  const [context] = cm.flow().data(data).transform(cm.encode, {x: "lake", y: "count"})._values;
  const [{value}] = cm.unitY(null, [{...context, I: [2, 1]}]);
  assert.deepStrictEqual(value.x, ["A", "B", "B"]);
});

test("cm.unitY orders the groups by the first appearance of their position, as values", () => {
  const data = [new Date(0), new Date(1), new Date(0)].map((date) => ({date}));
  const {value} = units(data, {x: "date"}, cm.unitY);
  assert.deepStrictEqual(value.x, [new Date(0), new Date(0), new Date(1)]);
});
