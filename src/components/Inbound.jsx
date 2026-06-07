import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Printer, Copy, Search, Upload, Download } from 'lucide-react';
const Inbound = ({ setInventory, items, inventory = [], agreements = [] }) => {
  const [inboundTab, setInboundTab] = useState('draft'); // 'draft' or 'history'
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

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
      remarks: '',
      agreementId: ''
    }]);
  };

  const downloadTemplate = () => {
    const headers = [
      "วันที่รับเข้า (YYYY-MM-DD)",
      "ชื่อสินค้า (ต้องตรงตามทะเบียนพัสดุ)",
      "เลขที่สัญญาจัดซื้อ (ถ้ามี)",
      "Supplier Lot (จำเป็น)",
      "Inhouse Lot (ถ้ามี)",
      "สถานะ QC (Pass / Quarantine / Reject)",
      "ขนาดบรรจุ (เช่น 25kg, 10ชิ้น - ถ้ามี)",
      "จำนวนรับเข้า (จำเป็น - ตัวเลขเท่านั้น)",
      "ที่เก็บ (ถ้ามี)",
      "หมายเหตุ (ถ้ามี)"
    ];
    
    // Sample data row
    const sampleRow = [
      new Date().toISOString().split('T')[0],
      (items && items.length > 0) ? items[0].name : "Raw Material A",
      "",
      "LOT-SUP-12345",
      "LOT-INH-001",
      "Quarantine",
      "25kg",
      "100",
      "A1",
      "ตัวอย่างบันทึกย่อ"
    ];
    
    const formatCSVField = (field) => {
      const stringified = String(field || '').replace(/"/g, '""');
      if (stringified.includes(',') || stringified.includes('\n') || stringified.includes('"')) {
        return `"${stringified}"`;
      }
      return stringified;
    };

    const csvContent = "\uFEFF" + [
      headers.map(formatCSVField).join(","), 
      sampleRow.map(formatCSVField).join(",")
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "nbc_inbound_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length <= 1) {
          alert("ไม่พบข้อมูลที่จะนำเข้าในไฟล์ (กรุณาตรวจสอบว่ามีข้อมูลในไฟล์อย่างน้อย 1 แถวใต้หัวข้อตาราง)");
          return;
        }

        const parseCSVLine = (lineText) => {
          let p = '', c = false, r = [];
          for (let i = 0; i < lineText.length; i++) {
            let char = lineText[i];
            if (char === '"') {
              c = !c;
            } else if (char === ',' && !c) {
              r.push(p.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
              p = '';
            } else {
              p += char;
            }
          }
          r.push(p.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          return r;
        };

        const newEntries = [];
        const missingItems = new Set();
        
        for (let i = 1; i < lines.length; i++) {
          const cells = parseCSVLine(lines[i]);
          if (cells.length < 2) continue;

          const date = cells[0] || new Date().toISOString().split('T')[0];
          const itemName = cells[1] ? cells[1].trim() : '';
          const agreementId = cells[2] ? cells[2].trim() : '';
          const supplierLot = cells[3] ? cells[3].trim() : '';
          const inhouseLot = cells[4] ? cells[4].trim() : '';
          let qcStatus = cells[5] ? cells[5].trim() : 'Quarantine';
          const packSize = cells[6] ? cells[6].trim() : '';
          const quantity = cells[7] ? Number(cells[7].trim()) : '';
          const location = cells[8] ? cells[8].trim() : '';
          const remarks = cells[9] ? cells[9].trim() : '';

          if (!itemName && !supplierLot && !quantity) continue;

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
            id: Date.now() + i + Math.random(),
            date,
            itemName: matchedItem ? matchedItem.name : itemName,
            unit: matchedItem ? matchedItem.unit : 'ชิ้น',
            agreementId,
            supplierLot,
            inhouseLot,
            qcStatus: normalizedQcStatus,
            packSize,
            quantity: isNaN(quantity) || !cells[7] ? '' : quantity,
            location,
            remarks
          });
        }

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
      
      e.target.value = '';
    };
    reader.readAsText(file);
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
    const matchesSearch = (item.itemName && item.itemName.toLowerCase().includes(term)) ||
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

    return matchesSearch && matchesDate;
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
                <tr style="${e.isCancelled ? 'opacity: 0.55; text-decoration: line-through;' : ''}">
                  <td>${e.date || "-"}</td>
                  <td style="font-weight: 600;">${e.itemName || "-"}</td>
                  <td>${e.supplierLot || "-"}</td>
                  <td>${e.inhouseLot || "-"}</td>
                  <td>
                    ${e.isCancelled ? '<span style="color: #ef4444; font-weight: bold;">ยกเลิกแล้ว</span>' : `
                    <span class="status-badge ${
                      e.qcStatus === 'Pass' ? 'status-pass' :
                      e.qcStatus === 'Reject' ? 'status-reject' : 'status-quarantine'
                    }">
                      ${e.qcStatus}
                    </span>`}
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
                  ${itemsToPrint.reduce((sum, e) => sum + (e.isCancelled ? 0 : Number(e.quantity || 0)), 0)}
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

    const htmlContent = `
      <html>
        <head>
          <title>รายงานสรุปการรับเข้าพัสดุ - NBC STOCK</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Sarabun', sans-serif;
              padding: 30px;
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
              font-size: 22px;
              font-weight: 700;
              color: #003366;
            }
            .meta-info {
              text-align: right;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              margin-bottom: 35px;
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
            .actions-bar {
              background-color: #003366;
              padding: 12px 20px;
              border-radius: 6px;
              display: flex;
              justify-content: flex-end;
              margin-bottom: 20px;
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
              transition: all 0.2s;
            }
            .btn-print:hover {
              background-color: #c2410c;
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
            @media print {
              .actions-bar {
                display: none;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="actions-bar">
            <button class="btn-print" onclick="window.print()">พิมพ์รายงาน / บันทึก PDF</button>
          </div>
          <div class="header">
            <div>
              <div class="title">รายงานสรุปการรับเข้าพัสดุ (Material Inbound Summary Report)</div>
              <div style="font-size: 12px; color: #555; margin-top: 5px;">ระบบบริหารจัดการคลังสินค้า NBC STOCK</div>
            </div>
            <div class="meta-info">
              <div><strong>วันที่ออกรายงาน:</strong> ${today}</div>
              <div><strong>ช่วงเวลา:</strong> ${dateRangeStr}</div>
              <div><strong>จำนวนรายการ:</strong> ${reportList.length} รายการ</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 10%;">วันที่รับเข้า</th>
                <th style="width: 25%;">รายการสินค้า</th>
                <th style="width: 12%;">Supplier Lot</th>
                <th style="width: 12%;">Inhouse Lot</th>
                <th style="width: 10%;">สถานะ QC</th>
                <th style="width: 8%;">ที่เก็บ</th>
                <th style="width: 10%; text-align: right;">จำนวนรับ</th>
                <th style="width: 8%;">หน่วย</th>
              </tr>
            </thead>
            <tbody>
              ${reportList.map(item => `
                <tr style="${item.isCancelled ? 'opacity: 0.55; text-decoration: line-through;' : ''}">
                  <td>${item.date}</td>
                  <td style="font-weight: 600;">${item.itemName}</td>
                  <td>${item.supplierLot || '-'}</td>
                  <td>${item.inhouseLot || '-'}</td>
                  <td>
                    ${item.isCancelled ? '<span style="color: #ef4444; font-weight: bold;">ยกเลิกแล้ว</span>' : `
                    <span class="status-badge ${
                      item.qcStatus === 'Pass' ? 'status-pass' :
                      item.qcStatus === 'Reject' ? 'status-reject' : 'status-quarantine'
                    }">
                      ${item.qcStatus}
                    </span>`}
                  </td>
                  <td style="font-weight: 600;">${item.location || '-'}</td>
                  <td style="font-weight: 700; text-align: right;">${item.quantity.toLocaleString()}</td>
                  <td>${item.unit || 'ชิ้น'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="6" style="text-align: right;">รวมจำนวนรับเข้าทั้งสิ้น:</td>
                <td style="color: #003366; text-align: right;">${reportList.reduce((sum, item) => sum + (item.isCancelled ? 0 : Number(item.quantity)), 0).toLocaleString()}</td>
                <td>หน่วยตามรายการ</td>
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

          {/* CSV Import / Export Section */}
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
                นำเข้าข้อมูลรับเข้าหลายรายการ (Excel / CSV Import)
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ดาวน์โหลดไฟล์เทมเพลตเพื่อกรอกข้อมูล จากนั้นเลือกไฟล์เพื่อนำข้อมูลเข้าตารางแบบกลุ่มได้สะดวกรวดเร็ว
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
                <Download size={15} /> ดาวน์โหลด Template (.csv)
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
                <Upload size={15} /> นำเข้าไฟล์ข้อมูล (.csv)
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleImportCSV} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>

          <div className="glass card" style={{ overflowX: 'hidden', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '9%' }}>วันที่รับ</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '20%' }}>รายการสินค้า</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '12%' }}>สัญญาจัดซื้อ</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '10%' }}>Supplier Lot</th>
                  <th style={{ padding: '0.5rem 0.25rem', fontSize: '0.72rem', width: '11%' }}>Inhouse Lot</th>
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

            {(historySearch || historyStartDate || historyEndDate) && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                onClick={() => {
                  setHistorySearch('');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
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
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)', opacity: item.isCancelled ? 0.55 : 1 }}>
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
                        {item.isCancelled ? (
                          <span className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            ยกเลิกแล้ว
                          </span>
                        ) : (
                          <span className={`status-badge status-${item.qcStatus.toLowerCase()}`}>
                            {item.qcStatus}
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
    </div>
  );
};

export default Inbound;
