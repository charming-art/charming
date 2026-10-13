# Charming WebGL

**Charming WebGL** renders shapes with [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API). Each shape is drawn with [batch rendering](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawArraysInstancedANGLE): all the instances appended together take one draw call, instead of one call each as with the Canvas API. That makes it suited to drawing tens of thousands of shapes per frame.

Attributes can also be [GLSL](#cm-glsl) functions, which the GPU evaluates for each shape. Here, 10,000 circles are positioned, sized and colored on the GPU:

```js eval code=false
(() => {
  const width = 640;
  const height = 640;
  const count = 10000;
  const scale = 240;
  const theta = Array.from({length: count}, (_, i) => (i / count) * Math.PI * 2);
  const renderer = cm.webgl({width, height});
  const root = cm.flow().renderer(renderer);
  const node = renderer.node();
  let time = 0;
  let frame = requestAnimationFrame(function tick() {
    if (!node.isConnected && time > 0) return;
    time += 0.02;
    root.append(cm.clear, {fill: "black"});
    root.data(theta).append(cm.circle, {
      position: cm.glsl`vec2 position(float theta) {
        vec2 xy = vec2(cos(theta), sin(theta)) * (0.6 + 0.2 * cos(theta * 6.0 + cos(theta * 8.0 + ${time})));
        return xy * ${scale} + vec2(${width / 2}, ${height / 2});
      }`,
      r: cm.glsl`float r(float theta) {
        return (0.2 + 0.12 * cos(theta * 9.0 - ${time} * 2.0)) * ${scale};
      }`,
      stroke: cm.glsl`vec4 stroke(float theta) {
        float th = 8.0 * theta + ${time} * 2.0;
        vec3 rgb = 0.6 + 0.4 * vec3(cos(th), cos(th - ${Math.PI} / 3.0), cos(th - ${Math.PI} * 2.0 / 3.0));
        return vec4(rgb, 1.0);
      }`,
      strokeOpacity: (0.15 * 2000) / count,
    });

    root.render();
    frame = requestAnimationFrame(tick);
  });
  unsubscribe(() => cancelAnimationFrame(frame));

  return node;
})();
```

```js
const width = 640;
const height = 640;
const count = 10000;
const scale = 240;
const theta = Array.from({length: count}, (_, i) => (i / count) * Math.PI * 2);
const renderer = cm.webgl({width, height});
const root = cm.flow().renderer(renderer);
let time = 0;

requestAnimationFrame(function frame() {
  time += 0.02;
  root.append(cm.clear, {fill: "black"});
  root.data(theta).append(cm.circle, {
    position: cm.glsl`vec2 position(float theta) {
      vec2 xy = vec2(cos(theta), sin(theta)) * (0.6 + 0.2 * cos(theta * 6.0 + cos(theta * 8.0 + ${time})));
      return xy * ${scale} + vec2(${width / 2}, ${height / 2});
    }`,
    r: cm.glsl`float r(float theta) {
      return (0.2 + 0.12 * cos(theta * 9.0 - ${time} * 2.0)) * ${scale};
    }`,
    stroke: cm.glsl`vec4 stroke(float theta) {
      float th = 8.0 * theta + ${time} * 2.0;
      vec3 rgb = 0.6 + 0.4 * vec3(cos(th), cos(th - ${Math.PI} / 3.0), cos(th - ${Math.PI} * 2.0 / 3.0));
      return vec4(rgb, 1.0);
    }`,
    strokeOpacity: (0.15 * 2000) / count,
  });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```

## _cm_.webgl(_[options]_) {#cm-webgl}

Returns a renderer that draws with WebGL. Options:

- **width** — CSS width of the canvas (default `640`).
- **height** — CSS height (default `480`).
- **dpi** — pixel ratio of the backing store (default `window.devicePixelRatio`).

Use _renderer_.node() to get the canvas element.

```js
const renderer = cm.webgl({width: 640, height: 480});
const root = cm.flow().renderer(renderer);
```

The WebGL renderer draws these shapes:

- [_cm_.circle](/shape#cm-circle) — **x**, **y** (or **position**, a `vec2`), **r**, **fill**, **fillOpacity**, **stroke**, **strokeOpacity**, and **count**, the number of segments (default `100`). A circle is filled when it has a fill, or when it has no stroke, and outlined when it has a stroke.
- [_cm_.rect](/shape#cm-rect) — **x**, **y**, **width**, **height** and **fill**.
- [_cm_.triangle](/shape#cm-triangle) — **x**, **y**, **x1**, **y1**, **x2**, **y2** and **fill**.
- [_cm_.clear](/shape#cm-clear) — **fill**.

Colors are blended additively, so overlapping shapes add up. That suits glowing, generative pieces.

## _cm_.glsl {#cm-glsl}

Defines an attribute as a [GLSL](<https://www.khronos.org/opengl/wiki/Core_Language_(GLSL)>) function, using a template literal. The function must be named after the attribute. It's called on the GPU for each shape with the datum, which must be a number, and returns the attribute's type: `float` for numbers, `vec2` for **position** and `vec4` for colors.

```js
const r = cm.glsl`float r(float theta) {
  return (0.2 + 0.12 * cos(theta * 9.0)) * 300.0;
}`;

root.data(theta).append(cm.circle, {x: 320, y: 320, r, stroke: "white"});
```

Numbers can be interpolated. They become uniforms, so a value that changes every frame, such as the time, doesn't recompile the shader.

```js
const position = cm.glsl`vec2 position(float theta) {
  return vec2(cos(theta + ${time}), sin(theta + ${time})) * ${scale} + vec2(${width / 2}, ${height / 2});
}`;
```

A GLSL function can be interpolated too, to call it from another one.

A rect's **fill** can be a GLSL function of the pixel's coordinate and color, `vec4 fill(vec2 coord, vec4 color)`, which works like a fragment shader. Here is shader art from [Shadertoy](https://www.shadertoy.com/view/mtyGWy):

```js eval code=false
(() => {
  const width = 640;
  const height = 360;
  const dpr = devicePixelRatio;
  const palette = cm.glsl`vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(3.1415926 * 2.0 * (c * t + d));
  }`;
  const renderer = cm.webgl({width, height});
  const root = cm.flow().renderer(renderer);
  const node = renderer.node();
  let time = 0;
  let frame = requestAnimationFrame(function tick() {
    if (!node.isConnected && time > 0) return;
    time += 0.02;
    const fill = cm.glsl`vec4 fill(vec2 coord, vec4 color) {
      vec2 uv = (coord - vec2(${(width * dpr) / 2}, ${(height * dpr) / 2})) / ${(height * dpr) / 2};
      vec2 uv0 = uv;
      vec3 rgb = vec3(0.0);
      for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * 1.5) - 0.5;
        float d = length(uv) * exp(-length(uv0));
        vec3 col = ${palette}(length(uv0) + i * 0.4 + ${time} * 0.4);
        d = sin(d * 8.0 + ${time}) / 8.0;
        d = abs(d);
        d = pow(0.01 / d, 1.2);
        rgb += col * d;
      }
      return vec4(rgb, 1.0);
    }`;
    root.append(cm.rect, {x: 0, y: 0, width, height, fill});

    root.render();
    frame = requestAnimationFrame(tick);
  });
  unsubscribe(() => cancelAnimationFrame(frame));

  return node;
})();
```

```js
const width = 640;
const height = 360;
const dpr = devicePixelRatio; // fill receives coordinates in device pixels
const palette = cm.glsl`vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.263, 0.416, 0.557);
  return a + b * cos(3.1415926 * 2.0 * (c * t + d));
}`;
const renderer = cm.webgl({width, height});
const root = cm.flow().renderer(renderer);
let time = 0;

requestAnimationFrame(function frame() {
  time += 0.02;
  const fill = cm.glsl`vec4 fill(vec2 coord, vec4 color) {
    vec2 uv = (coord - vec2(${(width * dpr) / 2}, ${(height * dpr) / 2})) / ${(height * dpr) / 2};
    vec2 uv0 = uv;
    vec3 rgb = vec3(0.0);
    for (float i = 0.0; i < 4.0; i++) {
      uv = fract(uv * 1.5) - 0.5;
      float d = length(uv) * exp(-length(uv0));
      vec3 col = ${palette}(length(uv0) + i * 0.4 + ${time} * 0.4);
      d = sin(d * 8.0 + ${time}) / 8.0;
      d = abs(d);
      d = pow(0.01 / d, 1.2);
      rgb += col * d;
    }
    return vec4(rgb, 1.0);
  }`;
  root.append(cm.rect, {x: 0, y: 0, width, height, fill});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
