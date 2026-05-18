import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

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
