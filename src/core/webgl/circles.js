import {range} from "./range.js";
import {colorBytes} from "../color.js";
import {
  getProgram,
  hasGLSLAttribute,
  bindAttribute,
  bindUniform,
  defineGlobalAttributes,
  defineLocalAttributes,
  bindVariables,
} from "./program.js";

// A circle is filled (with fill, or black by default like the canvas renderer) and/or
// outlined (with stroke). Each pass gets a shader colored by that channel. The opacity
// channel overrides the color's alpha, as with the canvas renderer.
function createVertexShaderSource(descriptors, value, color) {
  const {position} = value;
  const xy = position ? "_position + a_vertex * _r" : "vec2(_x, _y) + a_vertex * _r";
  const rgba = color in value ? `_${color}` : "vec4(0.0, 0.0, 0.0, 1.0)";
  const alpha = `${color}Opacity` in value ? `_${color}Opacity` : `${rgba}.a`;
  return `
    ${defineGlobalAttributes(descriptors, value)}
    attribute vec2 a_vertex;
    attribute float a_datum;
    uniform vec2 u_resolution;
    varying vec4 v_color;
    void main() {
      ${defineLocalAttributes(descriptors, value)}
      // Use computed attributes
      vec2 xy = ${xy};
      vec2 scale = xy / u_resolution;
      vec2 clipSpace = scale * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      vec4 color = ${rgba};
      v_color = vec4(color.r, color.g, color.b, ${alpha});
    }
  `;
}

function createFragmentShaderSource() {
  return `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
  `;
}

const attributes = {
  x: {type: "float", size: 1, glType: "FLOAT", normalize: false, map: (value) => new Float32Array(value)},
  y: {type: "float", size: 1, glType: "FLOAT", normalize: false, map: (value) => new Float32Array(value)},
  position: {type: "vec2", size: 2, glType: "FLOAT", map: (value) => new Float32Array(value)},
  stroke: {
    type: "vec4",
    size: 4,
    glType: "UNSIGNED_BYTE",
    normalize: true,
    map: (value) => new Uint8Array(value.flatMap(colorBytes)),
  },
  strokeOpacity: {
    type: "float",
    glType: "UNSIGNED_BYTE",
    normalize: true,
    map: (value) => new Uint8Array(value.map((d) => (d * 255) | 0)),
  },
  fill: {
    type: "vec4",
    size: 4,
    glType: "UNSIGNED_BYTE",
    normalize: true,
    map: (value) => new Uint8Array(value.flatMap(colorBytes)),
  },
  fillOpacity: {
    type: "float",
    glType: "UNSIGNED_BYTE",
    normalize: true,
    map: (value) => new Uint8Array(value.map((d) => (d * 255) | 0)),
  },
  r: {type: "float", size: 1, glType: "FLOAT", map: (value) => new Float32Array(value), normalize: false},
};

function omit(value, keys) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}

function drawCircles(renderer, I, value, data, {color, mode, vertices, count}) {
  const {_gl: gl, _circle: map} = renderer;
  const vertex = createVertexShaderSource(attributes, value, color);
  const fragment = createFragmentShaderSource();
  const program = getProgram(gl, map, vertex, fragment);

  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
  gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

  const ext = gl.getExtension("ANGLE_instanced_arrays");

  if (hasGLSLAttribute(value, attributes)) {
    bindAttribute(gl, program, ext, {
      name: "a_datum",
      data: new Float32Array(data),
      divisor: 1,
    });
  }

  bindAttribute(gl, program, ext, {
    name: "a_vertex",
    size: 2,
    divisor: 0,
    data: new Float32Array(vertices),
  });

  bindUniform(gl, program, {
    name: "u_resolution",
    data: [renderer._props.width, renderer._props.height],
  });

  bindVariables(gl, program, ext, attributes, value);

  ext.drawArraysInstancedANGLE(mode, 0, count, I.length);
}

export function webgl$circles(I, value, data) {
  const gl = this._gl;
  const {count = 100, ...rest} = value;
  const ring = range(count, 0, Math.PI * 2).flatMap((i) => [Math.cos(i), Math.sin(i)]);
  const hasFill = "fill" in rest || !("stroke" in rest);
  if (hasFill) {
    const fill = omit(rest, ["stroke", "strokeOpacity"]);
    const vertices = [0, 0, ...ring, ring[0], ring[1]]; // center, then the closed ring
    drawCircles(this, I, fill, data, {color: "fill", mode: gl.TRIANGLE_FAN, vertices, count: count + 2});
  }
  if ("stroke" in rest) {
    const stroke = omit(rest, ["fill", "fillOpacity"]);
    drawCircles(this, I, stroke, data, {color: "stroke", mode: gl.LINE_LOOP, vertices: ring, count});
  }
}
