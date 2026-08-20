import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "../public/assets");
const jobs = [
  { input: "li_stand_new.png", output: "li_stand_clean.png", crop: { left: 0, top: 0, width: 225, height: 625 } },
  { input: "li_work_new.png", output: "li_work_clean.png", crop: { left: 0, top: 0, width: 242, height: 410 } },
  { input: "li_sad_new.png", output: "li_sad_clean.png" },
  { input: "yan_portrait_new.png", output: "yan_portrait_clean.png", crop: { left: 0, top: 0, width: 354, height: 500 } },
  { input: "yan_stand_new.png", output: "yan_stand_clean.png", crop: { left: 0, top: 0, width: 167, height: 515 } },
  { input: "yan_depart_new.png", output: "yan_depart_clean.png" },
];

for (const job of jobs) {
  let pipeline = sharp(path.join(root, job.input)).ensureAlpha();
  if (job.crop) pipeline = pipeline.extract(job.crop);
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = data[offset + 3];
    const vivid = Math.max(red, green, blue) - Math.min(red, green, blue) > 125;
    const chromaRed = red > 205 && green < 92 && blue < 104;
    const chromaYellow = red > 205 && green > 176 && blue < 92;
    const fringeColor = alpha < 240 && Math.max(red, green, blue) - Math.min(red, green, blue) > 82 && (
      (red > 155 && green < 112 && blue < 108) ||
      (red > 165 && green > 142 && blue < 105)
    );

    if (alpha > 0 && ((vivid && (chromaRed || chromaYellow)) || fringeColor)) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
    }
  }

  await sharp(data, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, job.output));
}
