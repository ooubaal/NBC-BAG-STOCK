import React, { useState, useMemo } from 'react';
import { MinusCircle, Search, Calendar, ChevronRight, Package, AlertCircle, MapPin, Printer, X } from 'lucide-react';

const Withdrawal = ({ inventory, setInventory, items }) => {
  const [withdrawalTab, setWithdrawalTab] = useState('new'); // 'new' or 'history'
  const [selectedItem, setSelectedItem] = useState((items && items.length > 0) ? items[0].name : '');
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeLotId, setActiveLotId] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  
  // History search and selection states
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);

  // Gather all historical withdrawals from inventory lots
  const historicalWithdrawals = useMemo(() => {
    const list = [];
    inventory.forEach(item => {
      if (item.withdrawals && item.withdrawals.length > 0) {
        item.withdrawals.forEach(w => {
          list.push({
            id: w.id,
            date: w.date,
            amount: w.amount,
            reason: w.reason,
            itemName: item.itemName,
            supplierLot: item.supplierLot,
            inhouseLot: item.inhouseLot,
            unit: item.unit || 'ชิ้น',
            location: item.location
          });
        });
      }
    });
    // Sort by date descending, then ID descending
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [inventory]);

  // Filter available lots that have remaining stock and match selected item
  const availableLots = useMemo(() => {
    return inventory.filter(i => i.itemName === selectedItem && i.remainingQty > 0);
  }, [inventory, selectedItem]);

  const activeLot = useMemo(() => {
    return inventory.find(i => i.id === activeLotId);
  }, [inventory, activeLotId]);

  // Filter historical list based on search term
  const filteredWithdrawals = useMemo(() => {
    return historicalWithdrawals.filter(w => {
      const search = historySearch.toLowerCase();
      return (
        w.itemName.toLowerCase().includes(search) ||
        w.supplierLot.toLowerCase().includes(search) ||
        (w.inhouseLot && w.inhouseLot.toLowerCase().includes(search)) ||
        (w.reason && w.reason.toLowerCase().includes(search))
      );
    });
  }, [historicalWithdrawals, historySearch]);

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

  const handleSelectHistory = (id) => {
    setSelectedHistoryIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllHistory = (e) => {
    if (e.target.checked) {
      setSelectedHistoryIds(filteredWithdrawals.map(w => w.id));
    } else {
      setSelectedHistoryIds([]);
    }
  };

  const printWithdrawalPDF = (withdrawalList) => {
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const printWindow = window.open("", "_blank", "width=950,height=850");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เบราว์เซอร์เปิด Pop-up เพื่อเปิดหน้าพิมพ์เอกสาร");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>ใบนำตัดจ่ายพัสดุ - NBC STOCK</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Sarabun', sans-serif;
              padding: 30px;
              color: #1f2937;
              background-color: #fff;
              font-size: 14px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 25px;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              color: #0f172a;
            }
            .meta-info {
              text-align: right;
              font-size: 13px;
              line-height: 1.5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              margin-bottom: 35px;
            }
            th {
              background-color: #0f172a;
              color: #fff;
              font-weight: 600;
              text-align: left;
              padding: 10px;
              border: 1px solid #e5e7eb;
              font-size: 13px;
            }
            td {
              padding: 10px;
              border: 1px solid #e5e7eb;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .total-row {
              background-color: #f3f4f6 !important;
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
              font-size: 13px;
            }
            .actions-bar {
              background-color: #0f172a;
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
              font-size: 13px;
              transition: all 0.2s;
            }
            .btn-print:hover {
              background-color: #c2410c;
            }
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
            <button class="btn-print" onclick="window.print()">พิมพ์เอกสาร / บันทึก PDF</button>
          </div>
          <div class="header">
            <div>
              <div class="title">ใบนำตัดจ่ายพัสดุ (Material Withdrawal Slip)</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">ระบบบริหารจัดการคลังสินค้า NBC STOCK</div>
            </div>
            <div class="meta-info">
              <div><strong>วันที่ออกเอกสาร:</strong> ${today}</div>
              <div><strong>จำนวนรายการตัดจ่าย:</strong> ${withdrawalList.length} รายการ</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">วันที่ตัดจ่าย</th>
                <th style="width: 25%;">รายการสินค้า</th>
                <th style="width: 12%;">Supplier Lot</th>
                <th style="width: 12%;">Inhouse Lot</th>
                <th style="width: 12%; text-align: right;">จำนวนที่ตัด</th>
                <th style="width: 8%;">หน่วย</th>
                <th style="width: 10%;">ที่เก็บเดิม</th>
                <th style="width: 19%;">เหตุผลการตัดจ่าย / หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${withdrawalList.map(w => `
                <tr>
                  <td>${w.date}</td>
                  <td style="font-weight: 600;">${w.itemName}</td>
                  <td>${w.supplierLot}</td>
                  <td>${w.inhouseLot || '-'}</td>
                  <td style="font-weight: 700; color: #dc2626; text-align: right;">-${w.amount}</td>
                  <td>${w.unit}</td>
                  <td>${w.location || '-'}</td>
                  <td>${w.reason || '-'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right;">รวมจำนวนตัดจ่ายทั้งสิ้น:</td>
                <td style="color: #dc2626; text-align: right;">-${withdrawalList.reduce((sum, w) => sum + w.amount, 0)}</td>
                <td colspan="3">หน่วย</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-block">
              <br><br>
              <strong>ผู้จัดทำ / ผู้ขอเบิกพัสดุ</strong>
              <div style="margin-top: 5px; font-size: 11px; color: #6b7280;">วันที่: ...... / ...... / ......</div>
            </div>
            <div class="sig-block">
              <br><br>
              <strong>ผู้ตรวจสอบ / ผู้อนุมัติจ่ายพัสดุ</strong>
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
      <div className="page-header">
        <h1 className="page-title">โมดูลการตัดจ่ายพัสดุ (Withdrawal)</h1>
        <p className="page-subtitle">บันทึกการเบิกใช้พัสดุออกจากคลังสินค้าแยกตาม Lot</p>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          className="btn" 
          style={{ 
            background: withdrawalTab === 'new' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: 700
          }}
          onClick={() => setWithdrawalTab('new')}
        >
          ทำรายการตัดจ่าย
        </button>
        <button 
          className="btn" 
          style={{ 
            background: withdrawalTab === 'history' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontWeight: 700
          }}
          onClick={() => setWithdrawalTab('history')}
        >
          ประวัติการตัดจ่ายคลัง ({historicalWithdrawals.length})
        </button>
      </div>

      {withdrawalTab === 'new' ? (
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
                    คงเหลือ in Lot: <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{activeLot.remainingQty} {activeLot.unit || 'ชิ้น'}</span>
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
      ) : (
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 className="page-title" style={{ fontSize: '1.5rem' }}>ประวัติการตัดจ่ายพัสดุในคลัง</h2>
              <p className="page-subtitle">แสดงและสั่งพิมพ์รายงานเอกสารการตัดจ่ายพัสดุย้อนหลัง</p>
            </div>
            <div>
              {selectedHistoryIds.length > 0 && (
                <button 
                  className="btn" 
                  onClick={() => printWithdrawalPDF(historicalWithdrawals.filter(w => selectedHistoryIds.includes(w.id)))}
                  style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.2)' }}
                >
                  <Printer size={18} /> พิมพ์ใบตัดจ่ายที่เลือก ({selectedHistoryIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="glass card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Search size={20} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="ค้นหาประวัติการตัดจ่ายตามชื่อสินค้า, Lot no., หรือเหตุผล..." 
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0.5rem', width: '100%' }}
            />
            {historySearch && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                onClick={() => setHistorySearch('')}
              >
                ล้างการค้นหา
              </button>
            )}
          </div>

          <div className="glass card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllHistory}
                      checked={filteredWithdrawals.length > 0 && selectedHistoryIds.length === filteredWithdrawals.length}
                    />
                  </th>
                  <th style={{ padding: '1rem' }}>วันที่ตัดจ่าย</th>
                  <th style={{ padding: '1rem' }}>รายการสินค้า</th>
                  <th style={{ padding: '1rem' }}>Supplier / Inhouse Lot</th>
                  <th style={{ padding: '1rem' }}>จำนวนตัดจ่าย</th>
                  <th style={{ padding: '1rem' }}>ที่เก็บเดิม</th>
                  <th style={{ padding: '1rem' }}>เหตุผล / หมายเหตุ</th>
                  <th style={{ padding: '1rem' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      ไม่พบประวัติการตัดจ่ายพัสดุ
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedHistoryIds.includes(w.id)}
                          onChange={() => handleSelectHistory(w.id)}
                        />
                      </td>
                      <td style={{ padding: '1rem' }}>{w.date}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{w.itemName}</td>
                      <td style={{ padding: '1rem' }}>
                        <div>{w.supplierLot}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.inhouseLot || '-'}</div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--danger)' }}>
                        -{w.amount} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>{w.unit}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>{w.location || '-'}</td>
                      <td style={{ padding: '1rem' }}>{w.reason || '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', border: '1px solid rgba(234, 88, 12, 0.2)' }}
                          onClick={() => printWithdrawalPDF([w])}
                        >
                          <Printer size={14} /> พิมพ์ใบตัดจ่าย (PDF)
                        </button>
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

export default Withdrawal;
