import {defineConfig} from "vitepress";
import config from "genji-theme-vitepress/config";
import {categories} from "../examples/examples.js";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Charming",
  description: "The JavaScript library for creative coding and data-driven drawing on Canvas, WebGL and the terminal",
  cleanUrls: true,
  extends: config,
  vite: {
    ssr: {
      noExternal: ["points-on-path"],
    },
  },
  head: [["link", {rel: "icon", type: "image/png", href: "/logo.png"}]],
  appearance: false,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: "Examples",
        link: "/examples/",
        activeMatch: "^/examples/",
      },
      {
        text: "Demos",
        items: [
          {
            text: "Pretext",
            link: "https://pretext.charmingjs.org/",
          },
        ],
      },
    ],
    sidebar: {
      "/examples/": [
        {text: "Examples", link: "/examples/"},
        ...categories.map((category) => ({
          text: category.name,
          collapsed: false,
          items: category.examples.map(({slug, title}) => ({text: title, link: `/examples/${slug}`})),
        })),
      ],
      "/": [
        {
          text: "Introduction",
          items: [
            {
              text: "What is Charming?",
              link: "/",
            },
            {
              text: "Why Charming?",
              link: "/why-charming",
            },
            {
              text: "Get Started",
              link: "/get-started",
            },
            {
              text: "API Index",
              link: "/api-index",
            },
          ],
        },
        {
          text: "Features",
          items: [
            {
              text: "Charming Core",
              collapsed: false,
              items: [
                {text: "Charming Flow", link: "/flow"},
                {text: "Charming Shape", link: "/shape"},
                {text: "Charming Process", link: "/process"},
                {text: "Charming Transform", link: "/transform"},
                {text: "Charming Scale", link: "/scale"},
                {text: "Charming WebGL", link: "/webgl"},
              ],
            },
            {text: "Charming Terminal", link: "/terminal"},
            {text: "Charming DOM", link: "/dom"},
            {text: "Charming Canvas", link: "/canvas"},
            {text: "Charming Path", link: "/path"},
            {text: "Charming Pretext", link: "/pretext"},
            {text: "Charming Vector", link: "/vector"},
            {text: "Charming Noise", link: "/noise"},
          ],
        },
      ],
    },
    socialLinks: [{icon: "github", link: "https://github.com/charming-art/api"}],
    logo: "/logo.svg",
    outline: "deep",
  },
});
