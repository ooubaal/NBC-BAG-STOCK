import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, History, MinusCircle, Settings, Save } from 'lucide-react';

const Inventory = ({ inventory, setInventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Filter States
  const [filterQC, setFilterQC] = useState('All');
  const [filterBilling, setFilterBilling] = useState('All');
  const [filterItem, setFilterItem] = useState('All');

  // Edit States for expanded row
  const [editQC, setEditQC] = useState('');
  const [editBilling, setEditBilling] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editQCDate, setEditQCDate] = useState('');
  const [editBillingDate, setEditBillingDate] = useState('');
  const [editLocationDate, setEditLocationDate] = useState('');

  // Get unique items for filter dropdown
  const uniqueItems = Array.from(new Set(inventory.map(i => i.itemName)));

  const handleUpdateStatus = (id) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          qcStatus: editQC,
          billingStatus: editBilling,
          location: editLocation,
          qcUpdateDate: editQCDate,
          billingUpdateDate: editBillingDate,
          locationUpdateDate: editLocationDate
        };
      }
      return item;
    }));
    alert("อัปเดตข้อมูลและวันที่เรียบร้อย");
  };

  const toggleExpand = (item) => {
    if (expandedRow === item.id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(item.id);
      setEditQC(item.qcStatus);
      setEditBilling(item.billingStatus);
      setEditLocation(item.location);
      setEditQCDate(item.qcUpdateDate || new Date().toISOString().split('T')[0]);
      setEditBillingDate(item.billingUpdateDate || new Date().toISOString().split('T')[0]);
      setEditLocationDate(item.locationUpdateDate || new Date().toISOString().split('T')[0]);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.supplierLot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.inhouseLot.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesQC = filterQC === 'All' || item.qcStatus === filterQC;
    const matchesBilling = filterBilling === 'All' || item.billingStatus === filterBilling;
    const matchesItem = filterItem === 'All' || item.itemName === filterItem;

    return matchesSearch && matchesQC && matchesBilling && matchesItem;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">ฐานข้อมูลคลังพัสดุ (Mod 1)</h1>
        <p className="page-subtitle">จัดการและติดตามสถานะพัสดุในคลัง</p>
      </div>

      <div className="glass card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="ค้นหาตามชื่อสินค้า หรือ Lot no..." 
            style={{ border: 'none', background: 'transparent', padding: '0.5rem', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {(searchTerm || filterQC !== 'All' || filterBilling !== 'All' || filterItem !== 'All') && (
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
            onClick={() => {
              setSearchTerm('');
              setFilterQC('All');
              setFilterBilling('All');
              setFilterItem('All');
            }}
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>

      <div className="glass card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '1rem' }}>วันที่รับ</th>
              <th style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span>รายการสินค้า</span>
                  <select 
                    value={filterItem} 
                    onChange={(e) => setFilterItem(e.target.value)}
                    style={{ padding: '0.2rem', fontSize: '0.7rem', height: '24px' }}
                  >
                    <option value="All">ทั้งหมด</option>
                    {uniqueItems.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              </th>
              <th style={{ padding: '1rem' }}>Supplier / Inhouse Lot</th>
              <th style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span>สถานะ QC</span>
                  <select 
                    value={filterQC} 
                    onChange={(e) => setFilterQC(e.target.value)}
                    style={{ padding: '0.2rem', fontSize: '0.7rem', height: '24px' }}
                  >
                    <option value="All">ทั้งหมด</option>
                    <option value="Pass">Pass</option>
                    <option value="Quarantine">Quarantine</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
              </th>
              <th style={{ padding: '1rem' }}>ที่เก็บ</th>
              <th style={{ padding: '1rem' }}>จำนวนรับ / คงเหลือ</th>
              <th style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span>วางบิล</span>
                  <select 
                    value={filterBilling} 
                    onChange={(e) => setFilterBilling(e.target.value)}
                    style={{ padding: '0.2rem', fontSize: '0.7rem', height: '24px' }}
                  >
                    <option value="All">ทั้งหมด</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </th>
              <th style={{ padding: '1rem' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่มีข้อมูลพัสดุ</td></tr>
            ) : (
              filteredInventory.map((item) => (
                <React.Fragment key={item.id}>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                    <td style={{ padding: '1rem' }}>{item.date}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{item.itemName}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem' }}>{item.supplierLot}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.inhouseLot}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`status-badge status-${item.qcStatus.toLowerCase()}`}>{item.qcStatus}</span>
                      {item.qcUpdateDate && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Update: {item.qcUpdateDate}</div>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.location}</div>
                      {item.locationUpdateDate && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Update: {item.locationUpdateDate}</div>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700 }}>
                        {item.remainingQty} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>{item.unit || 'ชิ้น'}</span>
                        <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}> / {item.quantity} {item.unit || 'ชิ้น'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>{item.billingStatus}</div>
                      {item.billingUpdateDate && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Update: {item.billingUpdateDate}</div>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => toggleExpand(item)}
                      >
                        {expandedRow === item.id ? <ChevronUp size={16} /> : <Settings size={16} />}
                        {expandedRow === item.id ? "ปิด" : "แก้ไข/ประวัติ"}
                      </button>
                    </td>
                  </tr>
                  
                  {expandedRow === item.id && (
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <td colSpan="8" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                          {/* Edit Status Section */}
                          <div className="glass card" style={{ padding: '1.2rem' }}>
                            <h4 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Settings size={18} color="var(--accent-color)" /> แก้ไขสถานะพัสดุ
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ส่วนจัดการ QC</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <select 
                                    value={editQC} 
                                    onChange={(e) => setEditQC(e.target.value)}
                                    style={{ flex: 1 }}
                                  >
                                    <option value="Pass">Pass</option>
                                    <option value="Quarantine">Quarantine</option>
                                    <option value="Reject">Reject</option>
                                  </select>
                                  <input 
                                    type="date" 
                                    value={editQCDate} 
                                    onChange={(e) => setEditQCDate(e.target.value)}
                                    style={{ flex: 1.2, fontSize: '0.8rem' }}
                                  />
                                </div>
                              </div>

                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ส่วนจัดการการวางบิล</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <select 
                                    value={editBilling} 
                                    onChange={(e) => setEditBilling(e.target.value)}
                                    style={{ flex: 1 }}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                  <input 
                                    type="date" 
                                    value={editBillingDate} 
                                    onChange={(e) => setEditBillingDate(e.target.value)}
                                    style={{ flex: 1.2, fontSize: '0.8rem' }}
                                  />
                                </div>
                              </div>

                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ส่วนจัดการสถานที่เก็บ</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input 
                                    type="text"
                                    placeholder="สถานที่เก็บ..."
                                    value={editLocation} 
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    style={{ flex: 1 }}
                                  />
                                  <input 
                                    type="date" 
                                    value={editLocationDate} 
                                    onChange={(e) => setEditLocationDate(e.target.value)}
                                    style={{ flex: 1.2, fontSize: '0.8rem' }}
                                  />
                                </div>
                              </div>
                              <button 
                                className="btn btn-primary" 
                                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                                onClick={() => handleUpdateStatus(item.id)}
                              >
                                <Save size={16} /> อัปเดตสถานะ
                              </button>
                            </div>
                          </div>

                          {/* History Section */}
                          <div className="glass card" style={{ padding: '1.2rem' }}>
                            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <History size={18} color="var(--accent-secondary)" /> ประวัติการตัดจ่ายพัสดุ
                            </h4>
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                              {item.withdrawals && item.withdrawals.length > 0 ? (
                                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                  <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                      <th style={{ padding: '0.75rem' }}>วันที่ตัดจ่าย</th>
                                      <th style={{ padding: '0.75rem' }}>จำนวนที่ตัด</th>
                                      <th style={{ padding: '0.75rem' }}>เหตุผลการตัด</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.withdrawals.map(w => (
                                      <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '0.75rem' }}>{w.date}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>-{w.amount} {item.unit || 'ชิ้น'}</td>
                                        <td style={{ padding: '0.75rem' }}>{w.reason}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>ยังไม่มีประวัติการตัดจ่าย</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>หมายเหตุการรับเข้า:</span> {item.remarks || 'ไม่มีหมายเหตุ'}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
