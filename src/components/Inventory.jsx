import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, History, MinusCircle, Settings, Save } from 'lucide-react';

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

const Inventory = ({ inventory, setInventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Filter States
  const [filterQC, setFilterQC] = useState('All');
  const [filterAcceptance, setFilterAcceptance] = useState('All');
  const [filterItem, setFilterItem] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterQtyStatus, setFilterQtyStatus] = useState('All');
  const [sortType, setSortType] = useState('date-desc'); // 'date-desc', 'date-asc', 'name-asc', 'name-desc'

  // Edit States for expanded row
  const [editQC, setEditQC] = useState('');
  const [editAcceptance, setEditAcceptance] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editQCDate, setEditQCDate] = useState('');
  const [editAcceptanceDate, setEditAcceptanceDate] = useState('');
  const [editLocationDate, setEditLocationDate] = useState('');

  // Get unique items for filter dropdown
  const uniqueItems = Array.from(new Set(inventory.map(i => i.itemName)));
  // Get unique locations for filter dropdown
  const uniqueLocations = Array.from(new Set(inventory.map(i => i.location).filter(Boolean)));

  const handleUpdateStatus = (id) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          qcStatus: editQC,
          acceptanceStatus: editAcceptance,
          location: editLocation,
          remarks: editRemarks,
          qcUpdateDate: editQCDate,
          acceptanceUpdateDate: editAcceptanceDate,
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
      setEditAcceptance(item.acceptanceStatus || '');
      setEditLocation(item.location);
      setEditRemarks(item.remarks || '');
      setEditQCDate(item.qcUpdateDate || new Date().toISOString().split('T')[0]);
      setEditAcceptanceDate(item.acceptanceUpdateDate || new Date().toISOString().split('T')[0]);
      setEditLocationDate(item.locationUpdateDate || new Date().toISOString().split('T')[0]);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.supplierLot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.inhouseLot.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesQC = filterQC === 'All' || item.qcStatus === filterQC;
    const matchesAcceptance = filterAcceptance === 'All' || (item.acceptanceStatus || '') === filterAcceptance;
    const matchesItem = filterItem === 'All' || item.itemName === filterItem;

    let matchesDate = true;
    if (filterStartDate) {
      matchesDate = matchesDate && item.date >= filterStartDate;
    }
    if (filterEndDate) {
      matchesDate = matchesDate && item.date <= filterEndDate;
    }

    const matchesLocation = filterLocation === 'All' || item.location === filterLocation;
    
    let matchesQtyStatus = true;
    if (filterQtyStatus === 'InStock') {
      matchesQtyStatus = Number(item.remainingQty) > 0;
    } else if (filterQtyStatus === 'OutOfStock') {
      matchesQtyStatus = Number(item.remainingQty) <= 0;
    }

    return matchesSearch && matchesQC && matchesAcceptance && matchesItem && matchesDate && matchesLocation && matchesQtyStatus;
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (sortType === 'name-asc') {
      return a.itemName.localeCompare(b.itemName, 'th');
    }
    if (sortType === 'name-desc') {
      return b.itemName.localeCompare(a.itemName, 'th');
    }
    if (sortType === 'date-asc') {
      return (a.date || '').localeCompare(b.date || '');
    }
    if (sortType === 'date-desc') {
      return (b.date || '').localeCompare(a.date || '');
    }
    return 0;
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
        {(searchTerm || filterQC !== 'All' || filterAcceptance !== 'All' || filterItem !== 'All' || filterStartDate || filterEndDate || filterLocation !== 'All' || filterQtyStatus !== 'All' || sortType !== 'date-desc') && (
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
            onClick={() => {
              setSearchTerm('');
              setFilterQC('All');
              setFilterAcceptance('All');
              setFilterItem('All');
              setFilterStartDate('');
              setFilterEndDate('');
              setFilterLocation('All');
              setFilterQtyStatus('All');
              setSortType('date-desc');
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
              <th style={{ padding: '1rem', minWidth: '225px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>วันที่รับ (ช่วง)</span>
                    <select 
                      value={sortType.startsWith('date-') ? sortType : 'date-desc'} 
                      onChange={(e) => setSortType(e.target.value)}
                      style={{ 
                        width: 'auto', 
                        padding: '0 0.2rem', 
                        fontSize: '0.65rem', 
                        height: '20px', 
                        background: 'var(--input-bg)', 
                        color: 'var(--accent-color)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="date-desc">ล่าสุดอยู่บน 🔽</option>
                      <option value="date-asc">เก่าสุดอยู่บน 🔼</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                    <input 
                      type="date" 
                      value={filterStartDate} 
                      onChange={(e) => setFilterStartDate(e.target.value)} 
                      style={{ padding: '0.2rem', fontSize: '0.65rem', height: '24px', width: '95px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }} 
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>-</span>
                    <input 
                      type="date" 
                      value={filterEndDate} 
                      onChange={(e) => setFilterEndDate(e.target.value)} 
                      style={{ padding: '0.2rem', fontSize: '0.65rem', height: '24px', width: '95px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }} 
                    />
                  </div>
                </div>
              </th>
              <th style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span>รายการสินค้า</span>
                    <select 
                      value={sortType.startsWith('name-') ? sortType : 'none'} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setSortType(val === 'none' ? 'date-desc' : val);
                      }}
                      style={{ 
                        width: 'auto', 
                        padding: '0 0.2rem', 
                        fontSize: '0.65rem', 
                        height: '20px', 
                        background: 'var(--input-bg)', 
                        color: 'var(--accent-color)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="none">เรียงปกติ ↕️</option>
                      <option value="name-asc">ก-ฮ / A-Z 🔼</option>
                      <option value="name-desc">ฮ-ก / Z-A 🔽</option>
                    </select>
                  </div>
                  <select 
                    value={filterItem} 
                    onChange={(e) => setFilterItem(e.target.value)}
                    style={{ padding: '0.2rem', fontSize: '0.7rem', height: '24px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
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
                    style={{ padding: '0.2rem', fontSize: '0.7rem', height: '24px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                  >
                    <option value="All">ทั้งหมด</option>
                    <option value="Pass">Pass</option>
                    <option value="Quarantine">Quarantine</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
              </th>
              <th style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span>ที่เก็บ</span>
                  <select 
                    value={filterLocation} 
                    onChange={(e) => setFilterLocation(e.target.value)}
                    style={{ padding: '0.2rem', fontSize: '0.7rem', height: '24px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                  >
                    <option value="All">ทั้งหมด</option>
                    {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </th>
              <th style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span>จำนวนรับ / คงเหลือ</span>
                  <select 
                    value={filterQtyStatus} 
                    onChange={(e) => setFilterQtyStatus(e.target.value)}
                    style={{ padding: '0.2rem', fontSize: '0.7rem', height: '24px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                  >
                    <option value="All">ทั้งหมด</option>
                    <option value="InStock">มีคงเหลือ (&gt; 0)</option>
                    <option value="OutOfStock">สินค้าหมด (= 0)</option>
                  </select>
                </div>
              </th>
              <th style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span>สถานะจัดซื้อ / วางบิล</span>
                  <select 
                    value={filterAcceptance} 
                    onChange={(e) => setFilterAcceptance(e.target.value)}
                    style={{ padding: '0.2rem', fontSize: '0.7rem', height: '24px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                  >
                    <option value="All">ทั้งหมด</option>
                    <option value="">ยังไม่ได้วางบิล</option>
                    <option value="Pending">รอการตรวจรับ</option>
                    <option value="Accepted">ตรวจรับผ่าน</option>
                    <option value="Rejected">ปฏิเสธการรับ</option>
                  </select>
                </div>
              </th>
              <th style={{ padding: '1rem' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sortedInventory.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่มีข้อมูลพัสดุ</td></tr>
            ) : (
              sortedInventory.map((item) => (
                <React.Fragment key={item.id}>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', opacity: item.isCancelled ? 0.55 : 1 }}>
                    <td style={{ padding: '1rem' }}>{item.date}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{item.itemName}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem' }}>{item.supplierLot}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.inhouseLot}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {item.isCancelled ? (
                        <span className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>ยกเลิกแล้ว</span>
                      ) : (
                        <span className={`status-badge status-${item.qcStatus.toLowerCase()}`}>{item.qcStatus}</span>
                      )}
                      {item.qcUpdateDate && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Update: {item.qcUpdateDate}</div>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.location}</div>
                      {item.locationUpdateDate && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Update: {item.locationUpdateDate}</div>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700 }}>
                        {item.isCancelled ? (
                          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{item.remainingQty}</span>
                        ) : (
                          item.remainingQty
                        )}{' '}
                        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>{item.unit || 'ชิ้น'}</span>
                        <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {' '}
                          /{' '}
                          {item.isCancelled ? (
                            <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{item.quantity}</span>
                          ) : (
                            item.quantity
                          )}{' '}
                          {item.unit || 'ชิ้น'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <AcceptanceBadge status={item.acceptanceStatus} />
                      {item.acceptanceUpdateDate && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Update: {item.acceptanceUpdateDate}</div>}
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
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>ส่วนจัดการสถานะจัดซื้อ / ตรวจรับ</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <select 
                                    value={editAcceptance} 
                                    onChange={(e) => setEditAcceptance(e.target.value)}
                                    style={{ flex: 1 }}
                                  >
                                    <option value="">ยังไม่ได้วางบิล</option>
                                    <option value="Pending">รอการตรวจรับ</option>
                                    <option value="Accepted">ตรวจรับผ่าน</option>
                                    <option value="Rejected">ปฏิเสธการรับ</option>
                                  </select>
                                  <input 
                                    type="date" 
                                    value={editAcceptanceDate} 
                                    onChange={(e) => setEditAcceptanceDate(e.target.value)}
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
                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>หมายเหตุ</label>
                                <textarea 
                                  placeholder="พิมพ์หมายเหตุหรือข้อมูลบันทึกเพิ่มเติมที่นี่..."
                                  value={editRemarks}
                                  onChange={(e) => setEditRemarks(e.target.value)}
                                  rows={2}
                                  style={{ 
                                    width: '100%', 
                                    background: 'var(--input-bg)', 
                                    color: 'var(--text-primary)', 
                                    border: '1px solid var(--glass-border)', 
                                    borderRadius: '4px',
                                    padding: '0.5rem',
                                    fontSize: '0.8rem',
                                    resize: 'vertical',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                  }}
                                />
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
                                      <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: w.isCancelled ? 0.55 : 1 }}>
                                        <td style={{ padding: '0.75rem' }}>{w.date}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
                                          {w.isCancelled ? (
                                            <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>-{w.amount}</span>
                                          ) : (
                                            `-${w.amount}`
                                          )}{' '}
                                          {item.unit || 'ชิ้น'}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                          {w.isCancelled ? (
                                            <span style={{ color: '#ef4444', fontWeight: '500' }}>
                                              (ยกเลิกการตัดจ่าย) {w.reason || ''}
                                            </span>
                                          ) : (
                                            w.reason
                                          )}
                                        </td>
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
                          <span style={{ color: 'var(--text-muted)' }}>หมายเหตุ:</span> {item.remarks || 'ไม่มีหมายเหตุ'}
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
