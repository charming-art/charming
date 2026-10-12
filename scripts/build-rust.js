// Builds the terminal renderer's Rust backend to WebAssembly and inlines the
// binary as a base64 module, so it loads without a bundler or a network request.
import {execSync} from "node:child_process";
import {readFileSync, rmSync, writeFileSync, readdirSync} from "node:fs";
import {join} from "node:path";

const out = "src/terminal/backend";

execSync(`wasm-pack build ./rust --out-dir ../${out} --out-name index --target web`, {stdio: "inherit"});

const wasm = readFileSync(join(out, "index_bg.wasm")).toString("base64");
writeFileSync(join(out, "wasm.js"), `export default "${wasm}";\n`);

for (const file of readdirSync(out)) {
  if (file !== "index.js" && file !== "wasm.js") rmSync(join(out, file));
}
