# Trigger Sounds, Tone.js

Four instruments from [Tone.js](https://tonejs.github.io/), each animating a shape while it plays. Press the keys **A**, **S**, **D** and **F**, or click the shapes. After Luisa Pereira's [p5.js sketch](https://editor.p5js.org/luisa_NYU/sketches/Lmt3tXZAP) for _The Code of Music_.

```js eval t=example
const width = 640;
const height = 240;
const step = width / 4;
const instruments = [
  {key: "a", synth: new Tone.MembraneSynth().toDestination(), note: "C2"},
  {key: "s", synth: new Tone.PluckSynth().toDestination(), note: "E4"},
  {key: "d", synth: new Tone.FMSynth().toDestination(), note: "G3"},
  {key: "f", synth: new Tone.MetalSynth({volume: -12}).toDestination(), note: "C4"},
].map((d) => ({...d, start: -Infinity}));
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();

async function trigger(instrument) {
  await Tone.start();
  instrument.synth.triggerAttackRelease(instrument.note, "8n");
  instrument.start = performance.now();
}

const onkeydown = (event) => {
  const instrument = instruments.find((d) => d.key === event.key);
  if (instrument) trigger(instrument);
};
window.addEventListener("keydown", onkeydown);
node.addEventListener("click", (event) => trigger(instruments[Math.floor((event.offsetX / node.clientWidth) * 4)]));
node.style.cursor = "pointer";

invalidation.then(() => {
  window.removeEventListener("keydown", onkeydown);
  for (const {synth} of instruments) synth.dispose();
});

requestAnimationFrame(function frame(time) {
  // The progress of each sound over one second, 0 when it's not playing.
  const progress = instruments.map((d) => Math.min(1, (time - d.start) / 1000) % 1);
  const ease = progress.map((t) => d3.easeCubicOut(t));

  root.append(cm.clear, {fill: "black"});
  const cells = root.data(instruments).append(cm.group, {x: (_, i) => i * step + step / 2, y: height / 2});
  cells.append(cm.text, {
    text: (d) => d.key.toUpperCase(),
    x: 0,
    y: height / 2 - 16,
    fill: "#666",
    fontSize: 14,
    fontFamily: "sans-serif",
    textAlign: "center",
  });

  root.append(cm.circle, {
    x: step / 2 + (ease[0] - 0.5) * step * 0.8 * Math.sign(progress[0]),
    y: height / 2,
    r: 30 - ease[0] * 15,
    fill: "white",
  });
  root.append(cm.circle, {
    x: step * 1.5,
    y: height / 2 - 60 + ease[1] * 120 * Math.sign(progress[1]),
    r: 20,
    fill: "white",
  });
  root.append(cm.rect, {
    x: step * 2.5,
    y: height / 2,
    width: 60,
    height: 60,
    anchor: "center",
    rotate: ease[2] * Math.PI,
    fill: "white",
  });
  root.append(cm.circle, {
    x: step * 3.5,
    y: height / 2,
    r: 10 + ease[3] * 50,
    fill: "transparent",
    stroke: "white",
    strokeWidth: 4 * (1 - progress[3]),
  });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
