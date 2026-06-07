import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload, Download } from 'lucide-react';

const ProductRegistry = ({ items, setItems }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('ชิ้น');
  const [customUnit, setCustomUnit] = useState('');
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState({ name: '', unit: '' });

  const [confirmDelete, setConfirmDelete] = useState(null);

  const addItem = () => {
    if (!newItemName.trim()) return;
    if (items.some(item => item.name.toLowerCase() === newItemName.trim().toLowerCase())) {
      alert("รายการนี้มีอยู่แล้วในระบบ");
      return;
    }
    const finalUnit = newItemUnit === 'custom' ? (customUnit.trim() || 'หน่วย') : newItemUnit;
    setItems([...items, { name: newItemName.trim(), unit: finalUnit }]);
    setNewItemName('');
    setNewItemUnit('ชิ้น');
    setCustomUnit('');
  };

  const deleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setConfirmDelete(null);
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditingValue({ name: items[index].name, unit: items[index].unit });
  };

  const saveEdit = (index) => {
    if (!editingValue.name.trim()) return;
    const newItems = [...items];
    newItems[index] = { name: editingValue.name.trim(), unit: editingValue.unit.trim() || 'ชิ้น' };
    setItems(newItems);
    setEditingIndex(null);
  };

  const downloadTemplate = () => {
    const headers = ["ชื่อสินค้า (จำเป็น)", "หน่วยนับ (จำเป็น - เช่น ชิ้น, kg, g, ลิตร, ถุง, กล่อง)"];
    const sampleRow = ["Raw Material C", "kg"];
    
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
    link.setAttribute("download", "nbc_items_template.csv");
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
          alert("ไม่พบข้อมูลที่จะนำเข้าในไฟล์ (กรุณาตรวจสอบว่ามีข้อมูลสินค้าอย่างน้อย 1 แถวใต้หัวข้อตาราง)");
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

        const newItemsList = [];
        let duplicateCount = 0;
        let emptyCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const cells = parseCSVLine(lines[i]);
          if (cells.length < 1) continue;

          const name = cells[0] ? cells[0].trim() : '';
          const unit = cells[1] ? cells[1].trim() : 'ชิ้น';

          if (!name) {
            emptyCount++;
            continue;
          }

          const existsInCurrent = items.some(item => item.name.toLowerCase() === name.toLowerCase());
          const existsInImportBatch = newItemsList.some(item => item.name.toLowerCase() === name.toLowerCase());

          if (existsInCurrent || existsInImportBatch) {
            duplicateCount++;
            continue;
          }

          newItemsList.push({
            name,
            unit: unit || 'ชิ้น'
          });
        }

        if (newItemsList.length === 0) {
          if (duplicateCount > 0) {
            alert(`ไม่สามารถนำเข้าข้อมูลได้ เนื่องจากสินค้าทั้ง ${duplicateCount} รายการในไฟล์ มีอยู่ในทะเบียนพัสดุเรียบร้อยแล้ว`);
          } else {
            alert("ไม่พบข้อมูลสินค้าที่สมบูรณ์ในไฟล์");
          }
          return;
        }

        setItems([...items, ...newItemsList]);
        
        let msg = `🎉 นำเข้าข้อมูลสินค้าใหม่สำเร็จ ${newItemsList.length} รายการ!`;
        if (duplicateCount > 0) {
          msg += `\n(ข้าม ${duplicateCount} รายการเนื่องจากมีชื่อซ้ำในระบบแล้ว)`;
        }
        if (emptyCount > 0) {
          msg += `\n(ข้าม ${emptyCount} แถวที่ไม่มีชื่อสินค้า)`;
        }
        alert(msg);
      } catch (err) {
        console.error(err);
        alert("การวิเคราะห์ไฟล์ล้มเหลว: " + err.message);
      }
      
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">ทะเบียนพัสดุ (Product Registry)</h1>
        <p className="page-subtitle">จัดการรายการสินค้าพัสดุทั้งหมดที่จะใช้ในระบบ</p>
      </div>

      <div className="glass card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.2rem' }}>เพิ่มรายการพัสดุใหม่</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>ชื่อพัสดุ</label>
            <input 
              type="text" 
              placeholder="เช่น ชื่อสารเคมี, บรรจุภัณฑ์..." 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>หน่วยพัสดุ</label>
            <select 
              value={newItemUnit} 
              onChange={(e) => {
                setNewItemUnit(e.target.value);
                if (e.target.value !== 'custom') setCustomUnit('');
              }}
            >
              <option value="ชิ้น">ชิ้น (pcs)</option>
              <option value="kg">กิโลกรัม (kg)</option>
              <option value="g">กรัม (g)</option>
              <option value="ลิตร">ลิตร (L)</option>
              <option value="กล่อง">กล่อง (box)</option>
              <option value="ถุง">ถุง (bag)</option>
              <option value="แพ็ค">แพ็ค (pack)</option>
              <option value="ถัง">ถัง (drum)</option>
              <option value="เมตร">เมตร (m)</option>
              <option value="custom">อื่นๆ (ระบุเอง)</option>
            </select>
          </div>
          
          {newItemUnit === 'custom' && (
            <div style={{ flex: 1, minWidth: '150px' }} className="fade-in">
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>ระบุหน่วยเอง</label>
              <input 
                type="text" 
                placeholder="เช่น หลอด, ม้วน..." 
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
              />
            </div>
          )}

          <button className="btn btn-primary" style={{ whiteSpace: 'nowrap', height: '42px', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={addItem}>
            <Plus size={18} /> เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* CSV Import Section */}
      <div className="glass card" style={{ 
        marginBottom: '2rem', 
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
            นำเข้าทะเบียนสินค้าพัสดุทีละหลายรายการ (Excel / CSV Import)
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            ดาวน์โหลดไฟล์เทมเพลตเพื่อกรอกรายชื่อพัสดุและหน่วยนับ จากนั้นเลือกไฟล์อัปโหลดเข้าสู่ระบบพร้อมกัน
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
            <Upload size={15} /> นำเข้าไฟล์พัสดุ (.csv)
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImportCSV} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      <div className="glass card">
        <h3 style={{ marginBottom: '1.5rem' }}>รายการทั้งหมด ({items.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item, index) => (
            <div key={index} className="glass" style={{ padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingIndex === index ? (
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    value={editingValue.name} 
                    onChange={(e) => setEditingValue({ ...editingValue, name: e.target.value })}
                    style={{ padding: '0.4rem', flex: 2 }}
                    placeholder="ชื่อพัสดุ"
                  />
                  <input 
                    type="text" 
                    value={editingValue.unit} 
                    onChange={(e) => setEditingValue({ ...editingValue, unit: e.target.value })}
                    style={{ padding: '0.4rem', flex: 1 }}
                    placeholder="หน่วย"
                  />
                  <button className="btn btn-primary" style={{ padding: '0.4rem' }} onClick={() => saveEdit(index)}>
                    <Check size={16} />
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => setEditingIndex(null)}>
                    <X size={16} />
                  </button>
                </div>
              ) : confirmDelete === index ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 600 }}>ยืนยันการลบ?</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', background: 'var(--danger)', color: '#fff', fontSize: '0.7rem' }} onClick={() => deleteItem(index)}>ลบเลย</button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }} onClick={() => setConfirmDelete(null)}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <>
                  <span style={{ fontWeight: 600 }}>
                    {item.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>({item.unit})</span>
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onClick={() => startEdit(index)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      onClick={() => setConfirmDelete(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่มีข้อมูลพัสดุในทะเบียน</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductRegistry;
