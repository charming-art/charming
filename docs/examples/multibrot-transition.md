# Multibrot Set Transition

The [Multibrot sets](https://en.wikipedia.org/wiki/Multibrot_set) iterate _z_ ↦ _z_<sup>_d_</sup> + _c_. As the exponent _d_ goes from 1 to 6 and back, the Mandelbrot set (_d_ = 2) grows more and more lobes. Drawn as a [GLSL fill](/webgl#cm-glsl), with _d_ passed in each frame.

```js eval t=example
const size = 640;
const dpr = devicePixelRatio;
const renderer = cm.webgl({width: size, height: size});
const root = cm.flow().renderer(renderer);
let time = 0;

requestAnimationFrame(function frame() {
  time += 1 / 60;
  const d = 3.5 - 2.5 * Math.cos(time / 2);
  const fill = cm.glsl`vec4 fill(vec2 coord, vec4 color) {
    vec2 uv = -2.0 + coord / ${size * dpr} * 4.0;
    float x = 0.0;
    float y = 0.0;
    int j = 0;
    for (int i = 0; i < 80; i++) {
      j = i;
      float rn = pow(length(vec2(x, y)), ${d});
      float theta = atan(y, x) * ${d};
      x = rn * cos(theta) + uv.x;
      y = rn * sin(theta) + uv.y;
      if (x * x + y * y > 4.0) break;
    }
    float b = 1.0 - float(j * 4) / 80.0;
    return vec4(vec3(b), 1.0);
  }`;
  root.append(cm.clear, {fill: "black"});
  root.append(cm.rect, {x: 0, y: 0, width: size, height: size, fill});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
