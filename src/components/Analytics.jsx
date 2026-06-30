import { useState, useMemo } from 'react';
import { List, TrendingDown, ChevronDown } from 'lucide-react';

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
      color: current.text,
      whiteSpace: 'nowrap'
    }}>{current.label}</span>
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

const Analytics = ({ inventory, items }) => {
  const [selectedItem, setSelectedItem] = useState((items && items.length > 0) ? items[0].name : '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Column filter states for details by lot table
  const [filterLot, setFilterLot] = useState('');
  const [filterInhouseLot, setFilterInhouseLot] = useState('');
  const [filterQty, setFilterQty] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterAcceptance, setFilterAcceptance] = useState('All');
  const [filterQcStatus, setFilterQcStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  const currentUnit = useMemo(() => {
    const found = items.find(i => i.name === selectedItem);
    return found ? found.unit : 'ชิ้น';
  }, [items, selectedItem]);

  const stats = useMemo(() => {
    const itemRecords = inventory.filter(i => i.itemName === selectedItem);
    const totalStock = itemRecords.reduce((acc, curr) => acc + Number(curr.remainingQty), 0);
    const lots = itemRecords.map(i => ({ 
      lot: i.supplierLot, 
      inhouseLot: i.inhouseLot, 
      qty: i.remainingQty, 
      status: i.qcStatus, 
      location: i.location,
      acceptanceStatus: i.acceptanceStatus,
      date: i.date
    }));
    const qcStats = itemRecords.reduce((acc, curr) => {
      acc[curr.qcStatus] = (acc[curr.qcStatus] || 0) + 1;
      return acc;
    }, {});
    
    // Withdrawal rate analysis
    const allWithdrawals = itemRecords.flatMap(i => i.withdrawals || []);
    const totalWithdrawn = allWithdrawals.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Run-out prediction calculation
    let dailyRate = 0;
    let daysRemaining = null;
    let predictionDateStr = '';
    let predictionStatus; // 'outOfStock', 'runsOut', 'noUsage'
    
    if (totalStock === 0) {
      predictionStatus = 'outOfStock';
    } else if (allWithdrawals.length > 0) {
      const dates = allWithdrawals.map(w => new Date(w.date).getTime()).filter(t => !isNaN(t));
      if (dates.length > 0) {
        const minDate = Math.min(...dates);
        const minDateObj = new Date(minDate);
        minDateObj.setHours(0, 0, 0, 0);
        
        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0);
        
        const diffTime = todayObj.getTime() - minDateObj.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const activeDays = Math.max(1, diffDays + 1);
        
        dailyRate = totalWithdrawn / activeDays;
        
        if (dailyRate > 0) {
          daysRemaining = Math.ceil(totalStock / dailyRate);
          predictionStatus = 'runsOut';
          
          const predTime = new Date().getTime() + (daysRemaining * 24 * 60 * 60 * 1000);
          const predDate = new Date(predTime);
          const dd = String(predDate.getDate()).padStart(2, '0');
          const mm = String(predDate.getMonth() + 1).padStart(2, '0');
          const yyyy = predDate.getFullYear() + 543; // Buddhist Era
          predictionDateStr = `${dd}/${mm}/${yyyy}`;
        } else {
          predictionStatus = 'noUsage';
        }
      } else {
        predictionStatus = 'noUsage';
      }
    } else {
      predictionStatus = 'noUsage';
    }
    
    return {
      totalStock,
      lots,
      qcStats,
      totalWithdrawn,
      recordCount: itemRecords.length,
      withdrawals: allWithdrawals,
      dailyRate,
      daysRemaining,
      predictionDateStr,
      predictionStatus
    };
  }, [inventory, selectedItem]);

  const filteredLots = useMemo(() => {
    if (!stats.lots) return [];
    return stats.lots.filter(l => {
      const matchLot = !filterLot || (l.lot && l.lot.toLowerCase().includes(filterLot.toLowerCase()));
      const matchInhouse = !filterInhouseLot || (l.inhouseLot && l.inhouseLot.toLowerCase().includes(filterInhouseLot.toLowerCase()));
      const matchQty = !filterQty || String(l.qty).toLowerCase().includes(filterQty.toLowerCase());
      const matchLocation = !filterLocation || (l.location && l.location.toLowerCase().includes(filterLocation.toLowerCase()));
      const matchDate = !filterDate || (l.date && formatDateToDDMMYYYY(l.date).toLowerCase().includes(filterDate.toLowerCase()));
      
      let matchAcceptance = true;
      if (filterAcceptance !== 'All') {
        if (filterAcceptance === 'unbilled') {
          matchAcceptance = !l.acceptanceStatus || l.acceptanceStatus === '';
        } else {
          matchAcceptance = l.acceptanceStatus === filterAcceptance;
        }
      }
      
      const matchQc = filterQcStatus === 'All' || l.status === filterQcStatus;
      
      return matchLot && matchInhouse && matchQty && matchLocation && matchAcceptance && matchQc && matchDate;
    });
  }, [stats.lots, filterLot, filterInhouseLot, filterQty, filterLocation, filterAcceptance, filterQcStatus, filterDate]);

  const getPredictionColor = () => {
    if (stats.predictionStatus === 'outOfStock') return '#ef4444';
    if (stats.predictionStatus === 'noUsage') return 'rgba(255, 255, 255, 0.1)';
    if (stats.daysRemaining <= 14) return '#ef4444';
    if (stats.daysRemaining <= 30) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">วิเคราะห์ Stock รายตัว (Mod 3)</h1>
        <p className="page-subtitle">สรุปข้อมูลเชิงลึกและการวิเคราะห์อัตราการตัดจ่าย</p>
      </div>

      <div className="glass card" style={{ marginBottom: '2rem', maxWidth: '400px' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>เลือกพัสดุเพื่อดูข้อมูล</label>
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
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <input
              type="text"
              placeholder="พิมพ์เพื่อค้นหาชื่อสินค้า..."
              value={isDropdownOpen ? searchQuery : selectedItem}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(true);
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
            <ChevronDown size={18} color="var(--text-secondary)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
          </div>

          {isDropdownOpen && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                onClick={() => { setIsDropdownOpen(false); setSearchQuery(''); }}
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
                {((items ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : []).length === 0) ? (
                  <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ไม่พบสินค้าที่ตรงกับคำค้นหา
                  </div>
                ) : (
                  (items ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : []).map(item => (
                    <div
                      key={item.name}
                      style={{
                        padding: '0.6rem 1rem',
                        cursor: 'pointer',
                        background: selectedItem === item.name ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(15, 23, 42, 0.05)'}
                      onMouseLeave={(e) => e.target.style.background = selectedItem === item.name ? 'rgba(245, 158, 11, 0.15)' : 'transparent'}
                      onClick={() => {
                        setSelectedItem(item.name);
                        setIsDropdownOpen(false);
                        setSearchQuery('');
                        // Reset filters when switching product
                        setFilterLot('');
                        setFilterInhouseLot('');
                        setFilterQty('');
                        setFilterLocation('');
                        setFilterAcceptance('All');
                        setFilterQcStatus('All');
                        setFilterDate('');
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

      <div className="stats-grid">
        <div className="stat-card glass" style={{ borderTop: '4px solid var(--accent-color)' }}>
          <div className="stat-label">คงเหลือรวม</div>
          <div className="stat-value">{stats.totalStock} <span style={{ fontSize: '1rem', fontWeight: 400 }}>{currentUnit}</span></div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>จากทั้งหมด {stats.recordCount} Lot</p>
        </div>
        <div className="stat-card glass" style={{ borderTop: '4px solid var(--accent-secondary)' }}>
          <div className="stat-label">จำนวนที่ตัดจ่ายไปแล้ว</div>
          <div className="stat-value">{stats.totalWithdrawn} <span style={{ fontSize: '1rem', fontWeight: 400 }}>{currentUnit}</span></div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>อัตราการใช้: {stats.totalStock > 0 ? ((stats.totalWithdrawn / (stats.totalWithdrawn + stats.totalStock)) * 100).toFixed(1) : 0}%</p>
        </div>
        <div className="stat-card glass" style={{ borderTop: '4px solid var(--success)' }}>
          <div className="stat-label">สถานะ QC (Pass)</div>
          <div className="stat-value">{stats.qcStats['Pass'] || 0} Lot</div>
        </div>
        <div className="stat-card glass" style={{ borderTop: `4px solid ${getPredictionColor()}` }}>
          <div className="stat-label">คาดการณ์ของหมด</div>
          <div className="stat-value">
            {stats.predictionStatus === 'outOfStock' && <span style={{ color: '#ef4444' }}>ตัดหมดแล้ว</span>}
            {stats.predictionStatus === 'noUsage' && <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>ไม่มีข้อมูลการใช้</span>}
            {stats.predictionStatus === 'runsOut' && (
              <>
                {stats.daysRemaining > 365 ? '> 365' : stats.daysRemaining} <span style={{ fontSize: '1rem', fontWeight: 400 }}>วัน</span>
              </>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {stats.predictionStatus === 'outOfStock' && 'ไม่เหลือพัสดุในคลัง'}
            {stats.predictionStatus === 'noUsage' && 'ยังไม่มีประวัติการตัดจ่าย'}
            {stats.predictionStatus === 'runsOut' && `คาดว่าจะหมด: ${stats.predictionDateStr} (เฉลี่ย ${stats.dailyRate.toFixed(1)} ${currentUnit}/วัน)`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <List size={20} /> รายละเอียดแยกตาม Lot
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Lot no.</th>
                  <th style={{ padding: '0.5rem' }}>Inhouse Lot</th>
                  <th style={{ padding: '0.5rem' }}>วันที่รับ</th>
                  <th style={{ padding: '0.5rem' }}>คงเหลือ ({currentUnit})</th>
                  <th style={{ padding: '0.5rem' }}>ที่เก็บ</th>
                  <th style={{ padding: '0.5rem' }}>สถานะจัดซื้อ/วางบิล</th>
                  <th style={{ padding: '0.5rem' }}>สถานะ QC</th>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.25rem 0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={filterLot} 
                      onChange={(e) => setFilterLot(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.25rem 0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={filterInhouseLot} 
                      onChange={(e) => setFilterInhouseLot(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.25rem 0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={filterDate} 
                      onChange={(e) => setFilterDate(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.25rem 0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={filterQty} 
                      onChange={(e) => setFilterQty(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.25rem 0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="กรอง..." 
                      value={filterLocation} 
                      onChange={(e) => setFilterLocation(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    />
                  </th>
                  <th style={{ padding: '0.25rem 0.5rem' }}>
                    <select 
                      value={filterAcceptance} 
                      onChange={(e) => setFilterAcceptance(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                      <option value="All">ทั้งหมด</option>
                      <option value="unbilled">ยังไม่ได้วางบิล</option>
                      <option value="Pending">รอการตรวจรับ</option>
                      <option value="Accepted">ตรวจรับผ่าน</option>
                      <option value="Rejected">ปฏิเสธการรับ</option>
                    </select>
                  </th>
                  <th style={{ padding: '0.25rem 0.5rem' }}>
                    <select 
                      value={filterQcStatus} 
                      onChange={(e) => setFilterQcStatus(e.target.value)} 
                      style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                    >
                      <option value="All">ทั้งหมด</option>
                      <option value="Quarantine">Quarantine</option>
                      <option value="Pass">Pass</option>
                      <option value="Reject">Reject</option>
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '1rem', textAlign: 'center' }}>ไม่พบข้อมูลที่ตรงกับตัวกรอง</td></tr>
                ) : (
                  filteredLots.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.75rem' }}>{l.lot || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>{l.inhouseLot || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>{formatDateToDDMMYYYY(l.date)}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{l.qty}</td>
                      <td style={{ padding: '0.75rem' }}>{l.location}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <AcceptanceBadge status={l.acceptanceStatus} />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`status-badge status-${l.status.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{l.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={20} /> ประวัติการตัดจ่ายล่าสุด
          </h3>
          <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
            {stats.withdrawals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>ยังไม่มีประวัติการตัดจ่ายสำหรับรายการนี้</p>
            ) : (
              stats.withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date)).map((w, i) => (
                <div key={i} className="glass" style={{ padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{w.reason || "ไม่ระบุเหตุผล"}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.date}</div>
                  </div>
                  <div style={{ color: 'var(--danger)', fontWeight: 700 }}>-{w.amount} {currentUnit}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
