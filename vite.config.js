import {constants} from "node:fs";
import {access, mkdir, rm} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {build as esbuildBuild, transform as esbuildTransform} from "esbuild";
import {defineConfig} from "vite";
import {viteStaticCopy} from "vite-plugin-static-copy";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const distDir = resolve(root, "dist");

let didCleanDist = false;

async function pathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function cleanDistOnce() {
  if (didCleanDist) {
    return;
  }
  didCleanDist = true;
  if (await pathExists(distDir)) {
    await rm(distDir, {force: true, recursive: true});
  }
  await mkdir(distDir, {recursive: true});
}

/** Bundle extension scripts with esbuild (IIFE, minified). */
function esbuildExtensionEntries() {
  return {
    async buildStart() {
      await cleanDistOnce();
      await esbuildBuild({
        absWorkingDir: root,
        bundle: true,
        entryPoints: {
          content: resolve(root, "content.js"),
          popup: resolve(root, "popup.js"),
          shared: resolve(root, "shared.js"),
        },
        format: "iife",
        legalComments: "none",
        logLevel: "info",
        minify: true,
        outdir: distDir,
        platform: "neutral",
        target: "es2020",
      });
    },
    enforce: "pre",
    name: "udeprompt-esbuild-entries",
  };
}

/** Rollup must emit something; drop the file so `dist/` only has extension assets. */
function stripViteDummyOutput() {
  return {
    name: "udeprompt-strip-vite-dummy",
    async writeBundle() {
      const junk = resolve(distDir, "_vite_dummy.js");
      if (await pathExists(junk)) {
        await rm(junk, {force: true});
      }
    },
  };
}

export default defineConfig({
  build: {
    emptyOutDir: false,
    minify: false,
    outDir: "dist",
    rollupOptions: {
      input: resolve(root, "scripts/_vite_dummy_entry.js"),
      output: {
        entryFileNames: "_vite_dummy.js",
        format: "es",
      },
    },
    target: "es2020",
  },
  plugins: [
    esbuildExtensionEntries(),
    viteStaticCopy({
      targets: [
        {
          dest: "icons",
          rename: {stripBase: true},
          src: "public/icons/*.png",
        },
        {dest: ".", src: "manifest.json"},
        {dest: ".", src: "popup.html"},
        {
          dest: ".",
          src: "styles.css",
          transform: async (contents) => {
            const r = await esbuildTransform(contents, {
              loader: "css",
              minify: true,
            });
            return r.code;
          },
        },
      ],
    }),
    stripViteDummyOutput(),
  ],
  publicDir: false,
  root,
});
