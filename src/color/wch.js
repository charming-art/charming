import { NULL_VALUE } from "../renderer/terminal.js";

export function wch(string) {
  const code = string.codePointAt(0);
  return [code + 0xf0000000, NULL_VALUE];
}