import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite with fallback
try {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
}

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
 * Fast and memory-safe conversion from Uint8Array to Base64
 */
export const uint8ArrayToBase64 = (bytes) => {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
};

/**
 * Fast conversion from Data URL to Uint8Array
 */
export const dataUrlToUint8Array = (dataUrl) => {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Generates a standard-compliant, compressed PDF binary from an array of JPEG images
 * Direct JPEG embedding via /DCTDecode ensures zero quality loss from re-encoding
 */
export const createPdfFromJpegs = (pages) => {
  const chunks = [];
  const offsets = [];
  const encoder = new TextEncoder();
  let currentOffset = 0;

  const writeString = (str) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const writeBytes = (bytes) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  writeString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  const pageCount = pages.length;
  const totalObjs = 2 + pageCount * 3;

  // Obj 1: Catalog
  offsets[1] = currentOffset;
  writeString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets[2] = currentOffset;
  const kids = [];
  for (let i = 0; i < pageCount; i++) {
    kids.push(`${3 + i * 3} 0 R`);
  }
  writeString(`2 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pageCount} >>\nendobj\n`);

  for (let i = 0; i < pageCount; i++) {
    const pageObjNum = 3 + i * 3;
    const imgObjNum = pageObjNum + 1;
    const contentObjNum = pageObjNum + 2;
    const p = pages[i];

    // Standard PDF points (72 DPI): A4 standard width is ~595.28 pt
    const ptWidth = 595.28;
    const ptHeight = (595.28 / (p.width || 1)) * (p.height || 1);

    // Page object
    offsets[pageObjNum] = currentOffset;
    writeString(`${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth.toFixed(2)} ${ptHeight.toFixed(2)}] /Resources << /XObject << /Im${i + 1} ${imgObjNum} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentObjNum} 0 R >>\nendobj\n`);

    // Image object with raw JPEG stream
    offsets[imgObjNum] = currentOffset;
    writeString(`${imgObjNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`);
    writeBytes(p.bytes);
    writeString('\nendstream\nendobj\n');

    // Content stream placing and scaling the image
    offsets[contentObjNum] = currentOffset;
    const contentStr = `q ${ptWidth.toFixed(2)} 0 0 ${ptHeight.toFixed(2)} 0 0 cm /Im${i + 1} Do Q\n`;
    writeString(`${contentObjNum} 0 obj\n<< /Length ${contentStr.length} >>\nstream\n${contentStr}endstream\nendobj\n`);
  }

  // Cross-reference table
  const xrefOffset = currentOffset;
  writeString(`xref\n0 ${totalObjs + 1}\n`);
  writeString('0000000000 65535 f \n');
  for (let i = 1; i <= totalObjs; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    writeString(`${off} 00000 n \n`);
  }

  writeString(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  // Concatenate all chunks into a single Uint8Array
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.length;
  }
  return result;
};

/**
 * Compresses an image file (JPG, PNG, WEBP, etc.) with high clarity text retention
 */
export const compressImageFile = async (file, maxWidth = 1400, maxHeight = 1400, quality = 0.72) => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Clean white background for transparency handling
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let size = getBase64Size(dataUrl);

      // If still large (>400 KB), perform a secondary gentle compression pass
      if (size > 400 * 1024) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.58);
        size = getBase64Size(dataUrl);
      }

      URL.revokeObjectURL(objectUrl);
      resolve({ dataUrl, width, height, size });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
};

/**
 * Smart PDF Compressor (similar to PDF24)
 * Renders pages via PDF.js with adaptive high-resolution scaling and compresses them into a lightweight PDF
 */
