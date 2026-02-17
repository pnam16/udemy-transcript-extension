#!/usr/bin/env node
import {copyFileSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import esbuild from "esbuild";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");

mkdirSync(dist, {recursive: true});

const jsFiles = ["shared.js", "content.js", "popup.js"];
for (const name of jsFiles) {
  await esbuild.build({
    bundle: false,
    entryPoints: [join(root, name)],
    format: "iife",
    minify: true,
    outfile: join(dist, name),
    target: "es2020",
  });
}

// Copy assets (no bundling)
copyFileSync(join(root, "manifest.json"), join(dist, "manifest.json"));
copyFileSync(join(root, "popup.html"), join(dist, "popup.html"));

// Minify CSS: strip comments and collapse whitespace
const css = readFileSync(join(root, "styles.css"), "utf8");
const minCss = css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .trim();
writeFileSync(join(dist, "styles.css"), minCss);

console.log("Build complete → dist/");
