import {svg$init} from "./init.js";
import {svg$node} from "./node.js";
import {svg$circle} from "./circle.js";
import {svg$point} from "./point.js";
import {svg$rect} from "./rect.js";
import {svg$line} from "./line.js";
import {svg$triangle} from "./triangle.js";
import {svg$translate} from "./translate.js";
import {svg$path} from "./path.js";
import {svg$polygon} from "./polygon.js";
import {svg$text} from "./text.js";
import {svg$clear} from "./clear.js";
import {svg$rotate} from "./rotate.js";
import {svg$save} from "./save.js";
import {svg$restore} from "./restore.js";

function SVG() {
  Object.defineProperties(this, {
    _node: {value: null, writable: true},
    _group: {value: null, writable: true},
    _stack: {value: null, writable: true},
    _props: {value: {}, writable: true},
  });
}

Object.defineProperties(SVG.prototype, {
  init: {value: svg$init},
  node: {value: svg$node},
  point: {value: svg$point},
  circle: {value: svg$circle},
  rect: {value: svg$rect},
  line: {value: svg$line},
  triangle: {value: svg$triangle},
  path: {value: svg$path},
  polygon: {value: svg$polygon},
  text: {value: svg$text},
  clear: {value: svg$clear},
  translate: {value: svg$translate},
  rotate: {value: svg$rotate},
  save: {value: svg$save},
  restore: {value: svg$restore},
});

export function svg({width = 640, height = 480} = {}) {
  return new SVG().init({width, height});
}
