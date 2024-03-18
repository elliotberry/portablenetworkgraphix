import fs from "fs";
import PNG from "./lib/png.js"; // This is a hypothetical extension for educational purposes.

// A simplified resize function using nearest neighbor interpolation
function resizeImage(sourceImage, targetWidth) {
  const targetHeight = Math.floor(sourceImage.height * (targetWidth / sourceImage.width));
  const resizedData = new Uint8Array(targetWidth * targetHeight * 4);
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.floor(x * (sourceImage.width / targetWidth));
      const srcY = Math.floor(y * (sourceImage.height / targetHeight));
      const srcIdx = (srcY * sourceImage.width + srcX) * 4;
      const dstIdx = (y * targetWidth + x) * 4;
      resizedData[dstIdx] = sourceImage.data[srcIdx]; // R
      resizedData[dstIdx + 1] = sourceImage.data[srcIdx + 1]; // G
      resizedData[dstIdx + 2] = sourceImage.data[srcIdx + 2]; // B
      resizedData[dstIdx + 3] = sourceImage.data[srcIdx + 3]; // A
    }
  }
  return { width: targetWidth, height: targetHeight, data: resizedData };
}

async function main() {
  fs.createReadStream("./png.png")
    .pipe(new PNG({
      filterType: 4,
    }))
    .on("parsed", function() {
      const resized = resizeImage(this, 100); // Resize to 100 pixels wide.

      // Create a new PNG with the resized dimensions and data
      // This part is hypothetical and assumes the PNG library can accept raw data for a new image.
      const output = new PNG({ width: resized.width, height: resized.height }).fillData(resized.data);
      output.pack().pipe(fs.createWriteStream("out.png"));
    });
}

main().catch(console.error);
