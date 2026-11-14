import assert from "node:assert";
import {test} from "vitest";
import {cfb} from "../../../src/renderer/terminal/cfb.js";
import {NULL_VALUE} from "../../../src/renderer/terminal/constant.js";

test("cfb(color) encodes a none foreground or background as no color", () => {
  const [, , fg, bg] = cfb({ch: "a", fg: "none", bg: "none"});
  assert.strictEqual(fg, NULL_VALUE);
  assert.strictEqual(bg, NULL_VALUE);
});

test("cfb(color) encodes a currentColor foreground as the default foreground", () => {
  const [, , fg] = cfb({ch: "a", fg: "currentColor"});
  assert.strictEqual(fg, 0xffffff);
});

test("cfb(color) encodes a color as a 24-bit number", () => {
  const [, , fg] = cfb({ch: "a", fg: "rgb(1, 2, 3)"});
  assert.strictEqual(fg, (1 << 16) + (2 << 8) + 3);
});
