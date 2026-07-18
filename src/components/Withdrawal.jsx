import { useState, useMemo, useEffect } from 'react';
import { MinusCircle, Search, Calendar, Package, AlertCircle, MapPin, Printer, ChevronDown, Zap } from 'lucide-react';

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

const AcceptanceBadge = ({ status }) => {
  const normalizedStatus = status || '';
  const styles = {
    '': { bg: 'rgba(255, 255, 255, 0.05)', text: 'var(--text-muted, #888)', label: 'ยังไม่ได้วางบิล' },
    'Pending': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'รอการตรวจรับ' },
    'Accepted': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'ตรวจรับผ่าน' },
    'Rejected': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'ปฏิเสธการรับ' }
  };
  const current = styles[normalizedStatus] || styles[''];
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

const Withdrawal = ({ inventory, setInventory, items }) => {
  const [withdrawalTab, setWithdrawalTab] = useState('new'); // 'new' or 'history'
  const [selectedItem, setSelectedItem] = useState((items && items.length > 0) ? items[0].name : '');
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLotIds, setSelectedLotIds] = useState([]);
  const [lotWithdrawalAmounts, setLotWithdrawalAmounts] = useState({});
  const [cart, setCart] = useState([]);

  const activeLotId = selectedLotIds.length === 1 ? selectedLotIds[0] : null;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reasonType, setReasonType] = useState('ตัดเข้าห้องสะอาด');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lotSearchQuery, setLotSearchQuery] = useState('');

  const recommendedItems = useMemo(() => {
    const activity = {};
    items.forEach(it => {
      activity[it.name] = {
        name: it.name,
        lastActiveTime: 0,
        activityCount: 0
      };
    });
    
    inventory.forEach(invItem => {
      const name = invItem.itemName;
      if (!activity[name]) {
        activity[name] = { name, lastActiveTime: 0, activityCount: 0 };
      }
      
      const inboundTime = invItem.date ? new Date(invItem.date).getTime() : 0;
      if (!isNaN(inboundTime) && inboundTime > activity[name].lastActiveTime) {
        activity[name].lastActiveTime = inboundTime;
      }
      
      if (invItem.withdrawals && invItem.withdrawals.length > 0) {
        activity[name].activityCount += invItem.withdrawals.length;
        invItem.withdrawals.forEach(w => {
          const wTime = w.date ? new Date(w.date).getTime() : 0;
          if (!isNaN(wTime) && wTime > activity[name].lastActiveTime) {
            activity[name].lastActiveTime = wTime;
          }
        });
      }
    });
    
    return Object.values(activity)
      .sort((a, b) => {
        if (b.lastActiveTime !== a.lastActiveTime) {
          return b.lastActiveTime - a.lastActiveTime;
        }
        return b.activityCount - a.activityCount;
      })
      .slice(0, 15);
  }, [inventory, items]);
  
  // History search and selection states
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historySortType, setHistorySortType] = useState('date-desc');
  const [historyFilterItem, setHistoryFilterItem] = useState('All');
  const [historyFilterLocation, setHistoryFilterLocation] = useState('All');
  const [historyFilterReason, setHistoryFilterReason] = useState('All');



  useEffect(() => {
    setLotWithdrawalAmounts(prev => {
      const updated = {};
      selectedLotIds.forEach(id => {
        updated[id] = prev[id] !== undefined ? prev[id] : '';
      });
      return updated;
    });
  }, [selectedLotIds]);

  const lotPendingAmounts = useMemo(() => {
    const map = {};
    cart.forEach(item => {
      map[item.lotId] = (map[item.lotId] || 0) + item.amount;
    });
    return map;
  }, [cart]);

  // Gather all historical withdrawals from inventory lots
  const historicalWithdrawals = useMemo(() => {
    const list = [];
    (inventory || []).forEach(item => {
      if (item && item.withdrawals && item.withdrawals.length > 0) {
        item.withdrawals.forEach(w => {
          if (w) {
            list.push({
              id: w.id,
              date: w.date,
              amount: w.amount,
              reason: w.reason,
              itemName: item.itemName,
              supplierLot: item.supplierLot,
              inhouseLot: item.inhouseLot,
              packSize: item.packSize || '-',
              unit: item.unit || 'ชิ้น',
              location: item.location,
              isCancelled: w.isCancelled || false
            });
          }
        });
      }
    });
    // Sort by date descending, then ID descending
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
  }, [inventory]);

  // Filter available lots that have remaining stock and match selected item
  const availableLots = useMemo(() => {
    return (inventory || []).filter(i => {
      if (!i) return false;
      const pendingAmt = lotPendingAmounts[i.id] || 0;
      const displayRemaining = i.remainingQty - pendingAmt;
      const matchItem = i.itemName === selectedItem && displayRemaining > 0;
      if (!matchItem) return false;
      if (!lotSearchQuery) return true;
      const search = lotSearchQuery.toLowerCase();
      return i.supplierLot.toLowerCase().includes(search) || 
             (i.inhouseLot && i.inhouseLot.toLowerCase().includes(search)) ||
             (i.location && i.location.toLowerCase().includes(search));
    });
  }, [inventory, selectedItem, lotSearchQuery, lotPendingAmounts]);

  const totalLotsCount = useMemo(() => {
    return (inventory || []).filter(i => {
      if (!i) return false;
      const pendingAmt = lotPendingAmounts[i.id] || 0;
      return i.itemName === selectedItem && (i.remainingQty - pendingAmt) > 0;
    }).length;
  }, [inventory, selectedItem, lotPendingAmounts]);

  const activeLot = useMemo(() => {
    return (inventory || []).find(i => i && i.id === activeLotId);
  }, [inventory, activeLotId]);

  const uniqueHistoryItems = useMemo(() => {
    const names = new Set();
    (historicalWithdrawals || []).forEach(w => {
      if (w && w.itemName) names.add(w.itemName);
    });
    return Array.from(names).sort((a, b) => String(a).localeCompare(String(b), 'th'));
  }, [historicalWithdrawals]);

  const uniqueHistoryLocations = useMemo(() => {
    const locs = new Set();
    (historicalWithdrawals || []).forEach(w => {
      if (w && w.location) locs.add(w.location);
    });
    return Array.from(locs).sort((a, b) => String(a).localeCompare(String(b), 'th'));
  }, [historicalWithdrawals]);

  const uniqueHistoryReasons = useMemo(() => {
    const reasons = new Set();
    (historicalWithdrawals || []).forEach(w => {
      if (w && w.reason) reasons.add(w.reason);
    });
    return Array.from(reasons).sort((a, b) => String(a).localeCompare(String(b), 'th'));
  }, [historicalWithdrawals]);

  // Filter historical list based on search term, date range, items, locations, reasons, and sorting
  const filteredWithdrawals = useMemo(() => {
    let result = (historicalWithdrawals || []).filter(w => {
      if (!w) return false;
      const search = historySearch.toLowerCase();
      const matchesSearch = !historySearch ||
                          (w.itemName && w.itemName.toLowerCase().includes(search)) ||
                          (w.supplierLot && w.supplierLot.toLowerCase().includes(search)) ||
                          (w.inhouseLot && w.inhouseLot.toLowerCase().includes(search)) ||
                          (w.reason && w.reason.toLowerCase().includes(search));
      
      let matchesDate = true;
      if (historyStartDate) {
        matchesDate = matchesDate && w.date >= historyStartDate;
      }
      if (historyEndDate) {
        matchesDate = matchesDate && w.date <= historyEndDate;
      }

      const matchesItem = historyFilterItem === 'All' || w.itemName === historyFilterItem;
      const matchesLocation = historyFilterLocation === 'All' || w.location === historyFilterLocation;
      const matchesReason = historyFilterReason === 'All' || w.reason === historyFilterReason;
      
      return matchesSearch && matchesDate && matchesItem && matchesLocation && matchesReason;
    });

    result.sort((a, b) => {
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
      if (historySortType === 'amount-asc') {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }
      if (historySortType === 'amount-desc') {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      if (historySortType === 'location-asc') {
        return (a.location || '').localeCompare(b.location || '', 'th');
      }
      if (historySortType === 'location-desc') {
        return (b.location || '').localeCompare(a.location || '', 'th');
      }
      if (historySortType === 'reason-asc') {
        return (a.reason || '').localeCompare(b.reason || '', 'th');
      }
      if (historySortType === 'reason-desc') {
        return (b.reason || '').localeCompare(a.reason || '', 'th');
      }
      return 0;
    });

    return result;
  }, [historicalWithdrawals, historySearch, historyStartDate, historyEndDate, historySortType, historyFilterItem, historyFilterLocation, historyFilterReason]);

  const handleTotalAmountChange = (val) => {
    const num = Number(val) || 0;
    setAmount(val);
    let remaining = num;
    const newAmounts = {};
    
    // Distribute in the order of availableLots
    const selectedAvailableLots = availableLots.filter(l => selectedLotIds.includes(l.id));
    
    selectedAvailableLots.forEach(lot => {
      const pendingAmt = lotPendingAmounts[lot.id] || 0;
      const displayRemaining = lot.remainingQty - pendingAmt;
      if (remaining <= 0) {
        newAmounts[lot.id] = '';
      } else {
        const take = Math.min(remaining, displayRemaining);
        newAmounts[lot.id] = take || '';
        remaining -= take;
      }
    });
    
    setLotWithdrawalAmounts(newAmounts);
  };

  const handleLotAmountChange = (lotId, val) => {
    const num = Number(val) || 0;
    const lot = inventory.find(i => i.id === lotId);
    if (!lot) return;
    const pendingAmt = lotPendingAmounts[lot.id] || 0;
    const displayRemaining = lot.remainingQty - pendingAmt;
    const clampedVal = Math.max(0, Math.min(num, displayRemaining));
    
    setLotWithdrawalAmounts(prev => {
      const updated = { ...prev, [lotId]: clampedVal || '' };
      // Update total amount input sum
      const total = Object.values(updated).reduce((sum, current) => sum + (Number(current) || 0), 0);
      setAmount(total || '');
      return updated;
    });
  };

  const addToCart = () => {
    if (selectedLotIds.length === 0) {
      alert("กรุณาเลือก Lot ที่ต้องการตัดจ่าย");
      return;
    }
    
    const itemsToAdd = [];
    const newLotWithdrawalAmounts = { ...lotWithdrawalAmounts };
    
    for (const id of selectedLotIds) {
      const amt = Number(lotWithdrawalAmounts[id]) || 0;
      if (amt <= 0) continue;
      
      const lot = inventory.find(i => i.id === id);
      if (!lot) continue;
      
      const pendingAmt = lotPendingAmounts[lot.id] || 0;
      const availableStock = lot.remainingQty - pendingAmt;
      if (amt > availableStock) {
        alert(`จำนวนที่ระบุของ Lot ${lot.supplierLot} เกินจำนวนที่ถอนได้ (คงเหลือจริงหักรายการที่รอตัดจ่าย: ${availableStock})`);
        return;
      }
      
      const finalReason = reasonType === 'อื่นๆ โปรดระบุ ....'
        ? (reason.trim() ? `อื่นๆ: ${reason.trim()}` : 'อื่นๆ')
        : (reason.trim() ? `${reasonType} - ${reason.trim()}` : reasonType);
        
      itemsToAdd.push({
        id: Date.now() + Math.random(),
        lotId: lot.id,
        itemName: lot.itemName,
        supplierLot: lot.supplierLot,
        inhouseLot: lot.inhouseLot,
        unit: lot.unit || 'ชิ้น',
        amount: amt,
        date: withdrawalDate,
        finalReason
      });
      
      // Clear this lot's input amount
      newLotWithdrawalAmounts[id] = '';
    }
    
    if (itemsToAdd.length === 0) {
      alert("กรุณาระบุจำนวนที่ต้องการตัดจ่ายสำหรับ Lot ที่เลือก");
      return;
    }
    
    setCart(prev => [...prev, ...itemsToAdd]);
    setLotWithdrawalAmounts(newLotWithdrawalAmounts);
    // Clear selection and inputs
    setSelectedLotIds([]);
    setAmount('');
    setReason('');
    setReasonType('ตัดเข้าห้องสะอาด');
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(x => x.id !== id));
  };

  const handleCommitCart = () => {
    if (cart.length === 0) return;
    
    setInventory(prev => {
      return prev.map(item => {
        // Find all cart entries for this lot
        const cartEntriesForLot = cart.filter(c => c.lotId === item.id);
        if (cartEntriesForLot.length > 0) {
          const totalDeduction = cartEntriesForLot.reduce((sum, c) => sum + c.amount, 0);
          const newWithdrawals = cartEntriesForLot.map(c => ({
            id: c.id,
            date: c.date,
            amount: c.amount,
            reason: c.finalReason
          }));
          return {
            ...item,
            remainingQty: item.remainingQty - totalDeduction,
            withdrawals: [...(item.withdrawals || []), ...newWithdrawals]
          };
        }
        return item;
      });
    });
    
    alert(`บันทึกการตัดจ่ายทั้งหมดเรียบร้อยแล้ว (จำนวน ${cart.length} รายการ)`);
    setCart([]);
  };

  const handleSelectHistory = (id) => {
    setSelectedHistoryIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllHistory = (e) => {
    if (e.target.checked) {
      setSelectedHistoryIds(filteredWithdrawals.map(w => w.id));
    } else {
      setSelectedHistoryIds([]);
    }
  };

  const handleCancelWithdrawal = (withdrawalId) => {
    // Find the lot containing this withdrawal
    let targetLot = null;
    let targetW = null;
    
    for (const lot of inventory) {
      if (lot.withdrawals && lot.withdrawals.length > 0) {
        const found = lot.withdrawals.find(w => w.id === withdrawalId);
        if (found) {
          targetLot = lot;
          targetW = found;
          break;
        }
      }
    }

    if (!targetLot || !targetW) {
      alert("ไม่พบข้อมูลการตัดจ่ายนี้");
      return;
    }

    if (targetW.isCancelled) {
      alert("รายการนี้ถูกยกเลิกไปแล้ว");
      return;
    }

    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะยกเลิกการตัดจ่ายพัสดุจำนวน -${targetW.amount} ${targetLot.unit || 'ชิ้น'} ของ Lot: ${targetLot.supplierLot}?\nการยกเลิกจะคืนจำนวนพัสดุนี้เข้าคลังคงเหลือ และทำเครื่องหมายสถานะเป็น "ยกเลิก"`)) {
      setInventory(prev => prev.map(item => {
        if (item.id === targetLot.id) {
          const updatedWithdrawals = item.withdrawals.map(w => {
            if (w.id === withdrawalId) {
              return { ...w, isCancelled: true };
            }
            return w;
          });
          const refundedQty = Math.min(item.quantity, item.remainingQty + targetW.amount);
          return {
            ...item,
            remainingQty: refundedQty,
            withdrawals: updatedWithdrawals
          };
        }
        return item;
      }));
      alert("ยกเลิกการตัดจ่ายสำเร็จ และคืนยอดคงคลังเรียบร้อยแล้ว");
    }
  };

  const printWithdrawalPDF = (withdrawalList) => {
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
          <title>ใบนำตัดจ่ายพัสดุ - NBC STOCK</title>
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
                  <label><input type="checkbox" id="col-date" checked onchange="updateTable()"> วันที่ตัดจ่าย</label>
                  <label><input type="checkbox" id="col-item" checked onchange="updateTable()"> รายการสินค้า</label>
                  <label><input type="checkbox" id="col-supplier" checked onchange="updateTable()"> Supplier Lot</label>
                  <label><input type="checkbox" id="col-inhouse" checked onchange="updateTable()"> QC Lot</label>
                  <label><input type="checkbox" id="col-qty" checked onchange="updateTable()"> จำนวนตัดจ่าย</label>
                  <label><input type="checkbox" id="col-unit" checked onchange="updateTable()"> หน่วย</label>
                  <label><input type="checkbox" id="col-location" checked onchange="updateTable()"> ที่เก็บเดิม</label>
                  <label><input type="checkbox" id="col-reason" checked onchange="updateTable()"> เหตุผล / หมายเหตุ</label>
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

          <div class="header">
            <div>
              <div class="title">ใบนำตัดจ่ายพัสดุ (Material Withdrawal Slip)</div>
              <div style="font-size: 11px; color: #555; margin-top: 5px;">ระบบบริหารจัดการคลังสินค้า NBC STOCK</div>
            </div>
            <div class="meta-info">
              <div><strong>วันที่ออกเอกสาร:</strong> ${today}</div>
              <div><strong>จำนวนรายการตัดจ่าย:</strong> ${withdrawalList.length} รายการ</div>
            </div>
          </div>

          <table id="report-table">
            <thead>
              <tr>
                <th id="th-date" class="col-date" style="width: 10%;">วันที่ตัดจ่าย</th>
                <th id="th-item" class="col-item" style="width: 25%;">รายการสินค้า</th>
                <th id="th-supplier" class="col-supplier" style="width: 12%;">Supplier Lot</th>
                <th id="th-inhouse" class="col-inhouse" style="width: 12%;">QC Lot</th>
                <th id="th-qty" class="col-qty" style="width: 10%; text-align: right;">จำนวนตัดจ่าย</th>
                <th id="th-unit" class="col-unit" style="width: 7%;">หน่วย</th>
                <th id="th-location" class="col-location" style="width: 8%;">ที่เก็บเดิม</th>
                <th id="th-reason" class="col-reason" style="width: 16%;">เหตุผล / หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${withdrawalList.map(w => `
                <tr style="${w.isCancelled ? 'opacity: 0.55; text-decoration: line-through;' : ''}">
                  <td class="col-date nowrap">${escapeHTML(w.date)}</td>
                  <td class="col-item" style="font-weight: 600;">${escapeHTML(w.itemName)}</td>
                  <td class="col-supplier">${escapeHTML(w.supplierLot) || '-'}</td>
                  <td class="col-inhouse">${escapeHTML(w.inhouseLot) || '-'}</td>
                  <td class="col-qty" style="font-weight: 700; color: #dc2626; text-align: right;">
                    ${w.isCancelled ? `<s>-${w.amount.toLocaleString()}</s> <span style="font-size: 10px; color: #ef4444; display: block;">(ยกเลิกแล้ว)</span>` : `-${w.amount.toLocaleString()}`}
                  </td>
                  <td class="col-unit">${escapeHTML(w.unit) || 'ชิ้น'}</td>
                  <td class="col-location">${escapeHTML(w.location) || '-'}</td>
                  <td class="col-reason">${w.isCancelled ? `(ยกเลิกการตัดจ่าย) ${escapeHTML(w.reason)}` : escapeHTML(w.reason || '-')}</td>
                </tr>
              `).join('')}
              <tr id="total-row" class="total-row">
                <td id="total-label-cell" colspan="4" style="text-align: right;">รวมจำนวนตัดจ่ายทั้งสิ้น:</td>
                <td id="total-val-cell" class="col-qty" style="color: #dc2626; text-align: right;">-${withdrawalList.reduce((sum, w) => sum + (w.isCancelled ? 0 : w.amount), 0).toLocaleString()}</td>
                <td id="total-unit-cell" class="col-unit" colspan="3">หน่วยตามรายการ</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-block">
              <br><br>
              <strong>ผู้จัดทำ / ผู้ขอเบิกพัสดุ</strong>
              <div style="margin-top: 5px; font-size: 11px; color: #6b7280;">วันที่: ...... / ...... / ......</div>
            </div>
            <div class="sig-block">
              <br><br>
              <strong>ผู้ตรวจสอบ / ผู้อนุมัติจ่ายพัสดุ</strong>
              <div style="margin-top: 5px; font-size: 11px; color: #6b7280;">วันที่: ...... / ...... / ......</div>
            </div>
          </div>

          <script>
            const colNames = {
              date: 'วันที่ตัดจ่าย',
              item: 'รายการสินค้า',
              supplier: 'Supplier Lot',
              inhouse: 'QC Lot',
              qty: 'จำนวนตัดจ่าย',
              unit: 'หน่วย',
              location: 'ที่เก็บเดิม',
              reason: 'เหตุผล / หมายเหตุ'
            };
            
            const colWidths = {
              date: 10,
              item: 25,
              supplier: 12,
              inhouse: 12,
              qty: 10,
              unit: 7,
              location: 8,
              reason: 16
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
              const cols = ['date', 'item', 'supplier', 'inhouse', 'qty', 'unit', 'location', 'reason'];
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
              const reasonChecked = document.getElementById('col-reason').checked;
              
              const totalRow = document.getElementById('total-row');
              if (!qtyChecked) {
                totalRow.style.display = 'none';
              } else {
                totalRow.style.display = '';
                const columnsBeforeQty = ['date', 'item', 'supplier', 'inhouse'];
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
                if (reasonChecked) visibleCountAfterQty++;
                
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

  const printWithdrawalReportPDF = (reportList) => {
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
          <title>รายงานสรุปการตัดจ่ายพัสดุ - NBC STOCK</title>
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
                  <label><input type="checkbox" id="col-date" checked onchange="updateTable()"> วันที่ตัดจ่าย</label>
                  <label><input type="checkbox" id="col-item" checked onchange="updateTable()"> รายการสินค้า</label>
                  <label><input type="checkbox" id="col-supplier" checked onchange="updateTable()"> Supplier Lot</label>
                  <label><input type="checkbox" id="col-inhouse" checked onchange="updateTable()"> QC Lot</label>
                  <label><input type="checkbox" id="col-qty" checked onchange="updateTable()"> จำนวนตัดจ่าย</label>
                  <label><input type="checkbox" id="col-unit" checked onchange="updateTable()"> หน่วย</label>
                  <label><input type="checkbox" id="col-location" checked onchange="updateTable()"> ที่เก็บเดิม</label>
                  <label><input type="checkbox" id="col-reason" checked onchange="updateTable()"> เหตุผล / หมายเหตุ</label>
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
              <div class="title">รายงานสรุปการตัดจ่ายพัสดุ (Material Withdrawal Summary Report)</div>
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
                <th id="th-date" class="col-date" style="width: 10%;">วันที่ตัดจ่าย</th>
                <th id="th-item" class="col-item" style="width: 25%;">รายการสินค้า</th>
                <th id="th-supplier" class="col-supplier" style="width: 12%;">Supplier Lot</th>
                <th id="th-inhouse" class="col-inhouse" style="width: 12%;">QC Lot</th>
                <th id="th-qty" class="col-qty" style="width: 10%; text-align: right;">จำนวนตัดจ่าย</th>
                <th id="th-unit" class="col-unit" style="width: 7%;">หน่วย</th>
                <th id="th-location" class="col-location" style="width: 8%;">ที่เก็บเดิม</th>
                <th id="th-reason" class="col-reason" style="width: 16%;">เหตุผล / หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${reportList.map(w => `
                <tr style="${w.isCancelled ? 'opacity: 0.55; text-decoration: line-through;' : ''}">
                  <td class="col-date nowrap">${formatDateToDDMMYY(w.date)}</td>
                  <td class="col-item" style="font-weight: 600;">${escapeHTML(w.itemName)}</td>
                  <td class="col-supplier">${escapeHTML(w.supplierLot) || '-'}</td>
                  <td class="col-inhouse">${escapeHTML(w.inhouseLot) || '-'}</td>
                  <td class="col-qty" style="font-weight: 700; color: #dc2626; text-align: right;">
                    ${w.isCancelled ? `<s>-${w.amount.toLocaleString()}</s> <span style="font-size: 10px; color: #ef4444; display: block;">(ยกเลิกแล้ว)</span>` : `-${w.amount.toLocaleString()}`}
                  </td>
                  <td class="col-unit">${escapeHTML(w.unit) || 'ชิ้น'}</td>
                  <td class="col-location">${escapeHTML(w.location) || '-'}</td>
                  <td class="col-reason">${w.isCancelled ? `(ยกเลิกการตัดจ่าย) ${escapeHTML(w.reason)}` : escapeHTML(w.reason || '-')}</td>
                </tr>
              `).join('')}
              <tr id="total-row" class="total-row">
                <td id="total-label-cell" colspan="4" style="text-align: right;">รวมจำนวนตัดจ่ายทั้งสิ้น:</td>
                <td id="total-val-cell" class="col-qty" style="color: #dc2626; text-align: right;">-${reportList.reduce((sum, w) => sum + (w.isCancelled ? 0 : w.amount), 0).toLocaleString()}</td>
                <td id="total-unit-cell" class="col-unit" colspan="3">หน่วยตามรายการ</td>
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
              <strong>ผู้ตรวจสอบ / ผู้อนุมัติรายงาน</strong>
              <div style="margin-top: 5px; font-size: 11px; color: #6b7280;">วันที่: ...... / ...... / ......</div>
            </div>
          </div>

          <script>
            const colNames = {
              date: 'วันที่ตัดจ่าย',
              item: 'รายการสินค้า',
              supplier: 'Supplier Lot',
              inhouse: 'QC Lot',
              qty: 'จำนวนตัดจ่าย',
              unit: 'หน่วย',
              location: 'ที่เก็บเดิม',
              reason: 'เหตุผล / หมายเหตุ'
            };
            
            const colWidths = {
              date: 10,
              item: 25,
              supplier: 12,
              inhouse: 12,
              qty: 10,
              unit: 7,
              location: 8,
              reason: 16
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
              const cols = ['date', 'item', 'supplier', 'inhouse', 'qty', 'unit', 'location', 'reason'];
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
              const reasonChecked = document.getElementById('col-reason').checked;
              
              const totalRow = document.getElementById('total-row');
              if (!qtyChecked) {
                totalRow.style.display = 'none';
              } else {
                totalRow.style.display = '';
                const columnsBeforeQty = ['date', 'item', 'supplier', 'inhouse'];
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
                if (reasonChecked) visibleCountAfterQty++;
                
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

  const printRawMaterialRequisitionPDF = (reportList) => {
    const printWindow = window.open("", "_blank", "width=1000,height=900");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อเปิดหน้าพิมพ์เอกสาร");
      return;
    }

    // Only print active (non-cancelled) items to reflect "จริงที่จ่าย"
    const activeList = reportList.filter(w => !w.isCancelled);

    const isLocationString = (str, location) => {
      if (!str) return false;
      const s = String(str).toLowerCase().trim();
      const loc = location ? String(location).toLowerCase().trim() : '';
      return s.includes('ชั้น') || s.includes('ตึก') || s.includes('ตู้') || s.includes('ห้อง') || s.includes('คลัง') || s.includes('shelf') || s.includes('floor') || s.includes('building') || (loc && s === loc);
    };

    const formatPackSizeWithUnit = (packSize, unit, location) => {
      if (!packSize || packSize === '-') return '-';
      const ps = String(packSize).trim();
      if (isLocationString(ps, location)) return '-';
      
      const hasAlphabet = /[a-zA-Z\u0e00-\u0e7f]/.test(ps);
      if (hasAlphabet) {
        return ps;
      }
      return `${ps} ${unit || 'ชิ้น'}`;
    };

    const formatQtyWithUnit = (qty, unit) => {
      if (qty === undefined || qty === null || qty === '') return '';
      return `${Number(qty).toLocaleString()} ${unit || 'ชิ้น'}`;
    };

    // Create a dynamic list of rows: if the active items fit in 20 rows, pad up to 20.
    // If there are more than 20 items, display all of them (it will naturally split into multiple pages).
    const rows = [];
    const minRowCount = 20;
    const totalRowsToCreate = Math.max(activeList.length, minRowCount);

    for (let i = 0; i < totalRowsToCreate; i++) {
      if (i < activeList.length) {
        const item = activeList[i];
        rows.push({
          no: i + 1,
          itemName: `${item.itemName} (QC Lot: ${item.inhouseLot || '-'}, Supplier Lot: ${item.supplierLot || '-'})`,
          unitPack: formatPackSizeWithUnit(item.packSize, item.unit, item.location),
          amountReq: formatQtyWithUnit(item.amount, item.unit),
          amountIssued: formatQtyWithUnit(item.amount, item.unit),
        });
      } else {
        rows.push({
          no: '',
          itemName: '',
          unitPack: '',
          amountReq: '',
          amountIssued: '',
        });
      }
    }

    const htmlContent = `
      <html>
        <head>
          <title></title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              color: #000;
              background-color: #fff;
              font-size: 13px;
              line-height: 1.3;
              margin: 0;
              padding: 10mm;
              box-sizing: border-box;
            }
            .title-container {
              text-align: center;
              margin-bottom: 5px;
            }
            .title {
              font-size: 20px;
              font-weight: 700;
              margin: 0;
              letter-spacing: 1px;
            }
            .date-row {
              text-align: right;
              font-size: 13px;
              margin-bottom: 10px;
              padding-right: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th {
              border: 1.5px solid #000;
              font-weight: 600;
              text-align: center;
              padding: 6px 4px;
              font-size: 12px;
            }
            td {
              border: 1.5px solid #000;
              padding: 5px 4px;
              font-size: 12px;
              height: 20px;
            }
            .center {
              text-align: center;
              white-space: nowrap;
            }
            .right {
              text-align: right;
              padding-right: 8px;
              white-space: nowrap;
            }
            .footer {
              position: fixed;
              bottom: 8mm;
              left: 10mm;
              right: 10mm;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              padding: 0 5px;
            }
            .actions-bar {
              background-color: #0f172a;
              padding: 12px 20px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              margin-bottom: 15px;
              color: white;
            }
            .edit-inputs {
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
              flex-grow: 1;
            }
            .input-group {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .input-group label {
              font-size: 12px;
              color: #94a3b8;
              font-weight: 600;
              white-space: nowrap;
            }
            .input-group input {
              background-color: #1e293b;
              border: 1px solid #334155;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              font-family: 'Sarabun', sans-serif;
              font-size: 13px;
              outline: none;
              min-width: 140px;
            }
            .input-group input:focus {
              border-color: #ea580c;
            }
            .btn-print {
              background-color: #ea580c;
              color: white;
              border: none;
              padding: 8px 20px;
              border-radius: 4px;
              font-weight: 600;
              cursor: pointer;
              font-family: 'Sarabun', sans-serif;
              font-size: 13px;
              transition: all 0.2s;
              white-space: nowrap;
            }
            .btn-print:hover {
              background-color: #c2410c;
            }
            .print-page-header-spacer {
              display: none;
            }
            .print-page-footer-spacer {
              display: none;
            }
            @media print {
              @page {
                size: auto;
                margin: 0mm;
              }
              .actions-bar {
                display: none !important;
              }
              body {
                margin: 0;
                padding: 10mm;
              }
              .print-page-header-spacer {
                display: table-row;
              }
              .print-page-header-spacer th {
                border: none !important;
                height: 10mm;
                padding: 0;
                background: transparent;
              }
              .print-page-footer-spacer {
                display: table-row;
              }
              .print-page-footer-spacer td {
                border: none !important;
                height: 20mm;
                padding: 0;
                background: transparent;
              }
            }
          </style>
        </head>
        <body>
          <div class="actions-bar">
            <div class="edit-inputs">
              <div class="input-group">
                <label>ชื่อเอกสาร:</label>
                <input type="text" id="input-title" value="ใบเบิก-จ่ายวัตถุดิบ" oninput="updateHeaderFooter()" />
              </div>
              <div class="input-group">
                <label>แบบฟอร์มเลขที่:</label>
                <input type="text" id="input-form-no" value="BSP 014/001" oninput="updateHeaderFooter()" />
              </div>
              <div class="input-group">
                <label>แก้ไขครั้งที่:</label>
                <input type="text" id="input-revision" value="03/2564" oninput="updateHeaderFooter()" />
              </div>
            </div>
            <button class="btn-print" onclick="window.print()">พิมพ์เอกสาร / บันทึก PDF</button>
          </div>
          
          <div class="title-container">
            <h1 class="title" id="doc-title">ใบเบิก-จ่ายวัตถุดิบ</h1>
          </div>
          <div class="date-row">
            วันที่ _______________ เดือน ___________________________ พ.ศ. _________________
          </div>

          <table>
            <thead>
              <tr class="print-page-header-spacer">
                <th colspan="8"></th>
              </tr>
              <tr>
                <th style="width: 6%;">ลำดับที่</th>
                <th style="width: 38%;">รายการ</th>
                <th style="width: 10%;">หน่วยละ</th>
                <th style="width: 11%;">จำนวนเบิก</th>
                <th style="width: 9%;">ผู้เบิก</th>
                <th style="width: 11%;">จำนวนจ่าย</th>
                <th style="width: 9%;">ผู้จ่าย</th>
                <th style="width: 16%;">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td class="center">${r.no}</td>
                  <td style="padding-left: 8px; font-weight: ${r.itemName ? '600' : 'normal'};">${escapeHTML(r.itemName)}</td>
                  <td class="center">${escapeHTML(r.unitPack)}</td>
                  <td class="right">${r.amountReq ? escapeHTML(r.amountReq) : ''}</td>
                  <td class="center"></td>
                  <td class="right" style="font-weight: bold;">${r.amountIssued ? escapeHTML(r.amountIssued) : ''}</td>
                  <td class="center"></td>
                  <td class="center"></td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="print-page-footer-spacer">
                <td colspan="8"></td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            <span id="footer-form-no">แบบฟอร์มเลขที่ BSP 014/001</span>
            <span id="footer-revision">แก้ไขครั้งที่ 03/2564</span>
          </div>

          <script>
            function updateHeaderFooter() {
              const titleVal = document.getElementById('input-title').value;
              const formNoVal = document.getElementById('input-form-no').value;
              const revisionVal = document.getElementById('input-revision').value;
              
              document.getElementById('doc-title').innerText = titleVal;
              document.getElementById('footer-form-no').innerText = 'แบบฟอร์มเลขที่ ' + formNoVal;
              document.getElementById('footer-revision').innerText = 'แก้ไขครั้งที่ ' + revisionVal;
            }

            window.onload = function() {
              document.title = "";
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
      <div className="page-header">
        <h1 className="page-title">โมดูลการตัดจ่ายพัสดุ (Withdrawal)</h1>
        <p className="page-subtitle">บันทึกการเบิกใช้พัสดุออกจากคลังสินค้าแยกตาม Lot</p>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          className="btn" 
          style={{ 
            background: withdrawalTab === 'new' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: 700
          }}
          onClick={() => setWithdrawalTab('new')}
        >
          ทำรายการตัดจ่าย
        </button>
        <button 
          className="btn" 
          style={{ 
            background: withdrawalTab === 'history' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: 700
          }}
          onClick={() => setWithdrawalTab('history')}
        >
          ประวัติการตัดจ่ายคลัง ({historicalWithdrawals.length})
        </button>
      </div>

      {withdrawalTab === 'new' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Step 1: Selection */}
            <div className="glass card">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={20} color="var(--accent-color)" /> 1. เลือกรายการพัสดุ
              </h3>
              <div style={{ marginBottom: '2rem' }}>
                <label>ชื่อสินค้า</label>
                <div style={{ position: 'relative' }}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      background: 'var(--glass-bg)',
                      padding: '0.45rem 0.75rem',
                      cursor: 'pointer',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <input
                      type="text"
                      placeholder="พิมพ์เพื่อค้นหาชื่อสินค้า..."
                      value={isDropdownOpen ? searchQuery : selectedItem}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDropdownOpen(true);
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        width: '100%',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                    <ChevronDown size={18} color="var(--text-secondary)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </div>

                  {isDropdownOpen && (
                    <>
                      <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                        onClick={() => { setIsDropdownOpen(false); setSearchQuery(''); }}
                      />
                      <div 
                        style={{
                          position: 'absolute',
                          top: '105%',
                          left: 0,
                          right: 0,
                          maxHeight: '250px',
                          overflowY: 'auto',
                          background: '#ffffff',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          zIndex: 999,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {((items ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : []).length === 0) ? (
                          <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            ไม่พบสินค้าที่ตรงกับคำค้นหา
                          </div>
                        ) : (
                          (items ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : []).map(item => (
                            <div
                              key={item.name}
                              style={{
                                padding: '0.6rem 1rem',
                                cursor: 'pointer',
                                background: selectedItem === item.name ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: '0.88rem',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = 'rgba(15, 23, 42, 0.05)'}
                              onMouseLeave={(e) => e.target.style.background = selectedItem === item.name ? 'rgba(245, 158, 11, 0.15)' : 'transparent'}
                              onClick={() => {
                                setSelectedItem(item.name);
                                setSelectedLotIds([]);
                                setIsDropdownOpen(false);
                                setSearchQuery('');
                                setLotSearchQuery('');
                                setAmount('');
                              }}
                            >
                              {item.name} {item.unit ? `(${item.unit})` : ''}
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <Zap size={13} color="var(--accent-color)" /> เลือกพัสดุแนะนำแบบด่วน (เคลื่อนไหวบ่อย 15 อันดับแรก):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '130px', overflowY: 'auto', padding: '0.2rem 0.1rem' }}>
                  {recommendedItems.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ไม่มีข้อมูลการเคลื่อนไหว</span>
                  ) : (
                    recommendedItems.map(item => (
                      <button
                        key={item.name}
                        type="button"
                        className="btn"
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          borderRadius: '20px',
                          background: selectedItem === item.name ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.04)',
                          border: selectedItem === item.name ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                          color: selectedItem === item.name ? '#fff' : 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => {
                          setSelectedItem(item.name);
                          setLotSearchQuery('');
                          setSelectedLotIds([]);
                          setAmount('');
                        }}
                      >
                        {item.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Lot ที่มีสินค้าพร้อมใช้ ({availableLots.length === totalLotsCount ? availableLots.length : `${availableLots.length} จาก ${totalLotsCount}`})
              </h4>

              {totalLotsCount > 0 && (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    background: 'var(--glass-bg)',
                    padding: '0.45rem 0.75rem',
                    marginBottom: '1rem'
                  }}
                >
                  <Search size={16} color="var(--text-muted)" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="ค้นหาตาม Supplier Lot, QC Lot หรือสถานที่เก็บ..."
                    value={lotSearchQuery}
                    onChange={(e) => setLotSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      width: '100%',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '450px', overflowY: 'auto' }}>
                {availableLots.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                    <Package size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>{totalLotsCount > 0 ? 'ไม่พบ Lot ที่ตรงกับคำค้นหา' : 'ไม่มีสินค้าคงเหลือในสต็อก'}</p>
                  </div>
                ) : (
                  availableLots.map(lot => {
                    const pendingAmt = lotPendingAmounts[lot.id] || 0;
                    const displayRemaining = lot.remainingQty - pendingAmt;
                    const isSelected = selectedLotIds.includes(lot.id);
                    return (
                      <div 
                        key={lot.id} 
                        className={`glass ${isSelected ? 'active-lot' : ''}`}
                        style={{ 
                          padding: '0.4rem 0.65rem', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
                          background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'var(--glass-bg)',
                          transition: 'var(--transition)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onClick={() => {
                          setSelectedLotIds([lot.id]);
                        }}
                      >
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setSelectedLotIds(prev => 
                              prev.includes(lot.id) ? prev.filter(x => x !== lot.id) : [...prev, lot.id]
                            );
                          }}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>S/N Lot:</span>
                                {lot.supplierLot}
                              </div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>QC Lot:</span>
                                {lot.inhouseLot || '-'}
                              </div>
                              <span className={`status-badge status-${(lot.qcStatus || 'Quarantine').toLowerCase()}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem', borderRadius: '4px', textTransform: 'none', border: '1px solid transparent' }}>
                                {lot.qcStatus || 'Quarantine'}
                              </span>
                              <AcceptanceBadge status={lot.acceptanceStatus} />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <MapPin size={11} /> {lot.location}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '1rem', lineHeight: 1 }}>{displayRemaining}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{lot.unit || 'ชิ้น'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Step 2: Withdrawal Form */}
            <div className="glass card">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MinusCircle size={20} color="var(--danger)" /> 2. รายละเอียดการตัดจ่าย
              </h3>
              
              {selectedLotIds.length > 0 ? (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)' }}>
                    {selectedLotIds.length === 1 ? (
                      (() => {
                        const lot = inventory.find(i => i.id === selectedLotIds[0]);
                        const pendingAmt = lotPendingAmounts[lot.id] || 0;
                        const displayRemaining = lot.remainingQty - pendingAmt;
                        return (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>กำลังตัดจ่ายจาก</div>
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Supplier Lot:</div>
                                <div style={{ fontWeight: 700 }}>{lot.supplierLot}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>QC Lot:</div>
                                <div style={{ fontWeight: 700 }}>{lot.inhouseLot || '-'}</div>
                              </div>
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                              คงเหลือ (หักในรายการชั่วคราว): <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{displayRemaining} {lot.unit || 'ชิ้น'}</span>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      (() => {
                        const selectedLotsData = inventory.filter(i => selectedLotIds.includes(i.id));
                        const totalRemainingInSelected = selectedLotsData.reduce((sum, l) => {
                          const pendingAmt = lotPendingAmounts[l.id] || 0;
                          return sum + (l.remainingQty - pendingAmt);
                        }, 0);
                        const unit = selectedLotsData[0]?.unit || 'ชิ้น';
                        return (
                          <>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>กำลังตัดจ่ายจาก</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem' }}>
                              {selectedLotIds.length} Lot ที่เลือก
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                              คงเหลือรวมทั้งหมด: <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{totalRemainingInSelected} {unit}</span>
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} /> วันที่ตัดจ่าย
                    </label>
                    <input type="date" value={withdrawalDate} onChange={e => setWithdrawalDate(e.target.value)} />
                  </div>

                  <div>
                    <label>จำนวนที่ต้องการตัดจ่ายรวม</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={amount} 
                        onChange={e => handleTotalAmountChange(e.target.value)}
                        style={{ paddingRight: '4rem' }}
                      />
                      <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {inventory.find(i => selectedLotIds.includes(i.id))?.unit || 'ชิ้น'}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                        onClick={() => {
                          const selectedLotsData = inventory.filter(i => selectedLotIds.includes(i.id));
                          const totalRemainingInSelected = selectedLotsData.reduce((sum, l) => {
                            const pendingAmt = lotPendingAmounts[l.id] || 0;
                            return sum + (l.remainingQty - pendingAmt);
                          }, 0);
                          handleTotalAmountChange(totalRemainingInSelected);
                        }}
                      >
                        ตัดทั้งหมด (Full Lots)
                      </button>
                    </div>
                  </div>

                  {selectedLotIds.length > 1 && (
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        ระบุจำนวนสำหรับแต่ละ Lot:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {inventory.filter(i => selectedLotIds.includes(i.id)).map(lot => {
                          const pendingAmt = lotPendingAmounts[lot.id] || 0;
                          const displayRemaining = lot.remainingQty - pendingAmt;
                          return (
                            <div key={lot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                              <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                                <div style={{ fontWeight: 600 }}>Lot: {lot.supplierLot}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>คงเหลือ: {displayRemaining} {lot.unit || 'ชิ้น'}</div>
                              </div>
                              <div style={{ width: '90px', flexShrink: 0 }}>
                                <input 
                                  type="number"
                                  value={lotWithdrawalAmounts[lot.id] || ''}
                                  onChange={(e) => handleLotAmountChange(lot.id, e.target.value)}
                                  placeholder="0"
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', textAlign: 'right', width: '100%', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>เหตุผลการตัดจ่าย</label>
                      <select
                        value={reasonType}
                        onChange={e => setReasonType(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                      >
                        <option value="ตัดเข้าห้องสะอาด">1. ตัดเข้าห้องสะอาด</option>
                        <option value="ตัดจ่าย">2. ตัดจ่าย</option>
                        <option value="ตัดจำหน่าย">3. ตัดจำหน่าย</option>
                        <option value="ตัดเคลม">4. ตัดเคลม</option>
                        <option value="อื่นๆ โปรดระบุ ....">5. อื่นๆ โปรดระบุ ....</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                        {reasonType === 'อื่นๆ โปรดระบุ ....' ? 'ระบุรายละเอียดเหตุผลอื่นๆ (จำเป็น)' : 'หมายเหตุเพิ่มเติม (ถ้ามี)'}
                      </label>
                      <textarea 
                        placeholder={reasonType === 'อื่นๆ โปรดระบุ ....' ? 'กรุณาระบุรายละเอียดเพิ่มเติม...' : 'เช่น เลขที่ใบเบิก, หมายเลขเครื่องจักร, หรือหมายเหตุอื่นๆ...'} 
                        value={reason} 
                        onChange={e => setReason(e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'var(--glass-bg)', color: 'var(--text-primary)', outline: 'none' }}
                      ></textarea>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', background: 'var(--accent-color)', color: '#fff', justifyContent: 'center', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                      onClick={addToCart}
                    >
                      เพิ่มลงตารางตัดจ่ายชั่วคราว
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '4rem 0' }}>
                  <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                  <p>กรุณาเลือก Lot จากรายการด้านซ้าย</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Cart Card */}
          {cart.length > 0 && (
            <div className="glass card fade-in" style={{ borderTop: '4px solid var(--accent-color)', marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={20} color="var(--accent-color)" /> รายการรอตัดจ่ายชั่วคราว ({cart.length} รายการ)
                </span>
                <button 
                  className="btn" 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', borderRadius: '4px' }}
                  onClick={() => setCart([])}
                >
                  ล้างทั้งหมด
                </button>
              </h3>
              
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem' }}>ลำดับ</th>
                      <th style={{ padding: '0.5rem' }}>ชื่อสินค้า</th>
                      <th style={{ padding: '0.5rem' }}>Supplier Lot</th>
                      <th style={{ padding: '0.5rem' }}>QC Lot</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>จำนวนที่ตัดจ่าย</th>
                      <th style={{ padding: '0.5rem' }}>หน่วย</th>
                      <th style={{ padding: '0.5rem' }}>วันที่ตัดจ่าย</th>
                      <th style={{ padding: '0.5rem' }}>เหตุผล / หมายเหตุ</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>ลบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((cartItem, idx) => (
                      <tr key={cartItem.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{cartItem.itemName}</td>
                        <td style={{ padding: '0.5rem' }}>{cartItem.supplierLot}</td>
                        <td style={{ padding: '0.5rem' }}>{cartItem.inhouseLot || '-'}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-color)' }}>{cartItem.amount}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{cartItem.unit}</td>
                        <td style={{ padding: '0.5rem' }}>{formatDateToDDMMYYYY(cartItem.date)}</td>
                        <td style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cartItem.finalReason}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <button
                            className="btn"
                            style={{ padding: '0.2rem 0.5rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            onClick={() => removeFromCart(cartItem.id)}
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', background: 'var(--success)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}
                  onClick={handleCommitCart}
                >
                  ยืนยันการบันทึกการตัดจ่ายทั้งหมด ({cart.length} รายการ)
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 className="page-title" style={{ fontSize: '1.5rem' }}>ประวัติการตัดจ่ายพัสดุในคลัง</h2>
              <p className="page-subtitle">แสดงและสั่งพิมพ์รายงานเอกสารการตัดจ่ายพัสดุย้อนหลัง</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {filteredWithdrawals.length > 0 && (
                <>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => printRawMaterialRequisitionPDF(filteredWithdrawals)}
                    style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      color: '#10b981', 
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Printer size={18} /> พิมพ์ใบเบิก-จ่ายวัตถุดิบ (ฟอร์ม)
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => printWithdrawalReportPDF(filteredWithdrawals)}
                    style={{ 
                      background: 'rgba(14, 165, 233, 0.1)', 
                      color: '#0ea5e9', 
                      border: '1px solid rgba(14, 165, 233, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Printer size={18} /> พิมพ์รายงานตัดจ่าย ({historyStartDate && historyEndDate ? (historyStartDate === historyEndDate ? 'รายวัน' : 'รายช่วงเวลา') : historyStartDate || historyEndDate ? 'รายวัน' : 'ทั้งหมด'})
                  </button>
                </>
              )}
              {selectedHistoryIds.length > 0 && (
                <>
                  <button 
                    className="btn" 
                    onClick={() => printRawMaterialRequisitionPDF(historicalWithdrawals.filter(w => selectedHistoryIds.includes(w.id)))}
                    style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      color: '#10b981', 
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Printer size={18} /> พิมพ์ใบเบิก-จ่ายที่เลือก ({selectedHistoryIds.length})
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => printWithdrawalPDF(historicalWithdrawals.filter(w => selectedHistoryIds.includes(w.id)))}
                    style={{ 
                      background: 'rgba(234, 88, 12, 0.1)', 
                      color: '#ea580c', 
                      border: '1px solid rgba(234, 88, 12, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Printer size={18} /> พิมพ์ใบตัดจ่ายที่เลือก ({selectedHistoryIds.length})
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="glass card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: '1.5', minWidth: '300px' }}>
              <Search size={20} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="ค้นหาประวัติการตัดจ่ายตามชื่อสินค้า, Lot no., หรือเหตุผล..." 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: '0.5rem', width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: '1', minWidth: '250px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>ช่วงวันที่ตัดจ่าย:</span>
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

            {(historySearch || historyStartDate || historyEndDate || historyFilterItem !== 'All' || historyFilterLocation !== 'All' || historyFilterReason !== 'All' || historySortType !== 'date-desc') && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                onClick={() => {
                  setHistorySearch('');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setHistoryFilterItem('All');
                  setHistoryFilterLocation('All');
                  setHistoryFilterReason('All');
                  setHistorySortType('date-desc');
                }}
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          <div className="glass card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', width: '40px', verticalAlign: 'middle' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllHistory}
                      checked={filteredWithdrawals.length > 0 && selectedHistoryIds.length === filteredWithdrawals.length}
                    />
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>วันที่ตัดจ่าย</span>
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
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>จำนวนตัดจ่าย</span>
                      <select 
                        value={historySortType.startsWith('amount-') ? historySortType : 'none'} 
                        onChange={(e) => setHistorySortType(e.target.value === 'none' ? 'date-desc' : e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        <option value="none">ปกติ ↕️</option>
                        <option value="amount-desc">มาก 🔽</option>
                        <option value="amount-asc">น้อย 🔼</option>
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ที่เก็บเดิม</span>
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
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>เหตุผล / หมายเหตุ</span>
                      <select 
                        value={historySortType.startsWith('reason-') ? historySortType : 'none'} 
                        onChange={(e) => setHistorySortType(e.target.value === 'none' ? 'date-desc' : e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--accent-color)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.1rem' }}
                      >
                        <option value="none">ปกติ ↕️</option>
                        <option value="reason-asc">A-Z 🔼</option>
                        <option value="reason-desc">Z-A 🔽</option>
                      </select>
                      <select 
                        value={historyFilterReason} 
                        onChange={(e) => setHistoryFilterReason(e.target.value)}
                        style={{ fontSize: '0.68rem', padding: '0.15rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', width: '100%', minWidth: '120px' }}
                      >
                        <option value="All">ทั้งหมด</option>
                        {uniqueHistoryReasons.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '1rem', verticalAlign: 'middle' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      ไม่พบประวัติการตัดจ่ายพัสดุ
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid var(--glass-border)', opacity: w.isCancelled ? 0.55 : 1 }}>
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedHistoryIds.includes(w.id)}
                          onChange={() => handleSelectHistory(w.id)}
                        />
                      </td>
                      <td style={{ padding: '1rem' }}>{formatDateToDDMMYYYY(w.date)}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{w.itemName}</td>
                      <td style={{ padding: '1rem' }}>
                        <div>{w.supplierLot}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.inhouseLot || '-'}</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--danger)' }}>
                        {w.isCancelled ? (
                          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>-{w.amount}</span>
                        ) : (
                          `-${w.amount}`
                        )}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>{w.unit}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>{w.location || '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        {w.isCancelled ? (
                          <span style={{ color: '#ef4444', fontWeight: '500' }}>
                            (ยกเลิกการตัดจ่าย) {w.reason || ''}
                          </span>
                        ) : (
                          w.reason || '-'
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.2)' }}
                            onClick={() => printWithdrawalPDF([w])}
                          >
                            <Printer size={14} /> พิมพ์ใบตัดจ่าย (PDF)
                          </button>
                          {w.isCancelled ? (
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
                              onClick={() => handleCancelWithdrawal(w.id)}
                            >
                              ยกเลิกการตัดจ่าย
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
    </div>
  );
};

export default Withdrawal;
