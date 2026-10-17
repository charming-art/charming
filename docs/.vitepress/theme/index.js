import DefaultTheme from "vitepress/theme";
import Layout from "genji-theme-vitepress";
import {h} from "vue";
import * as cm from "../../../src/index.js";
import * as d3 from "d3";
import {example, libraries} from "./example.js";
import ExampleGrid from "./ExampleGrid.vue";
import GalleryWork from "./GalleryWork.vue";
import "./custom.css";

// More props: https://genji-md.dev/reference/props
const props = {
  Theme: DefaultTheme,
  library: {cm, d3, __libraries: libraries},
  transform: {example},
};

export default {
  extends: DefaultTheme,
  Layout: () => h(Layout, props),
  enhanceApp({app}) {
    app.component("ExampleGrid", ExampleGrid);
    app.component("GalleryWork", GalleryWork);
  },
};
