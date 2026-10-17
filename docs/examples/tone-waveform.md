# Waveform, Tone.js

The waveform of a [Tone.js](https://tonejs.github.io/) synth, read with an analyser every frame and drawn as a stroke, a fill or a radial shape. Click the canvas to play or stop. After Luisa Pereira's [p5.js sketches](https://editor.p5js.org/luisa/sketches/-OnVhOVyy) for _The Code of Music_.

```js eval code=false
const style = Inputs.radio(["Stroke", "Fill", "Radial"], {label: "Style", value: "Stroke"});
```

```js eval t=example
const width = 640;
const height = 320;
const analyser = new Tone.Waveform(256);
const synth = new Tone.PolySynth(Tone.Synth, {oscillator: {type: "triangle"}}).connect(analyser).toDestination();
const sequence = new Tone.Sequence(
  (time, note) => synth.triggerAttackRelease(note, "8n", time),
  ["C4", "E4", "G4", "B4", "C5", "B4", "G4", "E4"],
  "8n",
);
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();
let playing = false;

node.style.cursor = "pointer";
node.addEventListener("click", async () => {
  await Tone.start();
  playing = !playing;
  if (playing) (sequence.start(0), Tone.getTransport().start());
  else (sequence.stop(), Tone.getTransport().stop());
});

invalidation.then(() => {
  Tone.getTransport().stop();
  sequence.dispose();
  synth.dispose();
  analyser.dispose();
});

requestAnimationFrame(function frame() {
  const values = Array.from(analyser.getValue());
  const n = values.length;
  root.append(cm.clear, {fill: "black"});

  if (style === "Stroke") {
    root.data(values).append(cm.line, {
      x: (_, i) => (i / (n - 1)) * width,
      y: (d) => height / 2 - (d * height) / 2,
      stroke: "white",
      strokeWidth: 4,
    });
  } else if (style === "Fill") {
    // The area between the wave and the center line.
    const points = [
      ...values.map((d, i) => [(i / (n - 1)) * width, height / 2 - (d * height) / 2]),
      [width, height / 2],
      [0, height / 2],
    ];
    root.datum(points).append(cm.polygon, {x: (d) => d.map((p) => p[0]), y: (d) => d.map((p) => p[1]), fill: "white"});
  } else {
    const r = (d) => height / 4 + (d * height) / 4;
    const a = (i) => (i / n) * Math.PI * 2;
    root.datum(values).append(cm.polygon, {
      x: (V) => V.map((d, i) => width / 2 + Math.cos(a(i)) * r(d)),
      y: (V) => V.map((d, i) => height / 2 + Math.sin(a(i)) * r(d)),
      fill: "white",
    });
  }

  if (!playing) {
    root.append(cm.text, {
      text: "Click to play",
      x: width / 2,
      y: height - 20,
      fill: "#999",
      fontSize: 14,
      fontFamily: "sans-serif",
      textAlign: "center",
    });
  }

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