export const compressPdfFile = async (file, onProgress) => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  // Adaptive scale & quality based on total page count to prevent Firestore 1MB quota overflow
  let targetScale = 1.6;
  let targetQuality = 0.68;
  if (numPages > 12) {
    targetScale = 1.15;
    targetQuality = 0.50;
  } else if (numPages > 6) {
    targetScale = 1.30;
    targetQuality = 0.58;
  } else if (numPages > 3) {
    targetScale = 1.45;
    targetQuality = 0.64;
  }

  const pageDataUrls = [];
  const compressedJpegList = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress({ current: pageNum, total: numPages, name: file.name });
    }

    const page = await pdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    // Clamp maximum dimension so large technical drawings / high-res scans don't consume excess memory
    let actualScale = targetScale;
    const maxDim = Math.max(unscaledViewport.width, unscaledViewport.height);
    if (maxDim * actualScale > 1400) {
      actualScale = 1400 / maxDim;
    } else if (maxDim * actualScale < 800) {
      actualScale = Math.min(800 / maxDim, 2.0);
    }

    const viewport = page.getViewport({ scale: actualScale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');

    // Clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    const pageDataUrl = canvas.toDataURL('image/jpeg', targetQuality);
    pageDataUrls.push(pageDataUrl);

    const pageBytes = dataUrlToUint8Array(pageDataUrl);
    compressedJpegList.push({
      bytes: pageBytes,
      width: canvas.width,
      height: canvas.height
    });
  }

  // Construct standard compressed PDF from processed pages
  const compressedPdfBytes = createPdfFromJpegs(compressedJpegList);
  const compressedPdfBase64 = uint8ArrayToBase64(compressedPdfBytes);
  const compressedPdfDataUrl = `data:application/pdf;base64,${compressedPdfBase64}`;

  return {
    pageDataUrls,
    compressedPdfDataUrl,
    compressedPdfBytes,
    numPages
  };
};

/**
 * Universal smart upload file handler for both PDF documents and images
 * Provides real-time compression, size calculation, savings percentage, and multi-page preview
 */
export const smartCompressUploadFile = async (file, onProgress) => {
  if (!file) return null;

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(file.name);

  if (!isPdf && !isImage) {
    throw new Error(`รูปแบบไฟล์ "${file.name}" ไม่รองรับ กรุณาแนบเฉพาะไฟล์รูปภาพ (JPG, PNG) หรือไฟล์ PDF เท่านั้น`);
  }

  // Handle PDF Compression
  if (isPdf) {
    try {
      const {
        pageDataUrls,
        compressedPdfDataUrl,
        compressedPdfBytes,
        numPages
      } = await compressPdfFile(file, onProgress);

      const compressedSize = compressedPdfBytes.length;
      const originalSize = file.size;
      const isSmaller = compressedSize < originalSize;
      const savingsPercent = isSmaller ? Math.round(((originalSize - compressedSize) / originalSize) * 100) : 0;

      // In the rare case the original was already smaller (e.g. tiny 10KB vector PDF),
      // we can read the original data URL for storage while retaining page previews
      let finalData = compressedPdfDataUrl;
      let finalSize = compressedSize;

      if (!isSmaller && originalSize > 0) {
        finalData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(compressedPdfDataUrl);
          reader.readAsDataURL(file);
        });
        finalSize = originalSize;
      }

      return {
        name: file.name,
        type: 'pdf',
        isPdf: true,
        isCompressedPdf: true,
        totalPages: numPages,
        pages: pageDataUrls,
        thumbnail: pageDataUrls[0],
        data: finalData,
        originalSize: originalSize,
        compressedSize: finalSize,
        savingsPercent: savingsPercent,
        originalSizeFormatted: formatFileSize(originalSize),
        compressedSizeFormatted: formatFileSize(finalSize)
      };
    } catch (pdfErr) {
      console.warn("PDF smart compression encountered an issue, falling back to direct reader:", pdfErr);
      // Graceful fallback for password-protected or unsupported PDFs
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
            totalPages: 1,
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
    }
  }

  // Handle Image Compression
  try {
    const compressedImage = await compressImageFile(file);
    const originalSize = file.size;
    const compressedSize = compressedImage.size;
    const isSmaller = compressedSize < originalSize;
    const savingsPercent = isSmaller ? Math.round(((originalSize - compressedSize) / originalSize) * 100) : 0;

    return {
      name: file.name,
      type: 'image',
      isPdf: false,
      isCompressedPdf: false,
      totalPages: 1,
      pages: [compressedImage.dataUrl],
      thumbnail: compressedImage.dataUrl,
      data: compressedImage.dataUrl,
      originalSize: originalSize,
      compressedSize: compressedSize,
      savingsPercent: savingsPercent,
      originalSizeFormatted: formatFileSize(originalSize),
      compressedSizeFormatted: formatFileSize(compressedSize)
    };
  } catch (imgErr) {
    console.warn("Image smart compression failed, falling back to direct reader:", imgErr);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const size = getBase64Size(result);
        resolve({
          name: file.name,
          type: 'image',
          isPdf: false,
          isCompressedPdf: false,
          totalPages: 1,
          pages: [result],
          thumbnail: result,
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
  }
};
