# #21 Mandelbrot Set

The [Mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set) computed on the CPU, one pixel at a time: each pixel iterates _z_ ↦ *z*² + _c_ until it escapes, and the number of iterations picks its color. The pixels are written into the image data of a canvas from [_cm_.context2d](/canvas#cm-context2d). After the Coding Train's [Mandelbrot Set with p5.js](https://thecodingtrain.com/challenges/21-mandelbrot-set-with-p5js). For a zoomable version on the GPU, see [Mandelbrot Set](/examples/mandelbrot-set).

```js eval code=false
const max = Inputs.range([1, 100], {label: "Max iterations", step: 1, value: 80});
```

```js eval t=example
const width = 580;
const height = 450;
const context = cm.context2d({width, height});
const {width: w, height: h} = context.canvas; // in device pixels
const image = context.getImageData(0, 0, w, h);
const colors = Array.from({length: max + 1}, (_, i) => d3.rgb(i === max ? "white" : d3.interpolateTurbo(i / max)));

for (let px = 0; px < w; px++) {
  for (let py = 0; py < h; py++) {
    const x = -2 + (px / w) * 3;
    const y = -1.164 + (py / h) * 2.328;
    let a = 0;
    let b = 0;
    let i = 0;
    for (; i < max; i++) {
      [a, b] = [a * a - b * b + x, 2 * a * b + y];
      if (a * a + b * b > 4) break;
    }
    const {r, g, b: blue} = colors[i];
    const index = (py * w + px) * 4;
    image.data.set([r, g, blue, 255], index);
  }
}

context.putImageData(image, 0, 0);

document.body.append(context.canvas);
```
