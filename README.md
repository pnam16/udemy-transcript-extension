# UdePrompt

**UdePrompt** is a Chrome extension for **Udemy**: copy **lecture transcripts** to your **clipboard** in one step, with **custom templates** (great for notes, summaries, or **AI prompts**). Works on `*.udemy.com` course pages only; nothing is sent to external servers.

## Features

- **Floating Action Button (FAB)**: Amber accent circular FAB opens the transcript sidebar (if needed) and copies the transcript; styling follows the popup (light / dark / system)
- **Seek to end**: Neutral secondary FAB above it (outlined / surface style) seeks the lecture video to the end
- **Template System**: Customize the format of copied text using templates with `{{ transcript }}` placeholder
- **Extension Popup**: Toolbar icon opens the popup to edit the template, reset to default, and set **Appearance** (System / Light / Dark) for the popup and on-page UI
- **Smart Detection**: Automatically detects if the transcript sidebar is already open to avoid unnecessary clicks
- **Auto-copy on Tab Click**: Automatically copies the transcript when you click the Transcript tab
- **Dynamic Class Handling**: Works with Udemy's dynamic class names that change on reload
- **Success/Error Notifications**: Visual feedback for all operations

## Installation

1. Clone or download this repository.
2. Install dependencies and build:
   - `bun install` then `bun run build`  
   - Or use `npm install` / `pnpm install` / `yarn install` with the same `build` script if you use Node for Vite.
3. Open Chrome and go to `chrome://extensions/`.
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked**.
6. Select the **`dist/`** folder (build output). The manifest expects `icons/` and bundled scripts beside it; loading `dist/` is the supported path.
7. The extension is installed and active.

## Development

- **Install dependencies**: `bun install` (or npm/pnpm/yarn)
- **Icons & store art**: `bun run icons` — runs `node scripts/generate-icons.js`; rasterizes root `icon.svg` into `public/icons/` (extension + toolbar sizes) and writes Chrome Web Store placeholder PNGs under `public/store/` (`screenshot1`, `promo-small`, `promo-large`, `promo-marquee`). Store files are **not** copied into `dist/`; upload them in the Web Store dashboard when publishing.
- **Build**: `bun run build` — Vite runs an **esbuild** step (IIFE, minified) for `shared.js`, `content.js`, and `popup.js` into `dist/`; **vite-plugin-static-copy** copies `manifest.json`, `popup.html`, minified `styles.css`, and `public/icons/*.png` → `dist/icons/` (with `rename: { stripBase: true }` so files land as `dist/icons/icon16.png`, etc.).
- **Dev (watch)**: `bun run dev` — `vite build --watch`; rebuilds `dist/` when sources change.
- **Lint**: `bun run lint` — Biome check and write (`bunx @biomejs/biome`)

**Stack**: **Bun** (typical install/scripts), **Vite 6** (orchestration), **esbuild** (extension scripts), **sharp** (PNG generation), **Biome** (lint/format). Vite still expects a Node-compatible runtime.

## Usage

### Method 1: Using the Floating Action Button (FAB)

1. Open any Udemy course lecture page (e.g. `*.udemy.com/course/*/learn/lecture/*`).
2. Click the **bottom** circular **amber** FAB (copy transcript).
3. The extension will:
   - Open the transcript sidebar if needed
   - Wait for the transcript to load
   - Extract and format the transcript using your template
   - Copy it to the clipboard
4. A notification confirms success or errors.
5. Paste with Ctrl+V (Cmd+V on Mac).

### Seek to end

1. On a lecture page, click the **upper** FAB (neutral / outlined style) above the copy FAB.
2. The video seeks to the end. A notification confirms.

### Method 2: Clicking the Transcript Tab

1. Open a lecture page.
2. Click the **Transcript** tab.
3. The transcript is copied to the clipboard using your template.
4. A notification confirms.

### Editing your template and appearance

**Extension popup (only on-page editor)**

