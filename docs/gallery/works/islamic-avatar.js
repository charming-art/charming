import * as cm from "../../../src/index.js";
import * as d3 from "d3";
import {loadImage, imageSampler} from "./image.js";

// Shifts the hue by the saturation, keeping the lightness.
function hueFilter(offset) {
  return ([r, g, b, a]) => {
    const {s, l} = d3.hsl(d3.rgb(r, g, b, a));
    return d3.hsl(((s + offset) % 1) * 360, 0.5, l, a).toString();
  };
}

export const work = {
  title: "Islamic Avatar",
  description:
    'A portrait as a mosaic inspired by Islamic art: packed circles become polygons whose number of sides and rotation follow noise, colored from the image and shifted in hue. Made for <a href="https://genuary.art/prompts#jan17">Genuary 2024</a>, "Inspired by Islamic art".',
  background: ({theme}) => (theme === "Dark" ? "black" : "white"),
  controls: {
    count: {type: "range", label: "Circle count", min: 500, max: 4000, step: 1, value: 2000},
    filter: {type: "toggle", label: "Hue filter", value: true},
    theme: {type: "radio", label: "Theme", options: ["Dark", "Light"], value: "Dark"},
    image: {type: "file", label: "Image", accept: "image/*", value: "/gallery/bear.png"},
  },
  async draw(stage, {width, height, count, filter, theme, image}) {
    const color = imageSampler(await loadImage(image), width, height);
    const sides = cm.noise(3, 8);
    const rotate = cm.noise(0, Math.PI * 2 * width);
    const tint = filter ? hueFilter(Math.random()) : ([r, g, b, a]) => `rgba(${r}, ${g}, ${b}, ${a})`;
    const pack = d3.pack().size([width, height]).padding(3);
    const data = {children: Array.from({length: count}, () => ({value: Math.random() * 1000}))};
    const circles = pack(d3.hierarchy(data).sum((d) => d.value)).leaves();
    const renderer = cm.canvas({width, height});
    const root = cm.flow().renderer(renderer);

    root.append(cm.clear, {fill: theme === "Dark" ? "black" : "white"});
    root
      .data(circles)
      .process(cm.derive, {
        angles: (d) => {
          const n = Math.floor(sides(d.x / width, d.y / height));
          return Array.from({length: n}, (_, i) => (i / n) * Math.PI * 2);
        },
      })
      .append(cm.group, {x: (d) => d.x, y: (d) => d.y, rotate: (d) => rotate(d.x / width, d.y / height)})
      .append(cm.polygon, {
        x: (d) => d.angles.map((t) => d.r * Math.cos(t)),
        y: (d) => d.angles.map((t) => d.r * Math.sin(t)),
        fill: (d) => tint(color(d.x, d.y)),
      });

    root.render();
    stage.append(renderer.node());
  },
};
