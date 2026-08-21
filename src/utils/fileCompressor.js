

/**
 * Format bytes to readable string (e.g. 1.2 MB, 350 KB)
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Calculate approximate byte size of a base64 string
 */
export const getBase64Size = (base64Str) => {
  if (!base64Str) return 0;
  const base64Length = base64Str.length - (base64Str.indexOf(',') + 1);
  return Math.round(base64Length * 0.75);
};

/**
 * Intelligently compress image with adaptive multi-pass resizing and quality control
 */
export const compressImageFile = (file, { maxDimension = 1400, targetQuality = 0.72 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      // Pass 1: Scale to maxDimension preserving aspect ratio
      let width = naturalWidth;
      let height = naturalHeight;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Fill white background for transparent PNGs
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let quality = targetQuality;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let approxSize = getBase64Size(dataUrl);

      // Pass 2: If still > 500KB, reduce quality and dimensions
      if (approxSize > 500 * 1024) {
        const pass2Max = 1100;
        let p2Width = naturalWidth;
        let p2Height = naturalHeight;
        if (p2Width > p2Height) {
          if (p2Width > pass2Max) {
            p2Height = Math.round((p2Height * pass2Max) / p2Width);
            p2Width = pass2Max;
          }
        } else {
          if (p2Height > pass2Max) {
            p2Width = Math.round((p2Width * pass2Max) / p2Height);
            p2Height = pass2Max;
          }
        }
        canvas.width = p2Width;
        canvas.height = p2Height;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, p2Width, p2Height);
        ctx.drawImage(img, 0, 0, p2Width, p2Height);
        quality = 0.62;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        approxSize = getBase64Size(dataUrl);
      }

      // Pass 3: If still > 400KB (e.g. extremely complex pattern), do final optimize
      if (approxSize > 450 * 1024) {
        quality = 0.55;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        approxSize = getBase64Size(dataUrl);
      }

      const originalSize = file.size || approxSize;
      const savings = Math.max(0, Math.round((1 - (approxSize / originalSize)) * 100));

      resolve({
        name: file.name,
        type: 'image',
        data: dataUrl,
        originalSize: originalSize,
        compressedSize: approxSize,
        savingsPercent: savings,
        originalSizeFormatted: formatFileSize(originalSize),
        compressedSizeFormatted: formatFileSize(approxSize),
        dimensions: { width: canvas.width, height: canvas.height }
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
};

/**
 * Intelligently compress PDF document by rasterizing pages into HD compressed pages
 */
export const compressPdfFile = async (file) => {
  if (!file) throw new Error("No PDF file provided");
  
  // Directly read PDF as a raw Data URL (Base64)
  // This preserves vector text, searchability, signatures, and prevents blank pages
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const size = getBase64Size(result);
      
      resolve({
        name: file.name,
        type: 'pdf',
        isPdf: true,
        isCompressedPdf: false,
        // We set pages to undefined so the viewer uses native PDF reader via iframe
        pages: undefined,
        data: result,
        originalSize: file.size,
        compressedSize: size,
        savingsPercent: 0,
        originalSizeFormatted: formatFileSize(file.size),
        compressedSizeFormatted: formatFileSize(size)
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Universal smart upload file compressor
 * Automatically detects format (PDF or Image) and applies optimal compression
 */
export const smartCompressUploadFile = async (file) => {
  if (!file) return null;
  
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(file.name);

  if (isPdf) {
    return await compressPdfFile(file);
  } else if (isImage) {
    return await compressImageFile(file);
  } else {
    throw new Error(`รูปแบบไฟล์ "${file.name}" ไม่รองรับ กรุณาแนบเฉพาะไฟล์รูปภาพ (JPG, PNG) หรือไฟล์ PDF เท่านั้น`);
  }
};
