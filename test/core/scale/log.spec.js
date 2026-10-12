import {test} from "vitest";
import * as cm from "../../../src/index.js";
import {assertInDelta} from "../../helpers.js";

test("scaleLog(domain, range)(x) applies a logarithmic transform before mapping", () => {
  const x = cm.scaleLog([1, 10], [0, 1]);
  assertInDelta(x(1), 0);
  assertInDelta(x(Math.sqrt(10)), 0.5);
  assertInDelta(x(10), 1);
  assertInDelta(x(100), 2);
});
