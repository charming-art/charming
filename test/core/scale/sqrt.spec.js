import {test} from "vitest";
import * as cm from "../../../src/index.js";
import {assertInDelta} from "../../helpers.js";

test("scaleSqrt(domain, range)(x) applies a square root transform before mapping", () => {
  const x = cm.scaleSqrt([0, 1], [0, 100]);
  assertInDelta(x(0.09), 30);
  assertInDelta(x(0.64), 80);
  assertInDelta(x(0.81), 90);
});

test("scaleSqrt(domain, range)(x) handles negative values symmetrically", () => {
  assertInDelta(cm.scaleSqrt([-1, 1], [-100, 100])(-0.25), -50);
});
