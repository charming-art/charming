# Multibrot Set Table

The [Multibrot sets](https://en.wikipedia.org/wiki/Multibrot_set) iterate _z_ ↦ _z_<sup>_d_</sup> + _c_, side by side: positive exponents on the top row grow _d_ − 1 lobes, and negative exponents on the bottom row grow _d_ + 1 spikes. Each set is computed on the CPU, one pixel at a time, into a canvas from [_cm_.context2d](/canvas#cm-context2d). For the exponents animated one after another on the GPU, see [Multibrot Set Transition](/examples/multibrot-transition).

```js eval code=false
const n = Inputs.range([1, 8], {label: "Columns", step: 1, value: 4});
```

```js eval t=example
const max = 80;
const size = Math.floor(640 / n);
const colors = Array.from({length: max + 1}, (_, i) => d3.rgb(i === max ? "white" : d3.interpolateTurbo(i / max)));

function multibrot(d, range) {
  const context = cm.context2d({width: size, height: size});
  const {width: w, height: h} = context.canvas; // in device pixels
  const image = context.getImageData(0, 0, w, h);
  for (let px = 0; px < w; px++) {
    for (let py = 0; py < h; py++) {
      const x = -range + (px / w) * range * 2;
      const y = -range + (py / h) * range * 2;
      // Negative exponents start from c, as 0 to a negative power diverges.
      let a = d < 0 ? x : 0;
      let b = d < 0 ? y : 0;
      let i = 0;
      for (; i < max; i++) {
        const rn = Math.pow(Math.sqrt(a * a + b * b), d);
        const theta = Math.atan2(b, a) * d;
        a = rn * Math.cos(theta) + x;
        b = rn * Math.sin(theta) + y;
        if (a * a + b * b > 4) break;
      }
      const {r, g, b: blue} = colors[i];
      image.data.set([r, g, blue, 255], (py * w + px) * 4);
    }
  }
  context.putImageData(image, 0, 0);
  return context.canvas;
}

function cell(d, range) {
  return cm.html`<figure ${{style_margin: 0, style_background: "#21171B"}}>
    ${multibrot(d, range)}
    <figcaption ${{style_color: "white", style_text_align: "center", style_padding_bottom: "8px"}}>
      z ↦ z<sup>${d}</sup> + c
    </figcaption>
  </figure>`;
}

const exponents = d3.range(n);
const table = cm.html`<div ${{style_display: "grid", style_grid_template_columns: `repeat(${n}, ${size}px)`}}>
  ${[...exponents.map((d) => cell(d + 2, 2.2)), ...exponents.map((d) => cell(-d - 2, 2.4))]}
</div>`;

document.body.append(table);
```
