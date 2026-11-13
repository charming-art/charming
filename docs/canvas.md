# Charming Canvas

**Charming Canvas** renders shapes with the [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API). It draws every [shape](/shape), one by one, and is the renderer to start with. For tens of thousands of shapes per frame, use [Charming WebGL](/webgl); for ASCII art, use [Charming Terminal](/terminal).

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 640, height: 200});
  const root = cm.flow().renderer(renderer);

  root.append(cm.clear, {fill: "black"});
  root.data(Array.from({length: 60}, (_, i) => i)).append(cm.circle, {
    x: (d) => 20 + d * 10,
    y: (d) => 100 + Math.sin(d / 4) * 60,
    r: (d) => 4 + Math.abs(Math.cos(d / 4)) * 8,
    fill: "white",
    fillOpacity: 0.8,
  });

  root.render();

  return renderer.node();
})();
```

```js
const renderer = cm.canvas({width: 640, height: 200});
const root = cm.flow().renderer(renderer);

root.append(cm.clear, {fill: "black"});
root.data(Array.from({length: 60}, (_, i) => i)).append(cm.circle, {
  x: (d) => 20 + d * 10,
  y: (d) => 100 + Math.sin(d / 4) * 60,
  r: (d) => 4 + Math.abs(Math.cos(d / 4)) * 8,
  fill: "white",
  fillOpacity: 0.8,
});

root.render();

document.body.append(renderer.node());
```

## _cm_.canvas(_[options]_) {#cm-canvas}

Returns a renderer that draws with the [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).

Options:

- **width** — CSS width of the canvas (default `640`).
- **height** — CSS height (default `480`).
- **dpi** — pixel ratio of the backing store (default `window.devicePixelRatio`).

Use _renderer_.node() to get the canvas element.

```js
const renderer = cm.canvas({width: 200, height: 100});

document.body.append(renderer.node());
```

For many shapes, use [_cm_.webgl](/webgl#cm-webgl). For ASCII art, use [_cm_.terminal](/terminal#cm-terminal).
