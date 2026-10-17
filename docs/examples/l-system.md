# L-system

An [L-system](https://en.wikipedia.org/wiki/L-system) rewrites a sentence with rules, generation after generation. Here, the rule F → FF+[+F-F-F]-[-F+F+F] grows a plant, drawn by a turtle: F moves forward, + and - turn, and [ and ] save and restore its state. After [The Nature of Code](https://natureofcode.com/fractals/).

```js eval code=false
const generations = Inputs.range([1, 5], {label: "Generations", step: 1, value: 4});
```

```js eval code=false
const angle = Inputs.range([0, 45], {label: "Angle", step: 1, value: 25});
```

```js eval t=example
const width = 640;
const height = 400;
const rules = {F: "FF+[+F-F-F]-[-F+F+F]"};

function generate(sentence, count) {
  for (let i = 0; i < count; i++) {
    sentence = Array.from(sentence, (c) => rules[c] || c).join("");
  }
  return sentence;
}

function turtle(sentence) {
  const lines = [];
  const stack = [];
  let position = cm.vec(0, 0);
  let heading = -Math.PI / 2;
  for (const c of sentence) {
    if (c === "+") heading += (angle * Math.PI) / 180;
    else if (c === "-") heading -= (angle * Math.PI) / 180;
    else if (c === "[") stack.push([position.clone(), heading]);
    else if (c === "]") [position, heading] = stack.pop();
    else if (c === "F") {
      const next = cm.vecAdd(position, cm.vecFromAngle(heading));
      lines.push([position, next]);
      position = next;
    }
  }
  return lines;
}

const lines = turtle(generate("F", generations));

// Fit the plant to the canvas, keeping its aspect ratio.
const points = lines.flat();
const [x0, x1] = d3.extent(points, (d) => d.x);
const [y0, y1] = d3.extent(points, (d) => d.y);
const k = Math.min((width - 20) / (x1 - x0 || 1), (height - 20) / (y1 - y0));
const x = (d) => width / 2 + (d.x - (x0 + x1) / 2) * k;
const y = (d) => height - 10 - (y1 - d.y) * k;

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

root.data(lines).append(cm.link, {
  x: ([a]) => x(a),
  y: ([a]) => y(a),
  x1: ([, b]) => x(b),
  y1: ([, b]) => y(b),
  stroke: "black",
});

root.render();

document.body.append(renderer.node());
```
