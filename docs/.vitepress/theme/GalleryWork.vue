<script setup>
// A fullscreen gallery work: a sidebar on the left with a link to the source and
// the inputs, and on the right the title, the description, the author and the
// year above the artwork, which fills the rest of the window.
//
// A work is {title, description, author, year, source, controls, draw}:
// - controls maps each name to a control, {type: "range" | "radio" | "toggle" | "file", label, ...};
// - draw(stage, values, invalidation) draws into stage, where values has the
//   width and height of the stage and the value of each control, and stops
//   its animations when invalidation resolves.
import {onBeforeUnmount, onMounted, reactive, ref} from "vue";
import {withBase} from "vitepress";

const {work} = defineProps(["work"]);

const stage = ref(null);
const isSVG = ref(false);
const values = reactive(
  Object.fromEntries(
    Object.entries(work.controls).map(([name, control]) => [
      name,
      control.type === "file" ? withBase(control.value) : control.value,
    ]),
  ),
);

let invalidate = () => {};
let timeout;
let observer;

function draw() {
  invalidate();
  const invalidation = new Promise((resolve) => (invalidate = resolve));
  const node = stage.value;
  node.replaceChildren();
  // Draw in the content box, inside the stage's padding.
  const style = getComputedStyle(node);
  const width = node.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const height = node.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  Promise.resolve(work.draw(node, {...values, width, height}, invalidation))
    .then(() => (isSVG.value = !!node.querySelector("svg")))
    .catch((error) => console.error(error));
}

// Downloads the artwork as it is now: the canvas or the SVG on the stage.
function save(blob, extension) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${work.title.toLowerCase().replace(/\W+/g, "-")}.${extension}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function serialize(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new Blob([new XMLSerializer().serializeToString(clone)], {type: "image/svg+xml"});
}

function downloadSVG() {
  const svg = stage.value.querySelector("svg");
  if (svg) save(serialize(svg), "svg");
}

async function downloadPNG() {
  let canvas = stage.value.querySelector("canvas");
  const svg = stage.value.querySelector("svg");
  if (!canvas && svg) {
    // Draw the SVG into a canvas at the device pixel ratio, on its background.
    const {width, height} = svg.getBoundingClientRect();
    const dpr = devicePixelRatio;
    const image = new Image();
    image.src = URL.createObjectURL(serialize(svg));
    await image.decode();
    canvas = document.createElement("canvas");
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const context = canvas.getContext("2d");
    context.fillStyle = getComputedStyle(svg).backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(image.src);
  }
  if (canvas) canvas.toBlob((blob) => save(blob, "png"), "image/png");
}

function redraw() {
  clearTimeout(timeout);
  timeout = setTimeout(draw, 200);
}

function update(name, value) {
  values[name] = value;
  redraw();
}

function upload(name, event) {
  const [file] = event.target.files;
  if (file) update(name, URL.createObjectURL(file));
}

onMounted(() => {
  draw();
  let first = true;
  observer = new ResizeObserver(() => (first ? (first = false) : redraw()));
  observer.observe(stage.value);
});

onBeforeUnmount(() => {
  clearTimeout(timeout);
  observer?.disconnect();
  invalidate();
});
</script>

