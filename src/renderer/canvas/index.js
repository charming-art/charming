import {canvas$init} from "./init.js";
import {canvas$node} from "./node.js";
import {canvas$circle} from "./circle.js";
import {canvas$point} from "./point.js";
import {canvas$rect} from "./rect.js";
import {canvas$line} from "./line.js";
import {canvas$triangle} from "./triangle.js";
import {canvas$translate} from "./translate.js";
import {canvas$path} from "./path.js";
import {canvas$polygon} from "./polygon.js";
import {canvas$text} from "./text.js";
import {canvas$clear} from "./clear.js";
import {canvas$rotate} from "./rotate.js";
import {canvas$save} from "./save.js";
import {canvas$restore} from "./restore.js";

function Canvas() {
  Object.defineProperties(this, {
    _context: {value: null, writable: true},
    _props: {value: {}, writable: true},
  });
}

Object.defineProperties(Canvas.prototype, {
  init: {value: canvas$init},
  node: {value: canvas$node},
  point: {value: canvas$point},
  circle: {value: canvas$circle},
  rect: {value: canvas$rect},
  line: {value: canvas$line},
  triangle: {value: canvas$triangle},
  path: {value: canvas$path},
  polygon: {value: canvas$polygon},
  text: {value: canvas$text},
  clear: {value: canvas$clear},
  translate: {value: canvas$translate},
  rotate: {value: canvas$rotate},
  save: {value: canvas$save},
  restore: {value: canvas$restore},
});

export function canvas({width = 640, height = 480, dpi = null} = {}) {
  return new Canvas().init({width, height, dpi});
}
