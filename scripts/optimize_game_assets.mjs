import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const assetDirectory = path.resolve("public/assets");
const sourceFiles = ["app/page.tsx", "app/globals.css"];
const source = (await Promise.all(sourceFiles.map(file => fs.readFile(file, "utf8")))).join("\n");
const referenced = [...new Set([...source.matchAll(/assets\/([A-Za-z0-9_-]+)\.(?:png|webp)/g)].map(match => match[1]))];

await Promise.all(referenced.map(async name => {
  const input = path.join(assetDirectory, `${name}.png`);
  const output = path.join(assetDirectory, `${name}.webp`);
  try {
    await fs.access(input);
  } catch {
    return;
  }
  await sharp(input)
    .webp({ quality: 80, alphaQuality: 88, effort: 5, smartSubsample: true })
    .toFile(output);
}));

if (process.argv.includes("--prune")) {
  await Promise.all(referenced.map(async name => {
    const input = path.join(assetDirectory, `${name}.png`);
    const output = path.join(assetDirectory, `${name}.webp`);
    try {
      const [sourceInfo, optimizedInfo] = await Promise.all([fs.stat(input), fs.stat(output)]);
      if (optimizedInfo.size < sourceInfo.size) await fs.unlink(input);
    } catch {
      // An absent source is already optimized, and an absent WebP is never removed.
    }
  }));
}

console.log(`Optimized ${referenced.length} referenced assets to WebP${process.argv.includes("--prune") ? " and removed their larger PNG originals" : ""}.`);
