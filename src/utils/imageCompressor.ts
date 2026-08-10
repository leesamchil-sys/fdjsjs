/**
 * Custom client-side utility for high-performance, low-memory image cropping and compression.
 * Automatically extracts the center square from any ratio (landscape/portrait) and
 * compresses the output to an efficient high-density JPEG blob.
 */

export function compressAndCropImage(
  file: File,
  maxWidth = 512,
  maxHeight = 512,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Basic file validation
    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일 형식만 업로드 가능합니다.'));
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('파일 데이터를 읽을 수 없습니다.'));
        return;
      }
      img.src = e.target.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽는 도중 오류가 발생했습니다.'));
    };

    img.onload = () => {
      let canvas: HTMLCanvasElement | null = document.createElement('canvas');
      let ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('브라우저 Canvas를 초기화할 수 없습니다.'));
        return;
      }

      const originalWidth = img.width;
      const originalHeight = img.height;

      // Calculate center crop boundaries (1:1 ratio aspect)
      let cropX = 0;
      let cropY = 0;
      let cropSize = 0;

      if (originalWidth > originalHeight) {
        cropSize = originalHeight;
        cropX = (originalWidth - originalHeight) / 2;
        cropY = 0;
      } else {
        cropSize = originalWidth;
        cropX = 0;
        cropY = (originalHeight - originalWidth) / 2;
      }

      // Assign target dimensions
      canvas.width = maxWidth;
      canvas.height = maxHeight;

      try {
        // Render 1:1 cropped segment
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropSize,
          cropSize, // Source crop
          0,
          0,
          maxWidth,
          maxHeight // Destination resize
        );

        // Convert to high-performance JPEG Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('이미지 압축 처리에 실패했습니다.'));
            }

            // High-efficiency memory cleanup
            if (canvas) {
              canvas.width = 0;
              canvas.height = 0;
              canvas = null;
              ctx = null;
            }
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('이미지 소스를 분석할 수 없습니다. 손상된 파일일 수 있습니다.'));
    };

    reader.readAsDataURL(file);
  });
}