<template>
  <div class="work">
    <aside class="work-sidebar">
      <a class="work-source" :href="work.source" title="Source code" target="_blank" rel="noreferrer">&lt;/&gt;</a>
      <form class="work-inputs" @submit.prevent>
        <!-- A radio is a group of buttons, which a label would merge into one control. -->
        <component
          :is="control.type === 'radio' ? 'div' : 'label'"
          v-for="(control, name) in work.controls"
          :key="name"
          :class="['work-input', `work-input-${control.type}`]"
          :role="control.type === 'radio' ? 'group' : undefined"
          :aria-label="control.type === 'radio' ? control.label : undefined"
        >
          <span class="work-label">{{ control.label }}</span>
          <template v-if="control.type === 'range'">
            <output>{{ values[name] }}</output>
            <input
              type="range"
              :min="control.min"
              :max="control.max"
              :step="control.step"
              :value="values[name]"
              @input="update(name, +$event.target.value)"
            />
          </template>
          <span v-else-if="control.type === 'radio'" class="work-options">
            <button
              v-for="option in control.options"
              :key="option"
              type="button"
              :class="{active: values[name] === option}"
              @click="update(name, option)"
            >
              {{ option }}
            </button>
          </span>
          <input
            v-else-if="control.type === 'toggle'"
            type="checkbox"
            :checked="values[name]"
            @change="update(name, $event.target.checked)"
          />
          <template v-else-if="control.type === 'file'">
            <span class="work-button">Upload</span>
            <input type="file" :accept="control.accept" hidden @change="upload(name, $event)" />
          </template>
        </component>
        <button type="button" class="work-button work-primary" @click="draw">Regenerate</button>
        <div class="work-downloads">
          <button type="button" class="work-button" @click="downloadPNG">Download PNG</button>
          <button v-if="isSVG" type="button" class="work-button" @click="downloadSVG">Download SVG</button>
        </div>
      </form>
    </aside>
    <main class="work-main">
      <header class="work-header">
        <h1>{{ work.title }}</h1>
        <p>{{ work.description }} {{ work.author }} {{ work.year }}</p>
      </header>
      <div ref="stage" class="work-stage"></div>
    </main>
  </div>
</template>

<style scoped>
.work {
  position: fixed;
  inset: 0;
  display: flex;
  overflow: hidden;
  background: #f7f7f5;
  color: #222;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.work-sidebar {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 240px;
  padding: 16px 20px;
  overflow: auto;
  border-right: 1px solid #ddd;
  box-sizing: border-box;
}

.work-source {
  align-self: flex-start;
  color: #222;
  font-size: 20px;
  font-weight: 600;
  line-height: 32px;
  text-decoration: none;
}

.work-source:hover {
  color: var(--vp-c-brand-1);
}

/* Inputs stacked in the sidebar: the label, then the control. */
.work-inputs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-size: 12px;
}

.work-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.work-label {
  font-weight: 600;
}

.work-input-radio .work-label {
  flex-basis: 100%;
}

.work-input input[type="range"] {
  flex-basis: 100%;
  margin: 0;
  accent-color: #222;
}

.work-input input[type="checkbox"] {
  margin: 0;
  accent-color: #222;
}

.work-input output {
  color: #777;
  font-variant-numeric: tabular-nums;
}

.work-options {
  display: flex;
}

.work-options button,
.work-button {
  padding: 2px 10px;
  border: 1px solid #222;
  background: white;
  color: #222;
  font: inherit;
  line-height: 20px;
  cursor: pointer;
}

.work-button {
  border-radius: 4px;
}

.work-options button:first-child {
  border-radius: 4px 0 0 4px;
}

.work-options button:last-child {
  border-radius: 0 4px 4px 0;
}

.work-options button + button {
  border-left: none;
}

.work-options button.active,
.work-primary {
  background: #222;
  color: white;
}

.work-primary {
  padding: 6px 10px;
}

.work-downloads {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: -8px;
}

.work-downloads .work-button {
  padding: 6px 10px;
}

.work-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.work-header {
  padding: 48px 32px 0;
  text-align: center;
}

.work-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 32px;
}

.work-header p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 20px;
}

.work-stage {
  position: relative;
  display: flex;
  justify-content: safe center;
  align-items: safe center;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 40px 64px 64px;
}

.work-stage :deep(canvas),
.work-stage :deep(svg) {
  display: block;
  border-radius: 12px;
}

/* On narrow screens, the sidebar becomes a compact block above the artwork. */
@media (max-width: 640px) {
  .work {
    flex-direction: column;
    overflow: auto;
  }

  .work-sidebar {
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
    width: auto;
    padding: 12px 16px;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }

  .work-inputs {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-size: 11px;
  }

  .work-input input[type="range"] {
    flex-basis: 120px;
  }

  .work-input-radio .work-label {
    flex-basis: auto;
  }

  .work-main {
    flex: none;
    min-height: 0;
  }

  .work-header {
    padding: 12px 16px 0;
  }

  .work-header h1 {
    font-size: 18px;
  }

  .work-header p {
    font-size: 12px;
  }

  .work-stage {
    flex: none;
    height: 70vh;
    padding: 16px;
  }
}
</style>
