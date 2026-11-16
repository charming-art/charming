import assert from "node:assert";
import {test} from "vitest";
import {align, lengthOf, outlineOf, pathOf, project, resample} from "../../../src/core/transition/outline.js";
import {assertInDelta} from "../../helpers.js";

test("outlineOf(primitive) gives the corners of a rect, clockwise from its top left", () => {
  const {points, closed} = outlineOf({type: "rect", attrs: {x: 10, y: 20, width: 30, height: 40}});
  assert.deepStrictEqual(points, [
    [10, 20],
    [40, 20],
    [40, 60],
    [10, 60],
  ]);
  assert.strictEqual(closed, true);
});

test("outlineOf(primitive) turns a rotated rect around its center", () => {
  const {points} = outlineOf({type: "rect", attrs: {x: 0, y: 0, width: 2, height: 2, rotate: Math.PI / 2}});
  const [x, y] = points[0];
  assertInDelta(x, 2);
  assertInDelta(y, 0);
});

test("outlineOf(primitive) gives points along a circle, and the vertices of triangles and polygons", () => {
  const {points} = outlineOf({type: "circle", attrs: {x: 5, y: 5, r: 2}});
  assert.strictEqual(points.length, 64);
  for (const [x, y] of points) assertInDelta(Math.hypot(x - 5, y - 5), 2);
  const triangle = outlineOf({type: "triangle", attrs: {x: 0, y: 0, x1: 1, y1: 0, x2: 0, y2: 1}});
  assert.deepStrictEqual(triangle.points, [
    [0, 0],
    [1, 0],
    [0, 1],
  ]);
  const polygon = outlineOf({type: "polygon", attrs: {x: [0, 2, 2], y: [0, 0, 2]}});
  assert.deepStrictEqual(polygon.points, [
    [0, 0],
    [2, 0],
    [2, 2],
  ]);
});

test("outlineOf(primitive) gives an open line, and nothing for paths and texts", () => {
  assert.deepStrictEqual(outlineOf({type: "line", attrs: {x: 0, y: 0, x1: 3, y1: 4}}), {
    points: [
      [0, 0],
      [3, 4],
    ],
    closed: false,
  });
  assert.strictEqual(outlineOf({type: "path", attrs: {d: "M0,0L1,1"}}), null);
  assert.strictEqual(outlineOf({type: "text", attrs: {x: 0, y: 0}}), null);
});

test("project(points, ops) applies translations and rotations, from the innermost", () => {
  const points = project(
    [[1, 0]],
    [
      ["translate", 10, 0],
      ["rotate", Math.PI / 2],
    ],
  );
  assertInDelta(points[0][0], 10);
  assertInDelta(points[0][1], 1);
});

test("resample(points, closed, n) gives n points evenly along the outline, keeping its length", () => {
  const square = [
    [0, 0],
    [4, 0],
    [4, 4],
    [0, 4],
  ];
  const points = resample(square, true, 8);
  assert.strictEqual(points.length, 8);
  assert.deepStrictEqual(points.slice(0, 3), [
    [0, 0],
    [2, 0],
    [4, 0],
  ]);
  assertInDelta(lengthOf(points, true), 16);
});

test("align(a, b) turns b to start at the point that best lines up with a", () => {
  const a = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  const b = [a[2], a[3], a[0], a[1]];
  assert.deepStrictEqual(align(a, b), a);
});

test("pathOf(points, closed) gives the d of a path through the points", () => {
  const points = [
    [0, 0],
    [1, 2],
  ];
  assert.strictEqual(pathOf(points, true), "M0,0L1,2Z");
  assert.strictEqual(pathOf(points, false), "M0,0L1,2");
});

test("outlineOf(primitive) matches the renderers: points have a radius of 1, triangles and lines turn", () => {
  const point = outlineOf({type: "point", attrs: {x: 0, y: 0}});
  for (const [x, y] of point.points) assertInDelta(Math.hypot(x, y), 1);
  // A triangle turns around the origin.
  const triangle = outlineOf({type: "triangle", attrs: {x: 1, y: 0, x1: 2, y1: 0, x2: 1, y2: 1, rotate: Math.PI / 2}});
  assertInDelta(triangle.points[0][0], 0);
  assertInDelta(triangle.points[0][1], 1);
  // A line turns around its start by default, or its center or end.
  const line = (transformOrigin) =>
    outlineOf({type: "line", attrs: {x: 0, y: 0, x1: 2, y1: 0, rotate: Math.PI / 2, transformOrigin}}).points;
  const [, end] = line();
  assertInDelta(end[0], 0);
  assertInDelta(end[1], 2);
  const [start] = line("end");
  assertInDelta(start[0], 2);
  assertInDelta(start[1], -2);
});

test("outlineOf(primitive) keeps whether the outline of a morphing primitive is closed", () => {
  const points = [
    [0, 0],
    [1, 0],
  ];
  assert.strictEqual(outlineOf({type: "path", attrs: {}, points, closed: false}).closed, false);
  assert.strictEqual(outlineOf({type: "path", attrs: {}, points}).closed, true);
});

test("align(a, b) also lines up an outline wound the other way", () => {
  const a = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  // The same square, counterclockwise.
  const b = [a[0], a[3], a[2], a[1]];
  assert.deepStrictEqual(align(a, b), a);
});
