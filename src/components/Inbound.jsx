import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Save, Printer, Copy, Search, Upload, Download, RotateCcw, RefreshCw, AlertCircle, Calendar, MapPin, Check, FileText, CheckCircle2, PackageCheck, ArrowDownRight, Package, ShieldCheck, HelpCircle, ArrowRight, CornerDownRight, Edit2, X } from 'lucide-react';
import ExcelJS from 'exceljs';

const SearchableSelect = ({ value, onChange, options = [], placeholder, disabled }) => {
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
      const showAbove = spaceBelow < 200 && rect.top > 200;
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
          fontSize: '0.78rem',
          padding: '0.4rem 0.3rem',
          background: 'var(--input-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}
      />
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
              maxHeight: '200px',
              overflowY: 'auto',
              background: '#ffffff',
              border: '1.5px solid var(--accent-secondary, #0284c7)',
              borderRadius: '6px',
              boxShadow: '0 15px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)',
              zIndex: 99999,
              padding: '0.2rem 0',
              boxSizing: 'border-box'
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '0.5rem', color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', textAlign: 'center' }}>
                ไม่พบข้อมูล
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
                    padding: '0.45rem 0.6rem',
                    fontSize: '0.78rem',
                    color: opt.value === value ? 'var(--accent-secondary, #0284c7)' : 'var(--text-primary, #0f172a)',
                    background: opt.value === value ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                    textAlign: 'left',
                    fontWeight: opt.value === value ? '600' : 'normal',
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
                  {opt.value === value && <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary, #0284c7)', fontWeight: 'bold' }}>✓</span>}
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

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
};

const escapeHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const Inbound = ({ setInventory, items, inventory = [], agreements = [] }) => {
  const [inboundTab, setInboundTab] = useState('draft'); // 'draft', 'claim_return', or 'history'
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historySortType, setHistorySortType] = useState('date-desc');
  const [historyFilterItem, setHistoryFilterItem] = useState('All');
  const [historyFilterQC, setHistoryFilterQC] = useState('All');
  const [historyFilterLocation, setHistoryFilterLocation] = useState('All');
  const [historyFilterContract, setHistoryFilterContract] = useState('All');

  // Edit Inbound Lot Modal State
  const [editingInboundLot, setEditingInboundLot] = useState(null);
  const [editInboundFormData, setEditInboundFormData] = useState({
    date: '',
    itemName: '',
    unit: 'ชิ้น',
    supplierLot: '',
    inhouseLot: '',
    qcStatus: 'Quarantine',
    packSize: '',
    quantity: '',
    location: '',
    agreementId: '',
    acceptanceStatus: '',
    remarks: ''
  });

  const handleOpenEditInboundModal = (lot) => {
    if (!lot) return;
    setEditingInboundLot(lot);
    const matchedItem = (items || []).find(i => i.name === lot.itemName);
    setEditInboundFormData({
      date: lot.date || new Date().toISOString().split('T')[0],
      itemName: lot.itemName || '',
      unit: lot.unit || (matchedItem ? matchedItem.unit : 'ชิ้น'),
      supplierLot: lot.supplierLot || '',
      inhouseLot: lot.inhouseLot || '',
      qcStatus: lot.qcStatus || 'Quarantine',
      packSize: lot.packSize || '',
      quantity: String(lot.quantity || 0),
      location: lot.location || '',
      agreementId: lot.agreementId || '',
      acceptanceStatus: lot.acceptanceStatus || '',
      remarks: lot.remarks || ''
    });
  };

  const handleSaveEditInbound = (e) => {
    if (e) e.preventDefault();
    if (!editingInboundLot) return;

    if (!editInboundFormData.itemName || !editInboundFormData.supplierLot || !editInboundFormData.quantity) {
      alert("กรุณากรอกข้อมูลที่จำเป็น: รายการสินค้า, Supplier Lot, และจำนวน");
      return;
    }

    const newQty = Number(editInboundFormData.quantity);
    if (isNaN(newQty) || newQty <= 0) {
      alert("กรุณากรอกจำนวนให้ถูกต้อง (ต้องมากกว่า 0)");
      return;
    }

    // Check if new quantity is less than total already withdrawn
    const existingWithdrawals = (editingInboundLot.withdrawals || []).filter(w => !w.isCancelled);
    const totalWithdrawn = existingWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const existingClaimReturns = editingInboundLot.claimReturns || [];
    const totalReturned = existingClaimReturns.reduce((sum, cr) => sum + Number(cr.returnedQty || 0), 0);

    if (newQty < totalWithdrawn) {
      const confirmReduce = window.confirm(
        `คำเตือน: จำนวนรับเข้าใหม่ (${newQty.toLocaleString()}) น้อยกว่ายอดที่เคยตัดจ่ายไปแล้ว (${totalWithdrawn.toLocaleString()})\n\nคุณแน่ใจหรือไม่ที่จะบันทึกการแก้ไขนี้?`
      );
      if (!confirmReduce) return;
    }

    const newRemainingQty = Math.max(0, newQty - totalWithdrawn + totalReturned);

    setInventory(prev => prev.map(lot => {
      if (String(lot.id) === String(editingInboundLot.id)) {
        // Cascade updates to withdrawals
        const updatedWithdrawals = (lot.withdrawals || []).map(w => ({
          ...w,
          itemName: editInboundFormData.itemName,
          supplierLot: editInboundFormData.supplierLot,
          inhouseLot: editInboundFormData.inhouseLot,
          agreementId: editInboundFormData.agreementId,
          unit: editInboundFormData.unit,
          packSize: editInboundFormData.packSize
        }));

        // Cascade updates to claim returns
        const updatedClaimReturns = (lot.claimReturns || []).map(cr => ({
          ...cr,
          itemName: editInboundFormData.itemName,
          supplierLot: editInboundFormData.supplierLot,
          inhouseLot: editInboundFormData.inhouseLot,
          agreementId: editInboundFormData.agreementId,
          unit: editInboundFormData.unit
        }));

        return {
          ...lot,
          date: editInboundFormData.date,
          itemName: editInboundFormData.itemName,
          unit: editInboundFormData.unit,
          supplierLot: editInboundFormData.supplierLot,
          inhouseLot: editInboundFormData.inhouseLot,
          qcStatus: editInboundFormData.qcStatus,
          packSize: editInboundFormData.packSize,
          quantity: newQty,
          remainingQty: newRemainingQty,
          location: editInboundFormData.location,
          agreementId: editInboundFormData.agreementId,
          acceptanceStatus: editInboundFormData.agreementId ? (editInboundFormData.acceptanceStatus || 'Pending') : '',
          remarks: editInboundFormData.remarks,
          withdrawals: updatedWithdrawals,
          claimReturns: updatedClaimReturns,
          lastEditedAt: new Date().toISOString()
        };
      }
      return lot;
    }));

    alert(
      `บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว!\n\n` +
      `📦 รายการ: ${editInboundFormData.itemName}\n` +
      `🏷️ Supplier Lot: ${editInboundFormData.supplierLot}\n` +
      `🧪 QC Lot: ${editInboundFormData.inhouseLot || '-'}\n` +
      `📊 จำนวนรับเข้า: ${newQty.toLocaleString()} ${editInboundFormData.unit}\n` +
      `📄 สัญญา: ${editInboundFormData.agreementId || 'ไม่มีสัญญา'}\n\n` +
      `ข้อมูลถูกปรับปรุงและเชื่อมโยงไปยังคลังพัสดุ, รายการตัดจ่าย และสัญญาจัดซื้อเรียบร้อยแล้ว`
    );

    setEditingInboundLot(null);
  };

  // Claim Return & Lot Top-Up states
  const [selectedClaimLotId, setSelectedClaimLotId] = useState('');
  const [claimReturnDate, setClaimReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [claimReturnedQty, setClaimReturnedQty] = useState('');
  const [claimDefectiveQty, setClaimDefectiveQty] = useState('');
  const [claimLocation, setClaimLocation] = useState('');
  const [claimOperator, setClaimOperator] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [syncContractAdjustment, setSyncContractAdjustment] = useState(true);
  const [claimSearchFilter, setClaimSearchFilter] = useState('');
  const [claimReturnSubTab, setClaimReturnSubTab] = useState('new'); // 'new' or 'history'
  const [claimHistorySearch, setClaimHistorySearch] = useState('');

  // Lots that can be topped up / returned from claim
  const claimableLots = useMemo(() => {
    return (inventory || []).filter(lot => {
      if (!lot || lot.isCancelled) return false;
      return true; // Any lot in inventory can receive returns / replenish
    });
  }, [inventory]);

  const filteredClaimableLots = useMemo(() => {
    if (!claimSearchFilter.trim()) return claimableLots;
    const q = claimSearchFilter.toLowerCase().trim();
    return claimableLots.filter(l => 
      (l.itemName && l.itemName.toLowerCase().includes(q)) ||
      (l.supplierLot && l.supplierLot.toLowerCase().includes(q)) ||
      (l.inhouseLot && l.inhouseLot.toLowerCase().includes(q)) ||
      (l.agreementId && l.agreementId.toLowerCase().includes(q)) ||
      (l.location && l.location.toLowerCase().includes(q))
    );
  }, [claimableLots, claimSearchFilter]);

  const selectedLotForClaim = useMemo(() => {
    if (!selectedClaimLotId) return null;
    return (inventory || []).find(l => String(l.id) === String(selectedClaimLotId));
  }, [inventory, selectedClaimLotId]);

  const lotClaimStats = useMemo(() => {
    if (!selectedLotForClaim) return { totalClaimed: 0, totalWithdrawn: 0, totalPreviouslyReturned: 0, totalDefective: 0, pendingClaimReturn: 0 };
    const claimWithdrawals = (selectedLotForClaim.withdrawals || []).filter(w => !w.isCancelled && (w.reason || '').includes('เคลม'));
    const totalClaimed = claimWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const allWithdrawals = (selectedLotForClaim.withdrawals || []).filter(w => !w.isCancelled);
    const totalWithdrawn = allWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const prevReturns = (selectedLotForClaim.claimReturns || []);
    const totalPreviouslyReturned = prevReturns.reduce((sum, cr) => sum + Number(cr.returnedQty || 0), 0);
    const totalDefective = prevReturns.reduce((sum, cr) => sum + Number(cr.defectiveQty || 0), 0);
    const baseTarget = totalClaimed > 0 ? totalClaimed : totalWithdrawn;
    const pendingClaimReturn = Math.max(0, baseTarget - totalPreviouslyReturned - totalDefective);
    return {
      totalClaimed,
      totalWithdrawn,
      totalPreviouslyReturned,
      totalDefective,
      pendingClaimReturn
    };
  }, [selectedLotForClaim]);

  // Handle lot selection for claim return
  const handleSelectLotForClaim = (lotId) => {
    setSelectedClaimLotId(lotId);
    const targetLot = (inventory || []).find(l => String(l.id) === String(lotId));
    if (targetLot) {
      setClaimLocation(targetLot.location || '');
      const claimWithdrawals = (targetLot.withdrawals || []).filter(w => !w.isCancelled && (w.reason || '').includes('เคลม'));
      const totalClaimed = claimWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
      const allWithdrawals = (targetLot.withdrawals || []).filter(w => !w.isCancelled);
      const totalWithdrawn = allWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
      const prevReturns = (targetLot.claimReturns || []);
      const totalPrev = prevReturns.reduce((sum, cr) => sum + Number(cr.returnedQty || 0), 0) + prevReturns.reduce((sum, cr) => sum + Number(cr.defectiveQty || 0), 0);
      const defaultPending = Math.max(0, (totalClaimed > 0 ? totalClaimed : totalWithdrawn) - totalPrev);
      if (defaultPending > 0) {
        setClaimReturnedQty(String(defaultPending));
        setClaimDefectiveQty('0');
      } else {
        setClaimReturnedQty('');
        setClaimDefectiveQty('0');
      }
    }
  };

  const handleReturnedQtyChange = (val) => {
    setClaimReturnedQty(val);
    const num = Number(val) || 0;
    if (lotClaimStats.pendingClaimReturn > 0) {
      const diff = Math.max(0, lotClaimStats.pendingClaimReturn - num);
      setClaimDefectiveQty(String(diff));
    }
  };

  const handleSaveClaimReturn = (e) => {
    if (e) e.preventDefault();
    if (!selectedLotForClaim) {
      alert("กรุณาเลือก Lot ที่ต้องการทำรายการรับคืน");
      return;
    }
    const returnQtyNum = Number(claimReturnedQty) || 0;
    const defectiveQtyNum = Number(claimDefectiveQty) || 0;

    if (returnQtyNum <= 0 && defectiveQtyNum <= 0) {
      alert("กรุณาระบุจำนวนของดีที่รับคืน หรือจำนวนของเสียที่ตัดทิ้ง (ต้องมากกว่า 0)");
      return;
    }

    const newClaimReturnRecord = {
      id: `CR-${Date.now().toString().slice(-6)}`,
      date: claimReturnDate,
      returnedQty: returnQtyNum,
      defectiveQty: defectiveQtyNum,
      location: claimLocation || selectedLotForClaim.location,
      operator: claimOperator || '',
      note: claimNote || '',
      createdAt: new Date().toISOString(),
      syncContractAdjustment: syncContractAdjustment
    };

    setInventory(prev => prev.map(lot => {
      if (String(lot.id) === String(selectedLotForClaim.id)) {
        const currentRem = Number(lot.remainingQty || 0);
        const newRem = currentRem + returnQtyNum;
        const currentReturns = lot.claimReturns || [];
        return {
          ...lot,
          remainingQty: newRem,
          location: claimLocation ? claimLocation : lot.location,
          claimReturns: [...currentReturns, newClaimReturnRecord]
        };
      }
      return lot;
    }));

    alert(`บันทึกการรับคืนพัสดุสำเร็จ!\n- รับของดีเข้าสต็อก: +${returnQtyNum.toLocaleString()} ${selectedLotForClaim.unit || 'ชิ้น'}\n- ปรับตัดของเสีย: ${defectiveQtyNum.toLocaleString()} ${selectedLotForClaim.unit || 'ชิ้น'}${syncContractAdjustment && selectedLotForClaim.agreementId ? `\n- ปรับปรุงยอดสัญญา ${selectedLotForClaim.agreementId} เรียบร้อยแล้ว` : ''}`);

    // Reset inputs
    setClaimReturnedQty('');
    setClaimDefectiveQty('');
    setClaimNote('');
    setClaimOperator('');
    setSelectedClaimLotId('');
    setClaimReturnSubTab('history');
  };

  const allClaimReturnHistory = useMemo(() => {
    const list = [];
    (inventory || []).forEach(lot => {
      if (lot && lot.claimReturns && lot.claimReturns.length > 0) {
        lot.claimReturns.forEach(cr => {
          list.push({
            ...cr,
            lotId: lot.id,
            itemName: lot.itemName,
            supplierLot: lot.supplierLot,
            inhouseLot: lot.inhouseLot,
            unit: lot.unit || 'ชิ้น',
            agreementId: lot.agreementId || '',
            originalLotQty: lot.quantity,
            currentLotRemaining: lot.remainingQty
          });
        });
      }
    });
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || String(b.id || '').localeCompare(String(a.id || '')));
  }, [inventory]);

  const filteredClaimReturnHistory = useMemo(() => {
    if (!claimHistorySearch.trim()) return allClaimReturnHistory;
    const q = claimHistorySearch.toLowerCase().trim();
    return allClaimReturnHistory.filter(h => 
      (h.id && h.id.toLowerCase().includes(q)) ||
      (h.itemName && h.itemName.toLowerCase().includes(q)) ||
      (h.supplierLot && h.supplierLot.toLowerCase().includes(q)) ||
      (h.inhouseLot && h.inhouseLot.toLowerCase().includes(q)) ||
      (h.agreementId && h.agreementId.toLowerCase().includes(q)) ||
      (h.operator && h.operator.toLowerCase().includes(q)) ||
      (h.note && h.note.toLowerCase().includes(q))
    );
  }, [allClaimReturnHistory, claimHistorySearch]);

  const printClaimReturnSlip = (record) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อพิมพ์เอกสาร");
      return;
    }
    const html = `
      <html>
        <head>
          <title>ใบรับคืนพัสดุจากการเคลม / เติมสต็อก - NBC Stock</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #1f2937; line-height: 1.5; font-size: 13px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 700; color: #0284c7; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; }
            .highlight { background-color: #f0fdf4; font-weight: 700; color: #15803d; }
            .danger-text { color: #b91c1c; font-weight: 700; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-box { width: 40%; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">ใบรับคืนพัสดุจากการตัดเคลม (Claim Return Slip)</div>
              <div style="color: #64748b; font-size: 12px;">ศูนย์บริการโลหิตแห่งชาติ สภากาชาดไทย (NBC Stock)</div>
            </div>
            <div style="text-align: right;">
              <div><strong>เลขที่เอกสาร:</strong> ${record.id}</div>
              <div><strong>วันที่รับคืน:</strong> ${record.date}</div>
            </div>
          </div>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div><strong>รายการพัสดุ:</strong> ${escapeHTML(record.itemName)}</div>
              <div><strong>เลขที่สัญญาจัดซื้อ:</strong> ${escapeHTML(record.agreementId || '-')}</div>
              <div><strong>Supplier Lot:</strong> ${escapeHTML(record.supplierLot)}</div>
              <div><strong>QC Lot:</strong> ${escapeHTML(record.inhouseLot || '-')}</div>
              <div><strong>สถานที่จัดเก็บ:</strong> ${escapeHTML(record.location || '-')}</div>
              <div><strong>ผู้ตรวจรับ/ผู้บันทึก:</strong> ${escapeHTML(record.operator || '-')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>รายละเอียด</th>
                <th style="text-align: right; width: 25%;">จำนวน</th>
                <th style="width: 15%;">หน่วย</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ยอดรับเข้าคลังครั้งแรกเดิม (Original Inbound Qty)</td>
                <td style="text-align: right;">${(record.originalLotQty || 0).toLocaleString()}</td>
                <td>${escapeHTML(record.unit)}</td>
              </tr>
              <tr class="highlight">
                <td><strong>✅ จำนวนของดีที่รับกลับเข้าคลัง (+สต็อกพร้อมใช้)</strong></td>
                <td style="text-align: right; font-size: 15px;">+${(record.returnedQty || 0).toLocaleString()}</td>
                <td>${escapeHTML(record.unit)}</td>
              </tr>
              <tr>
                <td><span class="danger-text">❌ จำนวนของเสีย/เคลมทิ้ง ไม่ส่งกลับ (-หักลดยอดตรวจรับสัญญา)</span></td>
                <td style="text-align: right;" class="danger-text">-${(record.defectiveQty || 0).toLocaleString()}</td>
                <td>${escapeHTML(record.unit)}</td>
              </tr>
              <tr>
                <td><strong>📦 ยอดคงเหลือพร้อมใช้ในคลังปัจจุบัน (Current Stock on Hand)</strong></td>
                <td style="text-align: right; font-weight: 700;">${(record.currentLotRemaining || 0).toLocaleString()}</td>
                <td>${escapeHTML(record.unit)}</td>
              </tr>
            </tbody>
          </table>

          ${record.note ? `<p><strong>หมายเหตุ:</strong> ${escapeHTML(record.note)}</p>` : ''}

          <div class="signatures">
            <div class="sig-box">
              <br><br>
              <p>____________________________________</p>
              <p><strong>ผู้ส่งมอบ / ตัวแทน Supplier</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
            <div class="sig-box">
              <br><br>
              <p>____________________________________</p>
              <p><strong>ผู้รับมอบ / เจ้าหน้าที่คลังพัสดุ</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  const getLatestInhouseLot = (itemName) => {
    if (!itemName) return '-';
    const matches = (inventory || []).filter(item => 
      item &&
      item.itemName === itemName && 
      item.inhouseLot && 
      item.inhouseLot.trim() !== ''
    );
    if (matches.length === 0) return '-';

    const parseInhouseLot = (lotStr) => {
      if (!lotStr) return null;
      // Format example: "SDVP 52/0569" or "SDVP 31/0569"
      const match = lotStr.trim().match(/^([A-Za-z0-9\s-]+)\s+(\d+)\/(\d{2})(\d{2})$/);
      if (match) {
        return {
          prefix: match[1].trim(),
          seq: parseInt(match[2], 10),
          month: parseInt(match[3], 10),
          year: parseInt(match[4], 10)
        };
      }
      return null;
    };

    matches.sort((a, b) => {
      const parsedA = parseInhouseLot(a.inhouseLot);
      const parsedB = parseInhouseLot(b.inhouseLot);

      if (!parsedA && !parsedB) {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
        return dateB - dateA;
      }
      if (!parsedA) return 1;
      if (!parsedB) return -1;

      // 1. Compare year (last 2 digits) descending
      if (parsedA.year !== parsedB.year) {
        return parsedB.year - parsedA.year;
      }

      // 2. Compare month (first 2 digits of suffix) descending
      if (parsedA.month !== parsedB.month) {
        return parsedB.month - parsedA.month;
      }

      // 3. Compare seq (number before /) descending
      return parsedB.seq - parsedA.seq;
    });

    return matches[0].inhouseLot;
  };

  const [entries, setEntries] = useState(() => [{
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    itemName: (items && items.length > 0) ? items[0].name : '',
    unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
    supplierLot: '',
    inhouseLot: '',
    qcStatus: 'Quarantine',
    packSize: '',
    quantity: '',
    location: '',
    remarks: '',
    agreementId: ''
  }]);

  const addEntry = () => {
    setEntries([...entries, {
      id: Date.now() + Math.random(),
      date: new Date().toISOString().split('T')[0],
      itemName: (items && items.length > 0) ? items[0].name : '',
      unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
      supplierLot: '',
      inhouseLot: '',
      qcStatus: 'Quarantine',
      packSize: '',
      quantity: '',
      location: '',
      remarks: '',
      agreementId: ''
    }]);
  };

  const addCopiedEntry = () => {
    if (entries.length === 0) {
      addEntry();
      return;
    }
    const lastEntry = entries[entries.length - 1];
    setEntries([...entries, {
      id: Date.now() + Math.random(),
      date: lastEntry.date,
      itemName: lastEntry.itemName,
      unit: lastEntry.unit,
      agreementId: lastEntry.agreementId || '',
      supplierLot: '',
      inhouseLot: '',
      qcStatus: lastEntry.qcStatus || 'Quarantine',
      packSize: lastEntry.packSize || '',
      quantity: '',
      location: lastEntry.location || '',
      remarks: lastEntry.remarks || '',
    }]);
  };

  const removeEntry = (id) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id, field, value) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
        if (field === 'itemName') {
          const selectedItem = items.find(i => i.name === value);
          return { ...e, itemName: value, unit: selectedItem ? selectedItem.unit : 'ชิ้น' };
        }
        return { ...e, [field]: value };
      }
      return e;
    }));
  };

  const handleSave = () => {
    // Basic validation
    const hasRequired = entries.every(e => e.itemName && e.quantity && e.supplierLot);
    if (!hasRequired) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รายการสินค้า, จำนวน, Supplier Lot)");
      return;
    }

    const hasValidQty = entries.every(e => Number(e.quantity) > 0);
    if (!hasValidQty) {
      alert("กรุณากรอกจำนวนให้ถูกต้อง (ต้องมีค่ามากกว่า 0)");
      return;
    }

    const newRecords = entries.map(e => ({
      ...e,
      remainingQty: Number(e.quantity),
      withdrawals: [], // Array for Mod 1 requirements
      createdAt: new Date().toISOString(),
      acceptanceStatus: e.agreementId ? 'Pending' : ''
    }));

    setInventory(prev => [...prev, ...newRecords]);
    alert(`บันทึกสำเร็จ ${entries.length} รายการ`);
    // Reset form
    setEntries([{
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      itemName: (items && items.length > 0) ? items[0].name : '',
      unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
      supplierLot: '',
      inhouseLot: '',
      qcStatus: 'Quarantine',
      packSize: '',
      quantity: '',
      location: '',
      remarks: '',
      agreementId: ''
    }]);
  };

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // 1. Create Inbound Form sheet
      const formSheet = workbook.addWorksheet('Inbound Form');
      
      // 2. Create Product Registry sheet (visible, contains list of items and units)
      const registrySheet = workbook.addWorksheet('Product Registry');

      // 2.5 Create Contract Registry sheet (visible, contains list of active contracts)
      const contractSheet = workbook.addWorksheet('Contract Registry');
      
      // 3. Populate Product Registry
      registrySheet.columns = [
        { header: 'ชื่อสินค้า', key: 'name', width: 40 },
        { header: 'หน่วย', key: 'unit', width: 15 }
      ];
      
      if (items && items.length > 0) {
        items.forEach(item => {
          registrySheet.addRow({ name: item.name, unit: item.unit });
        });
      } else {
        registrySheet.addRow({ name: 'Raw Material A', unit: 'ชิ้น' });
      }

      // Format registry headers
      const regHeaderRow = registrySheet.getRow(1);
      regHeaderRow.height = 25;
      regHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Inter', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF475569' } // Slate-600
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      registrySheet.views = [{ showGridLines: true }];

      // 3.5 Populate Contract Registry
      contractSheet.columns = [
        { header: 'เลขที่สัญญาจัดซื้อ', key: 'id', width: 25 },
        { header: 'ชื่อสินค้า', key: 'itemName', width: 40 }
      ];

      const activeAgreements = agreements ? agreements.filter(ag => ag.status !== 'Completed') : [];
      if (activeAgreements.length > 0) {
        activeAgreements.forEach(ag => {
          if (ag.itemsList && ag.itemsList.length > 0) {
            ag.itemsList.forEach(item => {
              contractSheet.addRow({ id: ag.id, itemName: item.itemName });
            });
          } else {
            contractSheet.addRow({ id: ag.id, itemName: ag.itemName });
          }
        });
      } else {
        contractSheet.addRow({ id: 'AG-2026-001', itemName: 'Raw Material A' });
      }

      // Format contract registry headers
      const conHeaderRow = contractSheet.getRow(1);
      conHeaderRow.height = 25;
      conHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Inter', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0D9488' } // Teal-600
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      contractSheet.views = [{ showGridLines: true }];

      // Determine max rows for formula and dropdown references
      const maxRegistryRow = items && items.length > 0 ? items.length + 1 : 2;
      const maxContractRow = activeAgreements.length > 0 ? activeAgreements.length + 1 : 2;

      // 4. Configure Inbound Form columns (adding Unit as Column C, auto-resolved via VLOOKUP)
      formSheet.columns = [
        { header: 'วันที่รับเข้า (DD-MM-YYYY)', key: 'date', width: 25 },
        { header: 'ชื่อสินค้า (ต้องตรงตามทะเบียนพัสดุ)', key: 'itemName', width: 40 },
        { header: 'หน่วย (แสดงอัตโนมัติ)', key: 'unit', width: 20 },
        { header: 'เลขที่สัญญาจัดซื้อ (ถ้ามี)', key: 'agreementId', width: 25 },
        { header: 'Supplier Lot (จำเป็น)', key: 'supplierLot', width: 20 },
        { header: 'QC Lot (ถ้ามี)', key: 'inhouseLot', width: 20 },
        { header: 'สถานะ QC (Pass / Quarantine / Reject)', key: 'qcStatus', width: 35 },
        { header: 'ขนาดบรรจุ (เช่น 25kg, 10ชิ้น - ถ้ามี)', key: 'packSize', width: 30 },
        { header: 'จำนวนรับเข้า (จำเป็น - ตัวเลขเท่านั้น)', key: 'quantity', width: 30 },
        { header: 'ที่เก็บ (ถ้ามี)', key: 'location', width: 15 },
        { header: 'หมายเหตุ (ถ้ามี)', key: 'remarks', width: 30 }
      ];

      // Format Inbound Form headers
      const headerRow = formSheet.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Inter', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0284C7' } // Tailwind Blue-600
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF0284C7' } },
          left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          bottom: { style: 'thin', color: { argb: 'FF0284C7' } },
          right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
        };
      });

      // 5. Add a sample data row in Row 2
      const sampleItemName = (items && items.length > 0) ? items[0].name : "Raw Material A";
      const sampleAgreementId = activeAgreements.length > 0 ? activeAgreements[0].id : '';
      formSheet.addRow({
        date: (() => {
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
          return `${day}-${month}-${year}`;
        })(),
        itemName: sampleItemName,
        unit: { formula: `IF(ISBLANK(B2),"",VLOOKUP(B2,'Product Registry'!$A$2:$B$${maxRegistryRow},2,FALSE))` },
        agreementId: sampleAgreementId,
        supplierLot: 'LOT-SUP-12345',
        inhouseLot: 'LOT-INH-001',
        qcStatus: 'Quarantine',
        packSize: '25kg',
        quantity: 100,
        location: 'A1',
        remarks: 'ตัวอย่างบันทึกย่อ'
      });

      // 6. Pre-fill formulas and data validation rules for rows 2 to 200 (ample rows for bulk input)
      for (let row = 2; row <= 200; row++) {
        // Set VLOOKUP formula in Unit column (Column C)
        formSheet.getCell(`C${row}`).value = { 
          formula: `IF(ISBLANK(B${row}),"",VLOOKUP(B${row},'Product Registry'!$A$2:$B$${maxRegistryRow},2,FALSE))` 
        };

        // Add dropdown data validation on Column B (Item Name)
        formSheet.getCell(`B${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Product Registry'!$A$2:$A$${maxRegistryRow}`],
          showErrorMessage: true,
          errorTitle: 'ชื่อสินค้าไม่ถูกต้อง / Invalid Product Name',
          error: 'กรุณาเลือกชื่อสินค้าจากรายการที่กำหนดเท่านั้น / Please select a product name from the list.'
        };

        // Add dropdown data validation on Column D (Agreement ID)
        formSheet.getCell(`D${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Contract Registry'!$A$2:$A$${maxContractRow}`],
          showErrorMessage: true,
          errorTitle: 'เลขที่สัญญาจัดซื้อไม่ถูกต้อง / Invalid Contract Number',
          error: 'กรุณาเลือกเลขที่สัญญาจัดซื้อจากรายการที่กำหนดเท่านั้น / Please select a contract number from the list.'
        };

        // Add dropdown data validation on Column G (QC Status)
        formSheet.getCell(`G${row}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"Pass,Quarantine,Reject"'],
          showErrorMessage: true,
          errorTitle: 'สถานะ QC ไม่ถูกต้อง / Invalid QC Status',
          error: 'กรุณาเลือกสถานะ QC: Pass, Quarantine หรือ Reject / Please select QC Status: Pass, Quarantine or Reject'
        };
      }

      formSheet.views = [{ showGridLines: true }];

      // Write to buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "nbc_inbound_template.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate Excel template:", error);
      alert("ไม่สามารถสร้างไฟล์ Excel เทมเพลตได้: " + error.message);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear input so same file can be uploaded again
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        // Find the 'Inbound Form' sheet (case-insensitive or exact)
        let sheet = workbook.getWorksheet('Inbound Form') || workbook.worksheets[0];
        if (!sheet) {
          alert("ไม่พบแผ่นงาน Inbound Form หรือข้อมูลอื่นๆ ในไฟล์ Excel");
          return;
        }

        const newEntries = [];
        const missingItems = new Set();
        
        const formatLocalDate = (dateObj) => {
          if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Let's read from row 2 onwards.
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // skip header

          // Get values. In exceljs, cell.value can be a string, number, date, formula object ({ formula: '...', result: '...' })
          const getCellValue = (colNum) => {
            const cell = row.getCell(colNum);
            if (!cell || cell.value === null || cell.value === undefined) return '';
            
            // Check if cell has formula or other complex object
            if (typeof cell.value === 'object' && cell.value !== null) {
              if ('result' in cell.value) {
                // If it's a formula object
                return cell.value.result !== undefined && cell.value.result !== null ? cell.value.result : '';
              }
              if (cell.value instanceof Date) {
                return cell.value;
              }
              // If it's a RichText or something else
              if (cell.value.richText) {
                return cell.value.richText.map(t => t.text).join('');
              }
              return '';
            }
            return cell.value;
          };

          const dateVal = getCellValue(1);
          let dateStr;
          if (dateVal instanceof Date) {
            dateStr = formatLocalDate(dateVal);
          } else if (typeof dateVal === 'string' && dateVal.trim() !== '') {
            const trimmed = dateVal.trim();
            const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
            const match = trimmed.match(dmyRegex);
            if (match) {
              const day = match[1].padStart(2, '0');
              const month = match[2].padStart(2, '0');
              const year = match[3];
              dateStr = `${year}-${month}-${day}`;
            } else {
              const ymdRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
              if (ymdRegex.test(trimmed)) {
                dateStr = trimmed.replace(/\//g, '-');
              } else {
                dateStr = formatLocalDate(new Date());
              }
            }
          } else if (typeof dateVal === 'number') {
            // Excel serial date number
            const dateObj = new Date((dateVal - 25569) * 86400 * 1000);
            dateStr = formatLocalDate(dateObj);
          } else {
            dateStr = formatLocalDate(new Date());
          }

          const itemName = String(getCellValue(2)).trim();
          const unit = String(getCellValue(3)).trim(); // parsed from VLOOKUP or formula result
          const agreementId = String(getCellValue(4)).trim();
          const supplierLot = String(getCellValue(5)).trim();
          const inhouseLot = String(getCellValue(6)).trim();
          const qcStatus = String(getCellValue(7)).trim();
          const packSize = String(getCellValue(8)).trim();
          const quantityVal = getCellValue(9);
          const quantity = quantityVal !== '' ? Number(quantityVal) : '';
          const location = String(getCellValue(10)).trim();
          const remarks = String(getCellValue(11)).trim();

          // Skip completely empty rows
          if (!itemName && !supplierLot && !quantityVal) return;

          let normalizedQcStatus = 'Quarantine';
          if (qcStatus.toLowerCase() === 'pass') {
            normalizedQcStatus = 'Pass';
          } else if (qcStatus.toLowerCase() === 'reject') {
            normalizedQcStatus = 'Reject';
          }

          const matchedItem = items.find(item => item.name.toLowerCase() === itemName.toLowerCase());
          if (!matchedItem && itemName) {
            missingItems.add(itemName);
          }

          newEntries.push({
            id: Date.now() + rowNumber + Math.random(),
            date: dateStr,
            itemName: matchedItem ? matchedItem.name : itemName,
            unit: matchedItem ? matchedItem.unit : (unit || 'ชิ้น'),
            agreementId,
            supplierLot,
            inhouseLot,
            qcStatus: normalizedQcStatus,
            packSize,
            quantity: isNaN(quantity) || quantityVal === '' ? '' : quantity,
            location,
            remarks
          });
        });

        if (newEntries.length === 0) {
          alert("ไม่พบข้อมูลรายการพัสดุรับเข้าที่สมบูรณ์ในไฟล์");
          return;
        }

        if (missingItems.size > 0) {
          const missingList = Array.from(missingItems).join(', ');
          alert(`⚠️ คำเตือน: พบรายชื่อสินค้าในไฟล์ที่ไม่มีอยู่จริงใน "ทะเบียนพัสดุ":\n[ ${missingList} ]\n\nระบบยังอนุญาตให้นำเข้าลงตารางชั่วคราวได้ แต่แนะนำให้ไปเพิ่มสินค้าดังกล่าวในหน้าทะเบียนพัสดุก่อนกด "บันทึกทั้งหมด" เพื่อให้ระบบเก็บประวัติพัสดุได้ถูกต้องสะกดตรงกัน`);
        }

        const isFirstEntryEmpty = entries.length === 1 && 
                                  !entries[0].supplierLot && 
                                  !entries[0].quantity && 
                                  entries[0].itemName === ((items && items.length > 0) ? items[0].name : '');

        if (isFirstEntryEmpty) {
          setEntries(newEntries);
        } else {
          setEntries([...entries, ...newEntries]);
        }

        alert(`🎉 นำเข้าข้อมูลสำเร็จ ${newEntries.length} รายการ!\nข้อมูลจะแสดงอยู่ในตารางทำรายการรับเข้า (Draft) ด้านล่าง คุณสามารถตรวจสอบ แก้ไข หรือกด "บันทึกทั้งหมด" เพื่อยืนยันลงคลัง`);
      } catch (err) {
        console.error(err);
        alert("การวิเคราะห์ไฟล์ล้มเหลว: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const printPDF = () => {
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

    const htmlContent = `
      <html>
        <head>
          <title>ใบรับเข้าพัสดุ - NBC Stock</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              color: #222;
              padding: 20px;
              background-color: #fff;
              line-height: 1.5;
              font-size: 13px;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #003366;
              padding-bottom: 1.5rem;
              margin-bottom: 2rem;
            }
            .title-section h1 {
              font-size: 1.8rem;
              margin: 0;
              color: #003366;
              font-weight: 700;
            }
            .title-section p {
              margin: 0.25rem 0 0 0;
              color: #555;
              font-size: 0.9rem;
            }
            .meta-section {
              text-align: right;
              font-size: 0.9rem;
            }
            .meta-section p {
              margin: 0.2rem 0;
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
              margin-bottom: 3rem;
            }
            th {
              background-color: #003366;
              color: #fff;
              font-weight: 600;
              padding: 0.75rem;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 0.75rem;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              font-weight: 700;
              background-color: #f0f4f8 !important;
            }
            .status-badge {
              display: inline-block;
              padding: 0.15rem 0.4rem;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
            }
            .status-pass { background-color: #d1e7dd; color: #0f5132; }
            .status-quarantine { background-color: #fff3cd; color: #664d03; }
            .status-reject { background-color: #f8d7da; color: #842029; }
            .signature-section {
              margin-top: 4rem;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 4rem;
            }
            .signature-box {
              text-align: center;
              border-top: 1px solid #aaa;
              padding-top: 0.75rem;
              font-size: 0.9rem;
            }
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
                  <label><input type="checkbox" id="col-date" checked onchange="updateTable()"> วันที่รับ</label>
                  <label><input type="checkbox" id="col-item" checked onchange="updateTable()"> รายการสินค้า</label>
                  <label><input type="checkbox" id="col-supplier" checked onchange="updateTable()"> Supplier Lot</label>
                  <label><input type="checkbox" id="col-inhouse" checked onchange="updateTable()"> QC Lot</label>
                  <label><input type="checkbox" id="col-qc" checked onchange="updateTable()"> สถานะ QC</label>
                  <label><input type="checkbox" id="col-packsize" checked onchange="updateTable()"> Pack Size</label>
                  <label><input type="checkbox" id="col-qty" checked onchange="updateTable()"> จำนวนรับ</label>
                  <label><input type="checkbox" id="col-unit" checked onchange="updateTable()"> หน่วย</label>
                  <label><input type="checkbox" id="col-location" checked onchange="updateTable()"> ที่เก็บ</label>
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
                <button class="btn-print" onclick="window.print()">พิมพ์เอกสาร / บันทึก PDF</button>
              </div>
            </div>

            <div class="controls-section" style="border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 5px;">
              <strong>ปรับความกว้างคอลัมน์ (%):</strong>
              <div class="width-inputs" id="width-inputs-container">
                <!-- Generated by JS -->
              </div>
            </div>
          </div>

          <div class="header-container">
            <div class="title-section">
              <h1>ใบรับเข้าพัสดุ (Inbound Receipt Slip)</h1>
              <p>ระบบบริหารจัดการคลังสินค้า NBC STOCK</p>
            </div>
            <div class="meta-section">
              <p><strong>วันที่ออกเอกสาร:</strong> ${today}</p>
              <p><strong>จำนวนรายการรับเข้า:</strong> ${entries.length} รายการ</p>
            </div>
          </div>

          <table id="report-table">
            <thead>
              <tr>
                <th id="th-date" class="col-date" style="width: 10%;">วันที่รับ</th>
                <th id="th-item" class="col-item" style="width: 20%;">รายการสินค้า</th>
                <th id="th-supplier" class="col-supplier" style="width: 11%;">Supplier Lot</th>
                <th id="th-inhouse" class="col-inhouse" style="width: 11%;">QC Lot</th>
                <th id="th-qc" class="col-qc" style="width: 10%;">สถานะ QC</th>
                <th id="th-packsize" class="col-packsize" style="width: 11%;">Pack Size</th>
                <th id="th-qty" class="col-qty" style="width: 10%; text-align: right;">จำนวนรับ</th>
                <th id="th-unit" class="col-unit" style="width: 7%;">หน่วย</th>
                <th id="th-location" class="col-location" style="width: 10%;">ที่เก็บ</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr>
                  <td class="col-date nowrap">${e.date || "-"}</td>
                  <td class="col-item" style="font-weight: 600;">${escapeHTML(e.itemName) || "-"}</td>
                  <td class="col-supplier">${escapeHTML(e.supplierLot) || "-"}</td>
                  <td class="col-inhouse">${escapeHTML(e.inhouseLot) || "-"}</td>
                  <td class="col-qc">
                    <span class="status-badge ${
                      e.qcStatus === 'Pass' ? 'status-pass' :
                      e.qcStatus === 'Reject' ? 'status-reject' : 'status-quarantine'
                    }">
                      ${escapeHTML(e.qcStatus)}
                    </span>
                  </td>
                  <td class="col-packsize">${escapeHTML(e.packSize) || "-"}</td>
                  <td class="col-qty" style="font-weight: 700; text-align: right;">${e.quantity || "0"}</td>
                  <td class="col-unit">${escapeHTML(e.unit) || "ชิ้น"}</td>
                  <td class="col-location">${escapeHTML(e.location) || "-"}</td>
                </tr>
              `).join("")}
              <tr id="total-row" class="total-row">
                <td id="total-label-cell" colspan="6" style="text-align: right;">รวมจำนวนรับเข้าทั้งสิ้น:</td>
                <td id="total-val-cell" class="col-qty" style="text-align: right; font-size: 1.05rem;">
                  ${entries.reduce((sum, e) => sum + Number(e.quantity || 0), 0)}
                </td>
                <td id="total-unit-cell" class="col-unit" colspan="2">หน่วย</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <p style="margin-bottom: 2.5rem;"></p>
              <p>____________________________________</p>
              <p><strong>ผู้จัดทำ / เจ้าหน้าที่คลังสินค้า</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
            <div class="signature-box">
              <p style="margin-bottom: 2.5rem;"></p>
              <p>____________________________________</p>
              <p><strong>ผู้ตรวจสอบ / หัวหน้าคลังสินค้า</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
          </div>

          <script>
            const colNames = {
              date: 'วันที่รับ',
              item: 'รายการสินค้า',
              supplier: 'Supplier Lot',
              inhouse: 'QC Lot',
              qc: 'สถานะ QC',
              packsize: 'Pack Size',
              qty: 'จำนวนรับ',
              unit: 'หน่วย',
              location: 'ที่เก็บ'
            };
            
            const colWidths = {
              date: 10,
              item: 20,
              supplier: 11,
              inhouse: 11,
              qc: 10,
              packsize: 11,
              qty: 10,
              unit: 7,
              location: 10
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
              const cols = ['date', 'item', 'supplier', 'inhouse', 'qc', 'packsize', 'qty', 'unit', 'location'];
              cols.forEach(col => {
                const checked = document.getElementById('col-' + col).checked;
                const elements = document.querySelectorAll('.col-' + col);
                elements.forEach(el => {
                  el.style.display = checked ? '' : 'none';
                });
              });

              // Handle total row
              const qtyChecked = document.getElementById('col-qty').checked;
              const unitChecked = document.getElementById('col-unit').checked;
              const locationChecked = document.getElementById('col-location').checked;
              
              const totalRow = document.getElementById('total-row');
              if (!qtyChecked) {
                totalRow.style.display = 'none';
              } else {
                totalRow.style.display = '';
                const columnsBeforeQty = ['date', 'item', 'supplier', 'inhouse', 'qc', 'packsize'];
                let visibleCountBeforeQty = 0;
                columnsBeforeQty.forEach(col => {
                  if (document.getElementById('col-' + col).checked) {
                    visibleCountBeforeQty++;
                  }
                });
                
                const totalLabelCell = document.getElementById('total-label-cell');
                totalLabelCell.colSpan = visibleCountBeforeQty;
                totalLabelCell.style.display = visibleCountBeforeQty > 0 ? '' : 'none';
                
                document.getElementById('total-val-cell').style.display = '';
                
                // Count visible columns after qty
                let visibleCountAfterQty = 0;
                if (unitChecked) visibleCountAfterQty++;
                if (locationChecked) visibleCountAfterQty++;
                
                const totalUnitCell = document.getElementById('total-unit-cell');
                totalUnitCell.colSpan = visibleCountAfterQty;
                totalUnitCell.style.display = visibleCountAfterQty > 0 ? '' : 'none';
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

  const uniqueHistoryItems = useMemo(() => {
    const names = new Set();
    (inventory || []).forEach(item => {
      if (item && item.itemName) names.add(item.itemName);
    });
    return Array.from(names).sort((a, b) => String(a).localeCompare(String(b), 'th'));
  }, [inventory]);

  const uniqueHistoryContracts = useMemo(() => {
    const contracts = new Set();
    (inventory || []).forEach(item => {
      if (item && item.agreementId) contracts.add(String(item.agreementId));
    });
    return Array.from(contracts).sort((a, b) => String(a).localeCompare(String(b), 'th'));
  }, [inventory]);

  const uniqueHistoryLocations = useMemo(() => {
    const locs = new Set();
    (inventory || []).forEach(item => {
      if (item && item.location) locs.add(item.location);
    });
    return Array.from(locs).sort((a, b) => String(a).localeCompare(String(b), 'th'));
  }, [inventory]);

  const filteredHistory = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    let result = inventory.filter(item => {
      if (!item) return false;
      const term = (historySearch || '').toLowerCase();
      const matchesSearch = !historySearch || 
                          (item.itemName && item.itemName.toLowerCase().includes(term)) ||
                          (item.supplierLot && item.supplierLot.toLowerCase().includes(term)) ||
                          (item.inhouseLot && item.inhouseLot.toLowerCase().includes(term)) ||
                          (item.location && item.location.toLowerCase().includes(term));

      let matchesDate = true;
      if (historyStartDate) {
        matchesDate = matchesDate && item.date >= historyStartDate;
      }
      if (historyEndDate) {
        matchesDate = matchesDate && item.date <= historyEndDate;
      }

      const matchesItem = historyFilterItem === 'All' || item.itemName === historyFilterItem;
      const matchesQC = historyFilterQC === 'All' || (item.qcStatus || 'Quarantine') === historyFilterQC;
      const matchesLocation = historyFilterLocation === 'All' || item.location === historyFilterLocation;
      const matchesContract = historyFilterContract === 'All' || String(item.agreementId || '') === historyFilterContract;

      return matchesSearch && matchesDate && matchesItem && matchesQC && matchesLocation && matchesContract;
    });

    result.sort((a, b) => {
      if (!a || !b) return 0;
      if (historySortType === 'date-asc') {
        return (a.date || '').localeCompare(b.date || '') || a.id - b.id;
      }
      if (historySortType === 'date-desc') {
        return (b.date || '').localeCompare(a.date || '') || b.id - a.id;
      }
      if (historySortType === 'name-asc') {
        return (a.itemName || '').localeCompare(b.itemName || '', 'th');
      }
      if (historySortType === 'name-desc') {
        return (b.itemName || '').localeCompare(a.itemName || '', 'th');
      }
      if (historySortType === 'contract-asc') {
        return String(a.agreementId || '').localeCompare(String(b.agreementId || ''));
      }
      if (historySortType === 'contract-desc') {
        return String(b.agreementId || '').localeCompare(String(a.agreementId || ''));
      }
      if (historySortType === 'supplierLot-asc') {
        return (a.supplierLot || '').localeCompare(b.supplierLot || '');
      }
      if (historySortType === 'supplierLot-desc') {
        return (b.supplierLot || '').localeCompare(a.supplierLot || '');
      }
      if (historySortType === 'inhouseLot-asc') {
        return (a.inhouseLot || '').localeCompare(b.inhouseLot || '');
      }
      if (historySortType === 'inhouseLot-desc') {
        return (b.inhouseLot || '').localeCompare(a.inhouseLot || '');
      }
      if (historySortType === 'qty-asc') {
        return Number(a.quantity || 0) - Number(b.quantity || 0);
      }
      if (historySortType === 'qty-desc') {
        return Number(b.quantity || 0) - Number(a.quantity || 0);
      }
      if (historySortType === 'qc-asc') {
        return (a.qcStatus || 'Quarantine').localeCompare(b.qcStatus || 'Quarantine');
      }
      if (historySortType === 'qc-desc') {
        return (b.qcStatus || 'Quarantine').localeCompare(a.qcStatus || 'Quarantine');
      }
      if (historySortType === 'location-asc') {
        return (a.location || '').localeCompare(b.location || '', 'th');
      }
      if (historySortType === 'location-desc') {
        return (b.location || '').localeCompare(a.location || '', 'th');
      }
      return 0;
    });

    return result;
  }, [inventory, historySearch, historyStartDate, historyEndDate, historySortType, historyFilterItem, historyFilterQC, historyFilterLocation, historyFilterContract]);

  const toggleSelectHistory = (id) => {
    if (selectedHistoryIds.includes(id)) {
      setSelectedHistoryIds(selectedHistoryIds.filter(x => x !== id));
    } else {
      setSelectedHistoryIds([...selectedHistoryIds, id]);
    }
  };

  const toggleSelectAllHistory = () => {
    if (selectedHistoryIds.length === filteredHistory.length) {
      setSelectedHistoryIds([]);
    } else {
      setSelectedHistoryIds(filteredHistory.map(x => x.id));
    }
  };

  const handleUpdateAgreement = (id, newAgreementId) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        let nextAcceptance = item.acceptanceStatus || '';
        if (newAgreementId && !item.acceptanceStatus) {
          nextAcceptance = 'Pending';
        } else if (!newAgreementId) {
          nextAcceptance = '';
        }
        return {
          ...item,
          agreementId: newAgreementId,
          acceptanceStatus: nextAcceptance
        };
      }
      return item;
    }));
    alert("อัปเดตเลขที่สัญญาจัดซื้อเรียบร้อยแล้ว");
  };

  const handleCancelInbound = (lotId) => {
    const lot = inventory.find(item => item.id === lotId);
    if (!lot) return;

    const hasWithdrawals = (lot.withdrawals && lot.withdrawals.length > 0) || (Number(lot.remainingQty) < Number(lot.quantity));
    if (hasWithdrawals) {
      alert("ไม่สามารถยกเลิกรายการรับนี้ได้ เนื่องจากมีการตัดจ่ายพัสดุจาก Lot นี้ไปแล้ว");
      return;
    }

    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะยกเลิกการรับเข้าพัสดุของ Lot: ${lot.supplierLot || lot.id}?\nการยกเลิกจะไม่ลบประวัติ แต่จะตั้งสถานะเป็น "ยกเลิก" และยอดคงเหลือในคลังจะเป็น 0`)) {
      setInventory(prev => prev.map(item => {
        if (item.id === lotId) {
          return {
            ...item,
            isCancelled: true,
            remainingQty: 0
          };
        }
        return item;
      }));
      alert("ยกเลิกรายการรับเข้าสำเร็จ");
    }
  };

  const printHistoricalPDF = (itemsToPrint) => {
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

    const htmlContent = `
      <html>
        <head>
          <title>ใบรับเข้าพัสดุ (ประวัติ) - NBC Stock</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              color: #222;
              padding: 20px;
              background-color: #fff;
              line-height: 1.5;
              font-size: 13px;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #003366;
              padding-bottom: 1.5rem;
              margin-bottom: 2rem;
            }
            .title-section h1 {
              font-size: 1.8rem;
              margin: 0;
              color: #003366;
              font-weight: 700;
            }
            .title-section p {
              margin: 0.25rem 0 0 0;
              color: #555;
              font-size: 0.9rem;
            }
            .meta-section {
              text-align: right;
              font-size: 0.9rem;
            }
            .meta-section p {
              margin: 0.2rem 0;
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
              margin-bottom: 3rem;
            }
            th {
              background-color: #003366;
              color: #fff;
              font-weight: 600;
              padding: 0.75rem;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 0.75rem;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              font-weight: 700;
              background-color: #f0f4f8 !important;
            }
            .status-badge {
              display: inline-block;
              padding: 0.15rem 0.4rem;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
            }
            .status-pass { background-color: #d1e7dd; color: #0f5132; }
            .status-quarantine { background-color: #fff3cd; color: #664d03; }
            .status-reject { background-color: #f8d7da; color: #842029; }
            .signature-section {
              margin-top: 4rem;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 4rem;
            }
            .signature-box {
              text-align: center;
              border-top: 1px solid #aaa;
              padding-top: 0.75rem;
              font-size: 0.9rem;
            }
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
                  <label><input type="checkbox" id="col-date" checked onchange="updateTable()"> วันที่รับ</label>
                  <label><input type="checkbox" id="col-item" checked onchange="updateTable()"> รายการสินค้า</label>
                  <label><input type="checkbox" id="col-supplier" checked onchange="updateTable()"> Supplier Lot</label>
                  <label><input type="checkbox" id="col-inhouse" checked onchange="updateTable()"> QC Lot</label>
                  <label><input type="checkbox" id="col-qc" checked onchange="updateTable()"> สถานะ QC</label>
                  <label><input type="checkbox" id="col-packsize" checked onchange="updateTable()"> Pack Size</label>
                  <label><input type="checkbox" id="col-qty" checked onchange="updateTable()"> จำนวนรับ</label>
                  <label><input type="checkbox" id="col-unit" checked onchange="updateTable()"> หน่วย</label>
                  <label><input type="checkbox" id="col-location" checked onchange="updateTable()"> ที่เก็บ</label>
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
                <button class="btn-print" onclick="window.print()">พิมพ์เอกสาร / บันทึก PDF</button>
              </div>
            </div>

            <div class="controls-section" style="border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 5px;">
              <strong>ปรับความกว้างคอลัมน์ (%):</strong>
              <div class="width-inputs" id="width-inputs-container">
                <!-- Generated by JS -->
              </div>
            </div>
          </div>

          <div class="header-container">
            <div class="title-section">
              <h1>ใบรับเข้าพัสดุ (Historical Inbound Slip)</h1>
              <p>ระบบบริหารจัดการคลังสินค้า NBC STOCK</p>
            </div>
            <div class="meta-section">
              <p><strong>วันที่ออกเอกสาร:</strong> ${today}</p>
              <p><strong>จำนวนรายการที่พิมพ์:</strong> ${itemsToPrint.length} รายการ</p>
            </div>
          </div>

          <table id="report-table">
            <thead>
              <tr>
                <th id="th-date" class="col-date" style="width: 10%;">วันที่รับ</th>
                <th id="th-item" class="col-item" style="width: 20%;">รายการสินค้า</th>
                <th id="th-supplier" class="col-supplier" style="width: 11%;">Supplier Lot</th>
                <th id="th-inhouse" class="col-inhouse" style="width: 11%;">QC Lot</th>
                <th id="th-qc" class="col-qc" style="width: 10%;">สถานะ QC</th>
                <th id="th-packsize" class="col-packsize" style="width: 11%;">Pack Size</th>
                <th id="th-qty" class="col-qty" style="width: 10%; text-align: right;">จำนวนรับ</th>
                <th id="th-unit" class="col-unit" style="width: 7%;">หน่วย</th>
                <th id="th-location" class="col-location" style="width: 10%;">ที่เก็บ</th>
              </tr>
            </thead>
            <tbody>
              ${itemsToPrint.map(e => `
                <tr style="${e.isCancelled ? 'opacity: 0.55; text-decoration: line-through;' : ''}">
                  <td class="col-date nowrap">${e.date || "-"}</td>
                  <td class="col-item" style="font-weight: 600;">${escapeHTML(e.itemName) || "-"}</td>
                  <td class="col-supplier">${escapeHTML(e.supplierLot) || "-"}</td>
                  <td class="col-inhouse">${escapeHTML(e.inhouseLot) || "-"}</td>
                  <td class="col-qc">
                    ${e.isCancelled ? '<span style="color: #ef4444; font-weight: bold;">ยกเลิกแล้ว</span>' : `
                    <span class="status-badge ${
                      e.qcStatus === 'Pass' ? 'status-pass' :
                      e.qcStatus === 'Reject' ? 'status-reject' : 'status-quarantine'
                    }">
                      ${escapeHTML(e.qcStatus)}
                    </span>`}
                  </td>
                  <td class="col-packsize">${escapeHTML(e.packSize) || "-"}</td>
                  <td class="col-qty" style="font-weight: 700; text-align: right;">${e.quantity || "0"}</td>
                  <td class="col-unit">${escapeHTML(e.unit) || "ชิ้น"}</td>
                  <td class="col-location">${escapeHTML(e.location) || "-"}</td>
                </tr>
              `).join("")}
              <tr id="total-row" class="total-row">
                <td id="total-label-cell" colspan="6" style="text-align: right;">รวมจำนวนรับเข้าทั้งสิ้น:</td>
                <td id="total-val-cell" class="col-qty" style="text-align: right; font-size: 1.05rem;">
                  ${itemsToPrint.reduce((sum, e) => sum + (e.isCancelled ? 0 : Number(e.quantity || 0)), 0)}
                </td>
                <td id="total-unit-cell" class="col-unit" colspan="2">หน่วย</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <p style="margin-bottom: 2.5rem;"></p>
              <p>____________________________________</p>
              <p><strong>ผู้จัดทำ / เจ้าหน้าที่คลังสินค้า</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
            <div class="signature-box">
              <p style="margin-bottom: 2.5rem;"></p>
              <p>____________________________________</p>
              <p><strong>ผู้ตรวจสอบ / หัวหน้าคลังสินค้า</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
          </div>

          <script>
            const colNames = {
              date: 'วันที่รับ',
              item: 'รายการสินค้า',
              supplier: 'Supplier Lot',
              inhouse: 'QC Lot',
              qc: 'สถานะ QC',
              packsize: 'Pack Size',
              qty: 'จำนวนรับ',
              unit: 'หน่วย',
              location: 'ที่เก็บ'
            };
            
            const colWidths = {
              date: 10,
              item: 20,
              supplier: 11,
              inhouse: 11,
              qc: 10,
              packsize: 11,
              qty: 10,
              unit: 7,
              location: 10
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
              const cols = ['date', 'item', 'supplier', 'inhouse', 'qc', 'packsize', 'qty', 'unit', 'location'];
              cols.forEach(col => {
                const checked = document.getElementById('col-' + col).checked;
                const elements = document.querySelectorAll('.col-' + col);
                elements.forEach(el => {
                  el.style.display = checked ? '' : 'none';
                });
              });

              // Handle total row
              const qtyChecked = document.getElementById('col-qty').checked;
              const unitChecked = document.getElementById('col-unit').checked;
              const locationChecked = document.getElementById('col-location').checked;
              
              const totalRow = document.getElementById('total-row');
              if (!qtyChecked) {
                totalRow.style.display = 'none';
              } else {
                totalRow.style.display = '';
                const columnsBeforeQty = ['date', 'item', 'supplier', 'inhouse', 'qc', 'packsize'];
                let visibleCountBeforeQty = 0;
                columnsBeforeQty.forEach(col => {
                  if (document.getElementById('col-' + col).checked) {
                    visibleCountBeforeQty++;
                  }
                });
                
                const totalLabelCell = document.getElementById('total-label-cell');
                totalLabelCell.colSpan = visibleCountBeforeQty;
                totalLabelCell.style.display = visibleCountBeforeQty > 0 ? '' : 'none';
                
                document.getElementById('total-val-cell').style.display = '';
                
                // Count visible columns after qty
                let visibleCountAfterQty = 0;
                if (unitChecked) visibleCountAfterQty++;
                if (locationChecked) visibleCountAfterQty++;
                
                const totalUnitCell = document.getElementById('total-unit-cell');
                totalUnitCell.colSpan = visibleCountAfterQty;
                totalUnitCell.style.display = visibleCountAfterQty > 0 ? '' : 'none';
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

  const printInboundReportPDF = (reportList) => {
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let dateRangeStr = "ทั้งหมด";
    if (historyStartDate && historyEndDate) {
      if (historyStartDate === historyEndDate) {
        dateRangeStr = `ประจำวันที่ ${new Date(historyStartDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      } else {
        dateRangeStr = `ระหว่างวันที่ ${new Date(historyStartDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} ถึง ${new Date(historyEndDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
      }
    } else if (historyStartDate) {
      dateRangeStr = `ตั้งแต่วันที่ ${new Date(historyStartDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    } else if (historyEndDate) {
      dateRangeStr = `จนถึงวันที่ ${new Date(historyEndDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    }

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
          <title>รายงานสรุปการรับเข้าพัสดุ - NBC STOCK</title>
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
            .width-input-item {
              display: flex;
              align-items: center;
              gap: 4px;
              background-color: #fff;
              padding: 4px 8px;
              border-radius: 4px;
              border: 1px solid #cbd5e1;
            }
            .width-input-item span {
              font-size: 11px;
              color: #475569;
            }
            .width-input-item input {
              width: 45px;
              border: 1px solid #94a3b8;
              border-radius: 3px;
              padding: 2px 4px;
              text-align: center;
              font-size: 11px;
              font-weight: 600;
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
            .signatures {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              gap: 50px;
            }
            .sig-block {
              flex: 1;
              text-align: center;
              border-top: 1px solid #9ca3af;
              padding-top: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 0.15rem 0.4rem;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
            }
            .status-pass { background-color: #d1e7dd; color: #0f5132; }
            .status-quarantine { background-color: #fff3cd; color: #664d03; }
            .status-reject { background-color: #f8d7da; color: #842029; }
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
                  <label><input type="checkbox" id="col-date" checked onchange="updateTable()"> วันที่รับเข้า</label>
                  <label><input type="checkbox" id="col-item" checked onchange="updateTable()"> รายการสินค้า</label>
                  <label><input type="checkbox" id="col-supplier" checked onchange="updateTable()"> Supplier Lot</label>
                  <label><input type="checkbox" id="col-inhouse" checked onchange="updateTable()"> QC Lot</label>
                  <label><input type="checkbox" id="col-qc" checked onchange="updateTable()"> สถานะ QC</label>
                  <label><input type="checkbox" id="col-location" checked onchange="updateTable()"> ที่เก็บ</label>
                  <label><input type="checkbox" id="col-qty" checked onchange="updateTable()"> จำนวนรับ</label>
                  <label><input type="checkbox" id="col-unit" checked onchange="updateTable()"> หน่วย</label>
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
              <div class="title">รายงานสรุปการรับเข้าพัสดุ (Material Inbound Summary Report)</div>
              <div style="font-size: 11px; color: #555; margin-top: 5px;">ระบบบริหารจัดการคลังสินค้า NBC STOCK</div>
            </div>
            <div class="meta-info">
              <div><strong>วันที่ออกรายงาน:</strong> ${today}</div>
              <div><strong>ช่วงเวลา:</strong> ${dateRangeStr}</div>
              <div><strong>จำนวนรายการ:</strong> ${reportList.length} รายการ</div>
            </div>
          </div>

          <table id="report-table">
            <thead>
              <tr>
                <th id="th-date" class="col-date" style="width: 12%;">วันที่รับเข้า</th>
                <th id="th-item" class="col-item" style="width: 30%;">รายการสินค้า</th>
                <th id="th-supplier" class="col-supplier" style="width: 12%;">Supplier Lot</th>
                <th id="th-inhouse" class="col-inhouse" style="width: 12%;">QC Lot</th>
                <th id="th-qc" class="col-qc" style="width: 10%;">สถานะ QC</th>
                <th id="th-location" class="col-location" style="width: 10%;">ที่เก็บ</th>
                <th id="th-qty" class="col-qty" style="width: 10%; text-align: right;">จำนวนรับ</th>
                <th id="th-unit" class="col-unit" style="width: 4%;">หน่วย</th>
              </tr>
            </thead>
            <tbody>
              ${reportList.map(item => `
                <tr style="${item.isCancelled ? 'opacity: 0.55; text-decoration: line-through;' : ''}">
                  <td class="col-date nowrap">${formatDateToDDMMYY(item.date)}</td>
                  <td class="col-item" style="font-weight: 600;">${escapeHTML(item.itemName)}</td>
                  <td class="col-supplier">${escapeHTML(item.supplierLot) || '-'}</td>
                  <td class="col-inhouse">${escapeHTML(item.inhouseLot) || '-'}</td>
                  <td class="col-qc">
                    ${item.isCancelled ? '<span style="color: #ef4444; font-weight: bold;">ยกเลิกแล้ว</span>' : `
                    <span class="status-badge ${
                      item.qcStatus === 'Pass' ? 'status-pass' :
                      item.qcStatus === 'Reject' ? 'status-reject' : 'status-quarantine'
                    }">
                      ${escapeHTML(item.qcStatus)}
                    </span>`}
                  </td>
                  <td class="col-location" style="font-weight: 600;">${escapeHTML(item.location) || '-'}</td>
                  <td class="col-qty" style="font-weight: 700; text-align: right;">${item.quantity.toLocaleString()}</td>
                  <td class="col-unit">${escapeHTML(item.unit) || 'ชิ้น'}</td>
                </tr>
              `).join('')}
              <tr id="total-row" class="total-row">
                <td id="total-label-cell" colspan="6" style="text-align: right;">รวมจำนวนรับเข้าทั้งสิ้น:</td>
                <td id="total-val-cell" class="col-qty" style="color: #003366; text-align: right;">${reportList.reduce((sum, item) => sum + (item.isCancelled ? 0 : Number(item.quantity)), 0).toLocaleString()}</td>
                <td id="total-unit-cell" class="col-unit">หน่วยตามรายการ</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-block">
              <br><br>
              <strong>ผู้รายงาน / เจ้าหน้าที่คลังสินค้า</strong>
              <div style="margin-top: 5px; font-size: 11px; color: #6b7280;">วันที่: ...... / ...... / ......</div>
            </div>
            <div class="sig-block">
              <br><br>
              <strong>ผู้ตรวจสอบ / หัวหน้าคลังสินค้า</strong>
              <div style="margin-top: 5px; font-size: 11px; color: #6b7280;">วันที่: ...... / ...... / ......</div>
            </div>
          </div>

          <script>
            const colNames = {
              date: 'วันที่รับเข้า',
              item: 'รายการสินค้า',
              supplier: 'Supplier Lot',
              inhouse: 'QC Lot',
              qc: 'สถานะ QC',
              location: 'ที่เก็บ',
              qty: 'จำนวนรับ',
              unit: 'หน่วย'
            };
            
            const colWidths = {
              date: 12,
              item: 30,
              supplier: 12,
              inhouse: 12,
              qc: 10,
              location: 10,
              qty: 10,
              unit: 4
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
              const cols = ['date', 'item', 'supplier', 'inhouse', 'qc', 'location', 'qty', 'unit'];
              cols.forEach(col => {
                const checked = document.getElementById('col-' + col).checked;
                const elements = document.querySelectorAll('.col-' + col);
                elements.forEach(el => {
                  el.style.display = checked ? '' : 'none';
                });
              });

              // Handle total row
              const qtyChecked = document.getElementById('col-qty').checked;
              const unitChecked = document.getElementById('col-unit').checked;
              const totalRow = document.getElementById('total-row');
              if (!qtyChecked) {
                totalRow.style.display = 'none';
              } else {
                totalRow.style.display = '';
                const columnsBeforeQty = ['date', 'item', 'supplier', 'inhouse', 'qc', 'location'];
                let visibleCountBeforeQty = 0;
                columnsBeforeQty.forEach(col => {
                  if (document.getElementById('col-' + col).checked) {
                    visibleCountBeforeQty++;
                  }
                });
                const totalLabelCell = document.getElementById('total-label-cell');
                totalLabelCell.colSpan = visibleCountBeforeQty;
                totalLabelCell.style.display = visibleCountBeforeQty > 0 ? '' : 'none';
                document.getElementById('total-val-cell').style.display = '';
                document.getElementById('total-unit-cell').style.display = unitChecked ? '' : 'none';
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
      {/* แถบตัวเลือกโมดูลย่อย Inbound */}
      <div className="inbound-tabs glass" style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem', 
        padding: '0.5rem', 
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--glass-border)',
        width: 'fit-content'
      }}>
        <button 
          className="btn" 
          style={{ 
            background: inboundTab === 'draft' ? 'var(--accent-color)' : 'transparent', 
            color: inboundTab === 'draft' ? '#000' : 'var(--text-secondary)',
            fontSize: '0.85rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: 700
          }}
          onClick={() => setInboundTab('draft')}
        >
          ทำรายการรับเข้าพัสดุ (Lot ใหม่)
        </button>
        <button 
          className="btn" 
          style={{ 
            background: inboundTab === 'claim_return' ? 'var(--success)' : 'transparent', 
            color: inboundTab === 'claim_return' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.85rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
          onClick={() => setInboundTab('claim_return')}
        >
          <RotateCcw size={15} /> รับคืนจากการเคลม / เติม Lot เดิม
        </button>
        <button 
          className="btn" 
          style={{ 
            background: inboundTab === 'history' ? 'var(--accent-secondary)' : 'transparent', 
            color: inboundTab === 'history' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.85rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: 700
          }}
          onClick={() => setInboundTab('history')}
        >
          ประวัติการรับเข้าคลัง ({inventory.length})
        </button>
      </div>

      {inboundTab === 'draft' ? (
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 className="page-title">ทำรายการรับเข้าพัสดุ (Mod 2)</h1>
              <p className="page-subtitle">เพิ่มรายการพัสดุใหม่เข้าสู่คลังสินค้า</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={printPDF} style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                <Printer size={18} /> พิมพ์ใบพัสดุ (PDF)
              </button>
              <button className="btn btn-secondary" onClick={addEntry} title="เพิ่มแถวใหม่แบบค่าเริ่มต้น">
                <Plus size={18} /> เพิ่มแถวปกติ
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={addCopiedEntry}
                style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-color)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                title="เพิ่มแถวโดยคัดลอกค่า วันที่, สินค้า, สัญญา, Pack Size, QC, ที่เก็บ และการวางบิล จากแถวล่าสุด (เว้นว่าง Lot และจำนวน)"
              >
                <Copy size={18} /> คัดลอกแถวบน
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={18} /> บันทึกทั้งหมด
              </button>
            </div>
          </div>

          {/* Excel Import / Export Section */}
          <div className="glass card" style={{ 
            marginBottom: '1.5rem', 
            padding: '1.25rem 1.5rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1rem',
            borderLeft: '4px solid var(--accent-secondary)'
          }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
                <Upload size={18} color="var(--accent-secondary)" />
                นำเข้าข้อมูลรับเข้าหลายรายการ (Excel Import)
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ดาวน์โหลดไฟล์เทมเพลต Excel เพื่อกรอกข้อมูลพัสดุรับเข้า จากนั้นนำเข้าไฟล์กลับเข้าตารางเพื่อทำรายการแบบกลุ่มได้อย่างรวดเร็ว
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary" 
                onClick={downloadTemplate}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '0.5rem 1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <Download size={15} /> ดาวน์โหลด Template (.xlsx)
              </button>
              <label 
                className="btn btn-primary" 
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '0.5rem 1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, var(--accent-secondary), #0284c7)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600
                }}
              >
                <Upload size={15} /> นำเข้าไฟล์ข้อมูล (.xlsx)
                <input 
                  type="file" 
                  accept=".xlsx" 
                  onChange={handleImportExcel} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>

          <div className="glass card" style={{ overflow: 'visible', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '9%' }}>วันที่รับ</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '20%' }}>รายการสินค้า</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '12%' }}>สัญญาจัดซื้อ</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '10%' }}>Supplier Lot</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '11%' }}>QC Lot</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '9%' }}>สถานะ QC</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '8%' }}>Pack Size</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '7%' }}>จำนวน</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '5%' }}>หน่วย</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '6%' }}>ที่เก็บ</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '3%' }}></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <input 
                        type="date" 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.date} 
                        onChange={(e) => updateEntry(entry.id, 'date', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <SearchableSelect 
                        value={entry.itemName} 
                        onChange={(val) => updateEntry(entry.id, 'itemName', val)}
                        options={items.map(item => ({ value: item.name, label: item.name }))}
                        placeholder="เลือกสินค้า..."
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <SearchableSelect 
                        value={entry.agreementId || ''} 
                        onChange={(val) => updateEntry(entry.id, 'agreementId', val)}
                        options={[
                          { value: '', label: '-- ไม่ระบุ --' },
                          ...agreements
                            .filter(ag => {
                              const hasItem = (ag.itemsList && ag.itemsList.length > 0)
                                ? ag.itemsList.some(subItem => subItem.itemName === entry.itemName)
                                : ag.itemName === entry.itemName;
                              return hasItem && ag.status !== 'Completed';
                            })
                            .map(ag => ({ value: ag.id, label: ag.id }))
                        ]}
                        placeholder="เลือกสัญญา..."
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <input 
                        type="text" 
                        placeholder="Lot no." 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.supplierLot} 
                        onChange={(e) => updateEntry(entry.id, 'supplierLot', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <input 
                        type="text" 
                        placeholder="QC no." 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.inhouseLot} 
                        onChange={(e) => updateEntry(entry.id, 'inhouseLot', e.target.value)} 
                      />
                      {(() => {
                        const latest = getLatestInhouseLot(entry.itemName);
                        return (
                          <div 
                            style={{ 
                              fontSize: '0.68rem', 
                              color: latest !== '-' ? 'var(--accent-secondary, #0ea5e9)' : 'var(--text-muted, #888)', 
                              marginTop: '0.25rem',
                              fontWeight: '500',
                              cursor: latest !== '-' ? 'pointer' : 'default',
                              display: 'inline-block',
                              textDecoration: latest !== '-' ? 'underline' : 'none',
                              textDecorationStyle: 'dashed',
                              textUnderlineOffset: '2px'
                            }}
                            onClick={() => {
                              if (latest !== '-') {
                                updateEntry(entry.id, 'inhouseLot', latest);
                              }
                            }}
                            title={latest !== '-' ? "คลิกเพื่อใช้ค่านี้" : undefined}
                          >
                            ล่าสุด: {latest}
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <select 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.qcStatus} 
                        onChange={(e) => updateEntry(entry.id, 'qcStatus', e.target.value)}
                      >
                        <option value="Pass">Pass</option>
                        <option value="Quarantine">Quarantine</option>
                        <option value="Reject">Reject</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <input 
                        type="text" 
                        placeholder="เช่น 25kg" 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.packSize} 
                        onChange={(e) => updateEntry(entry.id, 'packSize', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <input 
                        type="number" 
                        placeholder="0" 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.quantity} 
                        onChange={(e) => updateEntry(entry.id, 'quantity', e.target.value)} 
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <input 
                        type="text" 
                        value={entry.unit} 
                        disabled 
                        style={{ 
                          fontSize: '0.78rem', 
                          padding: '0.4rem 0.3rem', 
                          background: 'rgba(255,255,255,0.02)', 
                          color: 'var(--text-secondary)', 
                          cursor: 'not-allowed', 
                          textAlign: 'center',
                          width: '100%'
                        }} 
                      />
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <input 
                        type="text" 
                        placeholder="A1, B2" 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.location} 
                        onChange={(e) => updateEntry(entry.id, 'location', e.target.value)} 
                      />
                    </td>

                    <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <button 
                        onClick={() => removeEntry(entry.id)} 
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: 'var(--danger)', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.2rem'
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
        </>
      ) : inboundTab === 'claim_return' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={26} color="var(--success)" /> รับคืนจากการตัดเคลม / เติมสต็อก Lot เดิม
              </h1>
              <p className="page-subtitle">บันทึกรับของดีที่ Supplier ส่งกลับคืนจากการเคลม NCP พร้อมปรับปรุงยอดคงเหลือและสัญญาจัดซื้ออัตโนมัติ</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <button
                className="btn"
                style={{
                  background: claimReturnSubTab === 'new' ? 'var(--success)' : 'transparent',
                  color: claimReturnSubTab === 'new' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontWeight: 700
                }}
                onClick={() => setClaimReturnSubTab('new')}
              >
                ➕ บันทึกรับคืนใหม่
              </button>
              <button
                className="btn"
                style={{
                  background: claimReturnSubTab === 'history' ? 'var(--accent-secondary)' : 'transparent',
                  color: claimReturnSubTab === 'history' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontWeight: 700
                }}
                onClick={() => setClaimReturnSubTab('history')}
              >
                📋 ประวัติการรับคืน ({allClaimReturnHistory.length})
              </button>
            </div>
          </div>

          {claimReturnSubTab === 'new' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Step 1: Selection */}
              <div className="glass card">
                <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={20} color="var(--accent-color)" /> 1. เลือก Lot ที่ตัดเคลม / ต้องการเติมสต็อก
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <input 
                    type="text"
                    placeholder="🔍 ค้นหาตามชื่อสินค้า, Supplier Lot, QC Lot, เลขสัญญา..."
                    value={claimSearchFilter}
                    onChange={(e) => setClaimSearchFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.85rem',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {filteredClaimableLots.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Package size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                      <p>ไม่พบรายการ Lot ในคลัง</p>
                    </div>
                  ) : (
                    filteredClaimableLots.map(lot => {
                      const isSelected = String(lot.id) === String(selectedClaimLotId);
                      const claimWithdrawals = (lot.withdrawals || []).filter(w => !w.isCancelled && (w.reason || '').includes('เคลม'));
                      const lotClaimedQty = claimWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
                      const hasClaim = lotClaimedQty > 0;

                      return (
                        <div
                          key={lot.id}
                          onClick={() => handleSelectLotForClaim(lot.id)}
                          style={{
                            padding: '0.85rem 1rem',
                            background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            border: isSelected ? '1.5px solid var(--success)' : '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                              📦 {lot.itemName}
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                              <span><strong>Lot:</strong> {lot.supplierLot}</span>
                              <span><strong>QC:</strong> {lot.inhouseLot || '-'}</span>
                              {lot.agreementId && (
                                <span style={{ color: 'var(--accent-color)' }}><strong>สัญญา:</strong> {lot.agreementId}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              {hasClaim ? (
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                  ⚠️ ตัดเคลมไป {lotClaimedQty.toLocaleString()} {lot.unit || 'ชิ้น'}
                                </span>
                              ) : null}
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                📍 {lot.location || '-'}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>คงเหลือปัจจุบัน</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: Number(lot.remainingQty) > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                              {Number(lot.remainingQty || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{lot.unit || 'ชิ้น'}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Return Details Form */}
              <div className="glass card">
                <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RotateCcw size={20} color="var(--success)" /> 2. รายละเอียดการรับคืนและปรับปรุงสต็อก
                </h3>

                {selectedLotForClaim ? (
                  <form onSubmit={handleSaveClaimReturn} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Lot Summary Box */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        📦 {selectedLotForClaim.itemName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', fontSize: '0.78rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Supplier Lot:</span>
                          <div style={{ fontWeight: 700 }}>{selectedLotForClaim.supplierLot}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>QC Lot:</span>
                          <div style={{ fontWeight: 700 }}>{selectedLotForClaim.inhouseLot || '-'}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>เลขสัญญา:</span>
                          <div style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{selectedLotForClaim.agreementId || '-'}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>ยอดรับเข้าเดิม:</span>
                          <div style={{ fontWeight: 700 }}>{Number(selectedLotForClaim.quantity || 0).toLocaleString()} {selectedLotForClaim.unit}</div>
                        </div>
                        <div>
                          <span style={{ color: '#ef4444' }}>ยอดตัดเคลมไป:</span>
                          <div style={{ fontWeight: 700, color: '#ef4444' }}>{lotClaimStats.totalClaimed.toLocaleString()} {selectedLotForClaim.unit}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--success)' }}>คงเหลือในคลังตอนนี้:</span>
                          <div style={{ fontWeight: 700, color: 'var(--success)' }}>{Number(selectedLotForClaim.remainingQty || 0).toLocaleString()} {selectedLotForClaim.unit}</div>
                        </div>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} /> วันที่รับคืนสินค้าเข้าคลัง
                      </label>
                      <input 
                        type="date"
                        value={claimReturnDate}
                        onChange={(e) => setClaimReturnDate(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--success)', fontWeight: 700 }}>
                          ✅ จำนวนของดีที่รับคืน (+เข้าคลัง)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number"
                            placeholder="0"
                            value={claimReturnedQty}
                            onChange={(e) => handleReturnedQtyChange(e.target.value)}
                            style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1.5px solid var(--success)', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}
                          />
                          <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {selectedLotForClaim.unit || 'ชิ้น'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--danger)', fontWeight: 700 }}>
                          ❌ จำนวนของเสีย/เคลมทิ้ง (-สัญญา)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number"
                            placeholder="0"
                            value={claimDefectiveQty}
                            onChange={(e) => setClaimDefectiveQty(e.target.value)}
                            style={{ width: '100%', padding: '0.65rem', paddingRight: '3.5rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '1.05rem', fontWeight: 700 }}
                          />
                          <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {selectedLotForClaim.unit || 'ชิ้น'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                          📍 สถานที่จัดเก็บ
                        </label>
                        <input 
                          type="text"
                          placeholder="เช่น ชั้น 5 ตึกบริจาคโลหิต"
                          value={claimLocation}
                          onChange={(e) => setClaimLocation(e.target.value)}
                          style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                          👤 ผู้รับของ / ผู้บันทึก
                        </label>
                        <input 
                          type="text"
                          placeholder="ชื่อผู้รับของหรือเจ้าหน้าที่"
                          value={claimOperator}
                          onChange={(e) => setClaimOperator(e.target.value)}
                          style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                        📝 หมายเหตุ / สาเหตุการคัดคืน
                      </label>
                      <textarea 
                        rows="2"
                        placeholder="เช่น Supplier นำไปคัดแยก พบว่าชำรุด 40,000 ชิ้น จึงนำส่งของดีคืน 60,000 ชิ้น"
                        value={claimNote}
                        onChange={(e) => setClaimNote(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>

                    {selectedLotForClaim.agreementId && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <input 
                          type="checkbox"
                          id="syncContractCheckbox"
                          checked={syncContractAdjustment}
                          onChange={(e) => setSyncContractAdjustment(e.target.checked)}
                          style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="syncContractCheckbox" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer', lineHeight: '1.4' }}>
                          <strong>ปรับปรุงยอดสัญญาจัดซื้ออัตโนมัติ:</strong> ปรับลดยอดตรวจรับในสัญญา <strong>{selectedLotForClaim.agreementId}</strong> ตามจำนวนของเสียที่คัดทิ้ง (-{Number(claimDefectiveQty || 0).toLocaleString()} {selectedLotForClaim.unit}) เพื่อให้ยอดค้างส่งในสัญญาเพิ่มขึ้น รอ Supplier ส่งของดีมาชดเชยให้ครบ
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{
                        background: 'var(--success)',
                        color: '#fff',
                        padding: '0.85rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: '0.5rem'
                      }}
                    >
                      <CheckCircle2 size={18} /> ยืนยันบันทึกรับคืนเข้าคลังและปรับปรุงยอด
                    </button>
                  </form>
                ) : (
                  <div style={{ height: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>กรุณาเลือก Lot จากรายการด้านซ้ายเพื่อทำรายการรับคืน</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Claim Return History Sub-tab */
            <div className="glass card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>ประวัติการรับคืนสินค้าจากการตัดเคลม</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>รายการรับคืนและปรับปรุงสต็อกจากการเคลมทั้งหมดในระบบ</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text"
                      placeholder="ค้นหาประวัติรับคืน..."
                      value={claimHistorySearch}
                      onChange={(e) => setClaimHistorySearch(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem 0.5rem 0.45rem 2rem', fontSize: '0.8rem', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>เลขที่เอกสาร</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>วันที่รับคืน</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>รายการพัสดุ</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>S/N Lot / QC Lot</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>เลขสัญญา</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--success)' }}>รับคืน (+เข้าคลัง)</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--danger)' }}>ของเสีย (-สัญญา)</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>ที่เก็บ / ผู้บันทึก</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaimReturnHistory.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          ยังไม่มีประวัติการรับคืนพัสดุจากการตัดเคลม
                        </td>
                      </tr>
                    ) : (
                      filteredClaimReturnHistory.map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>{h.id}</td>
                          <td style={{ padding: '0.65rem 0.5rem' }}>{h.date}</td>
                          <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600 }}>{h.itemName}</td>
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <div>{h.supplierLot}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.inhouseLot || '-'}</div>
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            {h.agreementId ? (
                              <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{h.agreementId}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>
                            +{Number(h.returnedQty || 0).toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: 400 }}>{h.unit}</span>
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 700, color: Number(h.defectiveQty || 0) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {Number(h.defectiveQty || 0) > 0 ? `-${Number(h.defectiveQty).toLocaleString()}` : '0'} <span style={{ fontSize: '0.72rem', fontWeight: 400 }}>{h.unit}</span>
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem' }}>
                            <div>{h.location || '-'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.operator || '-'}</div>
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                            <button 
                              className="btn btn-secondary"
                              onClick={() => printClaimReturnSlip(h)}
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}
                            >
                              <Printer size={13} /> พิมพ์ใบรับคืน (PDF)
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 className="page-title">ประวัติการรับเข้าพัสดุในคลัง</h1>
              <p className="page-subtitle">แสดงและส่งออกเอกสารรายงานรายการรับเข้าพัสดุในอดีต</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {filteredHistory.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => printInboundReportPDF(filteredHistory)}
                  style={{ 
                    background: 'rgba(14, 165, 233, 0.1)', 
                    color: '#0ea5e9', 
                    border: '1px solid rgba(14, 165, 233, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Printer size={18} /> พิมพ์รายงานรับเข้า ({historyStartDate && historyEndDate ? (historyStartDate === historyEndDate ? 'รายวัน' : 'รายช่วงเวลา') : historyStartDate || historyEndDate ? 'รายวัน' : 'ทั้งหมด'})
                </button>
              )}
              {selectedHistoryIds.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => printHistoricalPDF(inventory.filter(item => selectedHistoryIds.includes(item.id)))}
                  style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.2)' }}
                >
                  <Printer size={18} /> พิมพ์ใบพัสดุที่เลือก ({selectedHistoryIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="glass card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: '1.5', minWidth: '300px' }}>
              <Search size={20} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="ค้นหาประวัติตามชื่อสินค้า, Lot no., หรือที่เก็บ..." 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: '0.5rem', width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: '1', minWidth: '250px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>ช่วงวันที่รับเข้า:</span>
              <input 
                type="date" 
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                style={{ 
                  padding: '0.3rem 0.5rem', 
                  fontSize: '0.78rem', 
                  background: 'var(--input-bg)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '4px',
                  flex: 1
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
              <input 
                type="date" 
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                style={{ 
                  padding: '0.3rem 0.5rem', 
                  fontSize: '0.78rem', 
                  background: 'var(--input-bg)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '4px',
                  flex: 1
                }}
              />
            </div>

            {(historySearch || historyStartDate || historyEndDate || historyFilterItem !== 'All' || historyFilterQC !== 'All' || historyFilterLocation !== 'All' || historyFilterContract !== 'All' || historySortType !== 'date-desc') && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                onClick={() => {
                  setHistorySearch('');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setHistoryFilterItem('All');
                  setHistoryFilterQC('All');
                  setHistoryFilterLocation('All');
                  setHistoryFilterContract('All');
                  setHistorySortType('date-desc');
                }}
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          <div className="glass card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', width: '50px', verticalAlign: 'middle' }}>
                    <input 
                      type="checkbox" 
                      checked={filteredHistory.length > 0 && selectedHistoryIds.length === filteredHistory.length}
                      onChange={toggleSelectAllHistory}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>วันที่รับ</span>
                      <select 
                        value={historySortType.startsWith('date-') ? historySortType : 'none'} 
                        onChange={(e) => setHistorySortType(e.target.value === 'none' ? 'date-desc' : e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        <option value="date-desc">ล่าสุด 🔽</option>
                        <option value="date-asc">เก่าสุด 🔼</option>
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>รายการสินค้า</span>
                      <select 
                        value={historySortType.startsWith('name-') ? historySortType : 'none'} 
                        onChange={(e) => setHistorySortType(e.target.value === 'none' ? 'date-desc' : e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.1rem' }}
                      >
                        <option value="none">ปกติ ↕️</option>
                        <option value="name-asc">ก-ฮ 🔼</option>
                        <option value="name-desc">ฮ-ก 🔽</option>
                      </select>
                      <select 
                        value={historyFilterItem} 
                        onChange={(e) => setHistoryFilterItem(e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', width: '100%', minWidth: '130px' }}
                      >
                        <option value="All">ทั้งหมด</option>
                        {uniqueHistoryItems.map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem', width: '150px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>สัญญาจัดซื้อ</span>
                      <select 
                        value={historySortType.startsWith('contract-') ? historySortType : 'none'} 
                        onChange={(e) => setHistorySortType(e.target.value === 'none' ? 'date-desc' : e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.1rem' }}
                      >
                        <option value="none">ปกติ ↕️</option>
                        <option value="contract-asc">A-Z 🔼</option>
                        <option value="contract-desc">Z-A 🔽</option>
                      </select>
                      <select 
                        value={historyFilterContract} 
                        onChange={(e) => setHistoryFilterContract(e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                      >
                        <option value="All">ทั้งหมด</option>
                        {uniqueHistoryContracts.map(id => {
                          const ag = (agreements || []).find(a => a && String(a.id) === String(id));
                          return <option key={id} value={id}>สัญญา #{id} {ag ? `(${ag.vendorName})` : ''}</option>;
                        })}
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Supplier / QC Lot</span>
                      <select 
                        value={historySortType.startsWith('supplierLot-') || historySortType.startsWith('inhouseLot-') ? historySortType : 'none'} 
                        onChange={(e) => setHistorySortType(e.target.value === 'none' ? 'date-desc' : e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        <option value="none">ปกติ ↕️</option>
                        <option value="supplierLot-asc">Supplier A-Z 🔼</option>
                        <option value="supplierLot-desc">Supplier Z-A 🔽</option>
                        <option value="inhouseLot-asc">QC A-Z 🔼</option>
                        <option value="inhouseLot-desc">QC Z-A 🔽</option>
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>สถานะ QC</span>
                      <select 
                        value={historyFilterQC} 
                        onChange={(e) => setHistoryFilterQC(e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                      >
                        <option value="All">ทั้งหมด</option>
                        <option value="Pass">Pass</option>
                        <option value="Quarantine">Quarantine</option>
                        <option value="Reject">Reject</option>
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ที่เก็บ</span>
                      <select 
                        value={historySortType.startsWith('location-') ? historySortType : 'none'} 
                        onChange={(e) => setHistorySortType(e.target.value === 'none' ? 'date-desc' : e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.1rem' }}
                      >
                        <option value="none">ปกติ ↕️</option>
                        <option value="location-asc">A-Z 🔼</option>
                        <option value="location-desc">Z-A 🔽</option>
                      </select>
                      <select 
                        value={historyFilterLocation} 
                        onChange={(e) => setHistoryFilterLocation(e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                      >
                        <option value="All">ทั้งหมด</option>
                        {uniqueHistoryLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>จำนวนรับเข้า</span>
                      <select 
                        value={historySortType.startsWith('qty-') ? historySortType : 'none'} 
                        onChange={(e) => setHistorySortType(e.target.value === 'none' ? 'date-desc' : e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        <option value="none">ปกติ ↕️</option>
                        <option value="qty-desc">มาก 🔽</option>
                        <option value="qty-asc">น้อย 🔼</option>
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '1rem', verticalAlign: 'middle' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      ไม่พบประวัติการรับเข้าพัสดุ
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)', opacity: item.isCancelled ? 0.55 : 1 }}>
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedHistoryIds.includes(item.id)}
                          onChange={() => toggleSelectHistory(item.id)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </td>
                      <td style={{ padding: '1rem' }}>{formatDateToDDMMYYYY(item.date)}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{item.itemName}</td>
                      <td style={{ padding: '1rem' }}>
                        {(() => {
                          const contractOptions = agreements ? agreements.filter(ag => {
                            const hasItem = (ag.itemsList && ag.itemsList.length > 0)
                              ? ag.itemsList.some(subItem => subItem.itemName === item.itemName)
                              : ag.itemName === item.itemName;
                            return hasItem && (ag.status !== 'Completed' || ag.id === item.agreementId);
                          }) : [];
                          return (
                            <select
                              value={item.agreementId || ''}
                              onChange={(e) => handleUpdateAgreement(item.id, e.target.value)}
                              disabled={item.isCancelled}
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.3rem 0.5rem',
                                width: '100%',
                                background: 'var(--input-bg)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '4px',
                                cursor: item.isCancelled ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <option value="">-- ไม่ระบุ --</option>
                              {contractOptions.map(ag => (
                                <option key={ag.id} value={ag.id}>
                                  {ag.id}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>{item.supplierLot || '-'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.inhouseLot || '-'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {item.isCancelled ? (
                          <span className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            ยกเลิกแล้ว
                          </span>
                        ) : (
                          <span className={`status-badge status-${(item.qcStatus || 'Quarantine').toLowerCase()}`}>
                            {item.qcStatus || 'Quarantine'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{item.location || '-'}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        {item.isCancelled ? (
                          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{item.quantity}</span>
                        ) : (
                          item.quantity
                        )}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>{item.unit || 'ชิ้น'}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}
                            onClick={() => printHistoricalPDF([item])}
                          >
                            <Printer size={14} /> พิมพ์ใบพัสดุ (PDF)
                          </button>
                          {!item.isCancelled && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ 
                                padding: '0.4rem 0.8rem', 
                                fontSize: '0.75rem', 
                                background: 'rgba(245, 158, 11, 0.12)', 
                                color: '#f59e0b', 
                                border: '1px solid rgba(245, 158, 11, 0.3)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.3rem' 
                              }}
                              onClick={() => handleOpenEditInboundModal(item)}
                              title="แก้ไขข้อมูลรับเข้าพัสดุนี้ (Lot, QC, สัญญา, จำนวน ฯลฯ)"
                            >
                              <Edit2 size={13} /> แก้ไข
                            </button>
                          )}
                          {item.isCancelled ? (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold', 
                              color: '#ef4444', 
                              padding: '0.4rem 0.8rem',
                              background: 'rgba(239, 68, 68, 0.1)',
                              borderRadius: '4px' 
                            }}>
                              ยกเลิกแล้ว
                            </span>
                          ) : (
                            <button 
                              className="btn" 
                              style={{ 
                                padding: '0.4rem 0.8rem', 
                                fontSize: '0.75rem', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)' 
                              }}
                              onClick={() => handleCancelInbound(item.id)}
                            >
                              ยกเลิกการรับ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit Inbound Modal */}
      {editingInboundLot && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '1rem',
          boxSizing: 'border-box'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setEditingInboundLot(null);
        }}
        >
          <div className="card" style={{
            maxWidth: '680px',
            width: '100%',
            padding: '2rem',
            border: '2px solid var(--accent-color)',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '1.2rem' }}>
                  <Edit2 size={22} /> แก้ไขข้อมูลการรับเข้าพัสดุ
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  การแก้ไขจะอัปเดตและเชื่อมโยงข้อมูลไปยังคลังพัสดุ รายการตัดจ่าย และสัญญาจัดซื้อโดยอัตโนมัติ
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingInboundLot(null)}
                style={{ 
                  background: 'rgba(0,0,0,0.05)', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="ปิดหน้าต่าง"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditInbound} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    📅 วันที่รับเข้า
                  </label>
                  <input 
                    type="date"
                    value={editInboundFormData.date}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, date: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    📦 รายการสินค้า
                  </label>
                  <select
                    value={editInboundFormData.itemName}
                    onChange={(e) => {
                      const selItem = (items || []).find(i => i.name === e.target.value);
                      setEditInboundFormData({
                        ...editInboundFormData,
                        itemName: e.target.value,
                        unit: selItem ? selItem.unit : editInboundFormData.unit
                      });
                    }}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                    required
                  >
                    {(items || []).map(i => (
                      <option key={i.name} value={i.name}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--accent-color)', fontWeight: 700 }}>
                    🏷️ Supplier Lot (เลข Lot ผู้ผลิต)
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น TW-0010"
                    value={editInboundFormData.supplierLot}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, supplierLot: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1.5px solid var(--accent-color)', color: 'var(--text-primary)', fontWeight: 600 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    🧪 QC Lot (เลข Lot ภายใน)
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น LDWB 09/0669"
                    value={editInboundFormData.inhouseLot}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, inhouseLot: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    🚦 สถานะ QC
                  </label>
                  <select
                    value={editInboundFormData.qcStatus}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, qcStatus: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="Quarantine">Quarantine</option>
                    <option value="Pass">Pass</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    📦 Pack Size
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น 100/กล่อง"
                    value={editInboundFormData.packSize}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, packSize: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    📊 จำนวนรับเข้า ({editInboundFormData.unit})
                  </label>
                  <input 
                    type="number"
                    value={editInboundFormData.quantity}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, quantity: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1.5px solid var(--success)', color: 'var(--text-primary)', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    📄 สัญญาจัดซื้อ (Purchase Agreement)
                  </label>
                  <select
                    value={editInboundFormData.agreementId}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, agreementId: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- ไม่มีสัญญา / ไม่ระบุ --</option>
                    {(agreements || []).map(ag => (
                      <option key={ag.id} value={ag.id}>
                        {ag.id} ({ag.supplier || ag.vendorName || ''})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    📑 สถานะตรวจรับจัดซื้อ
                  </label>
                  <select
                    value={editInboundFormData.acceptanceStatus}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, acceptanceStatus: e.target.value })}
                    disabled={!editInboundFormData.agreementId}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: !editInboundFormData.agreementId ? 'not-allowed' : 'pointer' }}
                  >
                    <option value="Pending">รอการตรวจรับ (Pending)</option>
                    <option value="Accepted">ตรวจรับผ่าน (Accepted)</option>
                    <option value="Rejected">ปฏิเสธการรับ (Rejected)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    📍 สถานที่จัดเก็บ
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น ชั้น 5 ตึกบริจาคโลหิต"
                    value={editInboundFormData.location}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, location: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    📝 หมายเหตุ
                  </label>
                  <input 
                    type="text"
                    placeholder="หมายเหตุเพิ่มเติม"
                    value={editInboundFormData.remarks}
                    onChange={(e) => setEditInboundFormData({ ...editInboundFormData, remarks: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Status summary info */}
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>📊 ข้อมูลการตัดจ่ายปัจจุบันของ Lot นี้:</div>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <span>ยอดตัดจ่ายไปแล้ว: <strong>{((editingInboundLot.withdrawals || []).filter(w => !w.isCancelled).reduce((sum, w) => sum + Number(w.amount || 0), 0)).toLocaleString()} {editInboundFormData.unit}</strong></span>
                  <span>ยอดรับคืนจากเคลม: <strong>{((editingInboundLot.claimReturns || []).reduce((sum, cr) => sum + Number(cr.returnedQty || 0), 0)).toLocaleString()} {editInboundFormData.unit}</strong></span>
                  <span>คงเหลือคำนวณใหม่: <strong style={{ color: 'var(--success)' }}>{Math.max(0, Number(editInboundFormData.quantity || 0) - ((editingInboundLot.withdrawals || []).filter(w => !w.isCancelled).reduce((sum, w) => sum + Number(w.amount || 0), 0)) + ((editingInboundLot.claimReturns || []).reduce((sum, cr) => sum + Number(cr.returnedQty || 0), 0))).toLocaleString()} {editInboundFormData.unit}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingInboundLot(null)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'var(--accent-color)', color: '#000', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Save size={16} /> บันทึกการแก้ไขข้อมูลทั้งหมด
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Inbound;
