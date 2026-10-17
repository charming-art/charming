# Character Matrix

Falling strings of random characters, as in _The Matrix_: each column grows a string, then fades it out from the top and starts a new one. After an [asciinema recording](https://asciinema.org/a/19942).

```js eval t=example
const cols = 80;
const rows = 30;
const renderer = cm.terminal({cols, rows, fontWeight: "bold"});
const root = cm.flow().renderer(renderer);
const randomInt = (a, b) => a + Math.floor(Math.random() * (b - a));
const randomChar = () => String.fromCharCode(randomInt(33, 127));

function createString() {
  const lifespan = randomInt(0, rows);
  const length = randomInt(0, lifespan);
  return {lifespan, length, chars: Array.from({length}, randomChar), y: randomInt(0, 15)};
}

// Grow the string while it's alive, then erase it from the top, then replace it.
function updateString(d, i, data) {
  const {chars, lifespan, length} = d;
  if (lifespan < 0) data[i] = createString();
  else if (lifespan <= chars.length) chars[chars.length - lifespan] = "";
  else {
    for (let j = length - 1; j < chars.length; j++) chars[j] = randomChar();
    chars.push(randomChar());
  }
  d.lifespan--;
}

const strings = Array.from({length: cols}, createString);

setInterval(() => {
  root.append(cm.clear, {fill: "black"});
  root
    .data(strings)
    .process(cm.eachRight, updateString)
    .append(cm.group, {x: (_, i) => i, y: (d) => d.y})
    .data((d) => d.chars)
    .append(cm.point, {
      x: 0,
      y: (_, i) => i,
      stroke: (ch) => (ch ? {ch, fg: "#6EBD41"} : null),
    });

  root.render();
}, 1000 / 15);

document.body.append(renderer.node());
```
