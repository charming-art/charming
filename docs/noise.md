# Charming Noise

**Charming Noise** generates smooth random values for computational art, which [d3](https://d3js.org/) doesn't cover. For uniform, normal and other random distributions, use [d3-random](https://d3js.org/d3-random).

## _cm_.noise(_[lo[, hi[, options]]]_) {#cm-noise}

Returns a function for generating smooth, continuous random values between _lo_ and _hi_, known as [Perlin noise](https://en.wikipedia.org/wiki/Perlin_noise). _lo_ defaults to `0` and _hi_ to `1`. Nearby inputs give nearby values, which suits natural-looking motion, terrain and textures. Options:

- **octaves** — the number of layers of noise (default `4`). More octaves add finer detail.
- **falloff** — how much each octave contributes compared with the previous one (default `0.5`). As in p5.js, the octaves aren't normalized: with the default, values stay within about 94% of the range, and a falloff above `0.5` can exceed _hi_.
- **seed** — an integer seed for the sequence (default random). Two functions with the same seed and options return the same values. Fractional seeds are truncated, so `1.2` and `1.9` give the same values.

The returned function takes coordinates _x_, _y_ and _z_ in noise space, each defaulting to `0`. It's ported from [p5.js](https://p5js.org/reference/p5/noise/).

```js eval code=false
(() => {
  const noise = cm.noise(0, 1, {seed: 1});
  const renderer = cm.canvas({width: 640, height: 200});
  const root = cm.flow().renderer(renderer);

  root
    .data(Array.from({length: 640}, (_, i) => i))
    .append(cm.line, {x: (d) => d, y: (d) => 20 + noise(d / 80) * 160, stroke: "black", strokeWidth: 2});

  root.render();

  return renderer.node();
})();
```

```js
const noise = cm.noise(0, 1, {seed: 1});
const renderer = cm.canvas({width: 640, height: 200});
const root = cm.flow().renderer(renderer);

root.data(Array.from({length: 640}, (_, i) => i)).append(cm.line, {
  x: (d) => d,
  y: (d) => 20 + noise(d / 80) * 160,
  stroke: "black",
  strokeWidth: 2,
});

root.render();
```

```js
cm.noise(0, 1, {seed: 1})(0.2, 0.1); // 0.29…
cm.noise(6, 2)(0.2, 0.1); // a value between 2 and 6
cm.noise()(0.5); // a different value every time
```
