# Shader Art

Shader art from [Shadertoy](https://www.shadertoy.com/view/mtyGWy), after [kishimisu's tutorial](https://www.youtube.com/watch?v=f4s1h2YETNY): a [rect](/shape#cm-rect) covering the canvas whose **fill** is a [GLSL function](/webgl#cm-glsl) of the pixel's coordinate, like a fragment shader.

```js eval t=example
const width = 640;
const height = 400;
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
