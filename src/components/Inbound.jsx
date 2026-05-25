import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Printer, Copy } from 'lucide-react';
const Inbound = ({ setInventory, items, inventory = [], agreements = [] }) => {
  const [inboundTab, setInboundTab] = useState('draft'); // 'draft' or 'history'
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);

  const getLatestInhouseLot = (itemName) => {
    if (!itemName) return '-';
    const matches = inventory.filter(item => 
      item.itemName === itemName && 
      item.inhouseLot && 
      item.inhouseLot.trim() !== ''
    );
    if (matches.length === 0) return '-';
    matches.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
      return dateB - dateA;
    });
    return matches[0].inhouseLot;
  };

  const [entries, setEntries] = useState([{
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
    billingStatus: 'Pending',
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
      billingStatus: 'Pending',
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
      billingStatus: lastEntry.billingStatus || 'Pending',
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
    const isValid = entries.every(e => e.itemName && e.quantity && e.supplierLot);
    if (!isValid) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รายการสินค้า, จำนวน, Supplier Lot)");
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
      billingStatus: 'Pending',
      remarks: '',
      agreementId: ''
    }]);
  };


  const printPDF = () => {
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const printWindow = window.open("", "_blank", "width=900,height=800");
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
            body {
              font-family: 'Sarabun', sans-serif;
              color: #222;
              padding: 2.5rem;
              background-color: #fff;
              line-height: 1.5;
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 3rem;
              font-size: 0.9rem;
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
              padding: 0.2rem 0.5rem;
              border-radius: 4px;
              font-size: 0.75rem;
              font-weight: bold;
              text-transform: uppercase;
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
            .no-print-btn {
              position: fixed;
              top: 1rem;
              right: 1rem;
              background: #003366;
              color: white;
              border: none;
              padding: 0.6rem 1.2rem;
              font-size: 0.9rem;
              font-weight: bold;
              border-radius: 4px;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            @media print {
              .no-print-btn {
                display: none;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">พิมพ์เอกสาร / บันทึก PDF</button>

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

          <table>
            <thead>
              <tr>
                <th>วันที่รับ</th>
                <th>รายการสินค้า</th>
                <th>Supplier Lot</th>
                <th>Inhouse Lot</th>
                <th>สถานะ QC</th>
                <th>Pack Size</th>
                <th>จำนวนรับ</th>
                <th>หน่วย</th>
                <th>ที่เก็บ</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr>
                  <td>${e.date || "-"}</td>
                  <td style="font-weight: 600;">${e.itemName || "-"}</td>
                  <td>${e.supplierLot || "-"}</td>
                  <td>${e.inhouseLot || "-"}</td>
                  <td>
                    <span class="status-badge ${
                      e.qcStatus === 'Pass' ? 'status-pass' :
                      e.qcStatus === 'Reject' ? 'status-reject' : 'status-quarantine'
                    }">
                      ${e.qcStatus}
                    </span>
                  </td>
                  <td>${e.packSize || "-"}</td>
                  <td style="font-weight: 700; text-align: right;">${e.quantity || "0"}</td>
                  <td>${e.unit || "ชิ้น"}</td>
                  <td>${e.location || "-"}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="6" style="text-align: right;">รวมจำนวนรับเข้าทั้งสิ้น</td>
                <td style="text-align: right; font-size: 1.05rem;">
                  ${entries.reduce((sum, e) => sum + Number(e.quantity || 0), 0)}
                </td>
                <td colspan="2">หน่วย</td>
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
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredHistory = inventory.filter(item => {
    const term = historySearch.toLowerCase();
    return (
      (item.itemName && item.itemName.toLowerCase().includes(term)) ||
      (item.supplierLot && item.supplierLot.toLowerCase().includes(term)) ||
      (item.inhouseLot && item.inhouseLot.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term))
    );
  });

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

  const printHistoricalPDF = (itemsToPrint) => {
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const printWindow = window.open("", "_blank", "width=900,height=800");
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
            body {
              font-family: 'Sarabun', sans-serif;
              color: #222;
              padding: 2.5rem;
              background-color: #fff;
              line-height: 1.5;
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 3rem;
              font-size: 0.9rem;
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
              padding: 0.2rem 0.5rem;
              border-radius: 4px;
              font-size: 0.75rem;
              font-weight: bold;
              text-transform: uppercase;
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
            .no-print-btn {
              position: fixed;
              top: 1rem;
              right: 1rem;
              background: #003366;
              color: white;
              border: none;
              padding: 0.6rem 1.2rem;
              font-size: 0.9rem;
              font-weight: bold;
              border-radius: 4px;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            @media print {
              .no-print-btn {
                display: none;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">พิมพ์เอกสาร / บันทึก PDF</button>

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

          <table>
            <thead>
              <tr>
                <th>วันที่รับ</th>
                <th>รายการสินค้า</th>
                <th>Supplier Lot</th>
                <th>Inhouse Lot</th>
                <th>สถานะ QC</th>
                <th>Pack Size</th>
                <th>จำนวนรับ</th>
                <th>หน่วย</th>
                <th>ที่เก็บ</th>
              </tr>
            </thead>
            <tbody>
              ${itemsToPrint.map(e => `
                <tr>
                  <td>${e.date || "-"}</td>
                  <td style="font-weight: 600;">${e.itemName || "-"}</td>
                  <td>${e.supplierLot || "-"}</td>
                  <td>${e.inhouseLot || "-"}</td>
                  <td>
                    <span class="status-badge ${
                      e.qcStatus === 'Pass' ? 'status-pass' :
                      e.qcStatus === 'Reject' ? 'status-reject' : 'status-quarantine'
                    }">
                      ${e.qcStatus}
                    </span>
                  </td>
                  <td>${e.packSize || "-"}</td>
                  <td style="font-weight: 700; text-align: right;">${e.quantity || "0"}</td>
                  <td>${e.unit || "ชิ้น"}</td>
                  <td>${e.location || "-"}</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="6" style="text-align: right;">รวมจำนวนรับเข้าทั้งสิ้น</td>
                <td style="text-align: right; font-size: 1.05rem;">
                  ${itemsToPrint.reduce((sum, e) => sum + Number(e.quantity || 0), 0)}
                </td>
                <td colspan="2">หน่วย</td>
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
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
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
          ทำรายการรับเข้าพัสดุ
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

          <div className="glass card" style={{ overflowX: 'hidden', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '9%' }}>วันที่รับ</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '18%' }}>รายการสินค้า</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '11%' }}>สัญญาจัดซื้อ</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '9%' }}>Supplier Lot</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '11%' }}>Inhouse Lot</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '9%' }}>สถานะ QC</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '7%' }}>Pack Size</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '6%' }}>จำนวน</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '5%' }}>หน่วย</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '5%' }}>ที่เก็บ</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '8%' }}>การวางบิล</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '4%' }}></th>
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
                      <select 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.itemName} 
                        onChange={(e) => updateEntry(entry.id, 'itemName', e.target.value)}
                      >
                        {items.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <select 
                        value={entry.agreementId || ''} 
                        onChange={(e) => updateEntry(entry.id, 'agreementId', e.target.value)}
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }}
                      >
                        <option value="">-- ไม่ระบุ --</option>
                        {agreements
                          .filter(ag => ag.itemName === entry.itemName && ag.status !== 'Completed')
                          .map(ag => (
                            <option key={ag.id} value={ag.id}>
                              {ag.id}
                            </option>
                          ))
                        }
                      </select>
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
                        placeholder="Inhouse no." 
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
                    <td style={{ padding: '0.5rem 0.25rem', verticalAlign: 'top' }}>
                      <select 
                        style={{ fontSize: '0.78rem', padding: '0.4rem 0.3rem', width: '100%' }} 
                        value={entry.billingStatus} 
                        onChange={(e) => updateEntry(entry.id, 'billingStatus', e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                      </select>
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
      ) : (
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 className="page-title">ประวัติการรับเข้าพัสดุในคลัง</h1>
              <p className="page-subtitle">แสดงและส่งออกเอกสารรายงานรายการรับเข้าพัสดุในอดีต</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {selectedHistoryIds.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => printHistoricalPDF(inventory.filter(item => selectedHistoryIds.includes(item.id)))}
                  style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)' }}
                >
                  <Printer size={18} /> พิมพ์ใบพัสดุที่เลือก ({selectedHistoryIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="glass card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="ค้นหาประวัติตามชื่อสินค้า, Lot no., หรือที่เก็บ..." 
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0.5rem', width: '100%' }}
            />
            {historySearch && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                onClick={() => setHistorySearch('')}
              >
                ล้างตัวค้นหา
              </button>
            )}
          </div>

          <div className="glass card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', width: '50px' }}>
                    <input 
                      type="checkbox" 
                      checked={filteredHistory.length > 0 && selectedHistoryIds.length === filteredHistory.length}
                      onChange={toggleSelectAllHistory}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                  </th>
                  <th style={{ padding: '1rem' }}>วันที่รับ</th>
                  <th style={{ padding: '1rem' }}>รายการสินค้า</th>
                  <th style={{ padding: '1rem' }}>Supplier / Inhouse Lot</th>
                  <th style={{ padding: '1rem' }}>สถานะ QC</th>
                  <th style={{ padding: '1rem' }}>ที่เก็บ</th>
                  <th style={{ padding: '1rem' }}>จำนวนรับเข้า</th>
                  <th style={{ padding: '1rem' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      ไม่พบประวัติการรับเข้าพัสดุ
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedHistoryIds.includes(item.id)}
                          onChange={() => toggleSelectHistory(item.id)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </td>
                      <td style={{ padding: '1rem' }}>{item.date}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{item.itemName}</td>
                      <td style={{ padding: '1rem' }}>
                        <div>{item.supplierLot || '-'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.inhouseLot || '-'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`status-badge status-${item.qcStatus.toLowerCase()}`}>
                          {item.qcStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{item.location || '-'}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        {item.quantity} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>{item.unit || 'ชิ้น'}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}
                          onClick={() => printHistoricalPDF([item])}
                        >
                          <Printer size={14} /> พิมพ์ใบพัสดุ (PDF)
                        </button>
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

export default Inbound;
