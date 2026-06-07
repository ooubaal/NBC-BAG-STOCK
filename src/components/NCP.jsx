import { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { Camera, RefreshCcw, Plus, Download, Edit2, Trash2, X, Search } from 'lucide-react';

const compressImage = (base64Str, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to JPEG with 0.6 quality (highly efficient compression)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle = {
  background: 'rgba(30, 30, 45, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '2rem',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  position: 'relative'
};

const NCP = ({ inventory, items, db }) => {
  // Use lazy state initialization to load claims immediately, preventing race condition on initial render
  const [claims, rawSetClaims] = useState(() => {
    try {
      const savedClaims = localStorage.getItem('wms_claims');
      let parsed = savedClaims ? JSON.parse(savedClaims) : [];
      return parsed.filter(claim => claim && claim.id);
    } catch (e) {
      console.error("Error loading claims:", e);
      return [];
    }
  });

  // Custom wrapper to update both state and Firestore
  const setClaims = (newClaimsOrFunc) => {
    rawSetClaims(prev => {
      const next = typeof newClaimsOrFunc === 'function' ? newClaimsOrFunc(prev) : newClaimsOrFunc;
      
      if (db) {
        next.forEach(claim => {
          const prevClaim = prev.find(p => p.id === claim.id);
          if (!prevClaim || JSON.stringify(prevClaim) !== JSON.stringify(claim)) {
            setDoc(doc(db, 'claims', String(claim.id)), claim)
              .catch(err => console.error("Error syncing claim:", err));
          }
        });
        
        prev.forEach(prevClaim => {
          const stillExists = next.some(n => n.id === prevClaim.id);
          if (!stillExists) {
            deleteDoc(doc(db, 'claims', String(prevClaim.id))).catch(err => console.error("Error deleting claim:", err));
          }
        });
      }
      return next;
    });
  };

  // Real-time claims sync from Firestore when connected
  useEffect(() => {
    if (!db) return;

    const claimsRef = collection(db, 'claims');
    const unsubscribe = onSnapshot(claimsRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id) {
          list.push(data);
        }
      });
      
      const savedConfig = localStorage.getItem('wms_firebase_config');
      let projectId = null;
      if (savedConfig) {
        try {
          projectId = JSON.parse(savedConfig).projectId;
        } catch {
          console.warn("Failed to parse firebase config from localStorage");
        }
      }
      
      const isSynced = projectId && localStorage.getItem('wms_synced_project_id') === projectId;

      if (list.length > 0) {
        rawSetClaims(list);
        if (projectId) {
          localStorage.setItem('wms_synced_project_id', projectId);
        }
      } else if (isSynced) {
        rawSetClaims([]);
      }
    }, (error) => {
      console.error("Error listening to claims:", error);
    });

    return () => unsubscribe();
  }, [db]);

  const [ncpTab, setNcpTab] = useState('active'); // 'all', 'active', 'completed'
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Modals and Confirmations
  const [editingClaim, setEditingClaim] = useState(null);
  const [confirmDeleteClaimId, setConfirmDeleteClaimId] = useState(null);
  const [activeLightbox, setActiveLightbox] = useState(null); // { image, label }

  const initialNewClaim = {
    itemName: (items && items.length > 0) ? items[0].name : '',
    unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
    quantity: '',
    lotNo: '',
    description: '',
    status: 'Found', // Found, Claiming, Returned
    images: {
      found: null,
      claim: null,
      returned: null
    }
  };

  const [newClaim, setNewClaim] = useState(initialNewClaim);

  const availableLots = useMemo(() => {
    return inventory.filter(i => i.itemName === newClaim.itemName);
  }, [inventory, newClaim.itemName]);

  const filteredClaims = useMemo(() => {
    let base = claims;
    if (ncpTab === 'active') {
      base = claims.filter(c => c.status !== 'Returned');
    } else if (ncpTab === 'completed') {
      base = claims.filter(c => c.status === 'Returned');
    }
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      base = base.filter(c => 
        (c.itemName && c.itemName.toLowerCase().includes(q)) || 
        (c.lotNo && c.lotNo.toLowerCase().includes(q)) || 
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return base;
  }, [claims, ncpTab, searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem('wms_claims', JSON.stringify(claims));
    } catch (e) {
      console.error("Storage quota exceeded:", e);
      alert("ไม่สามารถบันทึกรูปภาพได้ เนื่องจากพื้นที่จัดเก็บเบราว์เซอร์เต็มแล้ว");
    }
  }, [claims]);

  const handleImageUpload = (step, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      compressImage(reader.result).then(compressed => {
        setNewClaim(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [step]: compressed
          }
        }));
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveNewClaimImage = (step) => {
    setNewClaim(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [step]: null
      }
    }));
  };

  const saveClaim = () => {
    if (!newClaim.itemName || !newClaim.lotNo || !newClaim.quantity) {
      alert("กรุณากรอกชื่อสินค้า, Lot no. และจำนวนที่พบปัญหา");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const claimToAdd = {
      ...newClaim,
      id: Date.now(),
      foundDate: today,
      claimingDate: '',
      returnedDate: ''
    };

    setClaims([...claims, claimToAdd]);
    setIsAdding(false);
    setNewClaim({
      itemName: (items && items.length > 0) ? items[0].name : '',
      unit: (items && items.length > 0) ? items[0].unit : 'ชิ้น',
      quantity: '',
      lotNo: '',
      description: '',
      status: 'Found',
      images: { found: null, claim: null, returned: null }
    });
  };

  const updateStatus = (id, status) => {
    const today = new Date().toISOString().split('T')[0];
    setClaims(claims.map(c => {
      if (c.id === id) {
        return { 
          ...c, 
          status,
          claimingDate: status === 'Claiming' ? today : c.claimingDate,
          returnedDate: status === 'Returned' ? today : c.returnedDate
        };
      }
      return c;
    }));
  };

  const deleteClaim = (id) => {
    setClaims(claims.filter(c => c.id !== id));
    setConfirmDeleteClaimId(null);
  };

  const saveEditClaim = () => {
    if (!editingClaim.itemName || !editingClaim.lotNo || !editingClaim.quantity) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    setClaims(claims.map(c => c.id === editingClaim.id ? editingClaim : c));
    setEditingClaim(null);
  };

  const handleUpdateImage = (id, step, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      compressImage(reader.result).then(compressed => {
        setClaims(claims.map(c => {
          if (c.id === id) {
            return {
              ...c,
              images: { ...c.images, [step]: compressed }
            };
          }
          return c;
        }));
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (id, step) => {
    setClaims(claims.map(c => {
      if (c.id === id) {
        return {
          ...c,
          images: { ...c.images, [step]: null }
        };
      }
      return c;
    }));
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">NCP Product การเคลมและรับคืน (Mod 4)</h1>
          <p className="page-subtitle">จัดการสินค้าไม่เป็นไปตามข้อกำหนดและติดตามการเคลม</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> แจ้งเคสใหม่
        </button>
      </div>

      {isAdding && (
        <div className="glass card" style={{ marginBottom: '2rem', border: '2px solid var(--accent-color)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>รายละเอียด NCP ใหม่</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>ชื่อสินค้า</label>
              <select 
                value={newClaim.itemName} 
                onChange={(e) => {
                  const selected = items.find(i => i.name === e.target.value);
                  setNewClaim({
                    ...newClaim,
                    itemName: e.target.value,
                    unit: selected ? selected.unit : 'ชิ้น',
                    lotNo: '',
                    quantity: ''
                  });
                }}
              >
                {items.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Lot no. ในคลังพัสดุ</label>
              <select 
                value={newClaim.lotNo} 
                onChange={e => setNewClaim({...newClaim, lotNo: e.target.value})}
              >
                <option value="">-- เลือก Lot จากคลังพัสดุ --</option>
                {availableLots.map((lot, idx) => (
                  <option key={lot.id || idx} value={lot.supplierLot}>
                    Supplier Lot: {lot.supplierLot} {lot.inhouseLot ? `(Inhouse: ${lot.inhouseLot})` : ''} - คงเหลือ {lot.remainingQty} {lot.unit || 'ชิ้น'} ({lot.location})
                  </option>
                ))}
              </select>
              {availableLots.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.4rem', display: 'block' }}>
                  * พัสดุชนิดนี้ยังไม่มี Lot หรือสินค้าคงเหลือในคลังพัสดุ
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>จำนวนที่พบปัญหา</label>
              <input type="number" value={newClaim.quantity} onChange={e => setNewClaim({...newClaim, quantity: e.target.value})} placeholder="ระบุจำนวน" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>หน่วยพัสดุ</label>
              <input type="text" value={newClaim.unit} disabled style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>รายละเอียดปัญหา</label>
            <textarea value={newClaim.description} onChange={e => setNewClaim({...newClaim, description: e.target.value})} placeholder="เช่น สินค้าชำรุด, สีผิดเพี้ยน..." rows="3"></textarea>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <ImageUploader 
              label="รูปภาพ NCP ที่พบ" 
              image={newClaim.images.found} 
              onUpload={(file) => handleImageUpload('found', file)} 
              onRemove={() => handleRemoveNewClaimImage('found')}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setIsAdding(false)}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={saveClaim}>สร้างเคส NCP</button>
          </div>
        </div>
      )}

      {/* แถบตัวกรองประวัติการเคลม NCP และช่องค้นหา */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div className="ncp-tabs glass" style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          padding: '0.5rem', 
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--glass-border)',
          width: 'fit-content'
        }}>
          <button 
            className="btn" 
            style={{ 
              background: ncpTab === 'active' ? 'var(--accent-color)' : 'transparent', 
              color: ncpTab === 'active' ? '#000' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 700
            }}
            onClick={() => setNcpTab('active')}
          >
            กำลังดำเนินการ ({claims.filter(c => c.status !== 'Returned').length})
          </button>
          <button 
            className="btn" 
            style={{ 
              background: ncpTab === 'completed' ? 'var(--success)' : 'transparent', 
              color: ncpTab === 'completed' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 700
            }}
            onClick={() => setNcpTab('completed')}
          >
            ประวัติเคสที่เสร็จสิ้น ({claims.filter(c => c.status === 'Returned').length})
          </button>
          <button 
            className="btn" 
            style={{ 
              background: ncpTab === 'all' ? 'var(--surface-lighter)' : 'transparent', 
              color: ncpTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 700
            }}
            onClick={() => setNcpTab('all')}
          >
            เคสทั้งหมด ({claims.length})
          </button>
        </div>

        {claims.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem', minWidth: '280px' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="ค้นหาตามชื่อสินค้า, Lot หรือรายละเอียด..."
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
      </div>

      <div className="claims-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {claims.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>ยังไม่มีประวัติการเคลมสินค้า</div>
        ) : filteredClaims.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            ไม่มีรายการเคลมสินค้าในหมวดหมู่นี้
          </div>
        ) : (
          filteredClaims.map(claim => (
            <div key={claim.id} className="glass card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{claim.itemName}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lot: {claim.lotNo}</div>
                  {claim.quantity && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600, marginTop: '0.25rem' }}>
                      จำนวนเคลม: {claim.quantity} {claim.unit || 'ชิ้น'}
                    </div>
                  )}
                </div>

                {/* Confirm Delete / Pen & Trash */}
                {confirmDeleteClaimId === claim.id ? (
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>ยืนยันลบ?</span>
                    <button 
                      style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '2px', fontSize: '0.7rem', padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                      onClick={() => deleteClaim(claim.id)}
                    >
                      ลบ
                    </button>
                    <button 
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: 'none', borderRadius: '2px', fontSize: '0.7rem', padding: '0.1rem 0.4rem', cursor: 'pointer' }}
                      onClick={() => setConfirmDeleteClaimId(null)}
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <StatusBadge status={claim.status} />
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', transition: 'var(--transition)' }}
                      onClick={() => setEditingClaim(claim)}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem', transition: 'var(--transition)' }}
                      onClick={() => setConfirmDeleteClaimId(claim.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              
              <p style={{ fontSize: '0.9rem' }}>{claim.description}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <div>
                  <ImageThumb 
                    label="1. ที่พบ" 
                    image={claim.images?.found} 
                    uniqueId={`thumb-found-${claim.id}`} 
                    onUpdate={(file) => handleUpdateImage(claim.id, 'found', file)} 
                    onRemove={() => handleRemoveImage(claim.id, 'found')}
                    onClick={() => claim.images?.found && setActiveLightbox({ image: claim.images.found, label: "1. ภาพพัสดุที่พบปัญหา" })}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                    {claim.foundDate || '-'}
                  </div>
                </div>
                
                <div>
                  <ImageThumb 
                    label="2. การเคลม" 
                    image={claim.images?.claim} 
                    uniqueId={`thumb-claim-${claim.id}`} 
                    onUpdate={(file) => handleUpdateImage(claim.id, 'claim', file)} 
                    onRemove={() => handleRemoveImage(claim.id, 'claim')}
                    onClick={() => claim.images?.claim && setActiveLightbox({ image: claim.images.claim, label: "2. ภาพขณะดำเนินการเคลม" })}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                    {claim.claimingDate || '-'}
                  </div>
                </div>

                <div>
                  <ImageThumb 
                    label="3. การคืน" 
                    image={claim.images?.returned} 
                    uniqueId={`thumb-returned-${claim.id}`} 
                    onUpdate={(file) => handleUpdateImage(claim.id, 'returned', file)} 
                    onRemove={() => handleRemoveImage(claim.id, 'returned')}
                    onClick={() => claim.images?.returned && setActiveLightbox({ image: claim.images.returned, label: "3. ภาพขารับคืนเรียบร้อย" })}
                  />
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                    {claim.returnedDate || '-'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
                {claim.status === 'Found' && <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => updateStatus(claim.id, 'Claiming')}>เริ่มดำเนินการเคลม</button>}
                {claim.status === 'Claiming' && <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem', background: 'var(--success)', color: '#fff' }} onClick={() => updateStatus(claim.id, 'Returned')}>รับสินค้าคืนเรียบร้อย</button>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox / Zoom-in Modal */}
      {activeLightbox && (
        <div style={modalOverlayStyle} onClick={() => setActiveLightbox(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '650px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <button 
              style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              onClick={() => setActiveLightbox(null)}
            >
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: '1.2rem', color: 'var(--accent-color)' }}>{activeLightbox.label}</h3>
            <img 
              src={activeLightbox.image} 
              alt="full view" 
              style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = activeLightbox.image;
                  link.download = `Evidence-${activeLightbox.label}.jpg`;
                  link.click();
                }}
              >
                <Download size={16} /> ดาวน์โหลดภาพหลักฐาน
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveLightbox(null)}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {editingClaim && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <Edit2 size={20} color="var(--accent-color)" /> แก้ไขข้อมูลเคส NCP
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>ชื่อสินค้า</label>
                <select 
                  value={editingClaim.itemName} 
                  onChange={(e) => {
                    const selected = items.find(i => i.name === e.target.value);
                    setEditingClaim({
                      ...editingClaim,
                      itemName: e.target.value,
                      unit: selected ? selected.unit : 'ชิ้น',
                      lotNo: '' 
                    });
                  }}
                >
                  {items.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Lot no. ในคลังพัสดุ</label>
                <select 
                  value={editingClaim.lotNo} 
                  onChange={e => setEditingClaim({...editingClaim, lotNo: e.target.value})}
                >
                  <option value="">-- เลือก Lot --</option>
                  {inventory.filter(i => i.itemName === editingClaim.itemName).map((lot, idx) => (
                    <option key={lot.id || idx} value={lot.supplierLot}>
                      Supplier: {lot.supplierLot} {lot.inhouseLot ? `(Inhouse: ${lot.inhouseLot})` : ''} - คงเหลือ {lot.remainingQty} {lot.unit || 'ชิ้น'} ({lot.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>จำนวนที่พบปัญหา</label>
                <input 
                  type="number" 
                  value={editingClaim.quantity} 
                  onChange={e => setEditingClaim({...editingClaim, quantity: e.target.value})} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>หน่วยพัสดุ</label>
                <input type="text" value={editingClaim.unit} disabled style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>รายละเอียดปัญหา</label>
              <textarea 
                value={editingClaim.description} 
                onChange={e => setEditingClaim({...editingClaim, description: e.target.value})} 
                rows="3"
              ></textarea>
            </div>

            <h4 style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              ลงบันทึกวันที่ในแต่ละขั้น
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>1. วันที่พบ</label>
                <input 
                  type="date" 
                  value={editingClaim.foundDate || ''} 
                  onChange={e => setEditingClaim({...editingClaim, foundDate: e.target.value})} 
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>2. วันที่เคลม</label>
                <input 
                  type="date" 
                  value={editingClaim.claimingDate || ''} 
                  onChange={e => setEditingClaim({...editingClaim, claimingDate: e.target.value})} 
                  disabled={editingClaim.status === 'Found'}
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>3. วันที่คืน</label>
                <input 
                  type="date" 
                  value={editingClaim.returnedDate || ''} 
                  onChange={e => setEditingClaim({...editingClaim, returnedDate: e.target.value})} 
                  disabled={editingClaim.status !== 'Returned'}
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.2rem' }}>
              <button className="btn btn-secondary" onClick={() => setEditingClaim(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={saveEditClaim}>บันทึกการแก้ไข</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    'Found': { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
    'Claiming': { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
    'Returned': { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' }
  };
  const color = colors[status] || colors.Found;
  return (
    <span style={{ 
      padding: '0.2rem 0.6rem', 
      borderRadius: '4px', 
      fontSize: '0.75rem', 
      fontWeight: 700, 
      backgroundColor: color.bg, 
      color: color.text 
    }}>{status}</span>
  );
};

const ImageUploader = ({ label, image, onUpload, onRemove }) => (
  <div style={{ border: '1px dashed var(--glass-border)', borderRadius: '8px', padding: '1rem', textAlign: 'center', position: 'relative' }}>
    <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{label}</div>
    {image ? (
      <div style={{ position: 'relative', width: '100%', height: '100px', borderRadius: '4px', overflow: 'hidden' }}>
        <img src={image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'rgba(0, 0, 0, 0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          opacity: 1
        }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} id={`change-${label}`} onChange={e => onUpload(e.target.files[0])} />
          <label htmlFor={`change-${label}`} style={{ 
            cursor: 'pointer', 
            background: 'var(--accent-color)', 
            color: '#000', 
            padding: '0.4rem', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s'
          }} title="เปลี่ยนรูป" className="hover-scale">
            <RefreshCcw size={14} />
          </label>
          <button 
            type="button"
            onClick={onRemove}
            style={{ 
              background: 'var(--danger)', 
              color: '#fff', 
              border: 'none', 
              padding: '0.4rem', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }} title="ลบรูป" className="hover-scale">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    ) : (
      <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <Camera size={24} color="var(--text-muted)" />
        <input type="file" accept="image/*" style={{ display: 'none' }} id={`upload-${label}`} onChange={e => onUpload(e.target.files[0])} />
        <label htmlFor={`upload-${label}`} style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent-color)' }}>คลิกเพื่ออัพโหลด</label>
      </div>
    )}
  </div>
);

const ImageThumb = ({ label, image, uniqueId, onUpdate, onRemove, onClick }) => {
  const fileInputId = `replace-${uniqueId}`;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>{label}</div>
      <div 
        style={{ 
          height: '80px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '6px', 
          position: 'relative', 
          overflow: 'hidden',
          border: '1px solid var(--glass-border)',
          cursor: image ? 'zoom-in' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => {
          if (image && onClick) onClick();
        }}
      >
        {image ? (
          <>
            <img src={image} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Control buttons in the bottom right corner */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              display: 'flex',
              gap: '4px',
              zIndex: 10
            }}>
              {/* Replace Button */}
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                id={fileInputId} 
                onChange={e => {
                  if (e.target.files[0]) {
                    onUpdate(e.target.files[0]);
                  }
                }} 
              />
              <label 
                htmlFor={fileInputId}
                onClick={e => e.stopPropagation()}
                style={{ 
                  background: 'var(--accent-color)', 
                  color: '#000', 
                  border: 'none', 
                  borderRadius: '4px', 
                  width: '24px', 
                  height: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s'
                }}
                title="เปลี่ยนรูป"
                className="hover-scale"
              >
                <RefreshCcw size={12} />
              </label>

              {/* Delete Button */}
              <button 
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  if (window.confirm('คุณต้องการลบรูปภาพนี้ใช่หรือไม่?')) {
                    onRemove();
                  }
                }}
                style={{ 
                  background: 'var(--danger)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '4px', 
                  width: '24px', 
                  height: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s'
                }}
                title="ลบรูป"
                className="hover-scale"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Camera size={18} color="var(--text-muted)" />
              <span style={{ fontSize: '0.6rem', color: 'var(--accent-color)' }}>อัพโหลด</span>
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }} id={uniqueId} onChange={e => {
              if (e.target.files[0]) {
                onUpdate(e.target.files[0]);
              }
            }} />
            <label htmlFor={uniqueId} style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}></label>
          </>
        )}
      </div>
    </div>
  );
};

export default NCP;
