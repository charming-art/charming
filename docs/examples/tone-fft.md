# FFT, Tone.js

The spectrum of a [Tone.js](https://tonejs.github.io/) synth from a [fast Fourier transform](https://tonejs.github.io/docs/latest/classes/FFT), on a log frequency scale, with the overall level from a [meter](https://tonejs.github.io/docs/latest/classes/Meter) on the right. Click the canvas to play or stop. After Luisa Pereira's [p5.js sketches](https://editor.p5js.org/luisa/sketches/V1arr0SHp) for _The Code of Music_.

```js eval t=example
const width = 640;
const height = 320;
const meterWidth = 24;
const fft = new Tone.FFT(512);
const meter = new Tone.Meter({normalRange: true, smoothing: 0.8});
const synth = new Tone.PolySynth(Tone.Synth, {oscillator: {type: "sawtooth"}, volume: -12})
  .fan(fft, meter)
  .toDestination();
const sequence = new Tone.Sequence(
  (time, chord) => synth.triggerAttackRelease(chord, "4n", time),
  [
    ["C3", "E4", "G4"],
    ["A2", "C4", "E4"],
    ["F2", "A3", "C4"],
    ["G2", "B3", "D4"],
  ],
  "2n",
);
const x = d3.scaleLog([1, 512], [0, width - meterWidth - 8]);
const y = d3.scaleLinear([-100, 0], [height, 0]).clamp(true);
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
  fft.dispose();
  meter.dispose();
});

requestAnimationFrame(function frame() {
  const values = Array.from(fft.getValue()).slice(1);
  const level = meter.getValue();
  const points = [[x(1), height], ...values.map((d, i) => [x(i + 1), y(d)]), [x(values.length), height]];

  root.append(cm.clear, {fill: "black"});
  root.datum(points).append(cm.polygon, {x: (d) => d.map((p) => p[0]), y: (d) => d.map((p) => p[1]), fill: "white"});
  root.append(cm.rect, {
    x: width - meterWidth,
    y: height * (1 - Math.min(1, level * 2)),
    width: meterWidth,
    height: height * Math.min(1, level * 2),
    fill: "#00adb5",
  });
  if (!playing) {
    root.append(cm.text, {
      text: "Click to play",
      x: width / 2,
      y: height / 2,
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
