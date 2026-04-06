# UdePrompt

**UdePrompt** is a Chrome extension for **Udemy**: copy **lecture transcripts** to your **clipboard** in one step, with **custom templates** (great for notes, summaries, or **AI prompts**). Works on `*.udemy.com` course pages only; nothing is sent to external servers.

## Features

- **Floating Action Button (FAB)**: Terracotta FAB opens the transcript sidebar (if needed) and copies the transcript
- **Seek to end**: Neutral secondary FAB above it seeks the lecture video to the end
- **Template System**: Customize the format of copied text using templates with `{{ transcript }}` placeholder
- **Extension Popup**: Click the extension icon to edit your template in a convenient popup
- **Settings Panel**: Access settings directly from the page with a gear icon button
- **Smart Detection**: Automatically detects if transcript sidebar is already open to avoid unnecessary clicks
- **Auto-copy on Tab Click**: Automatically copies transcript when you click the Transcript tab
- **Dynamic Class Handling**: Works with Udemy's dynamic class names that change on reload
- **Success/Error Notifications**: Visual feedback for all operations

## Installation

1. Clone or download this repository
2. (Optional) Install dependencies and build: `bun install` then `bun run build`. To use the built bundle, select the `dist/` folder in step 5; otherwise use the repo root.
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top right)
5. Click "Load unpacked"
6. Select the extension folder (repository root, or `dist/` if you ran the build)
7. The extension is now installed and active

## Development

- **Install dependencies**: `bun install`
- **Icons & store art**: `bun run icons` — rasterizes root `icon.svg` to `public/icons/` (extension + toolbar sizes) and writes CWS placeholder PNGs under `public/store/` (not copied into `dist/`; upload those in the Web Store dashboard)
- **Build**: `bun run build` — bundles and minifies JS with **esbuild** (IIFE), copies `manifest.json` / `popup.html` / `styles.css` / `public/icons/*.png` → `dist/icons/` via **vite-plugin-static-copy** (CSS minified with esbuild); output is in `dist/`
- **Dev (watch)**: `bun run dev` — same as build, rebuilds `dist/` when sources change
- **Lint**: `bun run lint` — Biome check and format (`bunx @biomejs/biome`)

Tech: **Bun** (install, scripts, `bunx`), Vite (orchestrates build), esbuild (bundles), **sharp** (icon PNG generation), Biome (lint/format). A Node-compatible runtime is still required for Vite.

## Usage

### Method 1: Using the Floating Action Button (FAB)

1. Navigate to any Udemy course lecture page (e.g., `*.udemy.com/course/*/learn/lecture/*`)
2. Click the purple circular FAB button in the bottom-right corner
3. The extension will:
   - Open the transcript sidebar (if not already open)
   - Wait for the transcript to load
   - Extract and format the transcript using your template
   - Copy it to your clipboard
4. A notification will appear confirming the copy operation
5. Paste the transcript anywhere using Ctrl+V (Cmd+V on Mac)

### Seek to end

1. On a lecture page, click the **green FAB** (above the purple FAB) in the bottom-right corner.
2. The video will seek to the end. A notification will confirm.

### Method 2: Clicking the Transcript Tab

1. Navigate to any Udemy course lecture page
2. Click on the "Transcript" tab button
3. The extension will automatically extract and copy the transcript text to your clipboard
4. A notification will appear confirming the copy operation

### Editing Your Template

#### Via Extension Popup (Recommended)

1. Click the extension icon in your browser toolbar
2. Edit the template in the textarea
3. Use `{{ transcript }}` as a placeholder for the actual transcript text
4. Click "Save" to save your template
5. Click "Reset to Default" to restore the default template

#### Via Settings Panel on Page

1. Click the gray gear icon button below the FAB
2. Edit the template in the modal dialog
3. Click "Save" to save your changes

### Default Template

The default template includes:

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

You can customize this to any format you prefer. The `{{ transcript }}` placeholder will be replaced with the actual transcript text when copying.

## How It Works

- **FAB Button**: When clicked, finds and clicks the transcript toggle button (`data-purpose="transcript-toggle"`) to open the sidebar
- **Seek to end**: Finds the page’s `<video>` and seeks it to the end, then dispatches the `ended` event
- **Smart Detection**: Checks if the transcript sidebar is already open using `aria-expanded` attribute and DOM visibility
- **Template System**: Default template is in `shared.js`; uses `chrome.storage.local` to sync templates between popup and content script
- **Transcript Extraction**:
  - Finds the transcript panel using stable selectors (data attributes and partial class matching)
  - Extracts text from transcript cue containers using flexible selectors
  - Handles dynamic class names that change on reload
- **Formatting**: Replaces `{{ transcript }}` placeholder with actual transcript text
- **Copy**: Uses the Clipboard API to copy formatted text to clipboard

## Permissions

- `clipboardWrite`: Clipboard writes after async work (e.g. after the transcript loads) without a continuous user gesture
- `storage`: Saves the template and UI theme (`chrome.storage.local` / `chrome.storage.sync`)
- **Site access**: The content script is limited to `*://*.udemy.com/*` via `manifest.json` `content_scripts` matches (not a separate `host_permissions` entry)

## Troubleshooting

- **Transcript not found**:
  - Make sure the transcript panel is fully loaded
  - Try clicking the FAB button again
  - Ensure you're on a lecture page with transcripts available
- **Copy failed**:
  - Check that clipboard permissions are granted
  - Try refreshing the page
- **Template not saving**:
  - Check browser console for errors
  - Try saving again via the extension popup
- **FAB button not appearing**:
  - Refresh the page
  - Make sure you're on a Udemy course page
  - Check that the extension is enabled in `chrome://extensions/`

## Project structure

- `icon.svg` — Source artwork for extension / toolbar icons (`bun run icons`)
- `public/icons/` — Generated PNGs (16–128px); copied into `dist/icons/` on build
- `public/store/` — Chrome Web Store listing placeholders (screenshot / promo); not packaged in the extension
- `scripts/generate-icons.js` — **sharp** pipeline: `icon.svg` → icons + store placeholders
- `manifest.json` — Extension configuration and permissions
- `content.js` — Content script: FAB, transcript extraction, template formatting (runs with `shared.js`)
- `shared.js` — Default transcript template (shared by content script and popup)
- `popup.html` — Extension popup UI for template editing
- `popup.js` — Popup script for template management
- `styles.css` — Styling for notifications, FAB, settings panel, and hover effects
- `vite.config.js` — Vite orchestrates **esbuild** for JS bundles and **vite-plugin-static-copy** for static assets (→ `dist/`)
- `biome.json` — Lint and format config (Biome)
- `dist/` — Build output (generated by `bun run build`); load this folder for a production-style install
- `PRIVACY.md` — Privacy and data handling
- `README.md` — This file

## Privacy and Chrome Web Store

- **Privacy**: What data we use and how we handle it is described in [PRIVACY.md](PRIVACY.md). Keep it in sync with the extension and with the Chrome Web Store Privacy tab when publishing.
- **Publishing**: Follow [Chrome Web Store Best Practices](https://developer.chrome.com/docs/webstore/best-practices/) (Manifest V3, minimal permissions, required images, category, and listing). Project rules are in `.cursor/rules/chrome-extension-best-practices.mdc`.

## Notes

- Templates are saved in `chrome.storage.local` and sync between the popup and content script
- The extension handles dynamic page structures where button IDs and class names change on reload
- Transcript extraction includes retry logic for asynchronous content loading
- The FAB button appears on all Udemy pages but only functions on lecture pages with transcripts
- Hover over the Transcript tab to see a purple highlight indicating the extension is active
