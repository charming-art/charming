import assert from "node:assert";
import {test} from "vitest";
import * as cm from "../../src/index.js";

test("figlet(text) returns a figlet text attribute", () => {
  assert.deepStrictEqual(cm.figlet("hello"), {type: "figlet", text: "hello"});
});
