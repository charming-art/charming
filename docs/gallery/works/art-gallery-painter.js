import * as cm from "../../../src/index.js";
import * as d3 from "d3";
import {loadImage, imageSampler} from "./image.js";

const maxFrame = 400;

// Three tints of a stroke, with hues shifted by lightness.
function palette(offset) {
  const hue = (l) => ((l + offset) % 1) * 360;
  return {
    normal: (d) => d3.hsl(hue(d.l), 0.5, d.l).toString(),
    darker: (d) => d3.hsl(hue(d.l), 0.5, d.l * 0.4, 0.2).toString(),
    brighter: (d) => d3.hsl(hue(d.l), 0.5, 0.6 + d.l * 0.4, 0.1).toString(),
  };
}

export const work = {
  title: "Art Gallery Painter",
  description:
    'A painter that recreates an image with brush strokes: each frame, it picks random points, samples their colors, and paints short strokes rotated by brightness, getting finer as it goes. A reimplementation of Jason Labbe\'s <a href="https://openprocessing.org/sketch/520387">Art gallery painter</a>, made for <a href="https://genuary.art/prompts#jan25">Genuary 2024</a>, "Recreate an image with code".',
  background: "white",
  controls: {
    brush: {type: "range", label: "Brush size", min: 0.2, max: 2, step: 0.1, value: 1},
    image: {type: "file", label: "Image", accept: "image/*", value: "/gallery/steven.jpeg"},
  },
  async draw(stage, {width, height, brush, image}, invalidation) {
    const color = imageSampler(await loadImage(image), width, height);
    const {normal, darker, brighter} = palette(Math.random());
    const strokeLength = cm.scaleLinear([0, maxFrame], [80 * brush, 5 * brush]);
    const strokeWeight = cm.scaleLinear([0, maxFrame], [brush, 0.1 * brush]);
    // Paint as many strokes per area as the original did on a 540 × 692 image.
    const count = Math.ceil((40 * width * height) / (540 * 692) / brush);
    const renderer = cm.canvas({width, height});
    const root = cm.flow().renderer(renderer);
    const stroke = (y, color) => ({
      x: (d) => -d.length / 2,
      x1: (d) => d.length / 2,
      y,
      y1: y,
      stroke: color,
      strokeWidth: (d) => d.weight,
      strokeCap: "round",
    });
    let frameCount = 0;
    let frame;

    stage.append(renderer.node());

    frame = requestAnimationFrame(function paint() {
      const points = Array.from({length: count}, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const [r, g, b] = color(x, y);
        const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return {x, y, l, length: strokeLength(frameCount), weight: strokeWeight(frameCount) * (2 + Math.random() * 13)};
      });
      const strokes = root
        .data(points)
        .append(cm.group, {x: (d) => d.x, y: (d) => d.y, rotate: (d) => (d.l * 2 - 1) * Math.PI});
      if (frameCount % 3 === 0) strokes.append(cm.link, stroke(0, normal));
      else {
        strokes.append(cm.link, stroke(1, darker));
        strokes.append(cm.link, stroke(0, normal));
        strokes.append(cm.link, stroke(2, brighter));
      }

      root.render();
      if (++frameCount <= maxFrame) frame = requestAnimationFrame(paint);
    });

    invalidation.then(() => cancelAnimationFrame(frame));
  },
};
