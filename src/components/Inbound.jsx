import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';

const Inbound = ({ setInventory, items }) => {
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
    remarks: ''
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
      remarks: ''
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
      createdAt: new Date().toISOString()
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
      remarks: ''
    }]);
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">รับเข้าพัสดุ (Mod 2)</h1>
          <p className="page-subtitle">เพิ่มรายการพัสดุใหม่เข้าสู่คลังสินค้า</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={addEntry}>
            <Plus size={18} /> เพิ่มแถว
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} /> บันทึกทั้งหมด
          </button>
        </div>
      </div>

      <div className="glass card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1rem' }}>วันที่รับ</th>
              <th style={{ padding: '1rem' }}>รายการสินค้า</th>
              <th style={{ padding: '1rem' }}>Supplier Lot</th>
              <th style={{ padding: '1rem' }}>Inhouse Lot</th>
              <th style={{ padding: '1rem' }}>สถานะ QC</th>
              <th style={{ padding: '1rem' }}>Pack Size</th>
              <th style={{ padding: '1rem' }}>จำนวน</th>
              <th style={{ padding: '1rem' }}>หน่วย</th>
              <th style={{ padding: '1rem' }}>ที่เก็บ</th>
              <th style={{ padding: '1rem' }}>การวางบิล</th>
              <th style={{ padding: '1rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '0.5rem' }}>
                  <input type="date" value={entry.date} onChange={(e) => updateEntry(entry.id, 'date', e.target.value)} />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <select value={entry.itemName} onChange={(e) => updateEntry(entry.id, 'itemName', e.target.value)}>
                    {items.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </select>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input type="text" placeholder="Lot no." value={entry.supplierLot} onChange={(e) => updateEntry(entry.id, 'supplierLot', e.target.value)} />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input type="text" placeholder="Inhouse no." value={entry.inhouseLot} onChange={(e) => updateEntry(entry.id, 'inhouseLot', e.target.value)} />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <select value={entry.qcStatus} onChange={(e) => updateEntry(entry.id, 'qcStatus', e.target.value)}>
                    <option value="Pass">Pass</option>
                    <option value="Quarantine">Quarantine</option>
                    <option value="Reject">Reject</option>
                  </select>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input type="text" placeholder="เช่น 25kg" value={entry.packSize} onChange={(e) => updateEntry(entry.id, 'packSize', e.target.value)} />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input type="number" placeholder="0" value={entry.quantity} onChange={(e) => updateEntry(entry.id, 'quantity', e.target.value)} />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input type="text" value={entry.unit} disabled style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', cursor: 'not-allowed', width: '80px', textAlign: 'center' }} />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input type="text" placeholder="A1, B2" value={entry.location} onChange={(e) => updateEntry(entry.id, 'location', e.target.value)} />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <select value={entry.billingStatus} onChange={(e) => updateEntry(entry.id, 'billingStatus', e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <button onClick={() => removeEntry(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inbound;
