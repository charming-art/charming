import * as cm from "../../../src/index.js";
import * as d3 from "d3";
import {loadImage, imageSampler} from "./image.js";

const eases = Object.entries(d3)
  .filter(([key]) => key.startsWith("ease"))
  .map(([, ease]) => ease);

// Splits an array into groups of random lengths, of at most max items.
function groups(array, max) {
  const groups = [[]];
  for (const item of array) {
    const group = groups[groups.length - 1];
    if ((max - group.length) / max > Math.random()) group.push(item);
    else groups.push([]);
  }
  return groups.filter((d) => d.length);
}

function poem(text) {
  const words = groups(Array.from(text), 10).map((d) => d.join(""));
  return groups(words, 6).map((d) => d.join(" "));
}

export const work = {
  title: "Pixel Poetry",
  description:
    "An image turned into a poem. Circles packed with d3-hierarchy take their colors from the image, then each grows a character whose code point comes from its brightness, and the characters are read out as a poem.",
  background: "white",
  controls: {
    count: {type: "range", label: "Circle count", min: 50, max: 1000, step: 1, value: 300},
    offset: {type: "range", label: "Code point offset", min: 0, max: 65536, step: 1, value: 1000},
    fontColor: {type: "radio", label: "Font color", options: ["black", "white"], value: "black"},
    image: {type: "file", label: "Image", accept: "image/*", value: "/gallery/bear.png"},
  },
  async draw(stage, {width, height, count, offset, fontColor, image}, invalidation) {
    const color = imageSampler(await loadImage(image), width, height);
    const rotate = cm.noise(0, 360);
    const pack = d3.pack().size([width, height]).padding(3);
    const data = {children: Array.from({length: count}, () => ({value: Math.random() * 1000}))};
    const circles = pack(d3.hierarchy(data).sum((d) => d.value))
      .leaves()
      .map((d) => {
        const [r, g, b, a] = color(d.x, d.y);
        const ch = String.fromCodePoint(offset + Math.round((r + g + b) / 3));
        return {x: d.x, y: d.y, r: d.r, fill: `rgba(${r}, ${g}, ${b}, ${a})`, ch};
      });

    const svg = cm.svg`<svg ${{width, height, viewBox: [0, 0, width, height]}}>
      <circle ${{data: circles, cx: (d) => d.x, cy: (d) => d.y, r: 0, fill: (d) => d.fill}}/>
      <text ${{
        data: circles,
        transform: (d) => `translate(${d.x}, ${d.y}) rotate(${rotate(d.x / width, d.y / height)})`,
        font_size: (d) => d.r * 1.4,
        font_weight: 900,
        text_anchor: "middle",
        dominant_baseline: "central",
        fill: fontColor,
        opacity: 0,
      }}>${(d) => d.ch}</text>
    </svg>`;
    const article = cm.html`<article ${{
      style_position: "absolute",
      style_inset: 0,
      style_display: "flex",
      style_flex_direction: "column",
      style_justify_content: "center",
      style_align_items: "center",
      style_pointer_events: "none",
    }}>
      <p ${{
        data: poem(circles.map((d) => d.ch).join("")),
        style_margin: "4px 0",
        style_padding: "2px 12px",
        style_background: "rgba(255, 255, 255, 0.8)",
        style_font_weight: "bold",
        style_font_size: "22px",
        style_opacity: 0,
      }}>${(d) => d}</p>
    </article>`;
    stage.append(svg, article);

    // Grow the circles, then show the characters, then read the poem line by line.
    d3.select(svg)
      .selectAll("circle")
      .data(circles)
      .each(function (d) {
        const ease = eases[d3.randomInt(eases.length)()];
        // Elastic and back easings overshoot below zero, which isn't a valid radius.
        d3.select(this)
          .transition()
          .delay(500)
          .duration(1000)
          .ease(ease)
          .attrTween("r", () => (t) => Math.max(0, d.r * t));
      });
    d3.select(svg).selectAll("text").transition().delay(1500).duration(1000).attr("opacity", 1);
    d3.select(article)
      .selectAll("p")
      .transition()
      .delay((_, i) => 2500 + 750 * i)
      .duration(750)
      .style("opacity", 1);

    invalidation.then(() => {
      d3.select(svg).selectAll("*").interrupt();
      d3.select(article).selectAll("*").interrupt();
    });
  },
};
