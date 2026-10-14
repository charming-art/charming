import DefaultTheme from "vitepress/theme";
import Layout from "genji-theme-vitepress";
import {h} from "vue";
import * as cm from "../../../src/index.js";
import * as d3 from "d3";
import "./custom.css";

// More props: https://genji-md.dev/reference/props
const props = {
  Theme: DefaultTheme,
  library: {cm, d3},
};

export default {
  extends: DefaultTheme,
  Layout: () => h(Layout, props),
};
