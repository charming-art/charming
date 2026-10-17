# Broken Heart

A heart whose outline wobbles with [noise](/noise), with text running along it and eyes following the mouse. Based on a [Processing sketch](https://openprocessing.org/sketch/720376).

```js eval code=false
const message = Inputs.text({label: "Text", value: "Sad News!!!"});
```

```js eval t=example
const width = 640;
const height = 640;
const count = 200;
const radius = 100;
const fontSize = 100;
const fontFamily = "sans-serif";
const noise = cm.noise();
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();
let mouseX = width / 2;
let mouseY = height / 2;
let frameCount = 0;

node.addEventListener("mousemove", (event) => {
  const rect = node.getBoundingClientRect();
  mouseX = ((event.clientX - rect.left) / rect.width) * width;
  mouseY = ((event.clientY - rect.top) / rect.height) * height;
});

// Spread the characters along the heart by their widths.
const context = cm.context2d();
context.font = `${fontSize}px ${fontFamily}`;
let prev = 0;
const chars = message.split("").map((c) => {
  const step = context.measureText(c).width / (radius * 1.8);
  const t = prev + step / 2;
  prev += step;
  return {t, c};
});

function noiseRadius(theta, time) {
  const s = noise(Math.cos(theta) + 1, Math.sin(theta) + 1, time) + 1;
  return radius * (1 + Math.cos(theta - Math.PI / 2)) * s;
}

function noiseAngle(theta, time) {
  const theta1 = theta - 0.06;
  const theta2 = theta + 0.06;
  const a = noiseRadius(theta1, time);
  const b = noiseRadius(theta2, time);
  return Math.atan2(a * Math.sin(theta1) - b * Math.sin(theta2), a * Math.cos(theta1) - b * Math.cos(theta2)) + Math.PI;
}

function drawHeart(flow, x, y, time) {
  flow
    .append(cm.group, {x, y})
    .data(Array.from({length: count}, (_, i) => (i / count) * Math.PI * 2))
    .process(cm.derive, {t: (d) => d, r: (d) => noiseRadius(d, time)})
    .append(cm.polygon, {
      x: (d) => Math.cos(d.t) * d.r,
      y: (d) => Math.sin(d.t) * d.r,
      fill: "red",
    });
}

function drawEyes(flow, x, y) {
  const r = radius / 2;
  const eyes = flow
    .data([-1, 1])
    .process(cm.derive, {x: (d) => x + (d * radius) / 1.8, y: y + height / 6})
    .append(cm.group, {
      x: (d) => d.x,
      y: (d) => d.y,
      rotate: (d) => Math.atan2(mouseY - d.y, mouseX - d.x),
    });
  eyes.append(cm.circle, {x: 0, y: 0, r, fill: "white"});
  eyes.append(cm.circle, {x: r / 3, y: 0, r: r / 2, fill: "black"});
}

function drawTexts(flow, x, y, time) {
  const start = Math.atan2(mouseY - y, mouseX - x);
  flow
    .append(cm.group, {x, y})
    .data(chars)
    .process(cm.derive, {t: (d) => d.t + start})
    .process(cm.derive, {r: (d) => noiseRadius(d.t, time), a: (d) => noiseAngle(d.t, time)})
    .append(cm.group, {
      x: (d) => Math.cos(d.t) * d.r,
      y: (d) => Math.sin(d.t) * d.r,
      rotate: (d) => d.a,
    })
    .append(cm.text, {x: 0, y: 0, text: (d) => d.c, fill: "#7214E3", fontSize, fontFamily});
}

requestAnimationFrame(function frame() {
  const time = frameCount / 100;
  frameCount++;
  root.append(cm.clear, {fill: "black"});
  root.call(drawHeart, width / 2, height / 3, time);
  root.call(drawEyes, width / 2, height / 3);
  root.call(drawTexts, width / 2, height / 3, time);

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
