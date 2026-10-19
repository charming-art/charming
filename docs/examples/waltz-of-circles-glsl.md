# Waltz of Circles, GLSL

The same circles with their attributes written as [GLSL functions](/webgl#cm-glsl), computed on the GPU instead of in JavaScript, so it handles even more. Made for [Genuary 2024](https://genuary.art/prompts#jan16), "Draw 10 000 of something". A reimplementation of Ricky Reusser's [Instanced WebGL Circles](https://observablehq.com/@rreusser/instanced-webgl-circles). Compare with the [Canvas](/examples/waltz-of-circles-canvas) and [WebGL](/examples/waltz-of-circles-webgl) versions.

```js eval code=false
const count = Inputs.range([5000, 20000], {label: "Circles", step: 1000, value: 12000});
```

```js eval t=example
const width = 640;
const height = 640;
const scale = 270;
const theta = Array.from({length: count}, (_, i) => (i / count) * Math.PI * 2);
const renderer = cm.webgl({width, height});
const root = cm.flow().renderer(renderer);
let time = 0;

requestAnimationFrame(function frame() {
  time += 0.02;

  root.append(cm.clear, {fill: "black"});

  root
    .data(theta)
    .append(cm.circle, {
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
