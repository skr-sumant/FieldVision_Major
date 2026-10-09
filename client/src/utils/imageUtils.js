/**
 * Utility to process device image uploads
 * Reads a File object selected from device file system or camera,
 * resizes it to a compact square avatar (256x256), and returns a compressed JPEG data URL.
 */
export function processAvatarImage(file, maxSize = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file selected'));
    }

    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select an image file (JPEG, PNG, WEBP, etc.)'));
    }

    // Limit raw upload size before processing to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error('Image file is too large. Please select a file under 15MB.'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Center-crop the image to a square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            maxSize,
            maxSize
          );

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(new Error('Could not process and resize image: ' + err.message));
        }
      };
      img.onerror = () => reject(new Error('Failed to parse image file.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file from device.'));
    reader.readAsDataURL(file);
  });
}
