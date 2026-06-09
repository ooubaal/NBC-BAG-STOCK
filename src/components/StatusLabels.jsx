import { useState, useMemo } from 'react';
import { Tag, Printer, Eye } from 'lucide-react';

const SearchableSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(opt => 
    String(opt.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (value || '');

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type="text"
        placeholder={placeholder}
        value={isOpen ? search : displayLabel}
        onChange={(e) => {
          if (!isOpen) setIsOpen(true);
          setSearch(e.target.value);
        }}
        onClick={() => {
          setIsOpen(true);
          setSearch('');
        }}
        style={{
          width: '100%',
          fontSize: '0.82rem',
          padding: '0.5rem 0.6rem',
          background: 'var(--input-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '6px',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      {isOpen && (
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
              zIndex: 999
            }}
          />
          <div style={{
            position: 'absolute',
            top: '105%',
            left: 0,
            right: 0,
            maxHeight: '180px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)',
            zIndex: 1000
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                ไม่พบข้อมูล
              </div>
            ) : (
              filtered.map((opt) => (
                <div 
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={{
                    padding: '0.5rem 0.6rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    background: opt.value === value ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = opt.value === value ? 'rgba(14, 165, 233, 0.15)' : 'transparent';
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

const StatusLabels = ({ inventory = [] }) => {
  const [layoutMode, setLayoutMode] = useState('full'); // 'full', 'half-empty', 'half-dual'
  const [colorMode, setColorMode] = useState('full-color'); // 'full-color', 'white-bg-black-text', 'white-bg-colored-text'
  
  // Lot 1 configuration states
  const [selectedItem1, setSelectedItem1] = useState('');
  const [selectedLotId1, setSelectedLotId1] = useState('');
  const [responsible1, setResponsible1] = useState('');
  const [qcStatus1, setQcStatus1] = useState('Quarantine');
  const [customDate1, setCustomDate1] = useState('');
  const [customQty1, setCustomQty1] = useState('');

  // Lot 2 configuration states (used only when layoutMode === 'half-dual')
  const [selectedItem2, setSelectedItem2] = useState('');
  const [selectedLotId2, setSelectedLotId2] = useState('');
  const [responsible2, setResponsible2] = useState('');
  const [qcStatus2, setQcStatus2] = useState('Quarantine');
  const [customDate2, setCustomDate2] = useState('');
  const [customQty2, setCustomQty2] = useState('');

  // Extract unique item names that exist in inventory
  const itemOptions = useMemo(() => {
    const names = Array.from(new Set(inventory.map(item => item.itemName)));
    return names.map(name => ({ value: name, label: name }));
  }, [inventory]);

  // Available lots for Item 1
  const lotsForItem1 = useMemo(() => {
    if (!selectedItem1) return [];
    return inventory.filter(item => item.itemName === selectedItem1);
  }, [selectedItem1, inventory]);

  // Available lots for Item 2
  const lotsForItem2 = useMemo(() => {
    if (!selectedItem2) return [];
    return inventory.filter(item => item.itemName === selectedItem2);
  }, [selectedItem2, inventory]);

  // Fetch lot details and autopopulate fields for Lot 1
  const handleLotChange1 = (lotId) => {
    setSelectedLotId1(lotId);
    const lot = lotsForItem1.find(l => String(l.id) === String(lotId));
    if (lot) {
      setQcStatus1(lot.qcStatus || 'Quarantine');
      setCustomDate1(lot.date || '');
      setCustomQty1(lot.remainingQty !== undefined ? String(lot.remainingQty) : String(lot.quantity || ''));
    }
  };

  // Fetch lot details and autopopulate fields for Lot 2
  const handleLotChange2 = (lotId) => {
    setSelectedLotId2(lotId);
    const lot = lotsForItem2.find(l => String(l.id) === String(lotId));
    if (lot) {
      setQcStatus2(lot.qcStatus || 'Quarantine');
      setCustomDate2(lot.date || '');
      setCustomQty2(lot.remainingQty !== undefined ? String(lot.remainingQty) : String(lot.quantity || ''));
    }
  };

  // Label UI formatting helpers
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [yyyy, mm, dd] = parts;
    const thaiYear = parseInt(yyyy, 10) + 543;
    return `${dd}/${mm}/${thaiYear}`;
  };

  const getLotLabelText = (lot) => {
    if (!lot) return '';
    const parts = [];
    if (lot.supplierLot) parts.push(`Supplier: ${lot.supplierLot}`);
    if (lot.inhouseLot) parts.push(`Inhouse: ${lot.inhouseLot}`);
    return parts.join(' / ') || lot.id;
  };

  // Lot Details lookup
  const lotDetails1 = useMemo(() => {
    return lotsForItem1.find(l => String(l.id) === String(selectedLotId1)) || null;
  }, [selectedLotId1, lotsForItem1]);

  const lotDetails2 = useMemo(() => {
    return lotsForItem2.find(l => String(l.id) === String(selectedLotId2)) || null;
  }, [selectedLotId2, lotsForItem2]);

  // Construct printable HTML document
  const printLabels = () => {
    if (!selectedLotId1) {
      alert("กรุณาเลือกข้อมูลวัตถุดิบและ Lot ที่ 1 ก่อนพิมพ์");
      return;
    }

    if (layoutMode === 'half-dual' && !selectedLotId2) {
      alert("กรุณาเลือกข้อมูลวัตถุดิบและ Lot ที่ 2 สำหรับพิมพ์แบบคู่");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=850");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อเปิดหน้าพิมพ์เอกสาร");
      return;
    }

    const getFormHtml = (lotNum, itemName, lotDetails, qcStatus, customDate, customQty, responsible) => {
      const displayLotNo = lotDetails ? (lotDetails.supplierLot || lotDetails.inhouseLot || lotDetails.id) : '-';
      const displayQty = `${customQty || '0'} ${lotDetails?.unit || 'ชิ้น'}`;
      const displayResp = responsible || '';

      if (qcStatus === 'Pass') {
        const displayDate = customDate ? formatThaiDate(customDate) : '-';
        return `
          <div class="label-container pass">
            <div class="title">ผ่านการตรวจสอบ (Passed)</div>
            <div class="fields-list">
              <div class="field-item">
                <span class="field-label">ชื่อวัตถุดิบ/วัสดุ</span>
                <span class="field-colon">:</span>
                <span class="field-value">${itemName}</span>
              </div>
              <div class="field-item">
                <span class="field-label">Lot. No</span>
                <span class="field-colon">:</span>
                <span class="field-value">${displayLotNo}</span>
              </div>
              <div class="field-item">
                <span class="field-label">Released date</span>
                <span class="field-colon">:</span>
                <span class="field-value">${displayDate}</span>
              </div>
              <div class="field-item">
                <span class="field-label">จำนวน</span>
                <span class="field-colon">:</span>
                <span class="field-value">${displayQty}</span>
              </div>
              <div class="field-item">
                <span class="field-label">ผู้รับผิดชอบ</span>
                <span class="field-colon">:</span>
                <span class="field-value font-handwriting">${displayResp}</span>
              </div>
            </div>
            <div class="footer">
              <span>แบบฟอร์มเลขที่ QSP 019/009</span>
              <span>แก้ไขครั้งที่ 01/0366</span>
            </div>
          </div>
        `;
      } else if (qcStatus === 'Reject') {
        return `
          <div class="label-container reject">
            <div class="title">การตรวจสอบไม่ผ่าน (Rejected)</div>
            <div class="fields-list">
              <div class="field-item">
                <span class="field-label">ชื่อวัตถุดิบ/วัสดุ</span>
                <span class="field-colon">:</span>
                <span class="field-value">${itemName}</span>
              </div>
              <div class="field-item">
                <span class="field-label">Lot. No</span>
                <span class="field-colon">:</span>
                <span class="field-value">${displayLotNo}</span>
              </div>
              <div class="field-item">
                <span class="field-label">จำนวน</span>
                <span class="field-colon">:</span>
                <span class="field-value">${displayQty}</span>
              </div>
              <div class="field-item">
                <span class="field-label">ผู้รับผิดชอบ</span>
                <span class="field-colon">:</span>
                <span class="field-value font-handwriting">${displayResp}</span>
              </div>
            </div>
            <div class="footer">
              <span>แบบฟอร์มเลขที่ QSP 019/010</span>
              <span>แก้ไขครั้งที่ 01/0366</span>
            </div>
          </div>
        `;
      } else { // Quarantine
        const displayDate = customDate ? formatThaiDate(customDate) : '-';
        return `
          <div class="label-container quarantine">
            <div class="title">รอการตรวจสอบ(Quarantined)</div>
            <div class="fields-list">
              <div class="field-item">
                <span class="field-label">ชื่อวัตถุดิบ/วัสดุ</span>
                <span class="field-colon">:</span>
                <span class="field-value">${itemName}</span>
              </div>
              <div class="field-item">
                <span class="field-label">Lot. No</span>
                <span class="field-colon">:</span>
                <span class="field-value">${displayLotNo}</span>
              </div>
              <div class="field-item">
                <span class="field-label">วันที่รับ</span>
                <span class="field-colon">:</span>
                <span class="field-value">${displayDate}</span>
              </div>
              <div class="field-item">
                <span class="field-label">จำนวน</span>
                <span class="field-colon">:</span>
                <span class="field-value">${displayQty}</span>
              </div>
              <div class="field-item">
                <span class="field-label">ผู้รับผิดชอบ</span>
                <span class="field-colon">:</span>
                <span class="field-value font-handwriting">${displayResp}</span>
              </div>
            </div>
            <div class="footer">
              <span>แบบฟอร์มเลขที่ QSP 019/008</span>
              <span>แก้ไขครั้งที่ 01/0366</span>
            </div>
          </div>
        `;
      }
    };

    const isPortrait = layoutMode !== 'full';

    const label1Html = getFormHtml(1, selectedItem1, lotDetails1, qcStatus1, customDate1, customQty1, responsible1);
    const label2Html = layoutMode === 'half-dual'
      ? getFormHtml(2, selectedItem2, lotDetails2, qcStatus2, customDate2, customQty2, responsible2)
      : '';

    let colorStyles;
    if (colorMode === 'white-bg-black-text') {
      colorStyles = `
        .label-container.quarantine, .label-container.pass, .label-container.reject {
          border: 8px double #000000;
          background-color: #ffffff;
          color: #000000;
        }
        .label-container.quarantine .title,
        .label-container.pass .title,
        .label-container.reject .title {
          color: #000000;
        }
        .field-value {
          color: #000000;
        }
        .font-handwriting {
          color: #000000 !important;
        }
      `;
    } else if (colorMode === 'white-bg-colored-text') {
      colorStyles = `
        .label-container.quarantine {
          border: 8px double #d97706;
          background-color: #ffffff;
          color: #b45309;
        }
        .label-container.quarantine .title {
          color: #b45309;
        }
        .label-container.quarantine .field-value {
          color: #b45309;
        }
        .label-container.quarantine .font-handwriting {
          color: #b45309 !important;
        }

        .label-container.pass {
          border: 8px double #16a34a;
          background-color: #ffffff;
          color: #15803d;
        }
        .label-container.pass .title {
          color: #15803d;
        }
        .label-container.pass .field-value {
          color: #15803d;
        }
        .label-container.pass .font-handwriting {
          color: #15803d !important;
        }

        .label-container.reject {
          border: 8px double #dc2626;
          background-color: #ffffff;
          color: #b91c1c;
        }
        .label-container.reject .title {
          color: #b91c1c;
        }
        .label-container.reject .field-value {
          color: #b91c1c;
        }
        .label-container.reject .font-handwriting {
          color: #b91c1c !important;
        }
      `;
    } else { // full-color
      colorStyles = `
        .label-container.quarantine {
          border: 8px double #d97706;
          background-color: #fffbeb;
          color: #000000;
        }
        .label-container.quarantine .title {
          color: #b45309;
        }
        .label-container.quarantine .field-value {
          color: #000000;
        }

        .label-container.pass {
          border: 8px double #16a34a;
          background-color: #f0fdf4;
          color: #000000;
        }
        .label-container.pass .title {
          color: #15803d;
        }
        .label-container.pass .field-value {
          color: #000000;
        }

        .label-container.reject {
          border: 8px double #dc2626;
          background-color: #fef2f2;
          color: #000000;
        }
        .label-container.reject .title {
          color: #b91c1c;
        }
        .label-container.reject .field-value {
          color: #000000;
        }
      `;
    }

    const htmlContent = `
      <html>
        <head>
          <title>พิมพ์ป้ายสถานะวัตถุดิบ - NBC STOCK</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&family=Charm:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 ${isPortrait ? 'portrait' : 'landscape'};
              margin: 10mm;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              background-color: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Container styling for printing */
            .print-page-wrapper {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
            }
            
            ${layoutMode === 'full' ? `
              .print-page-wrapper {
                height: 190mm; /* A4 height 210mm - 20mm margin */
                justify-content: center;
                align-items: center;
              }
              .label-container {
                width: 100%;
                height: 100%;
                max-height: 190mm;
              }
            ` : ''}

            ${layoutMode === 'half-empty' ? `
              .print-page-wrapper {
                height: 277mm; /* A4 height 297mm - 20mm margin */
                justify-content: flex-start;
              }
              .label-container {
                width: 100%;
                height: 133mm;
                margin-bottom: 133mm; /* top half occupied, bottom empty */
              }
            ` : ''}

            ${layoutMode === 'half-dual' ? `
              .print-page-wrapper {
                height: 277mm;
                justify-content: space-between;
                gap: 10mm;
              }
              .label-container {
                width: 100%;
                height: 133mm;
              }
            ` : ''}

            /* Shared Label UI Layout */
            .label-container {
              border-collapse: collapse;
              box-sizing: border-box;
              position: relative;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 2.5rem 3.5rem;
              border-radius: 4px;
            }
            
            /* QC Specific Color Themes */
            ${colorStyles}

            .title {
              font-size: 38px;
              font-weight: 700;
              text-align: center;
              margin-top: 5px;
              margin-bottom: 35px;
              letter-spacing: 1px;
            }

            .fields-list {
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              flex-grow: 1;
            }

            .field-item {
              display: flex;
              font-size: 24px;
              line-height: 1.4;
              align-items: flex-end;
            }

            .field-label {
              font-weight: 600;
              width: 280px;
              flex-shrink: 0;
            }

            .field-colon {
              font-weight: 600;
              width: 30px;
              text-align: center;
              flex-shrink: 0;
            }

            .field-value {
              font-weight: 400;
              border-bottom: 2px dashed #9ca3af;
              flex-grow: 1;
              padding-bottom: 4px;
            }

            .font-handwriting {
              font-family: 'Charm', cursive;
              font-size: 28px;
              font-weight: 700;
              color: #1e3a8a; /* Navy Blue for handwriting sign */
              padding-left: 10px;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              color: #4b5563;
              margin-top: 30px;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }

            .no-print-btn {
              position: fixed;
              top: 1rem;
              right: 1rem;
              background: #ea580c;
              color: white;
              border: none;
              padding: 0.6rem 1.4rem;
              font-size: 1rem;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.15);
              z-index: 99999;
              font-family: 'Sarabun', sans-serif;
            }
            .no-print-btn:hover {
              background: #c2410c;
            }

            @media print {
              .no-print-btn {
                display: none !important;
              }
              body {
                background-color: #fff;
              }
            }
          </style>
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">พิมพ์ป้ายสถานะ / บันทึก PDF</button>
          
          <div class="print-page-wrapper">
            ${label1Html}
            ${label2Html}
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

  // Preview helper components
  const renderPreview = (itemName, lotDetails, qcStatus, customDate, customQty, responsible) => {
    const displayLotNo = lotDetails ? (lotDetails.supplierLot || lotDetails.inhouseLot || lotDetails.id) : 'LOT-XXXXX-XX';
    const displayQty = `${customQty || '0'} ${lotDetails?.unit || 'ชิ้น'}`;
    const displayDate = customDate ? formatThaiDate(customDate) : 'DD/MM/YY (พ.ศ.)';
    const displayResp = responsible || 'ชื่อผู้รับผิดชอบ';

    let title = 'รอการตรวจสอบ(Quarantined)';
    let formNo = 'QSP 019/008';
    let dateLabel = 'วันที่รับ';

    if (qcStatus === 'Pass') {
      title = 'ผ่านการตรวจสอบ (Passed)';
      formNo = 'QSP 019/009';
      dateLabel = 'Released date';
    } else if (qcStatus === 'Reject') {
      title = 'การตรวจสอบไม่ผ่าน (Rejected)';
      formNo = 'QSP 019/010';
    }

    // Determine colors based on colorMode and qcStatus
    let cardBg = '#fffbeb';
    let cardBorderColor = '#d97706';
    let titleColor = '#b45309';
    let textColor = '#000000';
    let handwritingColor = '#1e3a8a';

    if (qcStatus === 'Pass') {
      cardBg = '#f0fdf4';
      cardBorderColor = '#16a34a';
      titleColor = '#15803d';
    } else if (qcStatus === 'Reject') {
      cardBg = '#fef2f2';
      cardBorderColor = '#dc2626';
      titleColor = '#b91c1c';
    }

    if (colorMode === 'white-bg-black-text') {
      cardBg = '#ffffff';
      cardBorderColor = '#000000';
      titleColor = '#000000';
      textColor = '#000000';
      handwritingColor = '#000000';
    } else if (colorMode === 'white-bg-colored-text') {
      cardBg = '#ffffff';
      if (qcStatus === 'Pass') {
        cardBorderColor = '#16a34a';
        titleColor = '#15803d';
        textColor = '#15803d';
        handwritingColor = '#15803d';
      } else if (qcStatus === 'Reject') {
        cardBorderColor = '#dc2626';
        titleColor = '#b91c1c';
        textColor = '#b91c1c';
        handwritingColor = '#b91c1c';
      } else { // Quarantine
        cardBorderColor = '#d97706';
        titleColor = '#b45309';
        textColor = '#b45309';
        handwritingColor = '#b45309';
      }
    }

    return (
      <div className="preview-label-card" style={{
        border: '6px double',
        borderColor: cardBorderColor,
        background: cardBg,
        padding: '1.75rem 2.5rem',
        borderRadius: '8px',
        color: textColor,
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        fontFamily: "'Sarabun', sans-serif"
      }}>
        <div style={{
          fontSize: '1.45rem',
          fontWeight: 700,
          textAlign: 'center',
          color: titleColor,
          marginBottom: '1.5rem'
        }}>
          {title}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flexGrow: 1 }}>
          <div style={{ display: 'flex', fontSize: '0.98rem' }}>
            <span style={{ fontWeight: 600, width: '150px', color: textColor }}>ชื่อวัตถุดิบ/วัสดุ</span>
            <span style={{ width: '20px', textAlign: 'center', color: textColor }}>:</span>
            <span style={{ borderBottom: '1px dashed #9ca3af', flexGrow: 1, fontWeight: 500, color: textColor }}>{itemName || 'ชื่อวัตถุดิบ/วัสดุ'}</span>
          </div>

          <div style={{ display: 'flex', fontSize: '0.98rem' }}>
            <span style={{ fontWeight: 600, width: '150px', color: textColor }}>Lot. No</span>
            <span style={{ width: '20px', textAlign: 'center', color: textColor }}>:</span>
            <span style={{ borderBottom: '1px dashed #9ca3af', flexGrow: 1, color: textColor }}>{displayLotNo}</span>
          </div>

          {qcStatus !== 'Reject' && (
            <div style={{ display: 'flex', fontSize: '0.98rem' }}>
              <span style={{ fontWeight: 600, width: '150px', color: textColor }}>{dateLabel}</span>
              <span style={{ width: '20px', textAlign: 'center', color: textColor }}>:</span>
              <span style={{ borderBottom: '1px dashed #9ca3af', flexGrow: 1, color: textColor }}>{displayDate}</span>
            </div>
          )}

          <div style={{ display: 'flex', fontSize: '0.98rem' }}>
            <span style={{ fontWeight: 600, width: '150px', color: textColor }}>จำนวน</span>
            <span style={{ width: '20px', textAlign: 'center', color: textColor }}>:</span>
            <span style={{ borderBottom: '1px dashed #9ca3af', flexGrow: 1, fontWeight: 600, color: textColor }}>{displayQty}</span>
          </div>

          <div style={{ display: 'flex', fontSize: '0.98rem' }}>
            <span style={{ fontWeight: 600, width: '150px', color: textColor }}>ผู้รับผิดชอบ</span>
            <span style={{ width: '20px', textAlign: 'center', color: textColor }}>:</span>
            <span style={{ 
              borderBottom: '1px dashed #9ca3af', 
              flexGrow: 1, 
              fontFamily: "'Charm', cursive", 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              color: handwritingColor,
              lineHeight: 1,
              paddingLeft: '10px'
            }}>
              {displayResp}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#4b5563',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '8px',
          marginTop: '1.5rem'
        }}>
          <span>แบบฟอร์มเลขที่ {formNo}</span>
          <span>แก้ไขครั้งที่ 01/0366</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">พิมพ์ป้ายสถานะวัตถุดิบ (Material Status Labels)</h1>
          <p className="page-subtitle">ออกป้ายแสดงสถานะ Passed, Quarantined, หรือ Rejected และเลือกจัดวางตำแหน่งบนหน้า A4</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Setup Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Print Layout configuration */}
          <div className="glass card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
              <Printer size={18} color="var(--accent-color)" />
              1. เลือกรูปแบบจัดหน้า A4 & โทนสีป้าย
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                background: layoutMode === 'full' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                border: layoutMode === 'full' ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.15s'
              }}>
                <input 
                  type="radio" 
                  name="layoutMode" 
                  value="full" 
                  checked={layoutMode === 'full'} 
                  onChange={() => setLayoutMode('full')}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>รูปแบบที่ 1: เต็ม A4 แนวนอน (1 ป้าย / หน้า)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ขยายป้ายขนาดใหญ่สุดเต็มกระดาษ A4 ในแนวนอน</span>
                </div>
              </label>

              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                background: layoutMode === 'half-empty' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                border: layoutMode === 'half-empty' ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.15s'
              }}>
                <input 
                  type="radio" 
                  name="layoutMode" 
                  value="half-empty" 
                  checked={layoutMode === 'half-empty'} 
                  onChange={() => setLayoutMode('half-empty')}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>รูปแบบที่ 2: ครึ่งบน A4 (ครึ่งล่างว่าง)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ป้ายขนาดพอดีสำหรับ A4 แนวตั้งพิมพ์ครึ่งบน เว้นครึ่งล่างว่างไว้</span>
                </div>
              </label>

              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                background: layoutMode === 'half-dual' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                border: layoutMode === 'half-dual' ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.15s'
              }}>
                <input 
                  type="radio" 
                  name="layoutMode" 
                  value="half-dual" 
                  checked={layoutMode === 'half-dual'} 
                  onChange={() => setLayoutMode('half-dual')}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>รูปแบบที่ 3: ครึ่งบน A4 Lot หนึ่ง + ครึ่งล่างอีก Lot หนึ่ง (2 ป้าย / หน้า)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>พิมพ์สองป้ายในแผ่นเดียว โดยสแกนกระดาษ Lot แรกที่ครึ่งบน และ Lot ที่สองที่ครึ่งล่าง</span>
                </div>
              </label>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />
            
            <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
              <Tag size={18} color="var(--accent-color)" />
              เลือกโทนสีการพิมพ์ป้าย
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                background: colorMode === 'full-color' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                border: colorMode === 'full-color' ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.15s'
              }}>
                <input 
                  type="radio" 
                  name="colorMode" 
                  value="full-color" 
                  checked={colorMode === 'full-color'} 
                  onChange={() => setColorMode('full-color')}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>สีเต็มตามสถานะ (พื้นหลังมีสี เขียว / เหลือง / แดง)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>พิมพ์พื้นหลังมีสีตามสถานะ เพื่อให้สังเกตเห็นและจำแนกได้ชัดเจนที่สุด</span>
                </div>
              </label>

              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                background: colorMode === 'white-bg-black-text' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                border: colorMode === 'white-bg-black-text' ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.15s'
              }}>
                <input 
                  type="radio" 
                  name="colorMode" 
                  value="white-bg-black-text" 
                  checked={colorMode === 'white-bg-black-text'} 
                  onChange={() => setColorMode('white-bg-black-text')}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>ประหยัดหมึก (พื้นหลังขาว กรอบดำ อักษรดำ)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ไม่มีสีพื้นหลัง ใช้ลายเส้นและตัวหนังสือสีดำล้วนทั้งหมด</span>
                </div>
              </label>

              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                background: colorMode === 'white-bg-colored-text' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)',
                border: colorMode === 'white-bg-colored-text' ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.15s'
              }}>
                <input 
                  type="radio" 
                  name="colorMode" 
                  value="white-bg-colored-text" 
                  checked={colorMode === 'white-bg-colored-text'} 
                  onChange={() => setColorMode('white-bg-colored-text')}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>พื้นหลังขาว กรอบและอักษรมีสีตามสถานะ</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ไม่มีสีพื้นหลัง ใช้กรอบและตัวหนังสือเป็นสี เขียว / เหลือง / แดง ตามสถานะ</span>
                </div>
              </label>
            </div>
          </div>

          {/* Lot 1 Setup Details */}
          <div className="glass card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
              <Tag size={18} color="var(--accent-secondary, #0ea5e9)" />
              {layoutMode === 'half-dual' ? '2. รายละเอียดป้ายที่ 1 (ครึ่งบน A4)' : '2. รายละเอียดป้ายสถานะ'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Product selector */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เลือกวัตถุดิบ/วัสดุ</label>
                <SearchableSelect 
                  value={selectedItem1} 
                  onChange={(val) => {
                    setSelectedItem1(val);
                    setSelectedLotId1('');
                    setCustomDate1('');
                    setCustomQty1('');
                  }}
                  options={itemOptions}
                  placeholder="ค้นหาชื่อวัตถุดิบ..."
                />
              </div>

              {/* Lot selector */}
              {selectedItem1 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เลือก Lot ที่ต้องการ</label>
                  <SearchableSelect 
                    value={selectedLotId1}
                    onChange={(val) => handleLotChange1(val)}
                    options={lotsForItem1.map(l => ({
                      value: String(l.id),
                      label: `${getLotLabelText(l)} (${l.qcStatus})`
                    }))}
                    placeholder="ค้นหา Lot..."
                  />
                </div>
              )}

              {/* Sub-inputs if lot selected */}
              {selectedLotId1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>สถานะ QC ป้าย (ดึงอัตโนมัติ)</label>
                    <select 
                      style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                      value={qcStatus1}
                      onChange={(e) => setQcStatus1(e.target.value)}
                    >
                      <option value="Quarantine">Quarantine (รอตรวจ)</option>
                      <option value="Pass">Pass (ผ่าน)</option>
                      <option value="Reject">Reject (ไม่ผ่าน)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ผู้รับผิดชอบ</label>
                    <input 
                      type="text" 
                      placeholder="พิมพ์ชื่อ..."
                      style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                      value={responsible1}
                      onChange={(e) => setResponsible1(e.target.value)}
                    />
                  </div>

                  {qcStatus1 !== 'Reject' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {qcStatus1 === 'Pass' ? 'Released Date' : 'วันที่รับ'}
                      </label>
                      <input 
                        type="date" 
                        style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                        value={customDate1}
                        onChange={(e) => setCustomDate1(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>จำนวน</label>
                    <input 
                      type="number" 
                      style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                      value={customQty1}
                      onChange={(e) => setCustomQty1(e.target.value)}
                    />
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Lot 2 Setup Details (Only visible in half-dual mode) */}
          {layoutMode === 'half-dual' && (
            <div className="glass card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-color)' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
                <Tag size={18} color="var(--accent-color)" />
                3. รายละเอียดป้ายที่ 2 (ครึ่งล่าง A4)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Product selector */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เลือกวัตถุดิบ/วัสดุ (ป้ายที่ 2)</label>
                  <SearchableSelect 
                    value={selectedItem2} 
                    onChange={(val) => {
                      setSelectedItem2(val);
                      setSelectedLotId2('');
                      setCustomDate2('');
                      setCustomQty2('');
                    }}
                    options={itemOptions}
                    placeholder="ค้นหาชื่อวัตถุดิบ..."
                  />
                </div>

                {/* Lot selector */}
                {selectedItem2 && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>เลือก Lot ที่ต้องการ (ป้ายที่ 2)</label>
                    <SearchableSelect 
                      value={selectedLotId2}
                      onChange={(val) => handleLotChange2(val)}
                      options={lotsForItem2.map(l => ({
                        value: String(l.id),
                        label: `${getLotLabelText(l)} (${l.qcStatus})`
                      }))}
                      placeholder="ค้นหา Lot ป้ายที่ 2..."
                    />
                  </div>
                )}

                {/* Sub-inputs if lot selected */}
                {selectedLotId2 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>สถานะ QC ป้าย (ดึงอัตโนมัติ)</label>
                      <select 
                        style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                        value={qcStatus2}
                        onChange={(e) => setQcStatus2(e.target.value)}
                      >
                        <option value="Quarantine">Quarantine (รอตรวจ)</option>
                        <option value="Pass">Pass (ผ่าน)</option>
                        <option value="Reject">Reject (ไม่ผ่าน)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ผู้รับผิดชอบ</label>
                      <input 
                        type="text" 
                        placeholder="พิมพ์ชื่อ..."
                        style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                        value={responsible2}
                        onChange={(e) => setResponsible2(e.target.value)}
                      />
                    </div>

                    {qcStatus2 !== 'Reject' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {qcStatus2 === 'Pass' ? 'Released Date' : 'วันที่รับ'}
                        </label>
                        <input 
                          type="date" 
                          style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                          value={customDate2}
                          onChange={(e) => setCustomDate2(e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>จำนวน</label>
                      <input 
                        type="number" 
                        style={{ width: '100%', fontSize: '0.82rem', padding: '0.4rem 0.5rem' }}
                        value={customQty2}
                        onChange={(e) => setCustomQty2(e.target.value)}
                      />
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

          {/* Action trigger button */}
          <button 
            className="btn btn-primary"
            onClick={printLabels}
            disabled={!selectedLotId1 || (layoutMode === 'half-dual' && !selectedLotId2)}
            style={{ 
              padding: '0.75rem 2rem', 
              fontSize: '0.92rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              width: '100%',
              marginTop: '0.5rem'
            }}
          >
            <Printer size={18} /> ออกเอกสาร / พิมพ์ป้ายสถานะ
          </button>

        </div>

        {/* Right Side: Live Visual Preview */}
        <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Eye size={16} /> ตัวอย่างป้ายก่อนพิมพ์ (Live Previews)
          </div>
          
          {/* Lot 1 Preview */}
          {selectedLotId1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {layoutMode === 'half-dual' && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ป้ายที่ 1 (ครึ่งบน A4)</span>}
              {renderPreview(selectedItem1, lotDetails1, qcStatus1, customDate1, customQty1, responsible1)}
            </div>
          ) : (
            <div style={{ 
              border: '2px dashed var(--glass-border)', 
              borderRadius: '8px', 
              padding: '3rem 2rem', 
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.82rem'
            }}>
              เลือกวัตถุดิบและ Lot ด้านซ้ายเพื่อแสดงตัวอย่างป้ายสถานะ
            </div>
          )}

          {/* Lot 2 Preview */}
          {layoutMode === 'half-dual' && (
            selectedLotId2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ป้ายที่ 2 (ครึ่งล่าง A4)</span>
                {renderPreview(selectedItem2, lotDetails2, qcStatus2, customDate2, customQty2, responsible2)}
              </div>
            ) : (
              <div style={{ 
                border: '2px dashed var(--glass-border)', 
                borderRadius: '8px', 
                padding: '3rem 2rem', 
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                marginTop: '1rem'
              }}>
                เลือกข้อมูลป้ายที่ 2 ด้านซ้ายเพื่อแสดงตัวอย่างป้ายที่ 2
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default StatusLabels;
