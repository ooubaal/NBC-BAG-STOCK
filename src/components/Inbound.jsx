import { useState } from 'react';
import { Plus, Trash2, Save, Printer, Copy, Search, Upload, Download } from 'lucide-react';
import ExcelJS from 'exceljs';

const SearchableSelect = ({ value, onChange, options, placeholder, disabled }) => {
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
          boxSizing: 'border-box'
        }}
      />
      {isOpen && !disabled && (
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
            borderRadius: '4px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
            zIndex: 1000
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'center' }}>
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
                    padding: '0.4rem 0.5rem',
                    fontSize: '0.78rem',
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

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
};

const Inbound = ({ setInventory, items, inventory = [], agreements = [] }) => {
  const [inboundTab, setInboundTab] = useState('draft'); // 'draft' or 'history'
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Column filter states for Inbound history
  const [inboundFilterDate, setInboundFilterDate] = useState('');
  const [inboundFilterItem, setInboundFilterItem] = useState('');
  const [inboundFilterAgreement, setInboundFilterAgreement] = useState('');
  const [inboundFilterLot, setInboundFilterLot] = useState('');
  const [inboundFilterQC, setInboundFilterQC] = useState('All');
  const [inboundFilterLocation, setInboundFilterLocation] = useState('');
  const [inboundFilterQty, setInboundFilterQty] = useState('');

  const getLatestInhouseLot = (itemName) => {
    if (!itemName) return '-';
    const matches = inventory.filter(item => 
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
          contractSheet.addRow({ id: ag.id, itemName: ag.itemName });
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
        { header: 'Inhouse Lot (ถ้ามี)', key: 'inhouseLot', width: 20 },
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

    // Column Filters
    const formattedDate = formatDateToDDMMYYYY(item.date);
    const matchColDate = !inboundFilterDate || formattedDate.toLowerCase().includes(inboundFilterDate.toLowerCase());
    const matchColItem = !inboundFilterItem || (item.itemName && item.itemName.toLowerCase().includes(inboundFilterItem.toLowerCase()));
    const matchColAgreement = !inboundFilterAgreement || (item.agreementId && item.agreementId.toLowerCase().includes(inboundFilterAgreement.toLowerCase()));
    const matchColLot = !inboundFilterLot || 
                       (item.supplierLot && item.supplierLot.toLowerCase().includes(inboundFilterLot.toLowerCase())) ||
                       (item.inhouseLot && item.inhouseLot.toLowerCase().includes(inboundFilterLot.toLowerCase()));
    const matchColQC = inboundFilterQC === 'All' || item.qcStatus === inboundFilterQC;
    const matchColLocation = !inboundFilterLocation || (item.location && item.location.toLowerCase().includes(inboundFilterLocation.toLowerCase()));
    const matchColQty = !inboundFilterQty || 
                       String(item.quantity).toLowerCase().includes(inboundFilterQty.toLowerCase()) || 
                       String(item.remainingQty).toLowerCase().includes(inboundFilterQty.toLowerCase()) || 
                       (item.unit && item.unit.toLowerCase().includes(inboundFilterQty.toLowerCase()));

    return matchesSearch && matchesDate && matchColDate && matchColItem && matchColAgreement && matchColLot && matchColQC && matchColLocation && matchColQty;
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
                  <label><input type="checkbox" id="col-inhouse" checked onchange="updateTable()"> Inhouse Lot</label>
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
                <th id="th-inhouse" class="col-inhouse" style="width: 12%;">Inhouse Lot</th>
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
                  <td class="col-item" style="font-weight: 600;">${item.itemName}</td>
                  <td class="col-supplier">${item.supplierLot || '-'}</td>
                  <td class="col-inhouse">${item.inhouseLot || '-'}</td>
                  <td class="col-qc">
                    ${item.isCancelled ? '<span style="color: #ef4444; font-weight: bold;">ยกเลิกแล้ว</span>' : `
                    <span class="status-badge ${
                      item.qcStatus === 'Pass' ? 'status-pass' :
                      item.qcStatus === 'Reject' ? 'status-reject' : 'status-quarantine'
                    }">
                      ${item.qcStatus}
                    </span>`}
                  </td>
                  <td class="col-location" style="font-weight: 600;">${item.location || '-'}</td>
                  <td class="col-qty" style="font-weight: 700; text-align: right;">${item.quantity.toLocaleString()}</td>
                  <td class="col-unit">${item.unit || 'ชิ้น'}</td>
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
              inhouse: 'Inhouse Lot',
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
                            .filter(ag => ag.itemName === entry.itemName && ag.status !== 'Completed')
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

            {(historySearch || historyStartDate || historyEndDate || inboundFilterDate || inboundFilterItem || inboundFilterAgreement || inboundFilterLot || inboundFilterQC !== 'All' || inboundFilterLocation || inboundFilterQty) && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                onClick={() => {
                  setHistorySearch('');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setInboundFilterDate('');
                  setInboundFilterItem('');
                  setInboundFilterAgreement('');
                  setInboundFilterLot('');
                  setInboundFilterQC('All');
                  setInboundFilterLocation('');
                  setInboundFilterQty('');
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
                  <th style={{ padding: '1rem', width: '150px' }}>สัญญาจัดซื้อ</th>
                  <th style={{ padding: '1rem' }}>Supplier / Inhouse Lot</th>
                  <th style={{ padding: '1rem' }}>สถานะ QC</th>
                  <th style={{ padding: '1rem' }}>ที่เก็บ</th>
                  <th style={{ padding: '1rem' }}>จำนวนรับเข้า</th>
                  <th style={{ padding: '1rem' }}>จัดการ</th>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.5rem 1rem' }}></th>
                  <th style={{ padding: '0.5rem 1rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={inboundFilterDate} 
                      onChange={(e) => setInboundFilterDate(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.5rem 1rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={inboundFilterItem} 
                      onChange={(e) => setInboundFilterItem(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.5rem 1rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={inboundFilterAgreement} 
                      onChange={(e) => setInboundFilterAgreement(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.5rem 1rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={inboundFilterLot} 
                      onChange={(e) => setInboundFilterLot(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.5rem 1rem' }}>
                    <select 
                      value={inboundFilterQC} 
                      onChange={(e) => setInboundFilterQC(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                      <option value="All">ทั้งหมด</option>
                      <option value="Quarantine">Quarantine</option>
                      <option value="Pass">Pass</option>
                      <option value="Reject">Reject</option>
                    </select>
                  </th>
                  <th style={{ padding: '0.5rem 1rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={inboundFilterLocation} 
                      onChange={(e) => setInboundFilterLocation(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.5rem 1rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={inboundFilterQty} 
                      onChange={(e) => setInboundFilterQty(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.5rem 1rem' }}></th>
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
                          const contractOptions = agreements ? agreements.filter(ag => 
                            ag.itemName === item.itemName && 
                            (ag.status !== 'Completed' || ag.id === item.agreementId)
                          ) : [];
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
