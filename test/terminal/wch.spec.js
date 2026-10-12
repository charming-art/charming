import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("wch(string) encodes the first character as a double-width cell", () => {
  assert.deepStrictEqual(cm.wch("🚀"), ["🚀".codePointAt(0) + 0xf0000000, 0xffffffff]);
  assert.deepStrictEqual(cm.wch("中文"), ["中".codePointAt(0) + 0xf0000000, 0xffffffff]);
});
