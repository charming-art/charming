# Get Started

This guide shows how to install Charming and run your first examples.

## Installing

Charming is typically installed via a package manager such as Yarn or NPM.

::: code-group

```sh [npm]
npm install charmingjs
```

```sh [pnpm]
pnpm add charmingjs
```

```sh [yarn]
yarn add charmingjs
```

```sh [bun]
bun add -S charmingjs
```

:::

Charming can then be imported as a namespace:

```js
import * as cm from "charmingjs";
```

In vanilla HTML, Charming can be imported as an ES module, say from jsDelivr:

```html
<script type="module">
  import * as cm from "https://cdn.jsdelivr.net/npm/charmingjs/+esm";

  const renderer = cm.canvas({width: 200, height: 200});
  cm.flow().renderer(renderer).append(cm.circle, {x: 100, y: 100, r: 50, fill: "steelblue"}).render();
  document.body.append(renderer.node());
</script>
```

Charming is also available as a UMD bundle for legacy browsers.

```html
<script src="https://cdn.jsdelivr.net/npm/charmingjs/dist/charming.umd.min.js"></script>
<script>
  const renderer = cm.canvas({width: 200, height: 200});
  cm.flow().renderer(renderer).append(cm.circle, {x: 100, y: 100, r: 50, fill: "steelblue"}).render();
  document.body.append(renderer.node());
</script>
```

## Quick examples

Draw a clover with the canvas renderer:

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 640, height: 640});
  const root = cm.flow().renderer(renderer);

  root
    .data(Array.from({length: 240}, (_, i) => (i * Math.PI) / 240))
    .append(cm.circle, {
      x: (t) => Math.cos(t) * Math.cos(t * 3),
      y: (t) => Math.sin(t) * Math.cos(t * 3),
      r: (_, i) => i,
      fill: "black",
    })
    .transform(cm.mapPosition, {padding: 15})
    .transform(cm.mapAttrs, {r: {range: [8, 20]}});

  root.render();

  return renderer.node();
})();
```

```js
import * as cm from "charmingjs";

const renderer = cm.canvas({width: 640, height: 640});
const root = cm.flow().renderer(renderer);

root
  .data(Array.from({length: 240}, (_, i) => (i * Math.PI) / 240))
  .append(cm.circle, {
    x: (t) => Math.cos(t) * Math.cos(t * 3),
    y: (t) => Math.sin(t) * Math.cos(t * 3),
    r: (_, i) => i,
    fill: "black",
  })
  .transform(cm.mapPosition, {padding: 15})
  .transform(cm.mapAttrs, {r: {range: [8, 20]}});

root.render();

document.body.append(renderer.node());
```

Draw ASCII-art text with the terminal renderer:

```js eval code=false
(() => {
  const renderer = cm.terminal({cols: 60, rows: 8});
  const root = cm.flow().renderer(renderer);

  root.append(cm.figlet, {
    text: "hello world",
    x: 30,
    y: 4,
    textAlign: "center",
    textBaseline: "middle",
    fill: () => (x, y, width) => `hsl(${(x / width) * 360}, 90%, 65%)`,
  });

  root.render();

  return renderer.node();
})();
```

```js
import * as cm from "charmingjs";

const renderer = cm.terminal({cols: 60, rows: 8});
const root = cm.flow().renderer(renderer);

root.append(cm.figlet, {
  text: "hello world",
  x: 30,
  y: 4,
  textAlign: "center",
  textBaseline: "middle",
  fill: () => (x, y, width) => `hsl(${(x / width) * 360}, 90%, 65%)`,
});

root.render();

document.body.append(renderer.node());
```

Next, read [What is Charming?](/) for an overview, or start from [Charming Flow](/flow) in the API reference.
