import React, { useState, useMemo } from 'react';
import { MinusCircle, Search, Calendar, ChevronRight, Package, AlertCircle, MapPin } from 'lucide-react';

const Withdrawal = ({ inventory, setInventory, items }) => {
  const [selectedItem, setSelectedItem] = useState((items && items.length > 0) ? items[0].name : '');
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeLotId, setActiveLotId] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  // Filter lots that have remaining stock and match selected item
  const availableLots = useMemo(() => {
    return inventory.filter(i => i.itemName === selectedItem && i.remainingQty > 0);
  }, [inventory, selectedItem]);

  const activeLot = useMemo(() => {
    return inventory.find(i => i.id === activeLotId);
  }, [inventory, activeLotId]);

  const handleWithdraw = () => {
    if (!activeLotId) {
      alert("กรุณาเลือก Lot ที่ต้องการตัดจ่าย");
      return;
    }
    const withdrawalAmount = Number(amount);
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      alert("กรุณาระบุจำนวนที่ต้องการตัดจ่าย");
      return;
    }

    if (withdrawalAmount > activeLot.remainingQty) {
      alert("จำนวนที่ระบุมากกว่าจำนวนคงเหลือใน Lot นี้");
      return;
    }

    setInventory(prev => prev.map(item => {
      if (item.id === activeLotId) {
        const newWithdrawal = {
          id: Date.now(),
          date: withdrawalDate,
          amount: withdrawalAmount,
          reason: reason
        };
        return {
          ...item,
          remainingQty: item.remainingQty - withdrawalAmount,
          withdrawals: [...(item.withdrawals || []), newWithdrawal]
        };
      }
      return item;
    }));

    alert("บันทึกการตัดจ่ายเรียบร้อย");
    setAmount('');
    setReason('');
    setActiveLotId(null);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">โมดูลการตัดจ่ายพัสดุ (Withdrawal)</h1>
        <p className="page-subtitle">บันทึกการเบิกใช้พัสดุออกจากคลังสินค้าแยกตาม Lot</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        {/* Step 1: Selection */}
        <div className="glass card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={20} color="var(--accent-color)" /> 1. เลือกรายการพัสดุ
          </h3>
          <div style={{ marginBottom: '2rem' }}>
            <label>ชื่อสินค้า</label>
            <select value={selectedItem} onChange={(e) => { setSelectedItem(e.target.value); setActiveLotId(null); }}>
              {items.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </div>

          <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Lot ที่มีสินค้าพร้อมใช้ ({availableLots.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
            {availableLots.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                <Package size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p>ไม่มีสินค้าคงเหลือในสต็อก</p>
              </div>
            ) : (
              availableLots.map(lot => (
                <div 
                  key={lot.id} 
                  className={`glass ${activeLotId === lot.id ? 'active-lot' : ''}`}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    border: activeLotId === lot.id ? '1px solid var(--accent-color)' : '1px solid transparent',
                    background: activeLotId === lot.id ? 'rgba(245, 158, 11, 0.1)' : 'var(--glass-bg)',
                    transition: 'var(--transition)'
                  }}
                  onClick={() => setActiveLotId(lot.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Supplier Lot:</span>
                        {lot.supplierLot}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Inhouse Lot:</span>
                        {lot.inhouseLot || '-'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} /> {lot.location}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{lot.remainingQty}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{lot.unit || 'ชิ้น'}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Step 2: Withdrawal Form */}
        <div className="glass card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MinusCircle size={20} color="var(--danger)" /> 2. รายละเอียดการตัดจ่าย
          </h3>
          
          {activeLot ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>กำลังตัดจ่ายจาก</div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Supplier Lot:</div>
                    <div style={{ fontWeight: 700 }}>{activeLot.supplierLot}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Inhouse Lot:</div>
                    <div style={{ fontWeight: 700 }}>{activeLot.inhouseLot || '-'}</div>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  คงเหลือใน Lot: <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{activeLot.remainingQty} {activeLot.unit || 'ชิ้น'}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} /> วันที่ตัดจ่าย
                </label>
                <input type="date" value={withdrawalDate} onChange={e => setWithdrawalDate(e.target.value)} />
              </div>

              <div>
                <label>จำนวนที่ต้องการตัดจ่าย</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    style={{ paddingRight: '4rem' }}
                  />
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {activeLot.unit || 'ชิ้น'}
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => setAmount(activeLot.remainingQty)}
                  >
                    ตัดทั้งหมด (Full Lot)
                  </button>
                </div>
              </div>

              <div>
                <label>เหตุผลการตัดจ่าย / หมายเหตุ</label>
                <textarea 
                  placeholder="เช่น เบิกไปผลิตชุดที่ 101, ตัวอย่างส่งตรวจ..." 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  rows="3"
                ></textarea>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', background: 'var(--danger)', color: '#fff', justifyContent: 'center', padding: '1rem' }}
                  onClick={handleWithdraw}
                >
                  ยืนยันการบันทึกการตัดจ่าย
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
    </div>
  );
};

export default Withdrawal;
