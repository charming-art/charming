import DefaultTheme from "vitepress/theme";
import Layout from "genji-theme-vitepress";
import {h} from "vue";
import * as cm from "../../../src/index.js";
import * as d3 from "d3";
import Matter from "matter-js";
import toxi from "toxiclibsjs";
import * as flubber from "flubber";
import rough from "roughjs";
import * as Tone from "tone";
import {example} from "./example.js";
import ExampleGrid from "./ExampleGrid.vue";
import "./custom.css";

// More props: https://genji-md.dev/reference/props
const props = {
  Theme: DefaultTheme,
  library: {cm, d3, Matter, toxi, flubber, rough, Tone},
  transform: {example},
};

export default {
  extends: DefaultTheme,
  Layout: () => h(Layout, props),
  enhanceApp({app}) {
    app.component("ExampleGrid", ExampleGrid);
  },
};
