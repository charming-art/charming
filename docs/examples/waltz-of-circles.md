# Waltz of Circles

Thousands of circles whose positions, radii and colors are computed by trigonometric functions, frame by frame. Switch the renderer to compare [Canvas](/flow#cm-canvas) with [WebGL](/webgl), which draws all the circles in one call. With GLSL, the attributes are [GLSL functions](/webgl#cm-glsl) computed on the GPU, which handles even more circles; it was made for [Genuary 2024](https://genuary.art/prompts#jan16), "Draw 10 000 of something". A reimplementation of Ricky Reusser's [Instanced WebGL Circles](https://observablehq.com/@rreusser/instanced-webgl-circles).

```js eval code=false
const type = Inputs.radio(["Canvas", "WebGL", "WebGL + GLSL"], {label: "Renderer", value: "WebGL"});
```

```js eval code=false
const count = Inputs.range([1000, 50000], {label: "Circles", step: 1000, value: 5000});
```

```js eval t=example
const width = 640;
const height = 640;
const theta = Array.from({length: count}, (_, i) => (i / count) * Math.PI * 2);
const scale = 220;
const renderer = type === "Canvas" ? cm.canvas({width, height}) : cm.webgl({width, height});
const root = cm.flow().renderer(renderer);
let time = 0;

function drawGLSL() {
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
}

function draw() {
  const dist = (d) => 0.6 + 0.2 * Math.cos(d * 6.0 + Math.cos(d * 8.0 + time));
  root
    .data(theta)
    .append(cm.circle, {
      x: (d) => Math.cos(d) * dist(d),
      y: (d) => Math.sin(d) * dist(d),
      r: (d) => 0.2 + 0.12 * Math.cos(d * 9.0 - time * 2.0),
      stroke: (d) => {
        const th = 8.0 * d + time * 2.0;
        const r = 0.6 + 0.4 * Math.cos(th);
        const g = 0.6 + 0.4 * Math.cos(th - Math.PI / 3);
        const b = 0.6 + 0.4 * Math.cos(th - (Math.PI * 2.0) / 3.0);
        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
      },
      fill: "transparent",
      strokeOpacity: (0.15 * 2000) / count,
    })
    .transform(cm.mapPosition, {padding: 100})
    .transform(cm.mapAttrs, {r: {range: [24, 96]}});
}

requestAnimationFrame(function frame() {
  time += 0.02;
  root.append(cm.clear, {fill: "black"});
  if (type === "WebGL + GLSL") drawGLSL();
  else draw();

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
