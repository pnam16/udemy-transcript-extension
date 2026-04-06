## Learned User Preferences

- Prefers a cleaner popup over heavy editorial styling (ornate headers, texture overlays, multiple webfonts); system UI fonts and compact neutral surfaces are in scope.
- When touching `icon.svg`, align with Pencil brand: neutral surface tile and warm amber accent for the glyph.
- Lint/format should run through Bun for Biome (`bunx` / `bun x @biomejs/biome`), matching `package.json`.
- Popup work should follow extension-ui expectations: max height with scrollable main, dark/light theming, and fast, subtle motion.

## Learned Workspace Facts

- **Product**: UdePrompt — Chrome MV3 extension for Udemy transcript copy and templates; vanilla `shared.js` / `content.js` / `popup.js` plus `popup.html` and `styles.css` at repo root.
- **Build**: `vite build` (and `vite build --watch` for `dev`); a Vite pre-plugin runs **esbuild** to bundle `shared.js`, `content.js`, and `popup.js` into `dist/` as minified IIFE; Rollup emits a dummy entry that is removed after the build.
- **Assets**: `vite-plugin-static-copy` copies `manifest.json` and `popup.html` into `dist/`, minifies `styles.css` (esbuild CSS transform), and copies `public/icons/*.png` to `dist/icons/` for manifest paths.
- **Manifest**: Root `manifest.json` lists `content_scripts` (`shared.js`, `content.js`) and `styles.css`, `icons/*`, and action icons; load the unpacked build from **`dist/`**.
- **Icons**: Source of truth is **`icon.svg`**; run `yarn icons` or `node scripts/generate-icons.js` to regenerate **`public/icons/`** (extension + toolbar sizes) and listing placeholders under **`public/store/`** (Sharp-based script).
- **Lint**: `yarn lint` / `bun run lint` → `bunx @biomejs/biome check --write`.
- **Tooling**: Vite 6, esbuild, Biome; dummy entry at `scripts/_vite_dummy_entry.js` satisfies Rollup when esbuild owns the real JS outputs.
