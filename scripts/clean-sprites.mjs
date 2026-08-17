import sharp from "sharp";
import path from "node:path";

const assets = "/Users/liull02/Desktop/文物小游戏/demo/public/assets";
const generated = "/Users/liull02/.codex/generated_images/019ff54d-4e46-7d50-837f-453ee7e8ecd2";
const projectArt = "/Users/liull02/Desktop/文物小游戏";

async function keepLargestComponents(source, output, keepCount = 1) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const labels = new Int32Array(pixelCount);
  labels.fill(-1);
  const queue = new Int32Array(pixelCount);
  const components = [];

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || data[start * 4 + 3] < 16) continue;
    let head = 0;
    let tail = 0;
    const label = components.length;
    queue[tail++] = start;
    visited[start] = 1;
    let size = 0;

    while (head < tail) {
      const current = queue[head++];
      const x = current % info.width;
      labels[current] = label;
      size += 1;

      const neighbors = [
        current - info.width,
        current + info.width,
        x > 0 ? current - 1 : -1,
        x < info.width - 1 ? current + 1 : -1,
      ];

      for (const next of neighbors) {
        if (
          next < 0 ||
          next >= pixelCount ||
          visited[next] ||
          data[next * 4 + 3] < 16
        ) {
          continue;
        }
        visited[next] = 1;
        queue[tail++] = next;
      }
    }
    components.push(size);
  }

  const retained = new Set(
    components
      .map((size, label) => ({ size, label }))
      .sort((a, b) => b.size - a.size)
      .slice(0, keepCount)
      .map(({ label }) => label),
  );

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (!retained.has(labels[pixel])) data[pixel * 4 + 3] = 0;
  }

  await sharp(data, { raw: info }).png().toFile(output);
}

async function removeRenderedCheckerboard(source, output) {
  const { data, info } = await sharp(source)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const background = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const canBeBackground = (pixel) => {
    const offset = pixel * 3;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (r + g + b) / 3;
    return lightness > 178 && max - min < 42;
  };

  const enqueue = (pixel) => {
    if (pixel < 0 || pixel >= pixelCount || background[pixel] || !canBeBackground(pixel)) return;
    background[pixel] = 1;
    queue[tail++] = pixel;
  };

  for (let x = 0; x < info.width; x += 1) {
    enqueue(x);
    enqueue((info.height - 1) * info.width + x);
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueue(y * info.width);
    enqueue(y * info.width + info.width - 1);
  }

  while (head < tail) {
    const current = queue[head++];
    const x = current % info.width;
    enqueue(current - info.width);
    enqueue(current + info.width);
    if (x > 0) enqueue(current - 1);
    if (x < info.width - 1) enqueue(current + 1);
  }

  const rgba = Buffer.alloc(pixelCount * 4);
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const sourceOffset = pixel * 3;
    const targetOffset = pixel * 4;
    const r = data[sourceOffset];
    const g = data[sourceOffset + 1];
    const b = data[sourceOffset + 2];
    rgba[targetOffset] = r;
    rgba[targetOffset + 1] = g;
    rgba[targetOffset + 2] = b;

    let alpha = 255;
    if (background[pixel]) {
      const lightness = (r + g + b) / 3;
      alpha = Math.max(0, Math.min(255, Math.round((224 - lightness) * 5.8)));
    }
    rgba[targetOffset + 3] = alpha;

    if (alpha > 12) {
      const x = pixel % info.width;
      const y = Math.floor(pixel / info.width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const margin = 10;
  const left = Math.max(0, minX - margin);
  const top = Math.max(0, minY - margin);
  const width = Math.min(info.width - left, maxX - minX + 1 + margin * 2);
  const height = Math.min(info.height - top, maxY - minY + 1 + margin * 2);

  await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract({ left, top, width, height })
    .png()
    .toFile(output);
}

await Promise.all([
  keepLargestComponents(path.join(assets, "li_work.png"), path.join(assets, "li_work_v2.png")),
  keepLargestComponents(path.join(assets, "yan_depart.png"), path.join(assets, "yan_depart_v2.png")),
  keepLargestComponents(path.join(assets, "brothers.png"), path.join(assets, "brothers_v2.png")),
  keepLargestComponents(path.join(assets, "workers_carry.png"), path.join(assets, "workers_carry_v2.png")),
  keepLargestComponents(path.join(assets, "workers_sand_water.png"), path.join(assets, "workers_sand_water_v2.png"), 2),
  removeRenderedCheckerboard(
    path.join(generated, "exec-10e81d68-5ba1-4cc5-a6c7-80db486b9c53.png"),
    path.join(assets, "master_portrait_v2.png"),
  ),
  removeRenderedCheckerboard(
    path.join(generated, "exec-95dedd55-3bd0-45d1-bbd9-0ae351430e86.png"),
    path.join(assets, "master_stand_v2.png"),
  ),
  removeRenderedCheckerboard(
    path.join(generated, "exec-a30be426-75b6-4237-9535-4fd77c3f7ee8.png"),
    path.join(assets, "master_work_v2.png"),
  ),
  removeRenderedCheckerboard(
    path.join(projectArt, "yucongwang.png"),
    path.join(assets, "jade_cong_final.png"),
  ),
  removeRenderedCheckerboard(
    path.join(projectArt, "shenrenshoumiantu_texie.png"),
    path.join(assets, "jade_motif_outline.png"),
  ),
  removeRenderedCheckerboard(
    path.join(projectArt, "yuanshiyuliao.png"),
    path.join(assets, "jade_raw.png"),
  ),
  removeRenderedCheckerboard(
    path.join(projectArt, "guanzuanhouyupei.png"),
    path.join(assets, "jade_drilled.png"),
  ),
  removeRenderedCheckerboard(
    path.join(projectArt, "diaokezhongdeyucong.png"),
    path.join(assets, "jade_carving.png"),
  ),
]);

console.log("Cleaned sprite assets written to public/assets/*_v2.png");
