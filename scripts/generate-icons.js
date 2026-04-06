/**
 * SVG → PNG icons (extension + toolbar) and CWS listing placeholders.
 * Usage: node scripts/generate-icons.js [icon.svg] [public/icons]
 */
import {mkdir, readFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourcePath = process.argv[2] ?? join(root, "icon.svg");
const iconsDir = process.argv[3] ?? join(root, "public", "icons");
const storeDir = join(root, "public", "store");

const EXTENSION_SIZES = [16, 32, 48, 128];
const ACTION_SIZES = [16, 24, 32];

async function generateIcons() {
  await mkdir(iconsDir, {recursive: true});
  const sourceBuffer = await readFile(sourcePath);

  for (const size of EXTENSION_SIZES) {
    const outputPath = join(iconsDir, `icon${size}.png`);
    await sharp(sourceBuffer)
      .resize(size, size, {
        background: {alpha: 0, b: 0, g: 0, r: 0},
        fit: "contain",
      })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${outputPath} (${size}×${size})`);
  }

  for (const size of ACTION_SIZES) {
    const outputPath = join(iconsDir, `action${size}.png`);
    await sharp(sourceBuffer)
      .resize(size, size, {
        background: {alpha: 0, b: 0, g: 0, r: 0},
        fit: "contain",
      })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${outputPath} (${size}×${size})`);
  }
}

async function generateStorePlaceholders() {
  await mkdir(storeDir, {recursive: true});

  await sharp({
    create: {
      background: {b: 250, g: 249, r: 248},
      channels: 3,
      height: 800,
      width: 1280,
    },
  })
    .png()
    .toFile(join(storeDir, "screenshot1.png"));
  console.log(`Generated: ${join(storeDir, "screenshot1.png")} (1280×800)`);

  const promoBg = {b: 9, g: 119, r: 217};

  await sharp({
    create: {
      background: promoBg,
      channels: 3,
      height: 280,
      width: 440,
    },
  })
    .png()
    .toFile(join(storeDir, "promo-small.png"));
  console.log(`Generated: ${join(storeDir, "promo-small.png")} (440×280)`);

  await sharp({
    create: {
      background: promoBg,
      channels: 3,
      height: 680,
      width: 920,
    },
  })
    .png()
    .toFile(join(storeDir, "promo-large.png"));
  console.log(`Generated: ${join(storeDir, "promo-large.png")} (920×680)`);

  await sharp({
    create: {
      background: promoBg,
      channels: 3,
      height: 560,
      width: 1400,
    },
  })
    .png()
    .toFile(join(storeDir, "promo-marquee.png"));
  console.log(`Generated: ${join(storeDir, "promo-marquee.png")} (1400×560)`);
}

async function main() {
  await generateIcons();
  await generateStorePlaceholders();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
