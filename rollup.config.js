import node from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const umd = {
  input: "src/index.js",
  output: {
    format: "umd",
    name: "cm",
  },
  plugins: [node()],
};

export default [
  {
    ...umd,
    output: {
      ...umd.output,
      file: "dist/charming.umd.js",
    },
  },
  {
    ...umd,
    output: {
      ...umd.output,
      file: "dist/charming.umd.min.js",
    },
    plugins: [...umd.plugins, terser()],
  },
];
