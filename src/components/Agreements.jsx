import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, X, FileText, ShieldAlert, PackageOpen, ChevronDown, ChevronUp, UserCheck, AlertTriangle, Search, Edit2, Trash2, Paperclip, Eye, Loader2, Sparkles, Image as ImageIcon, Calendar, Clock, Split, RefreshCw, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react';
import { smartCompressUploadFile, formatFileSize } from '../utils/fileCompressor';

const escapeHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

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

const Agreements = ({ agreements, setAgreements, inventory, setInventory, items }) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'
  const [expandedAgreementId, setExpandedAgreementId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);

  // File upload & smart compression status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Editing state
  const [editingAgreementId, setEditingAgreementId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isEditFormDropdownOpen, setIsEditFormDropdownOpen] = useState(false);
  const [editFormSearchQuery, setEditFormSearchQuery] = useState('');

  // Deleting state
  const [deleteAgreementId, setDeleteAgreementId] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Auto Split Helper Modal State
  const [autoSplitConfig, setAutoSplitConfig] = useState(null); // { isEdit: boolean, roundsCount: 3, intervalType: 'monthly', selectedItemIndex: 0 }

  const activeDeliveriesCount = useMemo(() => {
    if (!deleteAgreementId) return 0;
    return inventory.filter(lot => lot.agreementId === deleteAgreementId && !lot.isCancelled).length;
  }, [deleteAgreementId, inventory]);

  const handleDeleteCardAttachment = (agreementId, fileIndex, fileName) => {
    if (window.confirm(`คุณต้องการลบเอกสารแนบ "${fileName}" จากสัญญานี้ใช่หรือไม่?`)) {
      const updated = agreements.map(ag => {
        if (ag.id === agreementId) {
          const cleanAttachments = (ag.attachments || []).filter((_, idx) => idx !== fileIndex);
          // Update both the base object and the processed schedule properties
          return {
            ...ag,
            attachments: cleanAttachments
          };
        }
        return ag;
      });
      setAgreements(updated);
    }
  };

  const handleStartEdit = (agreement) => {
    setEditingAgreementId(agreement.id);
    setEditForm({
      ...agreement,
      itemsList: agreement.itemsList || [
        { itemName: agreement.itemName, totalQty: agreement.totalQty, unit: agreement.unit }
      ],
      tentativeSchedule: (agreement.tentativeSchedule || []).map(s => ({ ...s })),
      attachments: agreement.attachments || []
    });
    setEditFormSearchQuery('');
    setIsEditFormDropdownOpen(false);
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editForm.supplier) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ผู้จัดจำหน่าย)");
      return;
    }

    if (!editForm.itemsList || editForm.itemsList.length === 0) {
      alert("กรุณาเพิ่มรายการพัสดุในสัญญาอย่างน้อย 1 รายการ");
      return;
    }

    const hasInvalidItem = editForm.itemsList.some(item => !item.itemName || !item.totalQty || Number(item.totalQty) <= 0);
    if (hasInvalidItem) {
      alert("กรุณาระบุสินค้าและจำนวนจัดซื้อในสัญญาให้ถูกต้อง (ต้องมีค่ามากกว่า 0)");
      return;
    }

    // Clean and validate tentative schedule rows
    const cleanedTentative = (editForm.tentativeSchedule || [])
      .filter(s => s && (s.quantity !== '' && s.quantity !== undefined && Number(s.quantity) > 0))
      .map((s, idx) => ({
        id: s.id || `tentative-${Date.now()}-${idx}`,
        round: Number(s.round) || (idx + 1),
        date: s.date || editForm.startDate || new Date().toISOString().split('T')[0],
        itemName: s.itemName || (editForm.itemsList[0] ? editForm.itemsList[0].itemName : ''),
        quantity: Number(s.quantity),
        unit: s.unit || (editForm.itemsList.find(i => i.itemName === s.itemName) ? editForm.itemsList.find(i => i.itemName === s.itemName).unit : 'ชิ้น'),
        remarks: s.remarks || ''
      }));

    const updatedAgreements = agreements.map(ag => {
      if (ag.id === editingAgreementId) {
        const primaryItem = editForm.itemsList[0] || { itemName: '', totalQty: 0, unit: 'ชิ้น' };
        return {
          ...ag,
          supplier: editForm.supplier,
          itemsList: editForm.itemsList.map(item => ({
            ...item,
            totalQty: Number(item.totalQty)
          })),
          tentativeSchedule: cleanedTentative,
          // Fallback properties for compatibility with other parts of the application:
          itemName: primaryItem.itemName,
          totalQty: Number(primaryItem.totalQty),
          unit: primaryItem.unit,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          remarks: editForm.remarks,
          attachments: editForm.attachments || []
        };
      }
      return ag;
    });

    setAgreements(updatedAgreements);
    setEditingAgreementId(null);
    setEditForm(null);
    alert("แก้ไขข้อมูลสัญญาจัดซื้อเรียบร้อยแล้ว!");
  };

  // Smart file attachment upload with automatic real-time compression (PDF & Images)
  const handleFileChange = async (e, isEdit = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus(`กำลังลดขนาดไฟล์ (0/${files.length})...`);

    const newAttachments = [];
    let count = 0;

    for (const file of files) {
      try {
        count++;
        setUploadStatus(`กำลังบีบอัดลดขนาด "${file.name}" (${count}/${files.length})...`);
        const compressed = await smartCompressUploadFile(file);
        if (compressed) {
          newAttachments.push(compressed);
        }
      } catch (err) {
        console.error("File compression error:", err);
        alert(err.message || `เกิดข้อผิดพลาดในการประมวลผลไฟล์ "${file.name}"`);
      }
    }

    if (newAttachments.length > 0) {
      if (isEdit) {
        setEditForm(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...newAttachments]
        }));
      } else {
        setNewAgreement(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...newAttachments]
        }));
      }
    }

    setIsUploading(false);
    setUploadStatus('');
    if (e.target) e.target.value = '';
  };

  // High-clarity multi-page attachment viewer with zoom and print
  const openAttachmentViewer = (file) => {
    const newWindow = window.open();
    if (!newWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อดูเอกสารแนบ");
      return;
    }

    if (file.pages && file.pages.length > 0) {
      const pagesHtml = file.pages.map((pageSrc, pIdx) => `
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="font-size: 13px; color: #94a3b8; margin-bottom: 8px; font-weight: 500;">— หน้า ${pIdx + 1} จาก ${file.pages.length} —</div>
          <img src="${pageSrc}" alt="Page ${pIdx + 1}" style="max-width: 95%; max-height: 90vh; box-shadow: 0 15px 35px rgba(0,0,0,0.5); border-radius: 8px; background: #fff;" />
        </div>
      `).join('');

      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${escapeHTML(file.name)}</title>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 24px; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; }
              .toolbar { position: sticky; top: 12px; background: rgba(30, 41, 59, 0.95); backdrop-filter: blur(10px); padding: 10px 24px; border-radius: 30px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); display: flex; gap: 16px; align-items: center; z-index: 100; margin-bottom: 24px; color: #f8fafc; }
              button { background: #0284c7; color: white; border: none; padding: 7px 16px; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; transition: background 0.2s; }
              button:hover { background: #0369a1; }
              @media print {
                .toolbar { display: none; }
                body { background: white; padding: 0; }
                img { max-width: 100% !important; max-height: none !important; box-shadow: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="toolbar">
              <span style="font-weight: 600; font-size: 14px;">📄 ${escapeHTML(file.name)}</span>
              <span style="font-size: 12px; color: #94a3b8; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 12px;">${file.pages.length} หน้า</span>
              <button onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
            </div>
            ${pagesHtml}
          </body>
        </html>
      `);
      newWindow.document.close();
    } else if (file.type === 'pdf') {
      newWindow.document.write(`<iframe src="${file.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; position:fixed;" allowfullscreen></iframe>`);
      newWindow.document.title = file.name;
      newWindow.document.close();
    } else {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${escapeHTML(file.name)}</title>
            <style>
              body { margin: 0; background: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 95%; max-height: 95vh; object-fit: contain; box-shadow: 0 15px 35px rgba(0,0,0,0.6); border-radius: 8px; }
            </style>
          </head>
          <body>
            <img src="${file.data}" alt="${escapeHTML(file.name)}" />
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const removeAttachment = (index, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter((_, i) => i !== index)
      }));
    } else {
      setNewAgreement(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter((_, i) => i !== index)
      }));
    }
  };

  // Helper handlers for dynamic multi-item lists in newAgreement
  const handleAddNewAgreementItemRow = () => {
    setNewAgreement(prev => ({
      ...prev,
      itemsList: [
        ...(prev.itemsList || []),
        { itemName: (items && items.length > 0) ? items[0].name : '', totalQty: '', unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น' }
      ]
    }));
  };

  const handleUpdateNewAgreementItemRow = (index, key, val) => {
    setNewAgreement(prev => {
      const list = [...(prev.itemsList || [])];
      if (key === 'itemName') {
        const prod = items.find(i => i.name === val);
        list[index] = {
          ...list[index],
          itemName: val,
          unit: prod ? prod.unit : 'ชิ้น'
        };
      } else {
        list[index] = {
          ...list[index],
          [key]: val
        };
      }
      return { ...prev, itemsList: list };
    });
  };

  const handleRemoveNewAgreementItemRow = (index) => {
    setNewAgreement(prev => ({
      ...prev,
      itemsList: (prev.itemsList || []).filter((_, i) => i !== index)
    }));
  };

  // Helper handlers for dynamic multi-item lists in editForm
  const handleAddEditAgreementItemRow = () => {
    setEditForm(prev => ({
      ...prev,
      itemsList: [
        ...(prev.itemsList || []),
        { itemName: (items && items.length > 0) ? items[0].name : '', totalQty: '', unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น' }
      ]
    }));
  };

  const handleUpdateEditAgreementItemRow = (index, key, val) => {
    setEditForm(prev => {
      const list = [...(prev.itemsList || [])];
      if (key === 'itemName') {
        const prod = items.find(i => i.name === val);
        list[index] = {
          ...list[index],
          itemName: val,
          unit: prod ? prod.unit : 'ชิ้น'
        };
      } else {
        list[index] = {
          ...list[index],
          [key]: val
        };
      }
      return { ...prev, itemsList: list };
    });
  };

  const handleRemoveEditAgreementItemRow = (index) => {
    setEditForm(prev => ({
      ...prev,
      itemsList: (prev.itemsList || []).filter((_, i) => i !== index)
    }));
  };

  // Helper handlers for Tentative Delivery Schedule in newAgreement
  const handleAddNewAgreementTentativeRow = () => {
    setNewAgreement(prev => {
      const currentTentative = prev.tentativeSchedule || [];
      const defaultItem = (prev.itemsList && prev.itemsList.length > 0) ? prev.itemsList[0] : { itemName: '', unit: 'ชิ้น' };
      
      // Smart next date: 30 days from last row or 30 days from startDate
      let nextDate = prev.startDate || new Date().toISOString().split('T')[0];
      if (currentTentative.length > 0) {
        const lastDate = currentTentative[currentTentative.length - 1].date;
        if (lastDate) {
          const d = new Date(lastDate);
          d.setMonth(d.getMonth() + 1);
          nextDate = d.toISOString().split('T')[0];
        }
      }

      return {
        ...prev,
        tentativeSchedule: [
          ...currentTentative,
          {
            id: `tentative-${Date.now()}-${currentTentative.length + 1}`,
            round: currentTentative.length + 1,
            date: nextDate,
            itemName: defaultItem.itemName,
            quantity: '',
            unit: defaultItem.unit || 'ชิ้น',
            remarks: `รอบที่ ${currentTentative.length + 1}`
          }
        ]
      };
    });
  };

  const handleUpdateNewAgreementTentativeRow = (index, key, val) => {
    setNewAgreement(prev => {
      const list = [...(prev.tentativeSchedule || [])];
      if (key === 'itemName') {
        const matchedItem = (prev.itemsList || []).find(i => i.itemName === val);
        list[index] = {
          ...list[index],
          itemName: val,
          unit: matchedItem ? matchedItem.unit : (list[index].unit || 'ชิ้น')
        };
      } else {
        list[index] = {
          ...list[index],
          [key]: val
        };
      }
      return { ...prev, tentativeSchedule: list };
    });
  };

  const handleRemoveNewAgreementTentativeRow = (index) => {
    setNewAgreement(prev => ({
      ...prev,
      tentativeSchedule: (prev.tentativeSchedule || []).filter((_, i) => i !== index)
    }));
  };

  // Helper handlers for Tentative Delivery Schedule in editForm
  const handleAddEditAgreementTentativeRow = () => {
    setEditForm(prev => {
      const currentTentative = prev.tentativeSchedule || [];
      const defaultItem = (prev.itemsList && prev.itemsList.length > 0) ? prev.itemsList[0] : { itemName: '', unit: 'ชิ้น' };
      
      let nextDate = prev.startDate || new Date().toISOString().split('T')[0];
      if (currentTentative.length > 0) {
        const lastDate = currentTentative[currentTentative.length - 1].date;
        if (lastDate) {
          const d = new Date(lastDate);
          d.setMonth(d.getMonth() + 1);
          nextDate = d.toISOString().split('T')[0];
        }
      }

      return {
        ...prev,
        tentativeSchedule: [
          ...currentTentative,
          {
            id: `tentative-${Date.now()}-${currentTentative.length + 1}`,
            round: currentTentative.length + 1,
            date: nextDate,
            itemName: defaultItem.itemName,
            quantity: '',
            unit: defaultItem.unit || 'ชิ้น',
            remarks: `รอบที่ ${currentTentative.length + 1}`
          }
        ]
      };
    });
  };

  const handleUpdateEditAgreementTentativeRow = (index, key, val) => {
    setEditForm(prev => {
      const list = [...(prev.tentativeSchedule || [])];
      if (key === 'itemName') {
        const matchedItem = (prev.itemsList || []).find(i => i.itemName === val);
        list[index] = {
          ...list[index],
          itemName: val,
          unit: matchedItem ? matchedItem.unit : (list[index].unit || 'ชิ้น')
        };
      } else {
        list[index] = {
          ...list[index],
          [key]: val
        };
      }
      return { ...prev, tentativeSchedule: list };
    });
  };

  const handleRemoveEditAgreementTentativeRow = (index) => {
    setEditForm(prev => ({
      ...prev,
      tentativeSchedule: (prev.tentativeSchedule || []).filter((_, i) => i !== index)
    }));
  };

  // Helper to execute Auto-Split
  const handleExecuteAutoSplit = (isEdit, roundsCount, intervalType, selectedItemIndex = 0) => {
    const formTarget = isEdit ? editForm : newAgreement;
    if (!formTarget || !formTarget.itemsList || formTarget.itemsList.length === 0) {
      alert("กรุณาระบุรายการสินค้าในสัญญาก่อนแบ่งงวด");
      return;
    }

    const numRounds = Math.max(1, parseInt(roundsCount, 10) || 3);
    const startDateStr = formTarget.startDate || new Date().toISOString().split('T')[0];
    const endDateStr = formTarget.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

    const targetItem = formTarget.itemsList[selectedItemIndex] || formTarget.itemsList[0];
    const totalQty = Number(targetItem.totalQty || 0);

    if (totalQty <= 0) {
      alert(`กรุณาระบุยอดจัดซื้อของสินค้า "${targetItem.itemName || 'ที่เลือก'}" ให้ถูกต้องก่อนแบ่งงวด`);
      return;
    }

    const baseQty = Math.floor(totalQty / numRounds);
    const remainder = totalQty - (baseQty * numRounds);

    const startD = new Date(startDateStr);
    const endD = new Date(endDateStr);
    const totalDays = Math.max(1, Math.round((endD - startD) / (1000 * 60 * 60 * 24)));

    const newRounds = [];

    for (let r = 1; r <= numRounds; r++) {
      const roundQty = r === numRounds ? (baseQty + remainder) : baseQty;
      
      let roundDate = new Date(startD);
      if (intervalType === 'evenly') {
        const stepDays = Math.round((totalDays / numRounds) * r);
        roundDate.setDate(roundDate.getDate() + stepDays);
      } else if (intervalType === 'biweekly') {
        roundDate.setDate(roundDate.getDate() + (r * 14));
      } else if (intervalType === 'monthly') {
        roundDate.setMonth(roundDate.getMonth() + r);
      } else if (intervalType === 'quarterly') {
        roundDate.setMonth(roundDate.getMonth() + (r * 3));
      } else {
        roundDate.setMonth(roundDate.getMonth() + r);
      }

      const yyyy = roundDate.getFullYear();
      const mm = String(roundDate.getMonth() + 1).padStart(2, '0');
      const dd = String(roundDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      newRounds.push({
        id: `tentative-${Date.now()}-${r}-${Math.random().toString(36).substr(2, 4)}`,
        round: r,
        date: dateStr,
        itemName: targetItem.itemName,
        quantity: roundQty,
        unit: targetItem.unit || 'ชิ้น',
        remarks: `รอบที่ ${r} จากทั้งหมด ${numRounds} รอบ`
      });
    }

    if (isEdit) {
      setEditForm(prev => {
        const otherItemsRounds = (prev.tentativeSchedule || []).filter(s => s.itemName && s.itemName !== targetItem.itemName);
        return {
          ...prev,
          tentativeSchedule: [...otherItemsRounds, ...newRounds]
        };
      });
    } else {
      setNewAgreement(prev => {
        const otherItemsRounds = (prev.tentativeSchedule || []).filter(s => s.itemName && s.itemName !== targetItem.itemName);
        return {
          ...prev,
          tentativeSchedule: [...otherItemsRounds, ...newRounds]
        };
      });
    }

    setAutoSplitConfig(null);
  };

  // New agreement form state
  const [newAgreement, setNewAgreement] = useState({
    id: '',
    itemsList: [{ itemName: (items && items.length > 0) ? items[0].name : '', totalQty: '', unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น' }],
    tentativeSchedule: [],
    supplier: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    remarks: '',
    attachments: []
  });

  // Handle saving new agreement
  const handleSaveAgreement = (e) => {
    e.preventDefault();
    if (!newAgreement.id || !newAgreement.supplier) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (เลขที่สัญญา, ผู้จัดจำหน่าย)");
      return;
    }

    if (!newAgreement.itemsList || newAgreement.itemsList.length === 0) {
      alert("กรุณาเพิ่มรายการพัสดุในสัญญาอย่างน้อย 1 รายการ");
      return;
    }

    const hasInvalidItem = newAgreement.itemsList.some(item => !item.itemName || !item.totalQty || Number(item.totalQty) <= 0);
    if (hasInvalidItem) {
      alert("กรุณาระบุสินค้าและจำนวนจัดซื้อในสัญญาให้ถูกต้อง (ต้องมีค่ามากกว่า 0)");
      return;
    }

    const isDuplicate = agreements.some(ag => ag.id.toLowerCase() === newAgreement.id.toLowerCase());
    if (isDuplicate) {
      alert("มีเลขที่สัญญานี้อยู่ในระบบแล้ว กรุณาใช้เลขที่สัญญาอื่น");
      return;
    }

    // Clean and validate tentative schedule rows
    const cleanedTentative = (newAgreement.tentativeSchedule || [])
      .filter(s => s && (s.quantity !== '' && s.quantity !== undefined && Number(s.quantity) > 0))
      .map((s, idx) => ({
        id: s.id || `tentative-${Date.now()}-${idx}`,
        round: Number(s.round) || (idx + 1),
        date: s.date || newAgreement.startDate || new Date().toISOString().split('T')[0],
        itemName: s.itemName || (newAgreement.itemsList[0] ? newAgreement.itemsList[0].itemName : ''),
        quantity: Number(s.quantity),
        unit: s.unit || (newAgreement.itemsList.find(i => i.itemName === s.itemName) ? newAgreement.itemsList.find(i => i.itemName === s.itemName).unit : 'ชิ้น'),
        remarks: s.remarks || ''
      }));

    const primaryItem = newAgreement.itemsList[0] || { itemName: '', totalQty: 0, unit: 'ชิ้น' };
    const agreementToAdd = {
      ...newAgreement,
      itemsList: newAgreement.itemsList.map(item => ({
        ...item,
        totalQty: Number(item.totalQty)
      })),
      tentativeSchedule: cleanedTentative,
      // Fallback properties for compatibility with other parts of the application:
      itemName: primaryItem.itemName,
      totalQty: Number(primaryItem.totalQty),
      unit: primaryItem.unit,
      status: 'Active', // Initial status
      createdAt: new Date().toISOString(),
      attachments: newAgreement.attachments || []
    };

    setAgreements([...agreements, agreementToAdd]);
    alert("สร้างสัญญาจัดซื้อใหม่เรียบร้อยแล้ว!");
    
    // Reset form and go back to list
    setNewAgreement({
      id: '',
      itemsList: [{ itemName: (items && items.length > 0) ? items[0].name : '', totalQty: '', unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น' }],
      tentativeSchedule: [],
      supplier: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      remarks: '',
      attachments: []
    });
    setActiveTab('list');
  };

  // Handle Accept Delivery
  const handleAcceptDelivery = (lotId) => {
    setInventory(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return {
          ...lot,
          acceptanceStatus: 'Accepted'
        };
      }
      return lot;
    }));
  };

  // Handle Reject Delivery
  const handleRejectDelivery = (lotId) => {
    setInventory(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return {
          ...lot,
          acceptanceStatus: 'Rejected'
        };
      }
      return lot;
    }));
  };

  // Compute calculated metrics for each agreement dynamically to prevent sync errors
  const processedAgreements = useMemo(() => {
    return agreements.map(ag => {
      // Find all inventory lots linked to this agreement
      const deliveries = inventory.filter(lot => lot.agreementId === ag.id && !lot.isCancelled);

      // Compute stats for each item in the itemsList
      const itemsListWithStats = (ag.itemsList || [
        { itemName: ag.itemName, totalQty: ag.totalQty, unit: ag.unit }
      ]).map(item => {
        const itemDeliveries = deliveries.filter(lot => lot.itemName === item.itemName);

        const acceptedDeliveries = itemDeliveries.filter(lot => lot.acceptanceStatus === 'Accepted');

        const acceptedQty = acceptedDeliveries
          .reduce((sum, lot) => {
            const origQty = Number(lot.quantity || 0);
            const totalDefective = (lot.claimReturns || []).reduce((cSum, cr) => cSum + (cr.syncContractAdjustment !== false ? Number(cr.defectiveQty || 0) : 0), 0);
            return sum + Math.max(0, origQty - totalDefective);
          }, 0);

        const pendingQty = itemDeliveries
          .filter(lot => lot.acceptanceStatus === 'Pending')
          .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

        const rejectedQty = itemDeliveries
          .filter(lot => lot.acceptanceStatus === 'Rejected')
          .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);

        const totalDelivered = acceptedDeliveries.reduce((sum, lot) => sum + Number(lot.quantity || 0), 0) + pendingQty + rejectedQty;
        const outstandingQty = Math.max(0, Number(item.totalQty || 0) - acceptedQty);

        // Calculate Withdrawn (ตัดใช้ไปแล้ว) and Current Stock on Hand (คงเหลือในคลัง)
        const remainingStockQty = acceptedDeliveries.reduce((sum, lot) => {
          const rem = lot.remainingQty !== undefined ? Number(lot.remainingQty) : Number(lot.quantity || 0);
          return sum + Math.max(0, rem);
        }, 0);

        const withdrawnQty = acceptedDeliveries.reduce((sum, lot) => {
          const totalReturned = (lot.claimReturns || []).reduce((cSum, cr) => cSum + Number(cr.returnedQty || 0), 0);
          const totalDefective = (lot.claimReturns || []).reduce((cSum, cr) => cSum + Number(cr.defectiveQty || 0), 0);
          const withList = (lot.withdrawals || []).filter(w => !w.isCancelled);
          if (withList.length > 0) {
            const rawWithdrawn = withList.reduce((wSum, w) => wSum + Number(w.amount || 0), 0);
            return sum + Math.max(0, rawWithdrawn - totalReturned - totalDefective);
          }
          const lotQty = Number(lot.quantity || 0);
          const lotRem = lot.remainingQty !== undefined ? Number(lot.remainingQty) : lotQty;
          return sum + Math.max(0, lotQty - totalDefective - lotRem);
        }, 0);

        return {
          ...item,
          acceptedQty,
          pendingQty,
          rejectedQty,
          totalDelivered,
          outstandingQty,
          withdrawnQty,
          remainingStockQty
        };
      });

      // Sum metrics for backwards compatibility and high-level card status
      const totalQty = itemsListWithStats.reduce((sum, item) => sum + Number(item.totalQty || 0), 0);
      const acceptedQty = itemsListWithStats.reduce((sum, item) => sum + item.acceptedQty, 0);
      const pendingQty = itemsListWithStats.reduce((sum, item) => sum + item.pendingQty, 0);
      const rejectedQty = itemsListWithStats.reduce((sum, item) => sum + item.rejectedQty, 0);
      const totalDelivered = acceptedQty + pendingQty + rejectedQty;
      const outstandingQty = itemsListWithStats.reduce((sum, item) => sum + item.outstandingQty, 0);
      const withdrawnQty = itemsListWithStats.reduce((sum, item) => sum + item.withdrawnQty, 0);
      const remainingStockQty = itemsListWithStats.reduce((sum, item) => sum + item.remainingStockQty, 0);

      // Determine dynamic status
      let displayStatus = 'Active';
      if (acceptedQty >= totalQty) {
        displayStatus = 'Completed';
      } else if (new Date(ag.endDate) < new Date()) {
        displayStatus = 'Expired';
      }

      // Compute Tentative Delivery Schedule metrics
      const rawTentative = ag.tentativeSchedule || [];
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Map and sort tentative rounds
      const sortedTentative = [...rawTentative].sort((a, b) => {
        const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
        if (dateCompare !== 0) return dateCompare;
        return (Number(a.round) || 0) - (Number(b.round) || 0);
      });

      // Track cumulative delivered quantities per item to determine tentative status
      const cumulativeDeliveredPerItem = {};

      const processedTentativeSchedule = sortedTentative.map((round, rIdx) => {
        const targetItemName = round.itemName || (itemsListWithStats[0] ? itemsListWithStats[0].itemName : '');
        const matchedItemStats = itemsListWithStats.find(i => i.itemName === targetItemName);
        const totalAcceptedForItem = matchedItemStats ? matchedItemStats.acceptedQty : 0;
        const plannedQty = Number(round.quantity || 0);

        const prevCumulative = cumulativeDeliveredPerItem[targetItemName] || 0;
        const currentCumulative = prevCumulative + plannedQty;
        cumulativeDeliveredPerItem[targetItemName] = currentCumulative;

        let fulfilledQty = 0;
        let status = 'Pending'; // 'Completed' | 'Partial' | 'Pending' | 'Overdue'

        if (totalAcceptedForItem >= currentCumulative) {
          fulfilledQty = plannedQty;
          status = 'Completed';
        } else if (totalAcceptedForItem > prevCumulative) {
          fulfilledQty = totalAcceptedForItem - prevCumulative;
          status = 'Partial';
        } else {
          fulfilledQty = 0;
          if (round.date && round.date < todayStr) {
            status = 'Overdue';
          } else {
            status = 'Pending';
          }
        }

        const fulfilledPct = plannedQty > 0 ? Math.min(100, Math.round((fulfilledQty / plannedQty) * 100)) : 100;

        let daysDiff = null;
        if (round.date) {
          const dTarget = new Date(round.date + 'T00:00:00');
          const dToday = new Date(todayStr + 'T00:00:00');
          daysDiff = Math.round((dTarget - dToday) / (1000 * 60 * 60 * 24));
        }

        return {
          ...round,
          roundNumber: round.round || (rIdx + 1),
          itemName: targetItemName,
          quantity: plannedQty,
          unit: round.unit || (matchedItemStats ? matchedItemStats.unit : 'ชิ้น'),
          fulfilledQty,
          fulfilledPct,
          status,
          daysDiff
        };
      });

      const nextTentativeDelivery = processedTentativeSchedule.find(s => s.status !== 'Completed') || null;
      const totalPlannedQty = processedTentativeSchedule.reduce((sum, s) => sum + s.quantity, 0);
      const totalPlannedFulfilledQty = processedTentativeSchedule.reduce((sum, s) => sum + s.fulfilledQty, 0);

      return {
        ...ag,
        itemsListWithStats,
        totalQty,
        acceptedQty,
        pendingQty,
        rejectedQty,
        totalDelivered,
        outstandingQty,
        withdrawnQty,
        remainingStockQty,
        displayStatus,
        deliveries,
        tentativeSchedule: processedTentativeSchedule,
        nextTentativeDelivery,
        totalPlannedQty,
        totalPlannedFulfilledQty
      };
    });
  }, [agreements, inventory]);

  const filteredAgreements = useMemo(() => {
    if (searchQuery.trim() === '') return processedAgreements;
    const q = searchQuery.toLowerCase().trim();
    return processedAgreements.filter(ag => 
      (ag.id && ag.id.toLowerCase().includes(q)) || 
      (ag.supplier && ag.supplier.toLowerCase().includes(q)) || 
      (ag.remarks && ag.remarks.toLowerCase().includes(q)) ||
      (ag.itemsListWithStats || []).some(item => 
        String(item.itemName || '').toLowerCase().includes(q)
      )
    );
  }, [processedAgreements, searchQuery]);

  const printOutstandingReport = () => {
    const outstandingAgreements = processedAgreements.filter(ag => ag.outstandingQty > 0);

    if (outstandingAgreements.length === 0) {
      alert("ไม่มีสัญญาจัดซื้อที่มียอดค้างรับในระบบขณะนี้");
      return;
    }

    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อเปิดหน้าพิมพ์เอกสาร");
      return;
    }

    const formatDateToDDMMYY = (dateStr) => {
      if (!dateStr) return '-';
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [yyyy, mm, dd] = parts;
      const yy = yyyy.substring(2);
      return `${dd}/${mm}/${yy}`;
    };

    const htmlContent = `
      <html>
        <head>
          <title>รายงานสัญญาจัดซื้อค้างรับทั้งหมด - NBC Stock</title>
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
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 2px solid #003366;
              padding-bottom: 12px;
              margin-bottom: 25px;
            }
            .title {
              font-size: 20px;
              font-weight: 700;
              color: #003366;
            }
            .meta-info {
              text-align: right;
              font-size: 11px;
            }
            .controls-bar {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 25px;
              display: flex;
              flex-direction: column;
              gap: 12px;
              font-size: 13px;
            }
            .controls-row {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              align-items: center;
            }
            .controls-section {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .controls-section strong {
              color: #003366;
            }
            .checkbox-group {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
            }
            .checkbox-group label {
              display: flex;
              align-items: center;
              gap: 6px;
              cursor: pointer;
              background-color: #fff;
              padding: 4px 10px;
              border-radius: 4px;
              border: 1px solid #cbd5e1;
              user-select: none;
              font-weight: 500;
            }
            .checkbox-group label:hover {
              background-color: #f1f5f9;
              border-color: #94a3b8;
            }
            .width-inputs {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .print-btn-container {
              margin-left: auto;
            }
            .btn-print {
              background-color: #ea580c;
              color: white;
              border: none;
              padding: 10px 24px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              font-family: 'Sarabun', sans-serif;
              transition: all 0.2s;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .btn-print:hover {
              background-color: #c2410c;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              margin-bottom: 35px;
              table-layout: auto;
            }
            th {
              background-color: #003366;
              color: #fff;
              font-weight: 600;
              text-align: left;
              padding: 8px;
              border: 1px solid #ddd;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              background-color: #f0f4f8 !important;
              font-weight: 700;
            }
            .status-badge {
              display: inline-block;
              padding: 0.15rem 0.4rem;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
            }
            .status-active { background-color: #e0f7fa; color: #006064; }
            .status-expired { background-color: #ffebee; color: #b71c1c; }
            .nowrap {
              white-space: nowrap;
            }
            @media print {
              .controls-bar {
                display: none !important;
              }
              body {
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="controls-bar">
            <div class="controls-row">
              <div class="controls-section" style="flex: 1; min-width: 300px;">
                <strong>เลือกคอลัมน์ที่จะพิมพ์:</strong>
                <div class="checkbox-group">
                  <label><input type="checkbox" id="col-agreement" checked onchange="updateTable()"> เลขที่สัญญา</label>
                  <label><input type="checkbox" id="col-supplier" checked onchange="updateTable()"> ผู้จัดจำหน่าย</label>
                  <label><input type="checkbox" id="col-item" checked onchange="updateTable()"> สินค้าจัดซื้อ</label>
                  <label><input type="checkbox" id="col-totalqty" checked onchange="updateTable()"> ยอดสัญญา</label>
                  <label><input type="checkbox" id="col-acceptedqty" checked onchange="updateTable()"> รับแล้ว (ผ่าน)</label>
                  <label><input type="checkbox" id="col-pendingqty" checked onchange="updateTable()"> รอตรวจรับ</label>
                  <label><input type="checkbox" id="col-outstandingqty" checked onchange="updateTable()"> ยอดค้างรับ</label>
                  <label><input type="checkbox" id="col-unit" checked onchange="updateTable()"> หน่วย</label>
                  <label><input type="checkbox" id="col-enddate" checked onchange="updateTable()"> วันหมดอายุสัญญา</label>
                  <label><input type="checkbox" id="col-status" checked onchange="updateTable()"> สถานะสัญญา</label>
                </div>
              </div>
              
              <div class="controls-section">
                <strong>ขนาดตัวอักษรตาราง:</strong>
                <select id="font-size-select" onchange="updateFontSize()" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-family: 'Sarabun'; cursor: pointer;">
                  <option value="11px">11px</option>
                  <option value="12px">12px</option>
                  <option value="13px" selected>13px (ปกติ)</option>
                  <option value="14px">14px</option>
                  <option value="15px">15px</option>
                  <option value="16px">16px</option>
                  <option value="18px">18px</option>
                </select>
              </div>

              <div class="print-btn-container">
                <button class="btn-print" onclick="window.print()">พิมพ์รายงาน / บันทึก PDF</button>
              </div>
            </div>

            <div class="controls-section" style="border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 5px;">
              <strong>ปรับความกว้างคอลัมน์ (%):</strong>
              <div class="width-inputs" id="width-inputs-container">
                <!-- Generated by JS -->
              </div>
            </div>
          </div>

          <div class="header">
            <div>
              <div class="title">รายงานสัญญาจัดซื้อค้างรับทั้งหมด (Outstanding Purchase Agreements Report)</div>
              <div style="font-size: 11px; color: #555; margin-top: 5px;">ระบบบริหารจัดการคลังสินค้า NBC STOCK | ข้อมูลสัญญาค้างส่งมอบ</div>
            </div>
            <div class="meta-info">
              <div><strong>วันที่ออกรายงาน:</strong> ${today}</div>
              <div><strong>จำนวนสัญญาค้างรับ:</strong> ${outstandingAgreements.length} รายการ</div>
            </div>
          </div>

          <table id="report-table">
            <thead>
              <tr>
                <th id="th-agreement" class="col-agreement" style="width: 10%;">เลขที่สัญญา</th>
                <th id="th-supplier" class="col-supplier" style="width: 15%;">ผู้จัดจำหน่าย (Supplier)</th>
                <th id="th-item" class="col-item" style="width: 20%;">สินค้าจัดซื้อ</th>
                <th id="th-totalqty" class="col-totalqty" style="width: 8%; text-align: right;">ยอดสัญญา</th>
                <th id="th-acceptedqty" class="col-acceptedqty" style="width: 8%; text-align: right;">รับแล้ว (ผ่าน)</th>
                <th id="th-pendingqty" class="col-pendingqty" style="width: 8%; text-align: right;">รอตรวจรับ</th>
                <th id="th-outstandingqty" class="col-outstandingqty" style="width: 10%; text-align: right; color: #b71c1c;">ยอดค้างรับ</th>
                <th id="th-unit" class="col-unit" style="width: 5%;">หน่วย</th>
                <th id="th-enddate" class="col-enddate" style="width: 8%;">วันหมดอายุสัญญา</th>
                <th id="th-status" class="col-status" style="width: 8%;">สถานะสัญญา</th>
              </tr>
            </thead>
            <tbody>
              ${outstandingAgreements.flatMap(ag => 
                (ag.itemsListWithStats || []).filter(item => item.outstandingQty > 0).map((item, index) => `
                <tr>
                  <td class="col-agreement" style="font-weight: 600;">${index === 0 ? escapeHTML(ag.id) : ''}</td>
                  <td class="col-supplier">${index === 0 ? escapeHTML(ag.supplier) : ''}</td>
                  <td class="col-item" style="font-weight: 600;">${escapeHTML(item.itemName)}</td>
                  <td class="col-totalqty" style="text-align: right;">${item.totalQty.toLocaleString()}</td>
                  <td class="col-acceptedqty" style="text-align: right; color: #0f5132;">${item.acceptedQty.toLocaleString()}</td>
                  <td class="col-pendingqty" style="text-align: right; color: #664d03;">${item.pendingQty.toLocaleString()}</td>
                  <td class="col-outstandingqty" style="text-align: right; font-weight: 700; color: #b71c1c;">${item.outstandingQty.toLocaleString()}</td>
                  <td class="col-unit">${escapeHTML(item.unit)}</td>
                  <td class="col-enddate nowrap">${index === 0 ? formatDateToDDMMYY(ag.endDate) : ''}</td>
                  <td class="col-status">
                    ${index === 0 ? `
                    <span class="status-badge ${
                      ag.displayStatus === 'Expired' ? 'status-expired' : 'status-active'
                    }">
                      ${ag.displayStatus === 'Expired' ? 'หมดอายุสัญญา' : 'กำลังดำเนินการ'}
                    </span>
                    ` : ''}
                  </td>
                </tr>
              `)).join("")}
              <tr id="total-row" class="total-row">
                <td id="total-label-cell" colspan="3" style="text-align: right;">รวมทั้งหมด:</td>
                <td id="total-totalqty-cell" class="col-totalqty" style="text-align: right;">
                  ${outstandingAgreements.reduce((sum, ag) => sum + ag.totalQty, 0).toLocaleString()}
                </td>
                <td id="total-acceptedqty-cell" class="col-acceptedqty" style="text-align: right; color: #0f5132;">
                  ${outstandingAgreements.reduce((sum, ag) => sum + ag.acceptedQty, 0).toLocaleString()}
                </td>
                <td id="total-pendingqty-cell" class="col-pendingqty" style="text-align: right; color: #664d03;">
                  ${outstandingAgreements.reduce((sum, ag) => sum + ag.pendingQty, 0).toLocaleString()}
                </td>
                <td id="total-outstandingqty-cell" class="col-outstandingqty" style="text-align: right; color: #b71c1c; font-size: 0.95rem;">
                  ${outstandingAgreements.reduce((sum, ag) => sum + ag.outstandingQty, 0).toLocaleString()}
                </td>
                <td id="total-unit-cell" class="col-unit">หน่วยตามรายการ</td>
                <td id="total-enddate-cell" class="col-enddate"></td>
                <td id="total-status-cell" class="col-status"></td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 4rem; display: flex; justify-content: space-between; font-size: 0.9rem;">
            <div style="text-align: center; width: 40%;">
              <br><br>
              <p>____________________________________</p>
              <p><strong>ผู้ตรวจสอบรายงาน</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
            <div style="text-align: center; width: 40%;">
              <br><br>
              <p>____________________________________</p>
              <p><strong>ผู้อนุมัติรายงาน</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
          </div>

          <script>
            const colNames = {
              agreement: 'เลขที่สัญญา',
              supplier: 'ผู้จัดจำหน่าย',
              item: 'สินค้าจัดซื้อ',
              totalqty: 'ยอดสัญญา',
              acceptedqty: 'รับแล้ว (ผ่าน)',
              pendingqty: 'รอตรวจรับ',
              outstandingqty: 'ยอดค้างรับ',
              unit: 'หน่วย',
              enddate: 'วันหมดอายุสัญญา',
              status: 'สถานะสัญญา'
            };
            
            const colWidths = {
              agreement: 10,
              supplier: 15,
              item: 20,
              totalqty: 8,
              acceptedqty: 8,
              pendingqty: 8,
              outstandingqty: 10,
              unit: 5,
              enddate: 8,
              status: 8
            };

            function renderWidthInputs() {
              const container = document.getElementById('width-inputs-container');
              container.innerHTML = '';
              for (const [col, label] of Object.entries(colNames)) {
                const isChecked = document.getElementById('col-' + col).checked;
                if (isChecked) {
                  const div = document.createElement('div');
                  div.className = 'width-input-item';
                  div.style.cssText = 'display: flex; align-items: center; gap: 8px; background-color: #fff; padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1;';
                  div.innerHTML = \`
                    <span style="font-size: 11px; font-weight: 600; color: #475569;">\${label}:</span>
                    <input type="range" min="1" max="100" value="\${colWidths[col]}" oninput="updateWidth('\${col}', this.value)" style="width: 70px; accent-color: #ea580c; cursor: pointer; height: 4px;">
                    <span id="val-\${col}" style="font-size: 11px; font-weight: 700; color: #ea580c; min-width: 28px;">\${colWidths[col]}%</span>
                  \`;
                  container.appendChild(div);
                }
              }
            }

            function updateWidth(col, val) {
              const width = parseInt(val, 10) || colWidths[col];
              colWidths[col] = width;
              const th = document.getElementById('th-' + col);
              if (th) {
                th.style.width = width + '%';
              }
              const valSpan = document.getElementById('val-' + col);
              if (valSpan) {
                valSpan.textContent = width + '%';
              }
            }

            function updateTable() {
              const cols = ['agreement', 'supplier', 'item', 'totalqty', 'acceptedqty', 'pendingqty', 'outstandingqty', 'unit', 'enddate', 'status'];
              cols.forEach(col => {
                const checked = document.getElementById('col-' + col).checked;
                const elements = document.querySelectorAll('.col-' + col);
                elements.forEach(el => {
                  el.style.display = checked ? '' : 'none';
                });
              });

              // Handle total row
              const totalqtyChecked = document.getElementById('col-totalqty').checked;
              const acceptedqtyChecked = document.getElementById('col-acceptedqty').checked;
              const pendingqtyChecked = document.getElementById('col-pendingqty').checked;
              const outstandingqtyChecked = document.getElementById('col-outstandingqty').checked;
              
              const totalRow = document.getElementById('total-row');
              if (!totalqtyChecked && !acceptedqtyChecked && !pendingqtyChecked && !outstandingqtyChecked) {
                totalRow.style.display = 'none';
              } else {
                totalRow.style.display = '';
                
                const columnsBeforeTotalQty = ['agreement', 'supplier', 'item'];
                let visibleCountBeforeTotalQty = 0;
                columnsBeforeTotalQty.forEach(col => {
                  if (document.getElementById('col-' + col).checked) {
                    visibleCountBeforeTotalQty++;
                  }
                });
                
                const totalLabelCell = document.getElementById('total-label-cell');
                totalLabelCell.colSpan = visibleCountBeforeTotalQty;
                totalLabelCell.style.display = visibleCountBeforeTotalQty > 0 ? '' : 'none';
                
                document.getElementById('total-totalqty-cell').style.display = totalqtyChecked ? '' : 'none';
                document.getElementById('total-acceptedqty-cell').style.display = acceptedqtyChecked ? '' : 'none';
                document.getElementById('total-pendingqty-cell').style.display = pendingqtyChecked ? '' : 'none';
                document.getElementById('total-outstandingqty-cell').style.display = outstandingqtyChecked ? '' : 'none';
                
                document.getElementById('total-unit-cell').style.display = document.getElementById('col-unit').checked ? '' : 'none';
                document.getElementById('total-enddate-cell').style.display = document.getElementById('col-enddate').checked ? '' : 'none';
                document.getElementById('total-status-cell').style.display = document.getElementById('col-status').checked ? '' : 'none';
              }
              
              renderWidthInputs();
            }

            function updateFontSize() {
              const val = document.getElementById('font-size-select').value;
              document.getElementById('report-table').style.fontSize = val;
            }

            // Init width inputs
            renderWidthInputs();
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
          <h1 className="page-title">สัญญาจัดซื้อ (Purchase Agreements - Mod 5)</h1>
          <p className="page-subtitle">จัดการสัญญาแบบส่งมอบบางส่วน ติดตามยอดตรวจรับสำเร็จและยอดค้างส่งแยกจาก QC</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={printOutstandingReport}
            style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              color: 'var(--accent-color)', 
              border: '1px solid rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileText size={16} /> รายงานสัญญาค้างรับ
          </button>
          <button 
            className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('list')}
          >
            รายการสัญญาจัดซื้อ
          </button>
          <button 
            className={`btn ${activeTab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('new')}
          >
            <Plus size={16} /> สร้างสัญญาจัดซื้อใหม่
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="glass card" style={{ maxWidth: '700px', margin: '0 auto', border: '1px solid var(--accent-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
            รายละเอียดสัญญาจัดซื้อใหม่
          </h3>
          <form onSubmit={handleSaveAgreement} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>เลขที่สัญญาจัดซื้อ <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  placeholder="เช่น AG-2569-001" 
                  value={newAgreement.id} 
                  onChange={e => setNewAgreement({...newAgreement, id: e.target.value})} 
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>ชื่อผู้จัดจำหน่าย (Supplier) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  placeholder="เช่น บริษัท เอสซีจี จำกัด" 
                  value={newAgreement.supplier} 
                  onChange={e => setNewAgreement({...newAgreement, supplier: e.target.value})} 
                  required
                />
              </div>
            </div>

            {/* รายการพัสดุในสัญญา */}
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>รายการพัสดุจัดซื้อตามสัญญา <span style={{ color: 'var(--danger)' }}>*</span></label>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleAddNewAgreementItemRow}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={14} /> เพิ่มรายการพัสดุ
                </button>
              </div>
              
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-bg)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.6rem 0.75rem', width: '55%' }}>รายการสินค้า</th>
                      <th style={{ padding: '0.6rem 0.75rem', width: '30%' }}>จำนวนจัดซื้อตามสัญญา</th>
                      <th style={{ padding: '0.6rem 0.75rem', width: '15%', textAlign: 'center' }}>ลบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(newAgreement.itemsList || []).map((itemRow, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <SearchableSelect
                            value={itemRow.itemName}
                            onChange={(val) => handleUpdateNewAgreementItemRow(idx, 'itemName', val)}
                            placeholder="ค้นหาและเลือกสินค้า..."
                            options={items.map(item => ({ value: item.name, label: item.name }))}
                          />
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="number"
                              value={itemRow.totalQty}
                              onChange={(e) => handleUpdateNewAgreementItemRow(idx, 'totalQty', e.target.value)}
                              placeholder="เช่น 1000"
                              style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.8rem', outline: 'none' }}
                              required
                            />
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', minWidth: '35px' }}>
                              {itemRow.unit}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewAgreementItemRow(idx)}
                            disabled={(newAgreement.itemsList || []).length <= 1}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: (newAgreement.itemsList || []).length <= 1 ? 'var(--text-muted)' : 'var(--danger)',
                              cursor: (newAgreement.itemsList || []).length <= 1 ? 'not-allowed' : 'pointer',
                              opacity: (newAgreement.itemsList || []).length <= 1 ? 0.4 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.3rem'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>วันเริ่มสัญญา</label>
                <input 
                  type="date" 
                  value={newAgreement.startDate} 
                  onChange={e => setNewAgreement({...newAgreement, startDate: e.target.value})} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>วันสิ้นสุดสัญญา (วันหมดอายุ)</label>
                <input 
                  type="date" 
                  value={newAgreement.endDate} 
                  onChange={e => setNewAgreement({...newAgreement, endDate: e.target.value})} 
                />
              </div>
            </div>

            {/* แผนการส่งมอบสินค้าล่วงหน้า (Tentative Delivery Schedule) */}
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '10px', padding: '1.1rem', background: 'rgba(2, 132, 199, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                    <CalendarDays size={16} /> แผนการส่งมอบสินค้าล่วงหน้า (Tentative Schedule)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    กำหนดรอบและวันที่คาดว่าสินค้าจะมาส่งมอบตามสัญญา (ปรับเปลี่ยนได้ตลอดเวลา)
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setAutoSplitConfig({ isEdit: false, roundsCount: 3, intervalType: 'monthly', selectedItemIndex: 0 })}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-color)', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.08)' }}
                    title="ช่วยแบ่งงวดและวันที่อัตโนมัติตามจำนวนรอบที่ต้องการ"
                  >
                    <Sparkles size={13} /> ⚡ ช่วยแบ่งงวดอัตโนมัติ
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleAddNewAgreementTentativeRow}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={13} /> เพิ่มรอบส่งมอบ
                  </button>
                </div>
              </div>

              {/* Status / Comparison summary bar */}
              {(() => {
                const totalContractQty = (newAgreement.itemsList || []).reduce((sum, i) => sum + (Number(i.totalQty) || 0), 0);
                const totalPlannedQty = (newAgreement.tentativeSchedule || []).reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
                const diff = totalPlannedQty - totalContractQty;
                const isMatched = totalPlannedQty > 0 && diff === 0;

                return (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isMatched ? 'rgba(16, 185, 129, 0.08)' : (diff > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)'),
                    border: `1px solid ${isMatched ? 'rgba(16, 185, 129, 0.25)' : (diff > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--glass-border)')}`,
                    borderRadius: '6px',
                    padding: '0.45rem 0.75rem',
                    marginBottom: '0.75rem',
                    fontSize: '0.8rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>จำนวนรอบที่วางแผน: <strong>{(newAgreement.tentativeSchedule || []).length} รอบ</strong></span>
                      <span>|</span>
                      <span>ยอดรวมตามแผน: <strong style={{ color: isMatched ? '#10b981' : (diff > 0 ? '#ef4444' : 'var(--accent-secondary)') }}>{totalPlannedQty.toLocaleString()}</strong> / ยอดสัญญา: <strong>{totalContractQty.toLocaleString()}</strong></span>
                    </div>
                    <div>
                      {totalPlannedQty === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(ยังไม่ได้กำหนดแผนส่งมอบ)</span>
                      ) : isMatched ? (
                        <span style={{ color: 'var(--success, #10b981)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={14} /> แผนตรงตามยอดสัญญาสมบูรณ์ (100%)
                        </span>
                      ) : diff < 0 ? (
                        <span style={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <AlertCircle size={14} /> ยังขาดในแผนอีก {Math.abs(diff).toLocaleString()} หน่วย
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <AlertTriangle size={14} /> แผนเกินยอดสัญญา {diff.toLocaleString()} หน่วย
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {(!newAgreement.tentativeSchedule || newAgreement.tentativeSchedule.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '1.25rem', border: '1px dashed var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  ยังไม่มีการระบุแผนการส่งมอบล่วงหน้า (สามารถกดปุ่ม "<strong>⚡ ช่วยแบ่งงวดอัตโนมัติ</strong>" หรือ "<strong>+ เพิ่มรอบส่งมอบ</strong>" เพื่อเริ่มต้น)
                </div>
              ) : (
                <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-bg)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.5rem 0.6rem', width: '10%', textAlign: 'center' }}>รอบที่</th>
                        <th style={{ padding: '0.5rem 0.6rem', width: '22%' }}>วันที่กำหนดส่ง</th>
                        <th style={{ padding: '0.5rem 0.6rem', width: '28%' }}>รายการสินค้า</th>
                        <th style={{ padding: '0.5rem 0.6rem', width: '20%' }}>จำนวนส่งมอบ</th>
                        <th style={{ padding: '0.5rem 0.6rem', width: '14%' }}>หมายเหตุ</th>
                        <th style={{ padding: '0.5rem 0.6rem', width: '6%', textAlign: 'center' }}>ลบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newAgreement.tentativeSchedule.map((tRow, tIdx) => (
                        <tr key={tRow.id || tIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                          <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                            {tRow.round || (tIdx + 1)}
                          </td>
                          <td style={{ padding: '0.4rem 0.6rem' }}>
                            <input
                              type="date"
                              value={tRow.date || ''}
                              onChange={(e) => handleUpdateNewAgreementTentativeRow(tIdx, 'date', e.target.value)}
                              style={{ width: '100%', padding: '0.35rem 0.45rem', fontSize: '0.8rem' }}
                              required
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.6rem' }}>
                            {(newAgreement.itemsList && newAgreement.itemsList.length > 1) ? (
                              <select
                                value={tRow.itemName || ''}
                                onChange={(e) => handleUpdateNewAgreementTentativeRow(tIdx, 'itemName', e.target.value)}
                                style={{ width: '100%', padding: '0.35rem 0.45rem', fontSize: '0.8rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                              >
                                {newAgreement.itemsList.map((item, iIdx) => (
                                  <option key={iIdx} value={item.itemName}>{item.itemName || `รายการที่ ${iIdx + 1}`}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.82rem' }}>
                                {tRow.itemName || (newAgreement.itemsList && newAgreement.itemsList[0] ? newAgreement.itemsList[0].itemName : '-')}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.4rem 0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <input
                                type="number"
                                value={tRow.quantity}
                                onChange={(e) => handleUpdateNewAgreementTentativeRow(tIdx, 'quantity', e.target.value)}
                                placeholder="จำนวน"
                                style={{ width: '100%', padding: '0.35rem 0.45rem', fontSize: '0.8rem', outline: 'none' }}
                                required
                              />
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', minWidth: '28px' }}>
                                {tRow.unit || 'ชิ้น'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.4rem 0.6rem' }}>
                            <input
                              type="text"
                              value={tRow.remarks || ''}
                              onChange={(e) => handleUpdateNewAgreementTentativeRow(tIdx, 'remarks', e.target.value)}
                              placeholder="เช่น ล็อต 1"
                              style={{ width: '100%', padding: '0.35rem 0.45rem', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewAgreementTentativeRow(tIdx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.25rem'
                              }}
                              title="ลบรอบนี้"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>บันทึกเพิ่มเติม / หมายเหตุ</label>
              <textarea 
                placeholder="รายละเอียดเพิ่มเติมของสัญญา..." 
                value={newAgreement.remarks} 
                onChange={e => setNewAgreement({...newAgreement, remarks: e.target.value})}
                rows="3"
              ></textarea>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>แนบเอกสารสัญญา (PDF หรือ รูปภาพ)</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles size={13} /> ระบบย่อและบีบอัดไฟล์อัตโนมัติ
                </span>
              </label>
              <div style={{
                border: '2px dashed var(--glass-border)',
                borderRadius: '10px',
                padding: '1.25rem',
                textAlign: 'center',
                background: isUploading ? 'rgba(2, 132, 199, 0.06)' : 'rgba(255,255,255,0.02)',
                cursor: isUploading ? 'wait' : 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { if (!isUploading) e.currentTarget.style.borderColor = 'var(--accent-secondary)'; }}
              onMouseLeave={e => { if (!isUploading) e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
              >
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  multiple 
                  disabled={isUploading}
                  onChange={(e) => handleFileChange(e, false)} 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: isUploading ? 'wait' : 'pointer',
                    zIndex: 2
                  }}
                />
                {isUploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <Loader2 size={26} className="spin" style={{ color: 'var(--accent-secondary)' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                      {uploadStatus || 'กำลังประมวลผลและลดขนาดไฟล์...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <Paperclip size={24} style={{ color: 'var(--accent-secondary)', marginBottom: '0.4rem' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                    </p>
                    <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ⚡ รองรับทั้งไฟล์ PDF และรูปภาพ ระบบจะทำการปรับขนาดและบีบอัดความละเอียดให้คมชัดในขนาดไฟล์ที่กะทัดรัดโดยอัตโนมัติ
                    </p>
                  </>
                )}
              </div>

              {/* Show attached files list */}
              {newAgreement.attachments && newAgreement.attachments.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {newAgreement.attachments.map((file, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                        <FileText size={18} style={{ color: file.type === 'pdf' ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {file.name}
                          </span>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {file.compressedSizeFormatted ? (
                              <>
                                <span>{file.compressedSizeFormatted}</span>
                                {file.savingsPercent > 0 && (
                                  <span style={{ color: 'var(--success, #10b981)', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                    ลดขนาด {file.savingsPercent}% (จาก {file.originalSizeFormatted})
                                  </span>
                                )}
                                {file.totalPages > 1 && (
                                  <span style={{ background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-secondary)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                    {file.totalPages} หน้า
                                  </span>
                                )}
                              </>
                            ) : (
                              <span>{file.type.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button 
                          type="button"
                          onClick={() => openAttachmentViewer(file)}
                          style={{
                            background: 'rgba(2, 132, 199, 0.1)',
                            border: 'none',
                            color: 'var(--accent-secondary)',
                            cursor: 'pointer',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                          title="ดูตัวอย่างเอกสาร"
                        >
                          <Eye size={13} /> ดูเอกสาร
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeAttachment(idx, false)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="ลบไฟล์แนบนี้"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('list')}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary">สร้างสัญญาจัดซื้อ</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search Bar for Agreements */}
          {agreements.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem', maxWidth: '400px' }}>
              <Search size={16} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="ค้นหาตามเลขที่สัญญา, คู่สัญญา หรือชื่อสินค้า..."
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
          )}

          {filteredAgreements.length === 0 ? (
            <div className="glass card" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ opacity: 0.15, marginBottom: '1rem' }} />
              <p>{agreements.length === 0 ? "ยังไม่มีการสร้างสัญญาจัดซื้อในระบบ" : "ไม่พบข้อมูลสัญญาจัดซื้อที่ตรงกับคำค้นหา"}</p>
              {agreements.length === 0 && (
                <button className="btn btn-primary" onClick={() => setActiveTab('new')} style={{ marginTop: '1rem' }}>
                  สร้างสัญญาตัวแรก
                </button>
              )}
            </div>
          ) : (
            filteredAgreements.map(agreement => {
              if (editingAgreementId === agreement.id) {
                return (
                  <div 
                    key={agreement.id} 
                    className="glass card" 
                    style={{ 
                      borderLeft: '4px solid var(--accent-secondary)',
                      padding: '1.5rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>แก้ไขรายละเอียดสัญญา: <strong style={{ color: 'var(--accent-secondary)' }}>{agreement.id}</strong></span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(ไม่สามารถแก้ไขเลขที่สัญญาเพื่อรักษาประวัติรับเข้าได้)</span>
                    </h3>
                    <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>ชื่อผู้จัดจำหน่าย (Supplier) <span style={{ color: 'var(--danger)' }}>*</span></label>
                          <input 
                            type="text" 
                            value={editForm.supplier} 
                            onChange={e => setEditForm({...editForm, supplier: e.target.value})} 
                            required
                          />
                        </div>
                      </div>
                      {/* รายการพัสดุในสัญญา */}
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>รายการพัสดุจัดซื้อตามสัญญา <span style={{ color: 'var(--danger)' }}>*</span></label>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={handleAddEditAgreementItemRow}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Plus size={14} /> เพิ่มรายการพัสดุ
                          </button>
                        </div>
                        
                        <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-bg)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '0.6rem 0.75rem', width: '55%' }}>รายการสินค้า</th>
                                <th style={{ padding: '0.6rem 0.75rem', width: '30%' }}>จำนวนจัดซื้อตามสัญญา</th>
                                <th style={{ padding: '0.6rem 0.75rem', width: '15%', textAlign: 'center' }}>ลบ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(editForm.itemsList || []).map((itemRow, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                  <td style={{ padding: '0.5rem 0.75rem' }}>
                                    <SearchableSelect
                                      value={itemRow.itemName}
                                      onChange={(val) => handleUpdateEditAgreementItemRow(idx, 'itemName', val)}
                                      placeholder="ค้นหาและเลือกสินค้า..."
                                      options={items.map(item => ({ value: item.name, label: item.name }))}
                                    />
                                  </td>
                                  <td style={{ padding: '0.5rem 0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <input
                                        type="number"
                                        value={itemRow.totalQty}
                                        onChange={(e) => handleUpdateEditAgreementItemRow(idx, 'totalQty', e.target.value)}
                                        placeholder="เช่น 1000"
                                        style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.8rem', outline: 'none' }}
                                        required
                                      />
                                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', minWidth: '35px' }}>
                                        {itemRow.unit}
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEditAgreementItemRow(idx)}
                                      disabled={(editForm.itemsList || []).length <= 1}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: (editForm.itemsList || []).length <= 1 ? 'var(--text-muted)' : 'var(--danger)',
                                        cursor: (editForm.itemsList || []).length <= 1 ? 'not-allowed' : 'pointer',
                                        opacity: (editForm.itemsList || []).length <= 1 ? 0.4 : 1,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0.3rem'
                                      }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', gridColumn: 'span 2' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>วันเริ่มสัญญา</label>
                            <input 
                              type="date" 
                              value={editForm.startDate || ''} 
                              onChange={e => setEditForm({...editForm, startDate: e.target.value})} 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>วันหมดอายุสัญญา</label>
                            <input 
                              type="date" 
                              value={editForm.endDate || ''} 
                              onChange={e => setEditForm({...editForm, endDate: e.target.value})} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* แผนการส่งมอบสินค้าล่วงหน้า (Tentative Delivery Schedule) in editForm */}
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '10px', padding: '1.1rem', background: 'rgba(2, 132, 199, 0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                              <CalendarDays size={16} /> แผนการส่งมอบสินค้าล่วงหน้า (Tentative Schedule)
                            </label>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              กำหนดรอบและวันที่คาดว่าสินค้าจะมาส่งมอบตามสัญญา (ปรับเปลี่ยนได้ตลอดเวลา)
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              onClick={() => setAutoSplitConfig({ isEdit: true, roundsCount: 3, intervalType: 'monthly', selectedItemIndex: 0 })}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-color)', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.08)' }}
                              title="ช่วยแบ่งงวดและวันที่อัตโนมัติตามจำนวนรอบที่ต้องการ"
                            >
                              <Sparkles size={13} /> ⚡ ช่วยแบ่งงวดอัตโนมัติ
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              onClick={handleAddEditAgreementTentativeRow}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Plus size={13} /> เพิ่มรอบส่งมอบ
                            </button>
                          </div>
                        </div>

                        {/* Status / Comparison summary bar in editForm */}
                        {(() => {
                          const totalContractQty = (editForm.itemsList || []).reduce((sum, i) => sum + (Number(i.totalQty) || 0), 0);
                          const totalPlannedQty = (editForm.tentativeSchedule || []).reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
                          const diff = totalPlannedQty - totalContractQty;
                          const isMatched = totalPlannedQty > 0 && diff === 0;

                          return (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: isMatched ? 'rgba(16, 185, 129, 0.08)' : (diff > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)'),
                              border: `1px solid ${isMatched ? 'rgba(16, 185, 129, 0.25)' : (diff > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--glass-border)')}`,
                              borderRadius: '6px',
                              padding: '0.45rem 0.75rem',
                              marginBottom: '0.75rem',
                              fontSize: '0.8rem',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>จำนวนรอบที่วางแผน: <strong>{(editForm.tentativeSchedule || []).length} รอบ</strong></span>
                                <span>|</span>
                                <span>ยอดรวมตามแผน: <strong style={{ color: isMatched ? '#10b981' : (diff > 0 ? '#ef4444' : 'var(--accent-secondary)') }}>{totalPlannedQty.toLocaleString()}</strong> / ยอดสัญญา: <strong>{totalContractQty.toLocaleString()}</strong></span>
                              </div>
                              <div>
                                {totalPlannedQty === 0 ? (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(ยังไม่ได้กำหนดแผนส่งมอบ)</span>
                                ) : isMatched ? (
                                  <span style={{ color: 'var(--success, #10b981)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Check size={14} /> แผนตรงตามยอดสัญญาสมบูรณ์ (100%)
                                  </span>
                                ) : diff < 0 ? (
                                  <span style={{ color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <AlertCircle size={14} /> ยังขาดในแผนอีก {Math.abs(diff).toLocaleString()} หน่วย
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <AlertTriangle size={14} /> แผนเกินยอดสัญญา {diff.toLocaleString()} หน่วย
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {(!editForm.tentativeSchedule || editForm.tentativeSchedule.length === 0) ? (
                          <div style={{ textAlign: 'center', padding: '1.25rem', border: '1px dashed var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            ยังไม่มีการระบุแผนการส่งมอบล่วงหน้า (สามารถกดปุ่ม "<strong>⚡ ช่วยแบ่งงวดอัตโนมัติ</strong>" หรือ "<strong>+ เพิ่มรอบส่งมอบ</strong>" เพื่อเริ่มต้น)
                          </div>
                        ) : (
                          <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--glass-bg)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                              <thead>
                                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '0.5rem 0.6rem', width: '10%', textAlign: 'center' }}>รอบที่</th>
                                  <th style={{ padding: '0.5rem 0.6rem', width: '22%' }}>วันที่กำหนดส่ง</th>
                                  <th style={{ padding: '0.5rem 0.6rem', width: '28%' }}>รายการสินค้า</th>
                                  <th style={{ padding: '0.5rem 0.6rem', width: '20%' }}>จำนวนส่งมอบ</th>
                                  <th style={{ padding: '0.5rem 0.6rem', width: '14%' }}>หมายเหตุ</th>
                                  <th style={{ padding: '0.5rem 0.6rem', width: '6%', textAlign: 'center' }}>ลบ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {editForm.tentativeSchedule.map((tRow, tIdx) => (
                                  <tr key={tRow.id || tIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                    <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                                      {tRow.round || (tIdx + 1)}
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem' }}>
                                      <input
                                        type="date"
                                        value={tRow.date || ''}
                                        onChange={(e) => handleUpdateEditAgreementTentativeRow(tIdx, 'date', e.target.value)}
                                        style={{ width: '100%', padding: '0.35rem 0.45rem', fontSize: '0.8rem' }}
                                        required
                                      />
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem' }}>
                                      {(editForm.itemsList && editForm.itemsList.length > 1) ? (
                                        <select
                                          value={tRow.itemName || ''}
                                          onChange={(e) => handleUpdateEditAgreementTentativeRow(tIdx, 'itemName', e.target.value)}
                                          style={{ width: '100%', padding: '0.35rem 0.45rem', fontSize: '0.8rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                                        >
                                          {editForm.itemsList.map((item, iIdx) => (
                                            <option key={iIdx} value={item.itemName}>{item.itemName || `รายการที่ ${iIdx + 1}`}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.82rem' }}>
                                          {tRow.itemName || (editForm.itemsList && editForm.itemsList[0] ? editForm.itemsList[0].itemName : '-')}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <input
                                          type="number"
                                          value={tRow.quantity}
                                          onChange={(e) => handleUpdateEditAgreementTentativeRow(tIdx, 'quantity', e.target.value)}
                                          placeholder="จำนวน"
                                          style={{ width: '100%', padding: '0.35rem 0.45rem', fontSize: '0.8rem', outline: 'none' }}
                                          required
                                        />
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', minWidth: '28px' }}>
                                          {tRow.unit || 'ชิ้น'}
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem' }}>
                                      <input
                                        type="text"
                                        value={tRow.remarks || ''}
                                        onChange={(e) => handleUpdateEditAgreementTentativeRow(tIdx, 'remarks', e.target.value)}
                                        placeholder="เช่น ล็อต 1"
                                        style={{ width: '100%', padding: '0.35rem 0.45rem', fontSize: '0.78rem' }}
                                      />
                                    </td>
                                    <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEditAgreementTentativeRow(tIdx)}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: 'var(--danger)',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '0.25rem'
                                        }}
                                        title="ลบรอบนี้"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>บันทึกเพิ่มเติม / หมายเหตุ</label>
                        <textarea 
                          value={editForm.remarks || ''} 
                          onChange={e => setEditForm({...editForm, remarks: e.target.value})}
                          rows="2"
                        ></textarea>
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          <span>แนบเอกสารสัญญาเพิ่มเติม (PDF หรือ รูปภาพ)</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Sparkles size={13} /> ระบบย่อและบีบอัดไฟล์อัตโนมัติ
                          </span>
                        </label>
                        <div style={{
                          border: '2px dashed var(--glass-border)',
                          borderRadius: '10px',
                          padding: '1.25rem',
                          textAlign: 'center',
                          background: isUploading ? 'rgba(2, 132, 199, 0.06)' : 'rgba(255,255,255,0.02)',
                          cursor: isUploading ? 'wait' : 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => { if (!isUploading) e.currentTarget.style.borderColor = 'var(--accent-secondary)'; }}
                        onMouseLeave={e => { if (!isUploading) e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                        >
                          <input 
                            type="file" 
                            accept="application/pdf,image/*" 
                            multiple 
                            disabled={isUploading}
                            onChange={(e) => handleFileChange(e, true)} 
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              opacity: 0,
                              cursor: isUploading ? 'wait' : 'pointer',
                              zIndex: 2
                            }}
                          />
                          {isUploading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                              <Loader2 size={26} className="spin" style={{ color: 'var(--accent-secondary)' }} />
                              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                                {uploadStatus || 'กำลังประมวลผลและลดขนาดไฟล์...'}
                              </p>
                            </div>
                          ) : (
                            <>
                              <Paperclip size={24} style={{ color: 'var(--accent-secondary)', marginBottom: '0.4rem' }} />
                              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                              </p>
                              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ⚡ รองรับทั้งไฟล์ PDF และรูปภาพ ระบบจะทำการปรับขนาดและบีบอัดความละเอียดให้คมชัดในขนาดไฟล์ที่กะทัดรัดโดยอัตโนมัติ
                              </p>
                            </>
                          )}
                        </div>

                        {/* Show editForm attachments list */}
                        {editForm.attachments && editForm.attachments.length > 0 && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {editForm.attachments.map((file, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.06)',
                                padding: '0.55rem 0.85rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                fontSize: '0.82rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                                  <FileText size={18} style={{ color: file.type === 'pdf' ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 600 }}>
                                      {file.name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                      {file.compressedSizeFormatted ? (
                                        <>
                                          <span>{file.compressedSizeFormatted}</span>
                                          {file.savingsPercent > 0 && (
                                            <span style={{ color: 'var(--success, #10b981)', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                              ลดขนาด {file.savingsPercent}% (จาก {file.originalSizeFormatted})
                                            </span>
                                          )}
                                          {file.totalPages > 1 && (
                                            <span style={{ background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-secondary)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                              {file.totalPages} หน้า
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span>{file.type.toUpperCase()}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <button 
                                    type="button"
                                    onClick={() => openAttachmentViewer(file)}
                                    style={{
                                      background: 'rgba(2, 132, 199, 0.1)',
                                      border: 'none',
                                      color: 'var(--accent-secondary)',
                                      cursor: 'pointer',
                                      padding: '0.35rem 0.55rem',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}
                                    title="ดูตัวอย่างเอกสาร"
                                  >
                                    <Eye size={13} /> ดูเอกสาร
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => removeAttachment(idx, true)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: 'none',
                                      color: 'var(--danger)',
                                      cursor: 'pointer',
                                      padding: '0.35rem',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="ลบไฟล์แนบนี้"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setEditingAgreementId(null); setEditForm(null); }}>ยกเลิก</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent-secondary)', color: '#fff', border: '1px solid var(--accent-secondary)' }}>บันทึกการแก้ไข</button>
                      </div>
                    </form>
                  </div>
                );
              }

              const isExpanded = expandedAgreementId === agreement.id;
              
              // Tri-color bar calculation
              const acceptedPct = Math.min(100, (agreement.acceptedQty / agreement.totalQty) * 100);
              const pendingPct = Math.min(100 - acceptedPct, (agreement.pendingQty / agreement.totalQty) * 100);
              const remainingPct = Math.max(0, 100 - acceptedPct - pendingPct);

              return (
                <div 
                  key={agreement.id} 
                  className="glass card" 
                  style={{ 
                    borderLeft: agreement.displayStatus === 'Completed' ? '4px solid var(--success)' : 
                               agreement.displayStatus === 'Expired' ? '4px solid var(--danger)' : 
                               '4px solid var(--accent-color)',
                    padding: '1.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{agreement.id}</span>
                        <StatusBadge status={agreement.displayStatus} />
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        คู่สัญญา: <strong style={{ color: 'var(--text-primary)' }}>{agreement.supplier}</strong> | รายการพัสดุตามสัญญา: <strong style={{ color: 'var(--text-primary)' }}>{agreement.itemsListWithStats.length} รายการ</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.3rem 0.6rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                          onClick={() => handleStartEdit(agreement)}
                        >
                          <Edit2 size={13} /> แก้ไขข้อมูล
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}
                          onClick={() => {
                            setDeleteAgreementId(agreement.id);
                            setDeletePassword('');
                            setDeleteError('');
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <div>เริ่ม: <strong style={{ color: 'var(--text-secondary)' }}>{agreement.startDate}</strong></div>
                        <div>สิ้นสุด: <strong style={{ color: 'var(--text-secondary)' }}>{agreement.endDate}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* รายการสินค้าแยกย่อยและ Progress Bar ของแต่ละชนิด */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                    {(agreement.itemsListWithStats || []).map((item, itemIdx) => {
                      const itemAcceptedPct = Math.min(100, (item.acceptedQty / Number(item.totalQty || 1)) * 100);
                      const itemPendingPct = Math.min(100 - itemAcceptedPct, (item.pendingQty / Number(item.totalQty || 1)) * 100);
                      const itemRemainingPct = Math.max(0, 100 - itemAcceptedPct - itemPendingPct);

                      return (
                        <div 
                          key={itemIdx} 
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.015)', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: '10px', 
                            padding: '1rem 1.25rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                📦 {item.itemName}
                              </span>
                              {item.remainingStockQty > 0 ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                  คงเหลือในคลัง {item.remainingStockQty.toLocaleString()} {item.unit}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                                  {item.acceptedQty > 0 ? 'สต็อกในคลังหมดแล้ว (0)' : 'ยังไม่เคยรับเข้า'}
                                </span>
                              )}
                              {item.withdrawnQty > 0 && (
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                  ตัดใช้แล้ว {item.withdrawnQty.toLocaleString()} {item.unit}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              ยอดตามสัญญา: <strong style={{ color: 'var(--text-primary)' }}>{Number(item.totalQty).toLocaleString()} {item.unit}</strong>
                            </div>
                          </div>

                          {/* Tri-Color Progress Bar for this item */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                              <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                ตรวจรับผ่านแล้ว: {item.acceptedQty.toLocaleString()} {item.unit} ({itemAcceptedPct.toFixed(1)}%)
                              </span>
                              {item.pendingQty > 0 && (
                                <span style={{ color: 'var(--quarantine)', fontWeight: 600 }}>
                                  รอตรวจรับ: {item.pendingQty.toLocaleString()} {item.unit}
                                </span>
                              )}
                              <span style={{ color: item.outstandingQty > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 600 }}>
                                ค้างรับ: {item.outstandingQty.toLocaleString()} {item.unit}
                              </span>
                            </div>
                            
                            <div style={{ 
                              height: '10px', 
                              background: 'rgba(255,255,255,0.05)', 
                              borderRadius: '10px', 
                              overflow: 'hidden', 
                              display: 'flex',
                              border: '1px solid var(--glass-border)'
                            }}>
                              <div style={{ width: `${itemAcceptedPct}%`, height: '100%', background: 'var(--success)' }} title="ตรวจรับผ่านแล้ว" />
                              <div style={{ width: `${itemPendingPct}%`, height: '100%', background: 'var(--quarantine)' }} title="อยู่ระหว่างรอตรวจรับ" />
                              <div style={{ width: `${itemRemainingPct}%`, height: '100%', background: 'transparent' }} title="ค้างส่งมอบ" />
                            </div>

                            {/* Secondary Stock Status summary line */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '0.4rem' }}>
                              <span>
                                📤 <strong>ตัดใช้แล้ว:</strong> <span style={{ color: '#f59e0b', fontWeight: 700 }}>{item.withdrawnQty.toLocaleString()} {item.unit}</span>
                                {item.acceptedQty > 0 && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}> ({((item.withdrawnQty / item.acceptedQty) * 100).toFixed(1)}% ของยอดรับ)</span>
                                )}
                              </span>
                              <span>
                                📦 <strong>คงเหลือในคลัง:</strong> <span style={{ color: item.remainingStockQty > 0 ? '#10b981' : 'var(--danger)', fontWeight: 700 }}>{item.remainingStockQty.toLocaleString()} {item.unit}</span>
                              </span>
                              <span>
                                ⏳ <strong>รอส่งมอบอีก:</strong> <span style={{ color: item.outstandingQty > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 700 }}>{item.outstandingQty.toLocaleString()} {item.unit}</span>
                              </span>
                            </div>
                          </div>

                          {/* 6-Card Detailed Stats Grid for this item */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                            gap: '0.5rem', 
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            paddingTop: '0.65rem',
                            marginTop: '0.5rem'
                          }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ยอดตามสัญญา</div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>{Number(item.totalQty).toLocaleString()} {item.unit}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>มาส่งแล้วทั้งหมด</div>
                              <div style={{ fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '0.15rem' }}>{item.totalDelivered.toLocaleString()} {item.unit}</div>
                            </div>
                            <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.18)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--success)' }}>ตรวจรับผ่านแล้ว</div>
                              <div style={{ fontWeight: 700, color: 'var(--success)', marginTop: '0.15rem' }}>{item.acceptedQty.toLocaleString()} {item.unit}</div>
                            </div>
                            <div style={{ background: 'rgba(245, 158, 11, 0.04)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.18)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--accent-color)' }}>ยอดค้างส่งมอบ</div>
                              <div style={{ fontWeight: 700, color: item.outstandingQty > 0 ? 'var(--accent-color)' : 'var(--text-muted)', marginTop: '0.15rem' }}>{item.outstandingQty.toLocaleString()} {item.unit}</div>
                            </div>
                            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.28)' }}>
                              <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600 }}>📤 ตัดใช้ไปแล้ว</div>
                              <div style={{ fontWeight: 800, color: '#f59e0b', marginTop: '0.15rem' }}>{item.withdrawnQty.toLocaleString()} {item.unit}</div>
                            </div>
                            <div style={{ background: item.remainingStockQty > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: item.remainingStockQty > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
                              <div style={{ fontSize: '0.68rem', color: item.remainingStockQty > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>📦 คงเหลือในคลัง</div>
                              <div style={{ fontWeight: 800, color: item.remainingStockQty > 0 ? 'var(--success)' : 'var(--danger)', marginTop: '0.15rem' }}>{item.remainingStockQty.toLocaleString()} {item.unit}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* แผนการส่งมอบสินค้าล่วงหน้า (Tentative Schedule) Card Block */}
                  <div style={{
                    background: 'rgba(2, 132, 199, 0.04)',
                    border: '1px solid rgba(2, 132, 199, 0.22)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <CalendarDays size={18} style={{ color: 'var(--accent-secondary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          แผนการส่งมอบสินค้าล่วงหน้า (Tentative Schedule)
                        </span>
                        {agreement.tentativeSchedule && agreement.tentativeSchedule.length > 0 && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.15)', color: 'var(--accent-secondary)' }}>
                            {agreement.tentativeSchedule.length} รอบ
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {agreement.nextTentativeDelivery ? (
                          <div style={{
                            fontSize: '0.78rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            background: agreement.nextTentativeDelivery.status === 'Overdue' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: agreement.nextTentativeDelivery.status === 'Overdue' ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${agreement.nextTentativeDelivery.status === 'Overdue' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <Clock size={13} />
                            <span>
                              {agreement.nextTentativeDelivery.status === 'Overdue' ? '🔴 เกินกำหนดส่ง:' : '⏳ รอบส่งถัดไป:'} รอบที่ {agreement.nextTentativeDelivery.roundNumber} ({agreement.nextTentativeDelivery.date}) จำนวน {agreement.nextTentativeDelivery.quantity.toLocaleString()} {agreement.nextTentativeDelivery.unit}
                              {agreement.nextTentativeDelivery.daysDiff !== null && (
                                <strong style={{ marginLeft: '4px' }}>
                                  {agreement.nextTentativeDelivery.daysDiff === 0 ? '(ส่งวันนี้!)' : (agreement.nextTentativeDelivery.daysDiff > 0 ? `(อีก ${agreement.nextTentativeDelivery.daysDiff} วัน)` : `(เลย ${Math.abs(agreement.nextTentativeDelivery.daysDiff)} วัน)`)}
                                </strong>
                              )}
                            </span>
                          </div>
                        ) : agreement.tentativeSchedule && agreement.tentativeSchedule.length > 0 ? (
                          <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={13} /> ส่งมอบครบถ้วนทุกงวดตามแผนแล้ว
                          </span>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleStartEdit(agreement)}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            borderRadius: '5px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                          title="แก้ไขแผนการส่งมอบ"
                        >
                          <Edit2 size={11} /> {(!agreement.tentativeSchedule || agreement.tentativeSchedule.length === 0) ? '+ กำหนดแผน' : 'แก้ไขแผน'}
                        </button>
                      </div>
                    </div>

                    {/* Table or Empty message */}
                    {(!agreement.tentativeSchedule || agreement.tentativeSchedule.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--glass-border)', borderRadius: '6px' }}>
                        ยังไม่ได้ระบุแผนการส่งมอบล่วงหน้าสำหรับสัญญานี้ <button type="button" onClick={() => handleStartEdit(agreement)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>คลิกที่นี่เพื่อเพิ่มแผน</button>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '700px' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '0.45rem 0.6rem', width: '8%', textAlign: 'center' }}>รอบที่</th>
                              <th style={{ padding: '0.45rem 0.6rem', width: '16%' }}>กำหนดส่งมอบ</th>
                              <th style={{ padding: '0.45rem 0.6rem', width: '22%' }}>รายการสินค้า</th>
                              <th style={{ padding: '0.45rem 0.6rem', width: '15%', textAlign: 'right' }}>จำนวนตามแผน</th>
                              <th style={{ padding: '0.45rem 0.6rem', width: '15%', textAlign: 'right' }}>รับเข้าจริงแล้ว</th>
                              <th style={{ padding: '0.45rem 0.6rem', width: '14%', textAlign: 'center' }}>สถานะงวด</th>
                              <th style={{ padding: '0.45rem 0.6rem', width: '10%' }}>หมายเหตุ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agreement.tentativeSchedule.map((round, rIdx) => (
                              <tr key={round.id || rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)', background: round.status === 'Completed' ? 'rgba(16, 185, 129, 0.02)' : (round.status === 'Overdue' ? 'rgba(239, 68, 68, 0.03)' : 'transparent') }}>
                                <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                                  {round.roundNumber}
                                </td>
                                <td style={{ padding: '0.45rem 0.6rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                  {round.date || '-'}
                                </td>
                                <td style={{ padding: '0.45rem 0.6rem', color: 'var(--text-primary)' }}>
                                  {round.itemName}
                                </td>
                                <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {round.quantity.toLocaleString()} {round.unit}
                                </td>
                                <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>
                                  <span style={{ fontWeight: 700, color: round.fulfilledQty >= round.quantity ? 'var(--success)' : (round.fulfilledQty > 0 ? '#f59e0b' : 'var(--text-muted)') }}>
                                    {round.fulfilledQty.toLocaleString()} {round.unit}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                                    ({round.fulfilledPct}%)
                                  </span>
                                </td>
                                <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>
                                  <TentativeStatusBadge status={round.status} daysDiff={round.daysDiff} />
                                </td>
                                <td style={{ padding: '0.45rem 0.6rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                  {round.remarks || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  {agreement.remarks && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '1rem 0 0 0', fontStyle: 'italic' }}>
                      หมายเหตุ: {agreement.remarks}
                    </p>
                  )}

                  {/* Attachments list in read-only view */}
                  {agreement.attachments && agreement.attachments.length > 0 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>เอกสารแนบสัญญาจัดซื้อ:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {agreement.attachments.map((file, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => openAttachmentViewer(file)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '6px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-secondary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                            title={file.compressedSizeFormatted ? `${file.name} (${file.compressedSizeFormatted}${file.savingsPercent > 0 ? `, ลด ${file.savingsPercent}%` : ''})` : file.name}
                          >
                            <FileText size={14} style={{ color: file.type === 'pdf' ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                            {file.compressedSizeFormatted && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({file.compressedSizeFormatted})</span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.2rem' }}>
                              <Eye size={12} style={{ color: 'var(--accent-secondary)' }} title="ดูตัวอย่าง" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCardAttachment(agreement.id, idx, file.name);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--danger)',
                                  cursor: 'pointer',
                                  padding: '0.1rem 0.2rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  opacity: 0.6,
                                  transition: 'opacity 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; }}
                                title="ลบเอกสารแนบนี้"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expand Timeline Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => setExpandedAgreementId(isExpanded ? null : agreement.id)}
                    >
                      {isExpanded ? (
                        <>ซ่อนรายละเอียดการส่งมอบ <ChevronUp size={16} /></>
                      ) : (
                        <>ดูประวัติการส่งมอบ ({agreement.deliveries.length} รอบ) <ChevronDown size={16} /></>
                      )}
                    </button>
                  </div>

                  {/* Timeline section */}
                  {isExpanded && (
                    <div className="fade-in" style={{ 
                      marginTop: '1.5rem', 
                      borderTop: '1px solid var(--glass-border)', 
                      paddingTop: '1.25rem' 
                    }}>
                      <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)' }}>
                        <PackageOpen size={18} /> ประวัติและสถานะการตรวจส่งมอบแต่ละรอบ
                      </h4>

                      {agreement.deliveries.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          ยังไม่มีการรับของเข้าคลังพัสดุสำหรับสัญญานี้
                        </p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '850px' }}>
                            <thead>
                              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '0.6rem 0.5rem' }}>วันที่นำส่ง</th>
                                <th style={{ padding: '0.6rem 0.5rem' }}>รายการพัสดุ / Lot</th>
                                <th style={{ padding: '0.6rem 0.5rem' }}>QC Lot</th>
                                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>จำนวนส่ง (ตรวจรับ)</th>
                                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#f59e0b' }}>ตัดใช้แล้ว</th>
                                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#10b981' }}>คงเหลือในคลัง</th>
                                <th style={{ padding: '0.6rem 0.5rem' }}>ที่เก็บ</th>
                                <th style={{ padding: '0.6rem 0.5rem' }}>สถานะจัดซื้อ</th>
                                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>การอนุมัติจัดซื้อ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {agreement.deliveries.map(del => {
                                const totalDefective = (del.claimReturns || []).reduce((cSum, cr) => cSum + (cr.syncContractAdjustment !== false ? Number(cr.defectiveQty || 0) : 0), 0);
                                const totalReturned = (del.claimReturns || []).reduce((cSum, cr) => cSum + Number(cr.returnedQty || 0), 0);
                                const rawWithdrawn = (del.withdrawals || []).filter(w => !w.isCancelled).reduce((sum, w) => sum + Number(w.amount || 0), 0);
                                const lotWithdrawn = rawWithdrawn > 0 ? Math.max(0, rawWithdrawn - totalReturned - totalDefective) : Math.max(0, Number(del.quantity || 0) - totalDefective - Number(del.remainingQty !== undefined ? del.remainingQty : del.quantity));
                                const lotRemaining = del.remainingQty !== undefined ? Number(del.remainingQty) : Number(del.quantity || 0);
                                const netDeliveredQty = Math.max(0, Number(del.quantity || 0) - totalDefective);

                                return (
                                  <tr key={del.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '0.6rem 0.5rem' }}>{del.date}</td>
                                    <td style={{ padding: '0.6rem 0.5rem' }}>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{del.itemName}</div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)' }}>Lot: {del.supplierLot}</div>
                                    </td>
                                    <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>{del.inhouseLot || '-'}</td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>
                                      <div style={{ fontWeight: 700 }}>{netDeliveredQty.toLocaleString()} {del.unit}</div>
                                      {totalDefective > 0 && (
                                        <div style={{ fontSize: '0.68rem', color: 'var(--danger)', marginTop: '0.1rem' }}>
                                          (รับเดิม {del.quantity.toLocaleString()} / เคลมชำรุด -{totalDefective.toLocaleString()})
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 600, color: lotWithdrawn > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                                      {lotWithdrawn > 0 ? `-${lotWithdrawn.toLocaleString()} ${del.unit}` : `0 ${del.unit}`}
                                    </td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700, color: lotRemaining > 0 ? '#10b981' : 'var(--danger)' }}>
                                      {lotRemaining.toLocaleString()} {del.unit}
                                    </td>
                                    <td style={{ padding: '0.6rem 0.5rem' }}>{del.location || '-'}</td>
                                    <td style={{ padding: '0.6rem 0.5rem' }}>
                                      <AcceptanceBadge status={del.acceptanceStatus} />
                                    </td>
                                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                                      {del.acceptanceStatus === 'Pending' ? (
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                          <button 
                                            className="btn btn-primary"
                                            onClick={() => handleAcceptDelivery(del.id)}
                                            style={{ 
                                              background: 'var(--success)', 
                                              color: '#fff', 
                                              padding: '0.2rem 0.5rem', 
                                              fontSize: '0.7rem',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.2rem'
                                            }}
                                          >
                                            <Check size={12} /> ตรวจรับผ่าน
                                          </button>
                                          <button 
                                            className="btn"
                                            onClick={() => handleRejectDelivery(del.id)}
                                            style={{ 
                                              background: 'var(--danger)', 
                                              color: '#fff', 
                                              padding: '0.2rem 0.5rem', 
                                              fontSize: '0.7rem',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.2rem'
                                            }}
                                          >
                                            <X size={12} /> ปฏิเสธการรับ
                                          </button>
                                        </div>
                                      ) : del.acceptanceStatus === 'Accepted' ? (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                          <UserCheck size={14} color="var(--success)" /> บันทึกสิทธิ์ตรวจรับแล้ว
                                        </span>
                                      ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                          <AlertTriangle size={14} color="var(--danger)" /> ปฏิเสธตรวจรับเสร็จสิ้น
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
            {/* Auto Split Schedule Modal */}
      {autoSplitConfig !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999
        }}>
          <div className="glass card" style={{
            maxWidth: '500px',
            width: '90%',
            padding: '2rem',
            border: '1px solid var(--accent-secondary)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)', marginBottom: '1.25rem' }}>
              <Sparkles size={20} /> ตัวช่วยแบ่งงวดส่งมอบอัตโนมัติ (Auto-Split)
            </h3>
            
            {(() => {
              const formTarget = autoSplitConfig.isEdit ? editForm : newAgreement;
              const targetItems = formTarget ? (formTarget.itemsList || []) : [];
              const selectedItem = targetItems[autoSplitConfig.selectedItemIndex || 0] || targetItems[0] || { itemName: '-', totalQty: 0, unit: 'ชิ้น' };
              const totalQty = Number(selectedItem.totalQty || 0);
              const rounds = Math.max(1, Number(autoSplitConfig.roundsCount) || 3);
              const base = Math.floor(totalQty / rounds);
              const rem = totalQty - (base * rounds);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {targetItems.length > 1 && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>เลือกสินค้าที่ต้องการแบ่งงวด:</label>
                      <select
                        value={autoSplitConfig.selectedItemIndex || 0}
                        onChange={(e) => setAutoSplitConfig({ ...autoSplitConfig, selectedItemIndex: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                      >
                        {targetItems.map((item, idx) => (
                          <option key={idx} value={idx}>{item.itemName} (ยอด {Number(item.totalQty || 0).toLocaleString()} {item.unit})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                    <div>รายการสินค้า: <strong>{selectedItem.itemName || '-'}</strong></div>
                    <div>ยอดจัดซื้อตามสัญญา: <strong style={{ color: 'var(--accent-secondary)' }}>{totalQty.toLocaleString()} {selectedItem.unit}</strong></div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>จำนวนรอบที่ต้องการแบ่งส่ง (รอบ):</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        max="36"
                        value={autoSplitConfig.roundsCount}
                        onChange={(e) => setAutoSplitConfig({ ...autoSplitConfig, roundsCount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        style={{ width: '80px', padding: '0.45rem', fontSize: '0.9rem', textAlign: 'center' }}
                      />
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {[2, 3, 4, 6, 12].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setAutoSplitConfig({ ...autoSplitConfig, roundsCount: r })}
                            style={{
                              padding: '0.35rem 0.6rem',
                              fontSize: '0.78rem',
                              borderRadius: '4px',
                              background: autoSplitConfig.roundsCount === r ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.05)',
                              color: autoSplitConfig.roundsCount === r ? '#fff' : 'var(--text-secondary)',
                              border: '1px solid var(--glass-border)',
                              cursor: 'pointer'
                            }}
                          >
                            {r} รอบ
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>ระยะห่างระหว่างงวด:</label>
                    <select
                      value={autoSplitConfig.intervalType}
                      onChange={(e) => setAutoSplitConfig({ ...autoSplitConfig, intervalType: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                    >
                      <option value="monthly">รายเดือน (ทุก 1 เดือน)</option>
                      <option value="biweekly">ทุก 15 วัน (Bi-weekly)</option>
                      <option value="quarterly">รายไตรมาส (ทุก 3 เดือน)</option>
                      <option value="evenly">กระจายสม่ำเสมอตลอดระยะเวลาสัญญา</option>
                    </select>
                  </div>

                  {/* Preview Calculation */}
                  <div style={{ background: 'rgba(2, 132, 199, 0.06)', border: '1px solid rgba(2, 132, 199, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: '0.3rem' }}>ตัวอย่างการแบ่งงวด:</div>
                    <div>• รอบที่ 1 ถึง {rounds > 1 ? rounds - 1 : 1}: ส่งรอบละ <strong>{base.toLocaleString()}</strong> {selectedItem.unit}</div>
                    {rounds > 1 && rem > 0 && (
                      <div>• รอบสุดท้าย (รอบที่ {rounds}): ส่ง <strong>{(base + rem).toLocaleString()}</strong> {selectedItem.unit} (รวมเศษคงเหลือ)</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setAutoSplitConfig(null)}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleExecuteAutoSplit(autoSplitConfig.isEdit, autoSplitConfig.roundsCount, autoSplitConfig.intervalType, autoSplitConfig.selectedItemIndex || 0)}
                      style={{ background: 'var(--accent-secondary)', color: '#fff' }}
                    >
                      ยืนยันการแบ่งงวด
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Deletion Warning Modal */}
      {deleteAgreementId !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="glass card" style={{
            maxWidth: '550px',
            width: '90%',
            padding: '2.5rem',
            border: '1px solid var(--danger)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '1.25rem' }}>
              <AlertTriangle size={24} /> ยืนยันการลบสัญญาจัดซื้อ
            </h3>
            
            {activeDeliveriesCount > 0 ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                color: 'var(--danger)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '0.88rem',
                lineHeight: '1.5',
                marginBottom: '1.5rem'
              }}>
                <strong>คำเตือนสำคัญ ⚠️:</strong> สัญญานี้มีรายการรับเข้าพัสดุเชื่อมโยงอยู่ทั้งหมด <strong>{activeDeliveriesCount} รายการ</strong> การลบสัญญานี้จะส่งผลให้รายการพัสดุรับเข้าเหล่านั้นกลายเป็น "ไม่มีสัญญาจัดซื้ออ้างอิง" หากไม่ใช่กรณีพิมพ์ผิดร้ายแรง แนะนำให้ใช้ฟังก์ชัน "แก้ไขข้อมูลสัญญา" แทน
              </div>
            ) : (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                color: 'var(--accent-color)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontSize: '0.88rem',
                lineHeight: '1.5',
                marginBottom: '1.5rem'
              }}>
                <strong>ข้อควรระวัง ⚠️:</strong> การลบสัญญานี้จะไม่สามารถย้อนกลับได้ กรุณาตรวจสอบให้มั่นใจว่าข้อมูลสัญญาไม่ถูกต้องจริงๆ หรือใช้การแก้ไขแทน
              </div>
            )}

            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              กรุณากรอกรหัสผ่านเพื่อยืนยันการลบสัญญาจัดซื้อ: <strong>{deleteAgreementId}</strong>
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (deletePassword === '5640502') {
                const updated = agreements.filter(ag => ag.id !== deleteAgreementId);
                setAgreements(updated);
                setDeleteAgreementId(null);
                alert(`ลบสัญญาจัดซื้อ ${deleteAgreementId} เรียบร้อยแล้ว!`);
              } else {
                setDeleteError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
                setDeletePassword('');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="password"
                placeholder="กรอกรหัสผ่าน..."
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  letterSpacing: '0.2rem',
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
                autoFocus
              />

              {deleteError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setDeleteAgreementId(null)}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }}
                >
                  ยืนยันการลบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    'Active': { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', label: 'กำลังดำเนินการ' },
    'Completed': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'เสร็จสิ้นสัญญา' },
    'Expired': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'หมดอายุสัญญา' }
  };
  const current = styles[status] || styles.Active;
  return (
    <span style={{ 
      padding: '0.2rem 0.6rem', 
      borderRadius: '4px', 
      fontSize: '0.75rem', 
      fontWeight: 700, 
      backgroundColor: current.bg, 
      color: current.text 
    }}>{current.label}</span>
  );
};

const AcceptanceBadge = ({ status }) => {
  const styles = {
    'Pending': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'รอการตรวจรับ' },
    'Accepted': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'ตรวจรับผ่านแล้ว' },
    'Rejected': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'ปฏิเสธการตรวจรับ' }
  };
  const current = styles[status] || styles.Pending;
  return (
    <span style={{ 
      padding: '0.15rem 0.5rem', 
      borderRadius: '4px', 
      fontSize: '0.7rem', 
      fontWeight: 600, 
      backgroundColor: current.bg, 
      color: current.text 
    }}>{current.label}</span>
  );
};

const TentativeStatusBadge = ({ status, daysDiff }) => {
  if (status === 'Completed') {
    return (
      <span style={{ 
        padding: '0.15rem 0.5rem', 
        borderRadius: '4px', 
        fontSize: '0.7rem', 
        fontWeight: 700, 
        backgroundColor: 'rgba(16, 185, 129, 0.15)', 
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        <CheckCircle2 size={12} /> ส่งมอบครบแล้ว
      </span>
    );
  }
  if (status === 'Partial') {
    return (
      <span style={{ 
        padding: '0.15rem 0.5rem', 
        borderRadius: '4px', 
        fontSize: '0.7rem', 
        fontWeight: 700, 
        backgroundColor: 'rgba(245, 158, 11, 0.15)', 
        color: '#f59e0b',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        <Clock size={12} /> ส่งมอบแล้วบางส่วน
      </span>
    );
  }
  if (status === 'Overdue') {
    return (
      <span style={{ 
        padding: '0.15rem 0.5rem', 
        borderRadius: '4px', 
        fontSize: '0.7rem', 
        fontWeight: 700, 
        backgroundColor: 'rgba(239, 68, 68, 0.15)', 
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        <AlertTriangle size={12} /> เกินกำหนด {daysDiff !== null && daysDiff < 0 ? `(${Math.abs(daysDiff)} วัน)` : ''}
      </span>
    );
  }
  // Pending / Upcoming
  return (
    <span style={{ 
      padding: '0.15rem 0.5rem', 
      borderRadius: '4px', 
      fontSize: '0.7rem', 
      fontWeight: 600, 
      backgroundColor: 'rgba(2, 132, 199, 0.12)', 
      color: '#0284c7',
      border: '1px solid rgba(2, 132, 199, 0.25)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <Calendar size={12} /> รอส่งมอบ {daysDiff !== null && daysDiff >= 0 ? `(อีก ${daysDiff} วัน)` : ''}
    </span>
  );
};

export default Agreements;
