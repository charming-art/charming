# Zoomable Mandelbrot Set

The [Mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set), shaded by the [distance estimate](https://iquilezles.org/articles/distancefractals/) to its boundary, as a [GLSL fill](/webgl#cm-glsl). Scroll to zoom and drag to pan, with [d3-zoom](https://d3js.org/d3-zoom). The zoom is passed to the shader as numbers, which become uniforms, so it isn't recompiled. After [Inigo Quilez's shader](https://www.shadertoy.com/view/lsX3W4).

```js eval t=example
const width = 640;
const height = Math.round(width * 0.86);
const dpr = devicePixelRatio;
const renderer = cm.webgl({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();

// The distance from c to the set, or 0 inside it.
const estimate = cm.glsl`float estimate(vec2 c) {
  float c2 = dot(c, c);
  if (256.0 * c2 * c2 - 96.0 * c2 + 32.0 * c.x - 3.0 < 0.0) return 0.0;
  if (16.0 * (c2 + 2.0 * c.x + 1.0) - 1.0 < 0.0) return 0.0;
  vec2 z = vec2(0.0);
  vec2 dz = vec2(0.0);
  for (int i = 0; i < 300; i++) {
    dz = 2.0 * vec2(z.x * dz.x - z.y * dz.y, z.x * dz.y + z.y * dz.x) + vec2(1.0, 0.0);
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 1024.0) return 0.5 * sqrt(dot(z, z) / dot(dz, dz)) * log(dot(z, z));
  }
  return 0.0;
}`;

function draw({x, y, k}) {
  const fill = cm.glsl`vec4 fill(vec2 coord, vec4 color) {
    vec2 p = vec2(coord.x, ${height * dpr} - coord.y) / ${dpr};
    vec2 uv = (p - vec2(${x}, ${y})) / ${k} / vec2(${width}, ${height});
    vec2 c = vec2(-2.18 + 3.0 * uv.x, -1.29 + 2.58 * uv.y);
    float b = clamp(pow(4.0 * ${estimate}(c) * ${k}, 0.2), 0.0, 1.0);
    return vec4(vec3(b), 1.0);
  }`;
  root.append(cm.clear, {fill: "black"});
  root.append(cm.rect, {x: 0, y: 0, width, height, fill});
  root.render();
}

node.style.cursor = "grab";
d3.select(node).call(
  d3
    .zoom()
    .scaleExtent([1, 1e5])
    .on("zoom", (event) => draw(event.transform)),
);

draw(d3.zoomIdentity);

document.body.append(node);
```
