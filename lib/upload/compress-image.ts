export async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.8
): Promise<Blob> {
  // Fallback for browsers without OffscreenCanvas (iOS < 16.4)
  if (typeof OffscreenCanvas !== 'undefined') {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    return canvas.convertToBlob({ type: 'image/jpeg', quality });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
