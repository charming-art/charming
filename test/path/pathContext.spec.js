import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("pathContext() returns an empty path", () => {
  assert.deepStrictEqual(cm.pathContext().toArray(), []);
});

test("pathContext().moveTo, lineTo and closePath record M, L and Z commands", () => {
  const context = cm.pathContext();
  context.moveTo(0, 0);
  context.lineTo(10, 0);
  context.lineTo(10, 10);
  context.closePath();
  assert.deepStrictEqual(context.toArray(), [["M", 0, 0], ["L", 10, 0], ["L", 10, 10], ["Z"]]);
});

test("pathContext().quadraticCurveTo and bezierCurveTo record Q and C commands", () => {
  const context = cm.pathContext();
  context.moveTo(0, 0);
  context.quadraticCurveTo(10, 10, 0, 10);
  context.bezierCurveTo(1, 2, 3, 4, 5, 6);
  assert.deepStrictEqual(context.toArray(), [
    ["M", 0, 0],
    ["Q", 10, 10, 0, 10],
    ["C", 1, 2, 3, 4, 5, 6],
  ]);
});

test("pathContext().arc records a move to the start point and an A command", () => {
  const context = cm.pathContext();
  context.arc(50, 50, 10, 0, Math.PI);
  assert.deepStrictEqual(context.toArray(), [
    ["M", 60, 50],
    ["A", 10, 10, 0, 1, 1, 40, 50],
  ]);
});

test("pathContext().rect records a closed rectangle with relative commands", () => {
  const context = cm.pathContext();
  context.rect(0, 0, 5, 5);
  assert.deepStrictEqual(context.toArray(), [["M", 0, 0], ["h", 5], ["v", 5], ["h", -5], ["Z"]]);
});
