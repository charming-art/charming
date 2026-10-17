# Silexars

Danilo Guanabara's [Creation by Silexars](https://www.shadertoy.com/view/XsXXDn), a famous 1k demo, as a [GLSL fill](/webgl#cm-glsl) of a [rect](/shape#cm-rect).

```js eval t=example
const width = 640;
const height = 400;
const dpr = devicePixelRatio;
const renderer = cm.webgl({width, height});
const root = cm.flow().renderer(renderer);
let time = 0;

requestAnimationFrame(function frame() {
  time += 1 / 60;
  const fill = cm.glsl`vec4 fill(vec2 coord, vec4 color) {
    vec2 r = vec2(${width * dpr}, ${height * dpr});
    vec3 c;
    float l, z = ${time};
    for (int i = 0; i < 3; i++) {
      vec2 uv, p = coord / r;
      uv = p;
      p -= 0.5;
      p.x *= r.x / r.y;
      z += 0.07;
      l = length(p);
      uv += p / l * (sin(z) + 1.0) * abs(sin(l * 9.0 - z - z));
      c[i] = 0.01 / length(mod(uv, 1.0) - 0.5);
    }
    return vec4(c / l, 1.0);
  }`;
  root.append(cm.clear, {fill: "black"});
  root.append(cm.rect, {x: 0, y: 0, width, height, fill});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
