import { useState, useMemo } from 'react';
import { Plus, Check, X, FileText, ShieldAlert, PackageOpen, ChevronDown, ChevronUp, UserCheck, AlertTriangle, Search } from 'lucide-react';

const Agreements = ({ agreements, setAgreements, inventory, setInventory, items }) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'
  const [expandedAgreementId, setExpandedAgreementId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New agreement form state
  const [newAgreement, setNewAgreement] = useState({
    id: '',
    itemName: (items && items.length > 0) ? items[0].name : '',
    unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
    totalQty: '',
    supplier: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    remarks: ''
  });

  // Handle saving new agreement
  const handleSaveAgreement = (e) => {
    e.preventDefault();
    if (!newAgreement.id || !newAgreement.totalQty || !newAgreement.supplier) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (เลขที่สัญญา, จำนวนทั้งหมด, ผู้จัดจำหน่าย)");
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
      createdAt: new Date().toISOString()
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
      remarks: ''
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

    const htmlContent = `
      <html>
        <head>
          <title>รายงานสัญญาจัดซื้อค้างรับทั้งหมด - NBC Stock</title>
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
              font-size: 0.85rem;
            }
            th {
              background-color: #003366;
              color: #fff;
              font-weight: 600;
              padding: 0.6rem;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 0.6rem;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              font-weight: 700;
              background-color: #f0f4f8 !important;
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
              z-index: 9999;
            }
            .status-badge {
              display: inline-block;
              padding: 0.15rem 0.4rem;
              border-radius: 4px;
              font-size: 0.75rem;
              font-weight: bold;
            }
            .status-active { background-color: #e0f7fa; color: #006064; }
            .status-expired { background-color: #ffebee; color: #b71c1c; }
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
          <button class="no-print-btn" onclick="window.print()">พิมพ์รายงาน / บันทึก PDF</button>

          <div class="header-container">
            <div class="title-section">
              <h1>รายงานสัญญาจัดซื้อค้างรับทั้งหมด (Outstanding Purchase Agreements Report)</h1>
              <p>ระบบบริหารจัดการคลังสินค้า NBC STOCK | ข้อมูลสัญญาค้างส่งมอบ</p>
            </div>
            <div class="meta-section">
              <p><strong>วันที่ออกรายงาน:</strong> ${today}</p>
              <p><strong>จำนวนสัญญาค้างรับ:</strong> ${outstandingAgreements.length} รายการ</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>เลขที่สัญญา</th>
                <th>ผู้จัดจำหน่าย (Supplier)</th>
                <th>สินค้าจัดซื้อ</th>
                <th style="text-align: right;">ยอดสัญญา</th>
                <th style="text-align: right;">รับแล้ว (ผ่าน)</th>
                <th style="text-align: right;">รอตรวจรับ</th>
                <th style="text-align: right; color: #b71c1c;">ยอดค้างรับ</th>
                <th>หน่วย</th>
                <th>วันหมดอายุสัญญา</th>
                <th>สถานะสัญญา</th>
              </tr>
            </thead>
            <tbody>
              ${outstandingAgreements.map(ag => `
                <tr>
                  <td style="font-weight: 600;">${ag.id}</td>
                  <td>${ag.supplier}</td>
                  <td style="font-weight: 600;">${ag.itemName}</td>
                  <td style="text-align: right;">${ag.totalQty.toLocaleString()}</td>
                  <td style="text-align: right; color: #0f5132;">${ag.acceptedQty.toLocaleString()}</td>
                  <td style="text-align: right; color: #664d03;">${ag.pendingQty.toLocaleString()}</td>
                  <td style="text-align: right; font-weight: 700; color: #b71c1c;">${ag.outstandingQty.toLocaleString()}</td>
                  <td>${ag.unit}</td>
                  <td>${ag.endDate || "-"}</td>
                  <td>
                    <span class="status-badge ${
                      ag.displayStatus === 'Expired' ? 'status-expired' : 'status-active'
                    }">
                      ${ag.displayStatus === 'Expired' ? 'หมดอายุสัญญา' : 'กำลังดำเนินการ'}
                    </span>
                  </td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">รวมทั้งหมด</td>
                <td style="text-align: right;">
                  ${outstandingAgreements.reduce((sum, ag) => sum + ag.totalQty, 0).toLocaleString()}
                </td>
                <td style="text-align: right;">
                  ${outstandingAgreements.reduce((sum, ag) => sum + ag.acceptedQty, 0).toLocaleString()}
                </td>
                <td style="text-align: right;">
                  ${outstandingAgreements.reduce((sum, ag) => sum + ag.pendingQty, 0).toLocaleString()}
                </td>
                <td style="text-align: right; color: #b71c1c; font-size: 0.95rem;">
                  ${outstandingAgreements.reduce((sum, ag) => sum + ag.outstandingQty, 0).toLocaleString()}
                </td>
                <td colspan="3">หน่วยตามรายการ</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 4rem; display: flex; justify-content: space-between; font-size: 0.9rem;">
            <div style="text-align: center; width: 40%;">
              <p style="margin-bottom: 3.5rem;"></p>
              <p>____________________________________</p>
              <p><strong>ผู้ตรวจสอบรายงาน</strong></p>
              <p>วันที่: ...... / ...... / ......</p>
            </div>
            <div style="text-align: center; width: 40%;">
              <p style="margin-bottom: 3.5rem;"></p>
              <p>____________________________________</p>
              <p><strong>ผู้อนุมัติรายงาน</strong></p>
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
                <select 
                  value={newAgreement.itemName} 
                  onChange={e => {
                    const selected = items.find(i => i.name === e.target.value);
                    setNewAgreement({
                      ...newAgreement,
                      itemName: e.target.value,
                      unit: selected ? selected.unit : 'ชิ้น'
                    });
                  }}
                >
                  {items.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
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

                    <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
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
                                <th style={{ padding: '0.5rem' }}>Inhouse Lot</th>
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
