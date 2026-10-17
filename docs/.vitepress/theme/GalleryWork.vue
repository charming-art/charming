<script setup>
// A fullscreen gallery work: the artwork fills the window, with its controls in
// a panel that can be opened and hidden.
//
// A work is {title, description, background, controls, draw}:
// - controls maps each name to a control, {type: "range" | "radio" | "toggle" | "file", label, ...};
// - draw(stage, values, invalidation) draws into stage, where values has the
//   width and height of the window and the value of each control, and stops
//   its animations when invalidation resolves;
// - background is a color, or a function of the values.
import {computed, onBeforeUnmount, onMounted, reactive, ref} from "vue";
import {withBase} from "vitepress";

const {work} = defineProps(["work"]);

const stage = ref(null);
const open = ref(false);
const values = reactive(
  Object.fromEntries(
    Object.entries(work.controls).map(([name, control]) => [
      name,
      control.type === "file" ? withBase(control.value) : control.value,
    ]),
  ),
);
const background = computed(() =>
  typeof work.background === "function" ? work.background(values) : work.background || "white",
);

let invalidate = () => {};
let timeout;
let observer;

function draw() {
  invalidate();
  const invalidation = new Promise((resolve) => (invalidate = resolve));
  const node = stage.value;
  node.replaceChildren();
  const {width, height} = node.getBoundingClientRect();
  Promise.resolve(work.draw(node, {...values, width, height}, invalidation)).catch((error) => console.error(error));
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

function onkeydown(event) {
  if (event.key === "Escape") open.value = false;
}

onMounted(() => {
  draw();
  let first = true;
  observer = new ResizeObserver(() => (first ? (first = false) : redraw()));
  observer.observe(stage.value);
  window.addEventListener("keydown", onkeydown);
});

onBeforeUnmount(() => {
  clearTimeout(timeout);
  observer?.disconnect();
  window.removeEventListener("keydown", onkeydown);
  invalidate();
});
</script>

<template>
  <div class="work" :style="{background}">
    <div ref="stage" class="work-stage"></div>
    <a class="work-button work-back" :href="withBase('/gallery/')">← Gallery</a>
    <div class="work-actions">
      <button class="work-button" @click="open = !open">{{ open ? "Hide" : "Controls" }}</button>
    </div>
    <aside v-show="open" class="work-panel">
      <h1>{{ work.title }}</h1>
      <p v-if="work.description" class="work-description" v-html="work.description"></p>
      <label v-for="(control, name) in work.controls" :key="name" class="work-control">
        <span>{{ control.label }}</span>
        <template v-if="control.type === 'range'">
          <input
            type="range"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            :value="values[name]"
            @input="update(name, +$event.target.value)"
          />
          <output>{{ values[name] }}</output>
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
        <input
          v-else-if="control.type === 'file'"
          type="file"
          :accept="control.accept"
          @change="upload(name, $event)"
        />
      </label>
      <button class="work-regenerate" @click="draw">Regenerate</button>
    </aside>
  </div>
</template>

<style scoped>
.work {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: var(--vp-font-family-base);
}

.work-stage {
  position: absolute;
  inset: 0;
}

.work-stage :deep(canvas),
.work-stage :deep(svg) {
  display: block;
}

.work-button {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  font-size: 14px;
  line-height: 20px;
  text-decoration: none;
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.work-button:hover {
  background: white;
}

.work-back {
  position: absolute;
  top: 16px;
  left: 16px;
}

.work-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
}

.work-panel {
  position: absolute;
  top: 64px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: min(320px, calc(100vw - 32px));
  max-height: calc(100vh - 80px);
  overflow: auto;
  padding: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  font-size: 14px;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.work-panel h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.work-description {
  margin: 0;
  color: #666;
  line-height: 22px;
}

.work-description :deep(a) {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.work-control {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 4px 8px;
}

.work-control > span:first-child {
  grid-column: 1 / -1;
  font-weight: 500;
}

.work-control input[type="range"] {
  width: 100%;
}

.work-control input[type="file"] {
  grid-column: 1 / -1;
  font-size: 13px;
}

.work-control output {
  min-width: 3em;
  color: #666;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.work-options {
  grid-column: 1 / -1;
  display: flex;
  gap: 6px;
}

.work-options button,
.work-regenerate {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.work-options button.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.work-regenerate {
  padding: 8px 12px;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
  font-weight: 500;
}
</style>
