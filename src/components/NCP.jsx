import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Plus, Download, Edit2, Trash2, X, Search, Printer, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileCheck, RefreshCw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure pdfjs worker for Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
}

const SearchableSelect = ({ value, onChange, options = [], placeholder, disabled, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, showAbove: false });
  const containerRef = useRef(null);

  const filtered = useMemo(() => {
    return options.filter(opt => 
      String(opt.label || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (value || '');

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < 220 && rect.top > 220;
      setCoords({
        top: showAbove ? rect.top : (rect.bottom + 4),
        left: rect.left,
        width: rect.width,
        showAbove
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    setSearch('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input 
          type="text"
          placeholder={placeholder}
          value={isOpen ? search : displayLabel}
          title={displayLabel}
          onChange={(e) => {
            if (!isOpen) handleOpen();
            setSearch(e.target.value);
            updatePosition();
          }}
          onClick={handleOpen}
          disabled={disabled}
          style={{
            width: '100%',
            fontSize: '0.85rem',
            padding: '0.6rem 2rem 0.6rem 0.75rem',
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            boxSizing: 'border-box',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            ...style
          }}
        />
        <div style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            onClick={() => {
              setIsOpen(false);
              setSearch('');
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99998,
              background: 'transparent'
            }}
          />
          <div 
            style={{
              position: 'fixed',
              top: coords.showAbove ? 'auto' : `${coords.top}px`,
              bottom: coords.showAbove ? `${window.innerHeight - coords.top + 4}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: '230px',
              overflowY: 'auto',
              background: '#ffffff',
              border: '1.5px solid var(--accent-secondary, #0284c7)',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 99999,
              padding: '0.25rem 0',
              boxSizing: 'border-box'
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '0.75rem', color: 'var(--text-muted, #64748b)', fontSize: '0.82rem', textAlign: 'center' }}>
                ไม่พบข้อมูลที่ตรงกับคำค้นหา
              </div>
            ) : (
              filtered.map((opt) => (
                <div 
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '0.6rem 0.85rem',
                    fontSize: '0.82rem',
                    color: opt.value === value ? 'var(--accent-secondary, #0284c7)' : 'var(--text-primary, #0f172a)',
                    background: opt.value === value ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                    textAlign: 'left',
                    fontWeight: opt.value === value ? '700' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = opt.value === value ? 'rgba(2, 132, 199, 0.18)' : '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = opt.value === value ? 'rgba(2, 132, 199, 0.12)' : 'transparent';
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                  {opt.value === value && <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary, #0284c7)', fontWeight: 'bold', marginLeft: '0.5rem' }}>✓</span>}
                </div>
              ))
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

const compressImageFile = (file, maxWidth = 1200, maxHeight = 1200) => {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      reject(new Error("File is not an image"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // HD resolution but compressed: max 1200px (still crystal-clear text/details)
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // Draw white background for transparent images
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to JPEG with 0.68 quality (sharp text, light file size)
      let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.68);
      
      // Secondary pass if still large (> 500 KB)
      if (compressedDataUrl.length * 0.75 > 500 * 1024) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.55);
      }
      
      URL.revokeObjectURL(objectUrl);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};

// Process both Images and PDF files with automatic HD rendering and compression
const processUploadFile = async (file) => {
  if (!file) return null;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      const pages = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        // Scale 1.6 renders at crisp HD resolution for crystal clear text readability
        const viewport = page.getViewport({ scale: 1.6 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        // Draw clean white background for transparency
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        // Compress page to high-readability lightweight JPEG (0.65 quality saves 90%+ storage)
        const compressedPageData = canvas.toDataURL('image/jpeg', 0.65);
        pages.push(compressedPageData);
      }

      return {
        isPdf: true,
        fileName: file.name,
        fileSize: file.size,
        totalPages: numPages,
        pages: pages,
        thumbnail: pages[0],
        uploadedAt: new Date().toISOString()
      };
    } catch (err) {
      console.error("PDF processing error:", err);
      // Fallback: Read as data URL if pdfjs encounters an issue
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            isPdf: true,
            fileName: file.name,
            fileSize: file.size,
            totalPages: 1,
            pages: [e.target.result],
            thumbnail: e.target.result,
            isRawPdf: true,
            uploadedAt: new Date().toISOString()
          });
        };
        reader.readAsDataURL(file);
      });
    }
  } else {
    // Normal Image File
    const compressed = await compressImageFile(file);
    return compressed;
  }
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle = {
  background: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid var(--glass-border)',
  borderRadius: '16px',
  padding: '2rem',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
  position: 'relative',
  color: 'var(--text-primary)'
};

const formatThaiDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  const thaiYear = parseInt(yyyy, 10) + 543;
  return `${dd}/${mm}/${thaiYear}`;
};

const NCP = ({ inventory, items, claims, setClaims }) => {
  const [ncpTab, setNcpTab] = useState('active'); // 'all', 'active', 'completed'
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Modals and Confirmations
  const [editingClaim, setEditingClaim] = useState(null);
  const [confirmDeleteClaimId, setConfirmDeleteClaimId] = useState(null);
  const [activeLightbox, setActiveLightbox] = useState(null); // { item, label, activePage: 0, zoom: 1 }

  const initialNewClaim = {
    itemName: (items && items.length > 0) ? items[0].name : '',
    unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
    quantity: '',
    lotNo: '',
    description: '',
    status: 'Found', // Found, Claiming, Returned
    followUpDate: new Date().toISOString().split('T')[0],
    images: {
      found: [],
      claim: [],
      returned: []
    }
  };

  const [newClaim, setNewClaim] = useState(initialNewClaim);

  const availableLots = useMemo(() => {
    return inventory.filter(i => i.itemName === newClaim.itemName);
  }, [inventory, newClaim.itemName]);

  const filteredClaims = useMemo(() => {
    let base = claims;
    if (ncpTab === 'active') {
      base = claims.filter(c => c.status !== 'Returned');
    } else if (ncpTab === 'completed') {
      base = claims.filter(c => c.status === 'Returned');
    }
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      base = base.filter(c => 
        (c.itemName && c.itemName.toLowerCase().includes(q)) || 
        (c.lotNo && c.lotNo.toLowerCase().includes(q)) || 
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return base;
  }, [claims, ncpTab, searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem('wms_claims', JSON.stringify(claims));
    } catch (e) {
      console.error("Storage quota exceeded:", e);
      alert("ไม่สามารถบันทึกข้อมูลได้ เนื่องจากพื้นที่หน่วยความจำเบราว์เซอร์เต็ม");
    }
  }, [claims]);

  const handleImageUpload = (step, file) => {
    if (!file) return;
    processUploadFile(file).then(processed => {
      if (!processed) return;
      setNewClaim(prev => {
        const currentImages = Array.isArray(prev.images?.[step]) 
          ? prev.images[step] 
          : (prev.images?.[step] ? [prev.images[step]] : []);
        return {
          ...prev,
          images: {
            ...prev.images,
            [step]: [...currentImages, processed]
          }
        };
      });
    }).catch(err => {
      console.error("Error processing upload file:", err);
      alert("เกิดข้อผิดพลาดในการอัปโหลดและบีบอัดไฟล์");
    });
  };

  const handleRemoveNewClaimImage = (step, index) => {
    setNewClaim(prev => {
      const currentImages = Array.isArray(prev.images?.[step]) 
        ? prev.images[step] 
        : (prev.images?.[step] ? [prev.images[step]] : []);
      return {
        ...prev,
        images: {
          ...prev.images,
          [step]: currentImages.filter((_, i) => i !== index)
        }
      };
    });
  };

  const saveClaim = () => {
    if (!newClaim.itemName || !newClaim.lotNo || !newClaim.quantity) {
      alert("กรุณากรอกชื่อสินค้า, Lot no. และจำนวนที่พบปัญหา");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const claimToAdd = {
      ...newClaim,
      id: Date.now(),
      foundDate: today,
      claimingDate: '',
      returnedDate: ''
    };

    setClaims([...claims, claimToAdd]);
    setIsAdding(false);
    setNewClaim({
      itemName: (items && items.length > 0) ? items[0].name : '',
      unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
      quantity: '',
      lotNo: '',
      description: '',
      status: 'Found',
      followUpDate: new Date().toISOString().split('T')[0],
      images: { found: [], claim: [], returned: [] }
    });
  };

  const updateStatus = (id, status) => {
    const today = new Date().toISOString().split('T')[0];
    setClaims(claims.map(c => {
      if (c.id === id) {
        return { 
          ...c, 
          status,
          claimingDate: status === 'Claiming' ? today : c.claimingDate,
          returnedDate: status === 'Returned' ? today : c.returnedDate
        };
      }
      return c;
    }));
  };

  const deleteClaim = (id) => {
    setClaims(claims.filter(c => c.id !== id));
    setConfirmDeleteClaimId(null);
  };

  const saveEditClaim = () => {
    if (!editingClaim.itemName || !editingClaim.lotNo || !editingClaim.quantity) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    setClaims(claims.map(c => c.id === editingClaim.id ? editingClaim : c));
    setEditingClaim(null);
  };

  const handleUpdateImage = (id, step, file) => {
    if (!file) return;
    processUploadFile(file).then(processed => {
      if (!processed) return;
      setClaims(claims.map(c => {
        if (c.id === id) {
          const currentImages = Array.isArray(c.images?.[step]) 
            ? c.images[step] 
            : (c.images?.[step] ? [c.images[step]] : []);
          return {
            ...c,
            images: { ...c.images, [step]: [...currentImages, processed] }
          };
        }
        return c;
      }));
    }).catch(err => {
      console.error("Error processing update file:", err);
      alert("เกิดข้อผิดพลาดในการอัปโหลดและบีบอัดไฟล์");
    });
  };

  const handleRemoveImage = (id, step, index) => {
    setClaims(claims.map(c => {
      if (c.id === id) {
        const currentImages = Array.isArray(c.images?.[step]) 
          ? c.images[step] 
          : (c.images?.[step] ? [c.images[step]] : []);
        return {
          ...c,
          images: { ...c.images, [step]: currentImages.filter((_, i) => i !== index) }
        };
      }
      return c;
    }));
  };

  const printClaimCasePDF = (claim) => {
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const printWindow = window.open("", "_blank", "width=950,height=850");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อเปิดหน้าพิมพ์เอกสาร");
      return;
    }

    const escapeHTML = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const statusLabels = {
      'Claiming': 'กำลังเคลม (Claiming)',
      'Returned': 'คืนสินค้าแล้ว (Returned)',
      'Closed': 'ปิดเคสแล้ว (Closed)'
    };

    const renderPrintImages = (label, imageList) => {
      const images = Array.isArray(imageList) ? imageList : (imageList ? [imageList] : []);
      if (images.length === 0) return '';
      
      const cards = images.map((item, idx) => {
        if (item && typeof item === 'object' && item.isPdf) {
          return (item.pages || [item.thumbnail]).map((pageImg, pIdx) => `
            <div class="photo-card" style="position: relative;">
              <div style="position: absolute; top: 4px; left: 4px; background: rgba(220, 38, 38, 0.9); color: #fff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 3px; z-index: 10;">
                PDF: ${escapeHTML(item.fileName || 'เอกสาร')} (น. ${pIdx + 1}/${item.totalPages})
              </div>
              <img src="${pageImg}" alt="${label} PDF p.${pIdx + 1}" />
            </div>
          `).join('');
        } else {
          const src = typeof item === 'string' ? item : (item?.thumbnail || '');
          return `
            <div class="photo-card">
              <img src="${src}" alt="${label} #${idx + 1}" />
            </div>
          `;
        }
      }).join('');

      return `
        <div class="photo-section-block">
          <h3>${label}</h3>
          <div class="photo-grid">
            ${cards}
          </div>
        </div>
      `;
    };

    const htmlContent = `
      <html>
        <head>
          <title>รายงานเคสเคลมสินค้า NCP - ${escapeHTML(claim.itemName)}</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              padding: 20px;
              color: #1f2937;
              background-color: #fff;
              font-size: 13px;
              line-height: 1.6;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 2px solid #b91c1c;
              padding-bottom: 12px;
              margin-bottom: 25px;
            }
            .title {
              font-size: 20px;
              font-weight: 700;
              color: #b91c1c;
            }
            .meta-info {
              text-align: right;
              font-size: 11px;
            }
            .no-print-btn {
              position: fixed;
              top: 1rem;
              right: 1rem;
              background: #b91c1c;
              color: white;
              border: none;
              padding: 0.6rem 1.2rem;
              font-size: 0.9rem;
              font-weight: bold;
              border-radius: 4px;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              z-index: 1000;
            }
            @media print {
              .no-print-btn {
                display: none !important;
              }
              body {
                padding: 0;
                margin: 0;
              }
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 25px;
              background-color: #fef2f2;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #fee2e2;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-size: 11px;
              color: #7f1d1d;
              font-weight: 600;
              text-transform: uppercase;
            }
            .info-value {
              font-size: 13px;
              font-weight: 700;
              color: #1f2937;
            }
            .description-block {
              margin-bottom: 30px;
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }
            .description-block h3 {
              margin-top: 0;
              color: #111827;
              font-size: 13px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .photo-section-block {
              margin-bottom: 25px;
            }
            .photo-section-block h3 {
              font-size: 13px;
              border-left: 3px solid #b91c1c;
              padding-left: 8px;
              margin-bottom: 12px;
              color: #111827;
            }
            .photo-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
            }
            .photo-card {
              width: 220px;
              height: 220px;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              overflow: hidden;
              background-color: #f3f4f6;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .photo-card img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .signatures {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              gap: 50px;
              page-break-inside: avoid;
            }
            .sig-block {
              flex: 1;
              text-align: center;
              border-top: 1px solid #9ca3af;
              padding-top: 12px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">พิมพ์เอกสาร / บันทึก PDF</button>

          <div class="header">
            <div>
              <div class="title">รายงานสรุปเคสเคลมสินค้า NCP (NCP Claim Report)</div>
              <div style="font-size: 11px; color: #555; margin-top: 5px;">ระบบบริหารจัดการคลังสินค้า NBC STOCK</div>
            </div>
            <div class="meta-info">
              <div><strong>วันที่ออกรายงาน:</strong> ${today}</div>
              <div><strong>เคสเลขที่ (ID):</strong> ${claim.id}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ชื่อสินค้า (Item Name)</span>
              <span class="info-value">${escapeHTML(claim.itemName)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">สถานะเคส (Status)</span>
              <span class="info-value" style="color: #b91c1c;">${statusLabels[claim.status] || claim.status}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Lot ในคลังพัสดุ (Lot No.)</span>
              <span class="info-value">${escapeHTML(claim.lotNo) || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">จำนวนที่พบปัญหา (Claim Quantity)</span>
              <span class="info-value">${claim.quantity ? `${Number(claim.quantity).toLocaleString()} ${claim.unit || 'ชิ้น'}` : '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">วันที่พบปัญหาสินค้า (Found Date)</span>
              <span class="info-value">${claim.foundDate ? formatThaiDate(claim.foundDate) : '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">วันติดตามงานเคลม (Follow-up Date)</span>
              <span class="info-value" style="color: #ea580c;">${claim.followUpDate ? formatThaiDate(claim.followUpDate) : '-'}</span>
            </div>
          </div>

          <div class="description-block">
            <h3>รายละเอียดความผิดปกติ / เหตุผลการเคลม</h3>
            <div style="white-space: pre-wrap; font-size: 13px;">${escapeHTML(claim.description || '-')}</div>
          </div>

          ${renderPrintImages('1. ภาพพัสดุที่พบปัญหา (Found)', claim.images?.found)}
          ${renderPrintImages('2. ภาพขั้นตอนการเคลม (Claiming)', claim.images?.claim)}
          ${renderPrintImages('3. ภาพการส่งคืนและรับของใหม่ (Returned)', claim.images?.returned)}

          <div class="signatures">
            <div class="sig-block">
              <br><br>
              <strong>ผู้รายงานปัญหา / เจ้าหน้าที่คลังสินค้า</strong>
              <div style="margin-top: 5px; font-size: 11px; color: #6b7280;">วันที่: ...... / ...... / ......</div>
            </div>
            <div class="sig-block">
              <br><br>
              <strong>ผู้ตรวจสอบการรับคืน / หัวหน้าคลังสินค้า</strong>
              <div style="margin-top: 5px; font-size: 11px; color: #6b7280;">วันที่: ...... / ...... / ......</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const printSinglePdfDocument = (pdfItem) => {
    if (!pdfItem) return;
    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อเปิดหน้าพิมพ์เอกสาร");
      return;
    }
    const pages = pdfItem.pages || [pdfItem.thumbnail];
    const htmlContent = `
      <html>
        <head>
          <title>${pdfItem.fileName || 'เอกสารแนบ PDF'}</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body { margin: 0; padding: 10px; background: #fff; text-align: center; }
            .page-container { page-break-after: always; margin-bottom: 20px; }
            .page-container:last-child { page-break-after: avoid; }
            img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
            .no-print { position: fixed; top: 10px; right: 10px; z-index: 100; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background: #b91c1c; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">พิมพ์เอกสาร</button>
          ${pages.map((p, idx) => `
            <div class="page-container">
              <img src="${p}" alt="Page ${idx + 1}" />
            </div>
          `).join('')}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">NCP Product การเคลมและรับคืน (Mod 4)</h1>
          <p className="page-subtitle">จัดการสินค้าไม่เป็นไปตามข้อกำหนดและติดตามการเคลม (รองรับรูปภาพและไฟล์ PDF บีบอัด HD)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> แจ้งเคสใหม่
        </button>
      </div>

      {isAdding && (
        <div className="glass card" style={{ marginBottom: '2rem', border: '2px solid var(--accent-color)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>รายละเอียด NCP ใหม่</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>ชื่อสินค้า</label>
              <SearchableSelect
                value={newClaim.itemName}
                placeholder="-- ค้นหาและเลือกสินค้า --"
                onChange={(val) => {
                  const selected = items.find(i => i.name === val);
                  setNewClaim({
                    ...newClaim,
                    itemName: val,
                    unit: selected ? selected.unit : 'ชิ้น',
                    lotNo: '',
                    quantity: ''
                  });
                }}
                options={items.map(item => ({ value: item.name, label: item.name }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Lot no. ในคลังพัสดุ</label>
              <SearchableSelect
                value={newClaim.lotNo}
                placeholder={availableLots.length === 0 ? "-- ไม่มี Lot ในคลังพัสดุ --" : "-- เลือก Lot จากคลังพัสดุ --"}
                disabled={availableLots.length === 0}
                onChange={(val) => setNewClaim({...newClaim, lotNo: val})}
                options={availableLots.map(lot => ({
                  value: lot.supplierLot,
                  label: `Supplier Lot: ${lot.supplierLot} ${lot.inhouseLot ? `(QC: ${lot.inhouseLot})` : ''} - คงเหลือ ${lot.remainingQty} ${lot.unit || 'ชิ้น'} (${lot.location})`
                }))}
              />
              {availableLots.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.4rem', display: 'block' }}>
                  * พัสดุชนิดนี้ยังไม่มี Lot หรือสินค้าคงเหลือในคลังพัสดุ
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>จำนวนที่พบปัญหา</label>
              <input type="number" value={newClaim.quantity} onChange={e => setNewClaim({...newClaim, quantity: e.target.value})} placeholder="ระบุจำนวน" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>หน่วยพัสดุ</label>
              <input type="text" value={newClaim.unit} disabled style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>รายละเอียดปัญหา</label>
            <textarea value={newClaim.description} onChange={e => setNewClaim({...newClaim, description: e.target.value})} placeholder="เช่น สินค้าชำรุด, สีผิดเพี้ยน..." rows="3"></textarea>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>วันติดตามงาน (Tentative Follow-up Date)</label>
            <input 
              type="date" 
              value={newClaim.followUpDate} 
              onChange={e => setNewClaim({...newClaim, followUpDate: e.target.value})} 
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <ImageUploader 
              label="📷 / 📄 รูปภาพหรือเอกสาร PDF ที่พบ (แนบได้หลายไฟล์ ระบบบีบอัด HD อัตโนมัติ)" 
              images={newClaim.images.found} 
              onUpload={(file) => handleImageUpload('found', file)} 
              onRemove={(idx) => handleRemoveNewClaimImage('found', idx)}
              onPreview={(item, idx) => setActiveLightbox({ item: item, label: `เอกสาร/ภาพที่พบ (รายการที่ ${idx + 1})`, activePage: 0, zoom: 1 })}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setIsAdding(false)}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={saveClaim}>สร้างเคส NCP</button>
          </div>
        </div>
      )}

      {/* แถบตัวกรองประวัติการเคลม NCP และช่องค้นหา */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div className="ncp-tabs glass" style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          padding: '0.5rem', 
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--glass-border)',
          width: 'fit-content'
        }}>
          <button 
            className="btn" 
            style={{ 
              background: ncpTab === 'active' ? 'var(--accent-color)' : 'transparent', 
              color: ncpTab === 'active' ? '#000' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 700
            }}
            onClick={() => setNcpTab('active')}
          >
            กำลังดำเนินการ ({claims.filter(c => c.status !== 'Returned').length})
          </button>
          <button 
            className="btn" 
            style={{ 
              background: ncpTab === 'completed' ? 'var(--success)' : 'transparent', 
              color: ncpTab === 'completed' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 700
            }}
            onClick={() => setNcpTab('completed')}
          >
            ประวัติเคสที่เสร็จสิ้น ({claims.filter(c => c.status === 'Returned').length})
          </button>
          <button 
            className="btn" 
            style={{ 
              background: ncpTab === 'all' ? 'var(--surface-lighter)' : 'transparent', 
              color: ncpTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 700
            }}
            onClick={() => setNcpTab('all')}
          >
            เคสทั้งหมด ({claims.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem', minWidth: '280px' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อสินค้า, Lot หรือรายละเอียด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              width: '100%',
              fontSize: '0.85rem'
            }}
          />
        </div>
      </div>

      <div className="claims-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {claims.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>ยังไม่มีประวัติการเคลมสินค้า</div>
        ) : filteredClaims.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            {searchQuery.trim() !== '' ? 'ไม่พบรายการเคลมที่ตรงกับคำค้นหา' : 'ไม่มีรายการเคลมสินค้าในหมวดหมู่นี้'}
          </div>
        ) : (
          filteredClaims.map(claim => (
            <div key={claim.id} className="glass card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{claim.itemName}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lot: {claim.lotNo}</div>
                  {claim.quantity && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600, marginTop: '0.25rem' }}>
                      จำนวนเคลม: {Number(claim.quantity).toLocaleString()} {claim.unit || 'ชิ้น'}
                    </div>
                  )}
                  {claim.followUpDate && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      วันติดตามงาน: <strong style={{ color: 'var(--accent-color)' }}>{formatThaiDate(claim.followUpDate)}</strong>
                    </div>
                  )}
                </div>

                {/* Confirm Delete / Pen & Trash */}
                {confirmDeleteClaimId === claim.id ? (
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>ยืนยันลบ?</span>
                    <button 
                      style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '2px', fontSize: '0.7rem', padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                      onClick={() => deleteClaim(claim.id)}
                    >
                      ลบ
                    </button>
                    <button 
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: 'none', borderRadius: '2px', fontSize: '0.7rem', padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                      onClick={() => setConfirmDeleteClaimId(null)}
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <StatusBadge status={claim.status} />
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '0.2rem', transition: 'var(--transition)' }}
                      onClick={() => printClaimCasePDF(claim)}
                      title="พิมพ์เคส NCP (PDF)"
                    >
                      <Printer size={15} />
                    </button>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', transition: 'var(--transition)' }}
                      onClick={() => setEditingClaim(claim)}
                      title="แก้ไขข้อมูลเคส"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem', transition: 'var(--transition)' }}
                      onClick={() => setConfirmDeleteClaimId(claim.id)}
                      title="ลบเคส"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              
              <p style={{ fontSize: '0.9rem' }}>{claim.description}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div>
                  <ImageThumb 
                    label="1. ที่พบ" 
                    images={claim.images?.found} 
                    uniqueId={`thumb-found-${claim.id}`} 
                    onUpdate={(file) => handleUpdateImage(claim.id, 'found', file)} 
                    onRemove={(idx) => handleRemoveImage(claim.id, 'found', idx)}
                    onClick={(item, idx) => setActiveLightbox({ item: item, label: `1. ภาพ/เอกสารพัสดุที่พบปัญหา (รายการที่ ${idx + 1})`, activePage: 0, zoom: 1 })}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                    {claim.foundDate || '-'}
                  </div>
                </div>
                
                <div>
                  <ImageThumb 
                    label="2. การเคลม" 
                    images={claim.images?.claim} 
                    uniqueId={`thumb-claim-${claim.id}`} 
                    onUpdate={(file) => handleUpdateImage(claim.id, 'claim', file)} 
                    onRemove={(idx) => handleRemoveImage(claim.id, 'claim', idx)}
                    onClick={(item, idx) => setActiveLightbox({ item: item, label: `2. ภาพ/เอกสารขณะดำเนินการเคลม (รายการที่ ${idx + 1})`, activePage: 0, zoom: 1 })}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                    {claim.claimingDate || '-'}
                  </div>
                </div>

                <div>
                  <ImageThumb 
                    label="3. การคืน" 
                    images={claim.images?.returned} 
                    uniqueId={`thumb-returned-${claim.id}`} 
                    onUpdate={(file) => handleUpdateImage(claim.id, 'returned', file)} 
                    onRemove={(idx) => handleRemoveImage(claim.id, 'returned', idx)}
                    onClick={(item, idx) => setActiveLightbox({ item: item, label: `3. ภาพ/เอกสารขารับคืนเรียบร้อย (รายการที่ ${idx + 1})`, activePage: 0, zoom: 1 })}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                    {claim.returnedDate || '-'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
                {claim.status === 'Found' && <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => updateStatus(claim.id, 'Claiming')}>เริ่มดำเนินการเคลม</button>}
                {claim.status === 'Claiming' && <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem', background: 'var(--success)', color: '#fff' }} onClick={() => updateStatus(claim.id, 'Returned')}>รับสินค้าคืนเรียบร้อย</button>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Interactive Lightbox / PDF Viewer Modal */}
      {activeLightbox && (() => {
        const isPdf = activeLightbox.item && typeof activeLightbox.item === 'object' && activeLightbox.item.isPdf;
        const pages = isPdf ? (activeLightbox.item.pages || [activeLightbox.item.thumbnail]) : [typeof activeLightbox.item === 'string' ? activeLightbox.item : activeLightbox.item?.thumbnail];
        const currentPageIndex = activeLightbox.activePage || 0;
        const currentImageSrc = pages[currentPageIndex] || pages[0];
        const totalPages = isPdf ? (activeLightbox.item.totalPages || pages.length) : 1;
        const zoom = activeLightbox.zoom || 1;

        return (
          <div style={modalOverlayStyle} onClick={() => setActiveLightbox(null)}>
            <div 
              style={{ 
                ...modalContentStyle, 
                maxWidth: '850px', 
                width: '95%',
                textAlign: 'center',
                padding: '1.5rem',
                border: isPdf ? '1.5px solid rgba(220, 38, 38, 0.5)' : '1px solid var(--glass-border)'
              }} 
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, color: isPdf ? '#ef4444' : 'var(--accent-color)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isPdf ? <FileText size={20} /> : <Camera size={20} />} {activeLightbox.label}
                  </h3>
                  {isPdf && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      📄 <strong>{activeLightbox.item.fileName || 'เอกสารแนบ PDF'}</strong> • หน้า {currentPageIndex + 1} จาก {totalPages} (ความละเอียดระดับ HD)
                    </div>
                  )}
                </div>
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.25rem' }}
                  onClick={() => setActiveLightbox(null)}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Viewport Image */}
              <div style={{ 
                width: '100%', 
                height: '58vh', 
                overflow: 'auto', 
                borderRadius: '8px', 
                border: '1px solid var(--glass-border)', 
                marginBottom: '1rem',
                background: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                boxSizing: 'border-box'
              }}>
                <img 
                  src={currentImageSrc} 
                  alt="full view" 
                  style={{ 
                    maxWidth: zoom === 1 ? '100%' : 'none', 
                    maxHeight: zoom === 1 ? '100%' : 'none', 
                    width: zoom > 1 ? `${zoom * 100}%` : 'auto',
                    objectFit: 'contain', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    transition: 'width 0.2s ease, transform 0.2s ease',
                    transformOrigin: 'center center'
                  }} 
                />
              </div>

              {/* Filmstrip / Page Thumbnails for PDF */}
              {isPdf && totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', overflowX: 'auto', padding: '0.5rem 0', marginBottom: '0.75rem' }}>
                  {pages.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setActiveLightbox({ ...activeLightbox, activePage: pIdx })}
                      style={{
                        width: '45px',
                        height: '55px',
                        borderRadius: '4px',
                        border: pIdx === currentPageIndex ? '2px solid #ef4444' : '1px solid var(--glass-border)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#000',
                        opacity: pIdx === currentPageIndex ? 1 : 0.6,
                        position: 'relative'
                      }}
                      title={`ไปที่หน้า ${pIdx + 1}`}
                    >
                      <img src={p} alt={`p${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.55rem', textAlign: 'center' }}>
                        {pIdx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Controls Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                {/* Page Navigation for Multi-page PDF */}
                {isPdf && totalPages > 1 ? (
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      disabled={currentPageIndex === 0}
                      onClick={() => setActiveLightbox({ ...activeLightbox, activePage: Math.max(0, currentPageIndex - 1) })}
                    >
                      <ChevronLeft size={14} /> หน้าก่อน
                    </button>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '70px', textAlign: 'center' }}>
                      {currentPageIndex + 1} / {totalPages}
                    </span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      disabled={currentPageIndex >= totalPages - 1}
                      onClick={() => setActiveLightbox({ ...activeLightbox, activePage: Math.min(totalPages - 1, currentPageIndex + 1) })}
                    >
                      หน้าถัดไป <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div />
                )}

                {/* Zoom Controls */}
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => setActiveLightbox({ ...activeLightbox, zoom: Math.max(0.75, zoom - 0.25) })}
                    title="ซูมออก"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '40px' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => setActiveLightbox({ ...activeLightbox, zoom: Math.min(2.5, zoom + 0.25) })}
                    title="ซูมเข้า"
                  >
                    <ZoomIn size={14} />
                  </button>
                  {zoom !== 1 && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem' }}
                      onClick={() => setActiveLightbox({ ...activeLightbox, zoom: 1 })}
                    >
                      100%
                    </button>
                  )}
                </div>

                {/* Actions: Download / Print / Close */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isPdf && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', background: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', border: '1px solid rgba(220, 38, 38, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => printSinglePdfDocument(activeLightbox.item)}
                      title="พิมพ์เอกสาร PDF ทั้งหมด"
                    >
                      <Printer size={14} /> พิมพ์เอกสาร
                    </button>
                  )}
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = currentImageSrc;
                      link.download = isPdf 
                        ? `${activeLightbox.item.fileName || 'document'}-page-${currentPageIndex + 1}.jpg`
                        : `Evidence-${activeLightbox.label}.jpg`;
                      link.click();
                    }}
                  >
                    <Download size={14} /> {isPdf ? 'ดาวน์โหลดหน้านี้' : 'ดาวน์โหลดภาพ'}
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }} onClick={() => setActiveLightbox(null)}>
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Case Modal */}
      {editingClaim && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <Edit2 size={20} color="var(--accent-color)" /> แก้ไขข้อมูลเคส NCP
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>ชื่อสินค้า</label>
                <SearchableSelect
                  value={editingClaim.itemName}
                  placeholder="-- ค้นหาและเลือกสินค้า --"
                  onChange={(val) => {
                    const selected = items.find(i => i.name === val);
                    setEditingClaim({
                      ...editingClaim,
                      itemName: val,
                      unit: selected ? selected.unit : 'ชิ้น',
                      lotNo: '' 
                    });
                  }}
                  options={items.map(item => ({ value: item.name, label: item.name }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Lot no. ในคลังพัสดุ</label>
                {(() => {
                  const availableEditLots = inventory.filter(i => i.itemName === editingClaim.itemName);
                  return (
                    <SearchableSelect
                      value={editingClaim.lotNo}
                      placeholder={availableEditLots.length === 0 ? "-- ไม่มี Lot ในคลังพัสดุ --" : "-- เลือก Lot --"}
                      disabled={availableEditLots.length === 0}
                      onChange={(val) => setEditingClaim({...editingClaim, lotNo: val})}
                      options={availableEditLots.map(lot => ({
                        value: lot.supplierLot,
                        label: `Supplier: ${lot.supplierLot} ${lot.inhouseLot ? `(QC: ${lot.inhouseLot})` : ''} - คงเหลือ ${lot.remainingQty} ${lot.unit || 'ชิ้น'} (${lot.location})`
                      }))}
                    />
                  );
                })()}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>จำนวนที่พบปัญหา</label>
                <input 
                  type="number" 
                  value={editingClaim.quantity} 
                  onChange={e => setEditingClaim({...editingClaim, quantity: e.target.value})} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>หน่วยพัสดุ</label>
                <input type="text" value={editingClaim.unit} disabled style={{ background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>รายละเอียดปัญหา</label>
              <textarea 
                value={editingClaim.description} 
                onChange={e => setEditingClaim({...editingClaim, description: e.target.value})} 
                rows="3"
              ></textarea>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>วันติดตามงาน (Tentative Follow-up Date)</label>
              <input 
                type="date" 
                value={editingClaim.followUpDate || ''} 
                onChange={e => setEditingClaim({...editingClaim, followUpDate: e.target.value})} 
              />
            </div>

            <h4 style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              ลงบันทึกวันที่ในแต่ละขั้น
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>1. วันที่พบ</label>
                <input 
                  type="date" 
                  value={editingClaim.foundDate || ''} 
                  onChange={e => setEditingClaim({...editingClaim, foundDate: e.target.value})} 
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>2. วันที่เคลม</label>
                <input 
                  type="date" 
                  value={editingClaim.claimingDate || ''} 
                  onChange={e => setEditingClaim({...editingClaim, claimingDate: e.target.value})} 
                  disabled={editingClaim.status === 'Found'}
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>3. วันที่คืน</label>
                <input 
                  type="date" 
                  value={editingClaim.returnedDate || ''} 
                  onChange={e => setEditingClaim({...editingClaim, returnedDate: e.target.value})} 
                  disabled={editingClaim.status !== 'Returned'}
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.2rem' }}>
              <button className="btn btn-secondary" onClick={() => setEditingClaim(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={saveEditClaim}>บันทึกการแก้ไข</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    'Found': { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
    'Claiming': { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
    'Returned': { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' }
  };
  const color = colors[status] || colors.Found;
  return (
    <span style={{ 
      padding: '0.2rem 0.6rem', 
      borderRadius: '4px', 
      fontSize: '0.75rem', 
      fontWeight: 700, 
      backgroundColor: color.bg, 
      color: color.text 
    }}>{status}</span>
  );
};

const ImageUploader = ({ label, images, onUpload, onRemove, onPreview }) => {
  const imageList = Array.isArray(images) ? images : (images ? [images] : []);
  return (
    <div style={{ border: '1px dashed var(--glass-border)', borderRadius: '8px', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.5rem', alignItems: 'center' }}>
        {imageList.map((item, idx) => {
          const isPdf = item && typeof item === 'object' && item.isPdf;
          const thumbSrc = isPdf ? item.thumbnail : item;
          const pageCount = isPdf ? item.totalPages : 1;

          return (
            <div 
              key={idx} 
              style={{ 
                position: 'relative', 
                width: '72px', 
                height: '72px', 
                borderRadius: '6px', 
                overflow: 'hidden', 
                border: isPdf ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)',
                background: isPdf ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer'
              }}
              onClick={() => onPreview && onPreview(item, idx)}
            >
              {thumbSrc ? (
                <img src={thumbSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={28} color="#ef4444" />
                </div>
              )}
              {isPdf && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(180deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.8) 100%)',
                  color: '#fff',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  padding: '2px',
                  textAlign: 'center'
                }}>
                  PDF ({pageCount} หน้า)
                </div>
              )}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(idx);
                }}
                style={{ 
                  position: 'absolute', 
                  top: isPdf ? '18px' : '2px', 
                  right: '2px', 
                  background: 'rgba(239, 68, 68, 0.9)', 
                  color: '#fff', 
                  border: 'none', 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  fontSize: '0.65rem'
                }}
                title="ลบ"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
        <div style={{ 
          width: '72px', 
          height: '72px', 
          border: '1.5px dashed var(--glass-border)', 
          borderRadius: '6px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer', 
          background: 'rgba(255,255,255,0.02)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <Camera size={16} color="var(--text-muted)" />
            <FileText size={16} color="var(--accent-color)" />
          </div>
          <input 
            type="file" 
            accept="image/*,application/pdf,.pdf" 
            multiple 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              opacity: 0, 
              cursor: 'pointer' 
            }} 
            onChange={e => {
              if (e.target.files) {
                Array.from(e.target.files).forEach(file => onUpload(file));
              }
            }} 
          />
          <span style={{ fontSize: '0.62rem', color: 'var(--accent-color)', marginTop: '3px', fontWeight: 600 }}>แนบรูป/PDF</span>
        </div>
      </div>
    </div>
  );
};

const ImageThumb = ({ label, images, onUpdate, onRemove, onClick }) => {
  const imageList = Array.isArray(images) ? images : (images ? [images] : []);
  
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.5rem', border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.75rem', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', minHeight: '50px', alignItems: 'center' }}>
        {imageList.map((item, idx) => {
          const isPdf = item && typeof item === 'object' && item.isPdf;
          const thumbSrc = isPdf ? item.thumbnail : item;
          const pageCount = isPdf ? item.totalPages : 1;

          return (
            <div 
              key={idx}
              style={{ 
                width: '48px', 
                height: '48px', 
                background: isPdf ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.05)', 
                borderRadius: '5px', 
                position: 'relative', 
                overflow: 'hidden', 
                border: isPdf ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isPdf ? '0 2px 4px rgba(239, 68, 68, 0.15)' : 'none'
              }}
              onClick={() => onClick && onClick(item, idx)}
              title={isPdf ? `📄 PDF: ${item.fileName || 'เอกสาร'} (${pageCount} หน้า)` : `ภาพที่ ${idx + 1}`}
            >
              {thumbSrc ? (
                <img src={thumbSrc} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#ef4444" />
                </div>
              )}
              
              {isPdf && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(180deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.8) 100%)',
                  color: '#fff',
                  fontSize: '0.52rem',
                  fontWeight: 800,
                  padding: '1px 2px',
                  textAlign: 'center',
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px'
                }}>
                  PDF {pageCount > 1 ? `(${pageCount}p)` : ''}
                </div>
              )}
              
              <button 
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(isPdf ? `คุณต้องการลบไฟล์ PDF นี้ (${item.fileName || 'เอกสาร'}) ใช่หรือไม่?` : 'คุณต้องการลบรูปภาพนี้ใช่หรือไม่?')) {
                    onRemove(idx);
                  }
                }}
                style={{ 
                  position: 'absolute', 
                  bottom: '1px', 
                  right: '1px', 
                  background: 'rgba(239, 68, 68, 0.95)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '3px', 
                  width: '14px', 
                  height: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  fontSize: '0.55rem',
                  zIndex: 10
                }}
                title="ลบ"
              >
                <X size={8} />
              </button>
            </div>
          );
        })}
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '1.5px dashed var(--glass-border)', 
          borderRadius: '5px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
          position: 'relative'
        }}
        title="แนบรูปภาพ หรือ ไฟล์ PDF (บีบอัดอัตโนมัติ)"
        >
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <Camera size={13} color="var(--text-muted)" />
            <FileText size={13} color="var(--accent-color)" />
          </div>
          <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', marginTop: '2px' }}>รูป/PDF</span>
          <input 
            type="file" 
            accept="image/*,application/pdf,.pdf" 
            multiple 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer'
            }} 
            onChange={e => {
              if (e.target.files) {
                Array.from(e.target.files).forEach(file => onUpdate(file));
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default NCP;
