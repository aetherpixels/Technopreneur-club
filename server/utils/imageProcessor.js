import { Jimp } from 'jimp';
import fs from 'fs';

/**
 * Clean white/off-white backgrounds, autocrop bounding boxes, and resize signatures and logos.
 * @param {string} inputPath Path to raw uploaded image
 * @param {string} outputPath Path to save processed transparent PNG
 * @param {boolean} isSignature True if processing a hand-drawn faculty signature
 */
export const processImageBackground = async (inputPath, outputPath, isSignature = false) => {
  try {
    const image = await Jimp.read(inputPath);

    // Background threshold value (RGB values greater than this will be transparent)
    const threshold = 215;

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];

      // Only process opaque or semi-opaque pixels
      if (a > 10) {
        if (r > threshold && g > threshold && b > threshold) {
          this.bitmap.data[idx + 3] = 0; // Transparent
        } else if (isSignature) {
          // Boost signature ink visibility and contrast by darkening grey pixels
          const avg = (r + g + b) / 3;
          if (avg < 160) {
            // Make it extremely crisp (darken pixels proportionally)
            this.bitmap.data[idx + 0] = Math.max(0, r - 70);
            this.bitmap.data[idx + 1] = Math.max(0, g - 70);
            this.bitmap.data[idx + 2] = Math.max(0, b - 70);
          }
        }
      }
    });

    // Autocrop outer blank space/margin boundaries
    try {
      image.autocrop();
    } catch (cropErr) {
      // Ignore autocrop errors on unusual geometries
    }

    // Resize based on element type to prevent bloated sizes
    if (isSignature) {
      if (image.bitmap.width > 240) {
        image.resize({ w: 240 });
      }
    } else {
      // Logo height limits
      if (image.bitmap.height > 100) {
        image.resize({ h: 100 });
      }
    }

    await image.write(outputPath);
  } catch (err) {
    console.warn("processImageBackground processing warning, copying source image as fallback:", err.message);
    try {
      fs.copyFileSync(inputPath, outputPath);
    } catch (copyErr) {
      console.error("Failed to copy image to output path:", copyErr);
      throw err;
    }
  }
};
