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
 * Direct file reader (Base64) - Safe, stable and 100% quality retention
 */
export const smartCompressUploadFile = async (file) => {
  if (!file) return null;
  
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(file.name);

  if (!isPdf && !isImage) {
    throw new Error(`รูปแบบไฟล์ "${file.name}" ไม่รองรับ กรุณาแนบเฉพาะไฟล์รูปภาพ (JPG, PNG) หรือไฟล์ PDF เท่านั้น`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const size = getBase64Size(result);
      
      resolve({
        name: file.name,
        type: isPdf ? 'pdf' : 'image',
        isPdf: isPdf,
        isCompressedPdf: false,
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

