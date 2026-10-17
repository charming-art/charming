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
  description: "Turn an image into a poem, with packed circles and code points.",
  author: "Bairui SU",
  year: 2025,
  source: "https://github.com/charming-art/charming/blob/main/docs/gallery/works/pixel-poetry.js",
  controls: {
    count: {type: "range", label: "Circle count", min: 50, max: 1000, step: 1, value: 300},
    offset: {type: "range", label: "Code point offset", min: 0, max: 65536, step: 1, value: 1000},
    theme: {type: "radio", label: "Theme", options: ["Light", "Dark"], value: "Light"},
    animated: {type: "toggle", label: "Animated", value: true},
    image: {type: "file", label: "Image", accept: "image/*", value: "/gallery/bear.png"},
  },
  async draw(stage, {width, height, count, offset, theme, animated, image}, invalidation) {
    // The circles on the left and the poem on the right, or the poem below on narrow screens.
    const wide = width >= 768;
    const size = Math.floor(wide ? Math.min(height, width * 0.45) : Math.min(width, height * 0.6));
    const color = imageSampler(await loadImage(image), size, size);
    const rotate = cm.noise(0, 360);
    const pack = d3.pack().size([size, size]).padding(3);
    const data = {children: Array.from({length: count}, () => ({value: Math.random() * 1000}))};
    const circles = pack(d3.hierarchy(data).sum((d) => d.value))
      .leaves()
      .map((d) => {
        const [r, g, b, a] = color(d.x, d.y);
        const ch = String.fromCodePoint(offset + Math.round((r + g + b) / 3));
        return {x: d.x, y: d.y, r: d.r, fill: `rgba(${r}, ${g}, ${b}, ${a})`, ch};
      });

    const dark = theme === "Dark";
    const svg = cm.svg`<svg ${{
      width: size,
      height: size,
      viewBox: [0, 0, size, size],
      style_flex: "none",
      style_background: dark ? "black" : "transparent",
      // Set the font here rather than inherit it, so downloads look the same.
      font_family: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    }}>
      <circle ${{data: circles, cx: (d) => d.x, cy: (d) => d.y, r: (d) => (animated ? 0 : d.r), fill: (d) => d.fill}}/>
      <text ${{
        data: circles,
        transform: (d) => `translate(${d.x}, ${d.y}) rotate(${rotate(d.x / size, d.y / size)})`,
        font_size: (d) => d.r * 1.4,
        font_weight: 900,
        text_anchor: "middle",
        dominant_baseline: "central",
        fill: dark ? "white" : "black",
        opacity: animated ? 0 : 1,
      }}>${(d) => d.ch}</text>
    </svg>`;
    const article = cm.html`<article ${{
      style_flex: wide ? "0 1 480px" : "none",
      style_max_height: wide ? `${size}px` : "none",
      style_overflow: "auto",
    }}>
      <p ${{
        data: poem(circles.map((d) => d.ch).join("")),
        style_margin: "0 0 8px",
        style_font_weight: "bold",
        style_font_size: wide ? "18px" : "15px",
        style_line_height: 1.5,
        style_opacity: animated ? 0 : 1,
      }}>${(d) => d}</p>
    </article>`;
    const layout = cm.html`<div ${{
      style_display: "flex",
      style_flex_direction: wide ? "row" : "column",
      style_align_items: "center",
      style_gap: wide ? "80px" : "24px",
      style_width: "100%",
      style_height: wide ? "100%" : "auto",
      style_justify_content: "center",
      style_padding: 0,
      style_box_sizing: "border-box",
    }}>${[svg, article]}</div>`;
    stage.append(layout);

    if (!animated) return;

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
