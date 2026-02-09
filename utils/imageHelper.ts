/**
 * Process an image file to create a square, resized, and compressed Data URL.
 * Target: 256x256px, JPEG 0.8 quality to save LocalStorage space.
 */
export const processAvatarImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }

        // Target size
        const size = 256; 
        canvas.width = size;
        canvas.height = size;

        // Calculate center crop
        const minDimension = Math.min(img.width, img.height);
        const sx = (img.width - minDimension) / 2;
        const sy = (img.height - minDimension) / 2;

        // Draw cropped and resized image
        ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, size, size);

        // Export as JPEG with compression (0.8 quality) to keep string small
        // We use JPEG because PNG base64 strings are often too large for localStorage if detailed
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Safety check: if string is massive (> 150KB), try lower quality
        if (dataUrl.length > 200000) {
           const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
           resolve(compressedDataUrl);
        } else {
           resolve(dataUrl);
        }
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};