1. Click the UdePrompt icon in the toolbar.
2. Edit the template in the textarea; use `{{ transcript }}` where the transcript text should go.
3. **Save** stores the template in `chrome.storage.local`.
4. **Reset to Default** restores the default from `shared.js`.
5. **Appearance** (System / Light / Dark) is stored in `chrome.storage.sync` and updates the popup and the FAB / notification styling on Udemy pages.

### Default template

Defined in `shared.js`:

```
Analyze this video and provide insights.
Transcript: {{ transcript }}
Please provide:
1. Executive Summary
2. Key Points & Takeaways
3. Notable Quotes
4. Actionable Insights
Format as clear, structured content. Write in the same language as the transcript.
```

## How it works

- **FAB (copy)**: Finds `button[data-purpose="transcript-toggle"]` to open the sidebar when needed.
- **Seek to end**: Finds the page `<video>`, seeks to `duration`, then dispatches `ended` so Udemy can mark progress.
- **Smart detection**: Uses `aria-expanded` and DOM visibility to see if the transcript panel is already open.
- **Template**: Default in `shared.js`; runtime value in `chrome.storage.local` (`udemy-transcript-template`), shared by the content script and popup.
- **Theme**: `udeprompt-ui-theme` in `chrome.storage.sync`; content script listens with `chrome.storage.onChanged` and applies `data-utc-theme` on the FAB host.
- **Transcript extraction**: Locates the panel via `data-purpose` and class substrings; collects cue text with flexible selectors; retries while content loads.
- **Copy**: Clipboard API after async work; `clipboardWrite` permission supports writes without a continuous gesture.

## Permissions

- `clipboardWrite`: Clipboard writes after async work (e.g. after the transcript loads).
- `storage`: `chrome.storage.local` (template) and `chrome.storage.sync` (appearance).
- **Site access**: Content scripts are limited to `*://*.udemy.com/*` in `manifest.json` (`content_scripts.matches`).

## Troubleshooting

- **Transcript not found**: Wait for the panel to load; try the copy FAB again; confirm the lecture has captions/transcripts.
- **Copy failed**: Check clipboard permissions; refresh the page.
- **Template not saving**: Open the browser console; try Save again from the popup.
- **FAB not showing**: Refresh; confirm you are on a Udemy page; check `chrome://extensions/` that the extension is enabled.

## Project structure

| Path | Role |
|------|------|
| `icon.svg` | Source artwork for icons (`bun run icons`) |
| `public/icons/` | Generated PNGs; copied to `dist/icons/` on build |
| `public/store/` | CWS listing placeholders (not packaged in the extension) |
| `scripts/generate-icons.js` | **sharp**: SVG → icons + store placeholders |
| `scripts/_vite_dummy_entry.js` | Minimal Rollup input so Vite can run; output stripped from `dist/` |
| `manifest.json` | MV3 config (copied to `dist/`) |
| `shared.js` | Default template + global default string |
| `content.js` | FABs, transcript flow, tab listener, notifications |
| `popup.html` / `popup.js` | Template editor, theme controls |
| `styles.css` | Injected page UI (FABs, notifications); minified into `dist/` |
| `vite.config.js` | esbuild bundle plugin + static copy |
| `biome.json` | Lint/format |
| `dist/` | **Load this folder** in Chrome after `bun run build` |
| `PRIVACY.md` | Privacy disclosure |
| `README.md` | This file |

## Privacy and Chrome Web Store

- **Privacy**: See [PRIVACY.md](PRIVACY.md). Keep it aligned with the extension and the CWS Privacy tab when you publish.
- **Publishing**: Follow [Chrome Web Store best practices](https://developer.chrome.com/docs/webstore/best-listing/) (MV3, minimal permissions, listing images, category). Additional project guidance: `.cursor/rules/chrome-extension-best-practices.mdc`.

## Notes

- Template and theme sync between popup and content script via storage APIs above.
- The extension tolerates Udemy DOM changes (dynamic classes, SPA updates); a `MutationObserver` re-binds the Transcript tab listener when the DOM changes.
- The copy FAB is injected only in the **main frame** (`all_frames` is true for the script, but FAB creation is gated in code so nested frames do not stack FABs).
