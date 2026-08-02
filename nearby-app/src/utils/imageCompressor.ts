/**
 * Highly optimized client-side image compression using HTML5 Canvas.
 * Scales images down if they exceed maximum bounds and encodes them as high-quality JPEGs.
 */
export async function compressImage(
  data: Blob | File,
  maxDimension = 800,
  quality = 0.6
): Promise<Blob> {
  // Only compress images
  if (!data.type.startsWith('image/')) {
    return data;
  }
  
  // Do not compress GIFs (preserve animations)
  if (data.type === 'image/gif') {
    return data;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions if they exceed max bounds
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(data); // Fallback to original on error
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to Blob (prefer image/jpeg for best compression ratio)
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob && compressedBlob.size < data.size) {
              resolve(compressedBlob);
            } else {
              resolve(data); // If original was already smaller, use original
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        resolve(data);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve(data);
    };

    reader.readAsDataURL(data);
  });
}
