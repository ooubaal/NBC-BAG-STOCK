import { useState, useMemo } from 'react';
import { Plus, Check, X, FileText, ShieldAlert, PackageOpen, ChevronDown, ChevronUp, UserCheck, AlertTriangle, Search, Edit2, Trash2, Paperclip, Eye } from 'lucide-react';

const escapeHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const Agreements = ({ agreements, setAgreements, inventory, setInventory, items }) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'
  const [expandedAgreementId, setExpandedAgreementId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);

  // Editing state
  const [editingAgreementId, setEditingAgreementId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isEditFormDropdownOpen, setIsEditFormDropdownOpen] = useState(false);
  const [editFormSearchQuery, setEditFormSearchQuery] = useState('');

  // Deleting state
  const [deleteAgreementId, setDeleteAgreementId] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const activeDeliveriesCount = useMemo(() => {
    if (!deleteAgreementId) return 0;
    return inventory.filter(lot => lot.agreementId === deleteAgreementId && !lot.isCancelled).length;
  }, [deleteAgreementId, inventory]);

  const handleStartEdit = (agreement) => {
    setEditingAgreementId(agreement.id);
    setEditForm({
      ...agreement,
      totalQty: String(agreement.totalQty),
      attachments: agreement.attachments || []
    });
    setEditFormSearchQuery('');
    setIsEditFormDropdownOpen(false);
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (!editForm.totalQty || !editForm.supplier) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (จำนวนทั้งหมด, ผู้จัดจำหน่าย)");
      return;
    }

    if (Number(editForm.totalQty) <= 0) {
      alert("กรุณาระบุจำนวนจัดซื้อตามสัญญาให้ถูกต้อง (ต้องมีค่ามากกว่า 0)");
      return;
    }

    const updatedAgreements = agreements.map(ag => {
      if (ag.id === editingAgreementId) {
        return {
          ...ag,
          supplier: editForm.supplier,
          itemName: editForm.itemName,
          totalQty: Number(editForm.totalQty),
          unit: editForm.unit,
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

  // Helper to compress images (resizes to maximum 1200px width/height and quality 0.7)
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with 0.7 quality jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        callback(dataUrl);
      };
    };
  };

  // Handle file attachment upload
  const handleFileChange = (e, isEdit = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        alert(`ไฟล์ ${file.name} ไม่ได้รับการรองรับ กรุณาแนบเฉพาะไฟล์ PDF หรือรูปภาพ (JPEG/PNG) เท่านั้น`);
        return;
      }

      if (isPdf) {
        // PDF size check (must be < 800 KB)
        if (file.size > 800 * 1024) {
          alert(`ไฟล์ PDF "${file.name}" มีขนาดใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(2)} MB)\nกรุณาแนบไฟล์ขนาดไม่เกิน 800 KB เท่านั้น (แนะนำให้ลดขนาดไฟล์ PDF ออนไลน์ก่อนนำมาแนบ)`);
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const newAttach = {
            name: file.name,
            type: 'pdf',
            data: reader.result
          };
          if (isEdit) {
            setEditForm(prev => ({
              ...prev,
              attachments: [...(prev.attachments || []), newAttach]
            }));
          } else {
            setNewAgreement(prev => ({
              ...prev,
              attachments: [...(prev.attachments || []), newAttach]
            }));
          }
        };
      } else if (isImage) {
        // For images, we can compress them first
        compressImage(file, (base64Data) => {
          // Check compressed size (rough estimate of base64 size)
          const approxSize = base64Data.length * 0.75;
          if (approxSize > 800 * 1024) {
            alert(`ภาพ "${file.name}" มีขนาดใหญ่เกินไปหลังการบีบอัด กรุณาแนบรูปภาพที่มีความละเอียดต่ำกว่านี้ หรือขนาดไฟล์ต่ำกว่า 800 KB`);
            return;
          }

          const newAttach = {
            name: file.name,
            type: 'image',
            data: base64Data
          };

          if (isEdit) {
            setEditForm(prev => ({
              ...prev,
              attachments: [...(prev.attachments || []), newAttach]
            }));
          } else {
            setNewAgreement(prev => ({
              ...prev,
              attachments: [...(prev.attachments || []), newAttach]
            }));
          }
        });
      }
    });

    // Reset the input value so user can upload the same file again if needed
    e.target.value = '';
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

  // New agreement form state
  const [newAgreement, setNewAgreement] = useState({
    id: '',
    itemName: (items && items.length > 0) ? items[0].name : '',
    unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
    totalQty: '',
    supplier: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    remarks: '',
    attachments: []
  });

  // Handle saving new agreement
  const handleSaveAgreement = (e) => {
    e.preventDefault();
    if (!newAgreement.id || !newAgreement.totalQty || !newAgreement.supplier) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (เลขที่สัญญา, จำนวนทั้งหมด, ผู้จัดจำหน่าย)");
      return;
    }

    if (Number(newAgreement.totalQty) <= 0) {
      alert("กรุณาระบุจำนวนจัดซื้อตามสัญญาให้ถูกต้อง (ต้องมีค่ามากกว่า 0)");
      return;
    }

    const isDuplicate = agreements.some(ag => ag.id.toLowerCase() === newAgreement.id.toLowerCase());
    if (isDuplicate) {
      alert("มีเลขที่สัญญานี้อยู่ในระบบแล้ว กรุณาใช้เลขที่สัญญาอื่น");
      return;
    }

    const selected = items.find(i => i.name === newAgreement.itemName);
    const agreementToAdd = {
      ...newAgreement,
      totalQty: Number(newAgreement.totalQty),
      unit: selected ? selected.unit : 'ชิ้น',
      status: 'Active', // Initial status
      createdAt: new Date().toISOString(),
      attachments: newAgreement.attachments || []
    };

    setAgreements([...agreements, agreementToAdd]);
    alert("สร้างสัญญาจัดซื้อใหม่เรียบร้อยแล้ว!");
    
    // Reset form and go back to list
    setNewAgreement({
      id: '',
      itemName: (items && items.length > 0) ? items[0].name : '',
      unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
      totalQty: '',
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

      const acceptedQty = deliveries
        .filter(lot => lot.acceptanceStatus === 'Accepted')
        .reduce((sum, lot) => sum + Number(lot.quantity), 0);

      const pendingQty = deliveries
        .filter(lot => lot.acceptanceStatus === 'Pending')
        .reduce((sum, lot) => sum + Number(lot.quantity), 0);

      const rejectedQty = deliveries
        .filter(lot => lot.acceptanceStatus === 'Rejected')
        .reduce((sum, lot) => sum + Number(lot.quantity), 0);

      const totalDelivered = acceptedQty + pendingQty + rejectedQty;
      const outstandingQty = Math.max(0, ag.totalQty - acceptedQty);

      // Determine dynamic status
      let displayStatus = 'Active';
      if (acceptedQty >= ag.totalQty) {
        displayStatus = 'Completed';
      } else if (new Date(ag.endDate) < new Date()) {
        displayStatus = 'Expired';
      }

      return {
        ...ag,
        acceptedQty,
        pendingQty,
        rejectedQty,
        totalDelivered,
        outstandingQty,
        displayStatus,
        deliveries
      };
    });
  }, [agreements, inventory]);

  const filteredAgreements = useMemo(() => {
    if (searchQuery.trim() === '') return processedAgreements;
    const q = searchQuery.toLowerCase().trim();
    return processedAgreements.filter(ag => 
      (ag.id && ag.id.toLowerCase().includes(q)) || 
      (ag.supplier && ag.supplier.toLowerCase().includes(q)) || 
      (ag.itemName && ag.itemName.toLowerCase().includes(q)) ||
      (ag.remarks && ag.remarks.toLowerCase().includes(q))
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
              ${outstandingAgreements.map(ag => `
                <tr>
                  <td class="col-agreement" style="font-weight: 600;">${escapeHTML(ag.id)}</td>
                  <td class="col-supplier">${escapeHTML(ag.supplier)}</td>
                  <td class="col-item" style="font-weight: 600;">${escapeHTML(ag.itemName)}</td>
                  <td class="col-totalqty" style="text-align: right;">${ag.totalQty.toLocaleString()}</td>
                  <td class="col-acceptedqty" style="text-align: right; color: #0f5132;">${ag.acceptedQty.toLocaleString()}</td>
                  <td class="col-pendingqty" style="text-align: right; color: #664d03;">${ag.pendingQty.toLocaleString()}</td>
                  <td class="col-outstandingqty" style="text-align: right; font-weight: 700; color: #b71c1c;">${ag.outstandingQty.toLocaleString()}</td>
                  <td class="col-unit">${escapeHTML(ag.unit)}</td>
                  <td class="col-enddate nowrap">${formatDateToDDMMYY(ag.endDate)}</td>
                  <td class="col-status">
                    <span class="status-badge ${
                      ag.displayStatus === 'Expired' ? 'status-expired' : 'status-active'
                    }">
                      ${ag.displayStatus === 'Expired' ? 'หมดอายุสัญญา' : 'กำลังดำเนินการ'}
                    </span>
                  </td>
                </tr>
              `).join("")}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>เลือกสินค้าจัดซื้อ <span style={{ color: 'var(--danger)' }}>*</span></label>
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
                    onClick={() => setIsFormDropdownOpen(!isFormDropdownOpen)}
                  >
                    <input
                      type="text"
                      placeholder="พิมพ์เพื่อค้นหาชื่อสินค้า..."
                      value={isFormDropdownOpen ? formSearchQuery : newAgreement.itemName}
                      onChange={(e) => {
                        setFormSearchQuery(e.target.value);
                        setIsFormDropdownOpen(true);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFormDropdownOpen(true);
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
                    <ChevronDown size={18} color="var(--text-secondary)" style={{ transform: isFormDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </div>

                  {isFormDropdownOpen && (
                    <>
                      <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                        onClick={() => { setIsFormDropdownOpen(false); setFormSearchQuery(''); }}
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
                        {((items ? items.filter(item => item.name.toLowerCase().includes(formSearchQuery.toLowerCase())) : []).length === 0) ? (
                          <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            ไม่พบสินค้าที่ตรงกับคำค้นหา
                          </div>
                        ) : (
                          (items ? items.filter(item => item.name.toLowerCase().includes(formSearchQuery.toLowerCase())) : []).map(item => (
                            <div
                              key={item.name}
                              style={{
                                padding: '0.6rem 1rem',
                                cursor: 'pointer',
                                background: newAgreement.itemName === item.name ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: '0.88rem',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = 'rgba(15, 23, 42, 0.05)'}
                              onMouseLeave={(e) => e.target.style.background = newAgreement.itemName === item.name ? 'rgba(245, 158, 11, 0.15)' : 'transparent'}
                              onClick={() => {
                                setNewAgreement({
                                  ...newAgreement,
                                  itemName: item.name,
                                  unit: item.unit || 'ชิ้น'
                                });
                                setIsFormDropdownOpen(false);
                                setFormSearchQuery('');
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
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>จำนวนจัดซื้อตามสัญญา <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    placeholder="เช่น 1000" 
                    value={newAgreement.totalQty} 
                    onChange={e => setNewAgreement({...newAgreement, totalQty: e.target.value})} 
                    required 
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '40px' }}>
                    {newAgreement.unit}
                  </span>
                </div>
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
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>แนบเอกสารสัญญา (PDF หรือ รูปภาพ) <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(จำกัดขนาดไฟล์ไม่เกิน 800 KB ต่อไฟล์)</span></label>
              <div style={{
                border: '2px dashed var(--glass-border)',
                borderRadius: '8px',
                padding: '1.25rem',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  multiple 
                  onChange={(e) => handleFileChange(e, false)} 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                />
                <Paperclip size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                  ⚠️ จำกัดขนาดไฟล์ PDF หรือรูปภาพไม่เกิน 800 KB (สำหรับรูปภาพ ระบบจะทำการบีบอัดให้โดยอัตโนมัติ)
                </p>
              </div>

              {/* Show attached files list */}
              {newAgreement.attachments && newAgreement.attachments.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {newAgreement.attachments.map((file, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <FileText size={16} style={{ color: file.type === 'pdf' ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{file.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(idx, false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={16} />
                      </button>
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
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>เลือกสินค้าจัดซื้อ <span style={{ color: 'var(--danger)' }}>*</span></label>
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
                              onClick={() => setIsEditFormDropdownOpen(!isEditFormDropdownOpen)}
                            >
                              <input
                                type="text"
                                placeholder="พิมพ์เพื่อค้นหาชื่อสินค้า..."
                                value={isEditFormDropdownOpen ? editFormSearchQuery : editForm.itemName}
                                onChange={(e) => {
                                  setEditFormSearchQuery(e.target.value);
                                  setIsEditFormDropdownOpen(true);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditFormDropdownOpen(true);
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
                              <ChevronDown size={18} color="var(--text-secondary)" style={{ transform: isEditFormDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                            </div>

                            {isEditFormDropdownOpen && (
                              <>
                                <div 
                                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                                  onClick={() => { setIsEditFormDropdownOpen(false); setEditFormSearchQuery(''); }}
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
                                  {((items ? items.filter(item => item.name.toLowerCase().includes(editFormSearchQuery.toLowerCase())) : []).length === 0) ? (
                                    <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                      ไม่พบสินค้าที่ตรงกับคำค้นหา
                                    </div>
                                  ) : (
                                    (items ? items.filter(item => item.name.toLowerCase().includes(editFormSearchQuery.toLowerCase())) : []).map(item => (
                                      <div
                                        key={item.name}
                                        style={{
                                          padding: '0.6rem 1rem',
                                          cursor: 'pointer',
                                          background: editForm.itemName === item.name ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                          color: 'var(--text-primary)',
                                          fontSize: '0.88rem',
                                          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                          transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(15, 23, 42, 0.05)'}
                                        onMouseLeave={(e) => e.target.style.background = editForm.itemName === item.name ? 'rgba(245, 158, 11, 0.15)' : 'transparent'}
                                        onClick={() => {
                                          setEditForm({
                                            ...editForm,
                                            itemName: item.name,
                                            unit: item.unit || 'ชิ้น'
                                          });
                                          setIsEditFormDropdownOpen(false);
                                          setEditFormSearchQuery('');
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
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>จำนวนจัดซื้อตามสัญญา <span style={{ color: 'var(--danger)' }}>*</span></label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="number" 
                              value={editForm.totalQty} 
                              onChange={e => setEditForm({...editForm, totalQty: e.target.value})} 
                              required 
                              style={{ flex: 1 }}
                            />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '40px' }}>
                              {editForm.unit}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>บันทึกเพิ่มเติม / หมายเหตุ</label>
                        <textarea 
                          value={editForm.remarks || ''} 
                          onChange={e => setEditForm({...editForm, remarks: e.target.value})}
                          rows="2"
                        ></textarea>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>แนบเอกสารสัญญาเพิ่มเติม (PDF หรือ รูปภาพ) <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(จำกัดขนาดไฟล์ไม่เกิน 800 KB ต่อไฟล์)</span></label>
                        <div style={{
                          border: '2px dashed var(--glass-border)',
                          borderRadius: '8px',
                          padding: '1.25rem',
                          textAlign: 'center',
                          background: 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'border-color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        >
                          <input 
                            type="file" 
                            accept="application/pdf,image/*" 
                            multiple 
                            onChange={(e) => handleFileChange(e, true)} 
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              opacity: 0,
                              cursor: 'pointer',
                              zIndex: 2
                            }}
                          />
                          <Paperclip size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                            ⚠️ จำกัดขนาดไฟล์ PDF หรือรูปภาพไม่เกิน 800 KB (สำหรับรูปภาพ ระบบจะทำการบีบอัดให้โดยอัตโนมัติ)
                          </p>
                        </div>

                        {/* Show editForm attachments list */}
                        {editForm.attachments && editForm.attachments.length > 0 && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {editForm.attachments.map((file, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid var(--glass-border)',
                                fontSize: '0.8rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                  <FileText size={16} style={{ color: file.type === 'pdf' ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{file.name}</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => removeAttachment(idx, true)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--danger)',
                                    cursor: 'pointer',
                                    padding: '0.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <X size={16} />
                                </button>
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
                        คู่สัญญา: <strong style={{ color: 'var(--text-primary)' }}>{agreement.supplier}</strong> | ชนิดพัสดุ: <strong style={{ color: 'var(--text-primary)' }}>{agreement.itemName}</strong>
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

                  {/* Tri-Color Progress Bar */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--success)' }}>ตรวจรับผ่านแล้ว: {agreement.acceptedQty.toLocaleString()} {agreement.unit} ({acceptedPct.toFixed(1)}%)</span>
                      {agreement.pendingQty > 0 && <span style={{ color: 'var(--quarantine)' }}>รอตรวจรับ: {agreement.pendingQty.toLocaleString()} {agreement.unit} ({pendingPct.toFixed(1)}%)</span>}
                      <span style={{ color: 'var(--text-muted)' }}>ค้างรับ: {agreement.outstandingQty.toLocaleString()} {agreement.unit}</span>
                    </div>
                    
                    <div style={{ 
                      height: '14px', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '10px', 
                      overflow: 'hidden', 
                      display: 'flex',
                      border: '1px solid var(--glass-border)'
                    }}>
                      <div style={{ width: `${acceptedPct}%`, height: '100%', background: 'var(--success)', transition: 'width 0.3s ease' }} title="ตรวจรับผ่านแล้ว" />
                      <div style={{ width: `${pendingPct}%`, height: '100%', background: 'var(--quarantine)', transition: 'width 0.3s ease' }} title="อยู่ระหว่างรอตรวจรับ" />
                      <div style={{ width: `${remainingPct}%`, height: '100%', background: 'transparent', transition: 'width 0.3s ease' }} title="ค้างส่งมอบ" />
                    </div>
                    
                    {agreement.rejectedQty > 0 && (
                      <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ShieldAlert size={14} /> ตีกลับ/กรรมการปฏิเสธการรับแล้ว: {agreement.rejectedQty.toLocaleString()} {agreement.unit} (ไม่ลดจำนวนค้างส่งในสัญญา)
                      </div>
                    )}
                  </div>

                  {/* Compact Stats */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '1rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.85rem'
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ยอดสัญญาทั้งหมด</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem' }}>{agreement.totalQty.toLocaleString()} {agreement.unit}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>มาส่งแล้วทั้งหมด (กายภาพ)</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem', color: 'var(--accent-secondary)' }}>{agreement.totalDelivered.toLocaleString()} {agreement.unit}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ตรวจรับผ่านแล้ว (หักสัญญา)</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem', color: 'var(--success)' }}>{agreement.acceptedQty.toLocaleString()} {agreement.unit}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ยอดค้างส่ง (เป็นทางการ)</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.2rem', color: agreement.outstandingQty > 0 ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                        {agreement.outstandingQty.toLocaleString()} {agreement.unit}
                      </div>
                    </div>
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
                            onClick={() => {
                              const newWindow = window.open();
                              if (newWindow) {
                                if (file.type === 'pdf') {
                                  newWindow.document.write(`<iframe src="${file.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%; position:fixed;" allowfullscreen></iframe>`);
                                  newWindow.document.title = file.name;
                                } else {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${escapeHTML(file.name)}</title>
                                        <style>
                                          body { margin: 0; background: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                          img { max-width: 100%; max-height: 100vh; object-fit: contain; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                                        </style>
                                      </head>
                                      <body>
                                        <img src="${file.data}" alt="${escapeHTML(file.name)}" />
                                      </body>
                                    </html>
                                  `);
                                }
                              } else {
                                alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อดูเอกสารแนบ");
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '6px',
                              padding: '0.35rem 0.6rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-secondary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                          >
                            <FileText size={14} style={{ color: file.type === 'pdf' ? '#ef4444' : '#10b981' }} />
                            <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                            <Eye size={12} style={{ color: 'var(--text-muted)' }} />
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
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '650px' }}>
                            <thead>
                              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '0.5rem' }}>วันที่นำส่ง</th>
                                <th style={{ padding: '0.5rem' }}>Supplier Lot</th>
                                <th style={{ padding: '0.5rem' }}>QC Lot</th>
                                <th style={{ padding: '0.5rem' }}>จำนวนส่ง</th>
                                <th style={{ padding: '0.5rem' }}>ที่เก็บ</th>
                                <th style={{ padding: '0.5rem' }}>สถานะจัดซื้อ</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center' }}>การอนุมัติจัดซื้อ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {agreement.deliveries.map(del => (
                                <tr key={del.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '0.6rem 0.5rem' }}>{del.date}</td>
                                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{del.supplierLot}</td>
                                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>{del.inhouseLot || '-'}</td>
                                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>
                                    {del.quantity} {del.unit}
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
                              ))}
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

export default Agreements;
