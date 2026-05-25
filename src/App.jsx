import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Download, 
  BarChart3, 
  AlertOctagon, 
  Plus, 
  History,
  Settings,
  ArrowUpRight,
  ShieldCheck,
  PackageOpen,
  MinusCircle
} from 'lucide-react';
import './App.css';

// Import Components
import Inventory from './components/Inventory';
import Inbound from './components/Inbound';
import Analytics from './components/Analytics';
import NCP from './components/NCP';
import ProductRegistry from './components/ProductRegistry';
import Withdrawal from './components/Withdrawal';
import SettingsTab from './components/Settings';
import { initFirebase } from './firebase';
import { doc, setDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';

const INITIAL_ITEMS = [
  { name: "Raw Material A", unit: "kg" },
  { name: "Raw Material B", unit: "kg" },
  { name: "Packaging X", unit: "ชิ้น" },
  { name: "Label Z", unit: "ชิ้น" },
  { name: "Component Y", unit: "กล่อง" }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('wms_items');
    let parsedItems = saved ? JSON.parse(saved) : INITIAL_ITEMS;
    // Migration: If items is a list of strings, convert to list of objects
    if (parsedItems.length > 0 && typeof parsedItems[0] === 'string') {
      const defaultUnits = {
        "Raw Material A": "kg",
        "Raw Material B": "kg",
        "Packaging X": "ชิ้น",
        "Label Z": "ชิ้น",
        "Component Y": "กล่อง"
      };
      parsedItems = parsedItems.map(item => ({
        name: item,
        unit: defaultUnits[item] || "ชิ้น"
      }));
    }
    return parsedItems;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('wms_inventory');
    let parsedInventory = saved ? JSON.parse(saved) : [];
    
    // Migration: ensure every item in inventory has a unit field
    parsedInventory = parsedInventory.map(item => {
      if (!item.unit) {
        const registered = items.find(i => i.name === item.itemName);
        item.unit = registered ? registered.unit : 'ชิ้น';
      }
      return item;
    });
    return parsedInventory;
  });

  // 1. Firebase Configuration State
  const [firebaseConfig, setFirebaseConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('wms_firebase_config');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  const [db, setDb] = useState(null);

  // 2. Initialize Firebase dynamically on boot or when config changes
  useEffect(() => {
    if (firebaseConfig) {
      const res = initFirebase(firebaseConfig);
      if (res && res.db) {
        setDb(res.db);
      } else {
        setDb(null);
      }
    } else {
      setDb(null);
    }
  }, [firebaseConfig]);

  // 3. Real-time synchronisation for Items
  useEffect(() => {
    if (!db) return;

    const itemsRef = collection(db, 'items');
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      if (list.length > 0) {
        setItems(list);
      }
    }, (error) => {
      console.error("Error listening to items:", error);
    });

    return () => unsubscribe();
  }, [db]);

  // 4. Real-time synchronisation for Inventory
  useEffect(() => {
    if (!db) return;

    const invRef = collection(db, 'inventory');
    const unsubscribe = onSnapshot(invRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data());
      });
      if (list.length > 0) {
        setInventory(list);
      }
    }, (error) => {
      console.error("Error listening to inventory:", error);
    });

    return () => unsubscribe();
  }, [db]);

  // Save data to LocalStorage as cache
  useEffect(() => {
    localStorage.setItem('wms_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('wms_items', JSON.stringify(items));
  }, [items]);

  // 5. Intercept state updates to sync with Firestore
  const updateItems = (newItemsOrFunc) => {
    setItems(prev => {
      const next = typeof newItemsOrFunc === 'function' ? newItemsOrFunc(prev) : newItemsOrFunc;
      
      if (db) {
        next.forEach(item => {
          setDoc(doc(db, 'items', item.name), item)
            .catch(err => console.error("Error syncing item:", err));
        });
      }
      return next;
    });
  };

  const updateInventory = (newInvOrFunc) => {
    setInventory(prev => {
      const next = typeof newInvOrFunc === 'function' ? newInvOrFunc(prev) : newInvOrFunc;
      
      if (db) {
        next.forEach(item => {
          const prevItem = prev.find(p => p.id === item.id);
          if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
            setDoc(doc(db, 'inventory', String(item.id)), item)
              .catch(err => console.error("Error syncing inventory:", err));
          }
        });
        prev.forEach(prevItem => {
          const stillExists = next.some(n => n.id === prevItem.id);
          if (!stillExists) {
            deleteDoc(doc(db, 'inventory', String(prevItem.id))).catch(err => console.error("Error deleting doc:", err));
          }
        });
      }
      return next;
    });
  };

  // 6. Migration and Sync Helpers for SettingsTab
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigrate = async () => {
    if (!db) return;
    setIsMigrating(true);
    try {
      // Upload Items
      for (const item of items) {
        await setDoc(doc(db, 'items', item.name), item);
      }
      
      // Upload Inventory
      for (const lot of inventory) {
        await setDoc(doc(db, 'inventory', String(lot.id)), lot);
      }
      
      // Upload Claims from local storage
      const savedClaimsText = localStorage.getItem('wms_claims');
      if (savedClaimsText) {
        const savedClaims = JSON.parse(savedClaimsText);
        for (const claim of savedClaims) {
          await setDoc(doc(db, 'claims', String(claim.id)), claim);
        }
      }
      
      alert("ย้ายข้อมูลขึ้นฐานข้อมูลคลาวด์สำเร็จเรียบร้อยแล้ว ทุกเครื่องจะเห็นข้อมูลใหม่นี้ทันที!");
    } catch (error) {
      console.error("Migration failed:", error);
      alert("การย้ายข้อมูลล้มเหลว: " + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const getSyncStats = () => {
    const savedClaimsText = localStorage.getItem('wms_claims');
    const localClaims = savedClaimsText ? JSON.parse(savedClaimsText).length : 0;
    return {
      localItems: items.length,
      localInventory: inventory.length,
      localClaims
    };
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventory={inventory} setActiveTab={setActiveTab} />;
      case 'items':
        return <ProductRegistry items={items} setItems={updateItems} />;
      case 'inventory':
        return <Inventory inventory={inventory} setInventory={updateInventory} items={items} />;
      case 'inbound':
        return <Inbound setInventory={updateInventory} items={items} inventory={inventory} />;
      case 'withdrawal':
        return <Withdrawal inventory={inventory} setInventory={updateInventory} items={items} />;
      case 'analytics':
        return <Analytics inventory={inventory} items={items} />;
      case 'ncp':
        return <NCP inventory={inventory} items={items} db={db} />;
      case 'settings':
        return (
          <SettingsTab 
            config={firebaseConfig} 
            onSaveConfig={(newConfig) => {
              localStorage.setItem('wms_firebase_config', JSON.stringify(newConfig));
              setFirebaseConfig(newConfig);
              alert("บันทึกการตั้งค่าและเชื่อมต่อ Firebase สำเร็จ!");
            }}
            onDisconnect={() => {
              if (window.confirm("คุณต้องการตัดการเชื่อมต่อคลาวด์และกลับมาใช้งานแบบในเครื่อง (Local) ใช่หรือไม่?")) {
                localStorage.removeItem('wms_firebase_config');
                setFirebaseConfig(null);
              }
            }}
            onMigrate={handleMigrate}
            syncStats={getSyncStats()}
            isMigrating={isMigrating}
          />
        );
      default:
        return <Dashboard inventory={inventory} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar glass">
        <div className="logo" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <Package size={32} />
          <span>NBC STOCK</span>
        </div>
        
        <nav className="nav-links">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === 'items'} 
            onClick={() => setActiveTab('items')}
            icon={<Package size={20} />}
            label="ทะเบียนพัสดุ (Items)"
          />
          <NavItem 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            icon={<History size={20} />}
            label="คลังพัสดุ (Mod 1)"
          />
          <NavItem 
            active={activeTab === 'inbound'} 
            onClick={() => setActiveTab('inbound')}
            icon={<Plus size={20} />}
            label="รับเข้า (Mod 2)"
          />
          <NavItem 
            active={activeTab === 'withdrawal'} 
            onClick={() => setActiveTab('withdrawal')}
            icon={<MinusCircle size={20} />}
            label="การตัดจ่าย (Withdraw)"
          />
          <NavItem 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
            icon={<BarChart3 size={20} />}
            label="วิเคราะห์ Stock (Mod 3)"
          />
          <NavItem 
            active={activeTab === 'ncp'} 
            onClick={() => setActiveTab('ncp')}
            icon={<AlertOctagon size={20} />}
            label="เคลมสินค้า NCP (Mod 4)"
          />
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={20} />} 
            label="ตั้งค่าแชร์คลาวด์" 
          />
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

const Dashboard = ({ inventory, setActiveTab }) => {
  const stats = {
    total: inventory.length,
    pass: inventory.filter(i => i.qcStatus === 'Pass').length,
    quarantine: inventory.filter(i => i.qcStatus === 'Quarantine').length,
    reject: inventory.filter(i => i.qcStatus === 'Reject').length,
  };

  const recentEntries = [...inventory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">ภาพรวมของคลังสินค้าและความเคลื่อนไหวล่าสุด</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card glass" style={{ borderTop: '4px solid var(--accent-secondary)' }}>
          <div className="stat-label">รายการทั้งหมด</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card glass" style={{ borderTop: '4px solid var(--success)' }}>
          <div className="stat-label">ผ่าน QC (Pass)</div>
          <div className="stat-value">{stats.pass}</div>
        </div>
        <div className="stat-card glass" style={{ borderTop: '4px solid var(--quarantine)' }}>
          <div className="stat-label">กักกัน (Quarantine)</div>
          <div className="stat-value">{stats.quarantine}</div>
        </div>
        <div className="stat-card glass" style={{ borderTop: '4px solid var(--danger)' }}>
          <div className="stat-label">ไม่ผ่าน (Reject)</div>
          <div className="stat-value">{stats.reject}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="glass card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>รายการรับเข้าล่าสุด</h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('inventory')}>
              ดูทั้งหมด <ArrowUpRight size={14} />
            </button>
          </div>
          {recentEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>ไม่มีข้อมูลพัสดุใหม่</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentEntries.map(item => (
                <div key={item.id} className="glass" style={{ padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.itemName}
                      <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                        ({item.quantity} {item.unit || 'ชิ้น'})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lot: {item.supplierLot} | {item.date}</div>
                  </div>
                  <div className={`status-badge status-${item.qcStatus.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{item.qcStatus}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), transparent)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <PackageOpen size={18} color="var(--accent-color)" /> การแจ้งเตือน
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>มีรายการ Quarantine ค้างอยู่ {stats.quarantine} รายการ กรุณาตรวจสอบสถานะ QC</p>
          </div>
          
          <div className="glass card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), transparent)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShieldCheck size={18} color="var(--accent-secondary)" /> ความพร้อมของคลัง
            </h4>
            <div style={{ height: '8px', background: 'var(--surface-lighter)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', background: 'var(--accent-secondary)' }}></div>
            </div>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>พื้นที่จัดเก็บคงเหลือประมาณ 15%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
