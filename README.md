# @charming-art/app

The data-driven JavaScript renderer.

## Installing

```js
import * as cm from "@charming-art/app";

const app = cm.app({
  width: 640,
  height: 640,
});

app
  .data(cm.range(240))
  .process(cm.map, (_, i, data) => (i * Math.PI * 2) / data.length)
  .append(cm.circle, {
    x: (t) => Math.cos(t) * Math.cos(t * 3),
    y: (t) => Math.sin(t) * Math.cos(t * 3),
    r: (_, i) => i,
  })
  .transform(cm.scale, {
    x: { range: [15, app.prop("width") - 30] },
    y: { range: [15, app.prop("height") - 30] },
    r: { range: [1, 15] },
  });

document.body.appendChild(app.render());
```
