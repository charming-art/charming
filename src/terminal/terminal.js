import {initSync} from "./backend/index.js";
import wasm from "./backend/wasm.js";
import {terminal$init} from "./init.js";
import {terminal$node} from "./node.js";
import {terminal$char} from "./char.js";
import {terminal$render} from "./render.js";
import {terminal$point} from "./point.js";
import {terminal$text} from "./text.js";
import {terminal$rect} from "./rect.js";
import {terminal$line} from "./line.js";
import {terminal$clear} from "./clear.js";
import {terminal$save} from "./save.js";
import {terminal$restore} from "./restore.js";
import {terminal$rotate} from "./rotate.js";
import {terminal$scale} from "./scale.js";
import {terminal$translate} from "./translate.js";
import {terminal$toString} from "./toString.js";
import {terminal$textBBox} from "./textBBox.js";

function Terminal(memory) {
  Object.defineProperties(this, {
    _memory: {value: memory},
    _props: {value: {}, writable: true},
    _buffer: {value: null, writable: true},
    _context: {value: null, writable: true},
    _backend: {value: null, writable: true},
  });
}

Object.defineProperties(Terminal.prototype, {
  init: {value: terminal$init},
  node: {value: terminal$node},
  char: {value: terminal$char},
  render: {value: terminal$render},
  point: {value: terminal$point},
  rect: {value: terminal$rect},
  line: {value: terminal$line},
  text: {value: terminal$text},
  clear: {value: terminal$clear},
  save: {value: terminal$save},
  restore: {value: terminal$restore},
  rotate: {value: terminal$rotate},
  scale: {value: terminal$scale},
  translate: {value: terminal$translate},
  toString: {value: terminal$toString},
  textBBox: {value: terminal$textBBox},
});

let wasmExports;

function memoryOf() {
  if (!wasmExports) {
    const bytes = Uint8Array.from(atob(wasm), (c) => c.charCodeAt(0));
    wasmExports = initSync({module: bytes});
  }
  return wasmExports.memory;
}

export function terminal({width = 640, height = 480, ...options} = {}) {
  return new Terminal(memoryOf()).init({width, height, ...options});
}
