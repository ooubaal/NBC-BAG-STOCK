import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  AlertOctagon, 
  Plus, 
  History,
  Settings,
  ArrowUpRight,
  ShieldCheck,
  PackageOpen,
  MinusCircle,
  ClipboardList,
  Calendar,
  Tag,
  Menu,
  X,
  Clock,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Truck,
  Flame,
  ArrowDownLeft,
  ShieldAlert,
  Check,
  RefreshCw,
  AlertTriangle,
  Layers,
  Activity,
  ArrowRight
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
import Agreements from './components/Agreements';
import StatusLabels from './components/StatusLabels';
import { initFirebase } from './firebase';
import { doc, setDoc, collection, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';

const INITIAL_ITEMS = [];

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
};

const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error("LocalStorage write failed:", error);
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      if (!window._wms_storage_warning_shown) {
        window._wms_storage_warning_shown = true;
        alert("⚠️ คำเตือน: พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็มแล้ว! ไม่สามารถบันทึกข้อมูลสำรองชั่วคราวในเครื่องนี้ได้ (แต่อุปกรณ์ที่ต่อระบบแชร์คลาวด์/Firebase จะยังคงทำงานและบันทึกข้อมูลได้อย่างปลอดภัย)");
      }
    }
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2.5rem', 
          textAlign: 'center', 
          color: '#fff', 
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          margin: '2rem auto',
          maxWidth: '700px',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1.25rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
        }}>
          <h2 style={{ color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚠️ เกิดข้อผิดพลาดในการโหลดหน้าจอ</h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            เกิดข้อผิดพลาดในการประมวลผลหรือเรนเดอร์เนื้อหาหน้าจอ
          </p>
          <div style={{ 
            width: '100%',
            textAlign: 'left', 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.15)',
            padding: '1rem', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            overflowX: 'auto',
            color: '#f43f5e'
          }}>
            {this.state.error ? this.state.error.toString() : 'Unknown Error'}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })} 
              style={{ 
                padding: '0.5rem 1.25rem', 
                background: 'rgba(255,255,255,0.08)', 
                border: '1px solid var(--glass-border)', 
                borderRadius: '20px', 
                color: '#fff', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            >
              ย้อนกลับหน้าจอก่อนหน้า
            </button>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '0.5rem 1.25rem', 
                background: 'var(--accent-secondary)', 
                border: 'none', 
                borderRadius: '20px', 
                color: '#fff', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            >
              โหลดหน้าเว็บใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    return parsedItems.filter(item => item && item.name && item.name.trim());
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('wms_inventory');
    let parsedInventory = saved ? JSON.parse(saved) : [];
    
    // Migration: ensure every item in inventory has a unit field
    parsedInventory = parsedInventory.map(item => {
      if (item && !item.unit) {
        const registered = items.find(i => i && i.name === item.itemName);
        item.unit = registered ? registered.unit : 'ชิ้น';
      }
      return item;
    });
    return parsedInventory.filter(item => item && item.id);
  });

  const [agreements, setAgreements] = useState(() => {
    try {
      const saved = localStorage.getItem('wms_agreements');
      let parsed = saved ? JSON.parse(saved) : [];
      return parsed.filter(ag => ag && ag.id);
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [claims, setClaims] = useState(() => {
    try {
      const saved = localStorage.getItem('wms_claims');
      let parsed = saved ? JSON.parse(saved) : [];
      return parsed.filter(c => c && c.id);
    } catch (e) {
      console.error(e);
      return [];
    }
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
    let active = true;
    if (firebaseConfig) {
      const res = initFirebase(firebaseConfig);
      if (res && res.db) {
        Promise.resolve().then(() => {
          if (active) setDb(res.db);
        });
      } else {
        Promise.resolve().then(() => {
          if (active) setDb(null);
        });
      }
    } else {
      Promise.resolve().then(() => {
        if (active) setDb(null);
      });
    }
    return () => {
      active = false;
    };
  }, [firebaseConfig]);

  // 3. Real-time synchronisation for Items
  useEffect(() => {
    if (!db) return;

    const itemsRef = collection(db, 'items');
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.name && data.name.trim()) {
          list.push(data);
        }
      });
      
      const isSynced = firebaseConfig && localStorage.getItem('wms_synced_project_id') === firebaseConfig.projectId;

      if (list.length > 0) {
        setItems(list);
        if (firebaseConfig) {
          localStorage.setItem('wms_synced_project_id', firebaseConfig.projectId);
        }
      } else if (isSynced) {
        setItems(INITIAL_ITEMS);
      }
    }, (error) => {
      console.error("Error listening to items:", error);
    });

    return () => unsubscribe();
  }, [db, firebaseConfig]);

  // 4. Real-time synchronisation for Inventory
  useEffect(() => {
    if (!db) return;

    const invRef = collection(db, 'inventory');
    const unsubscribe = onSnapshot(invRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id) {
          list.push(data);
        }
      });
      
      const isSynced = firebaseConfig && localStorage.getItem('wms_synced_project_id') === firebaseConfig.projectId;

      if (list.length > 0) {
        setInventory(list);
        if (firebaseConfig) {
          localStorage.setItem('wms_synced_project_id', firebaseConfig.projectId);
        }
      } else if (isSynced) {
        setInventory([]);
      }
    }, (error) => {
      console.error("Error listening to inventory:", error);
    });

    return () => unsubscribe();
  }, [db, firebaseConfig]);

  // 4b. Real-time synchronisation for Agreements
  useEffect(() => {
    if (!db) return;

    const agreementsRef = collection(db, 'agreements');
    const unsubscribe = onSnapshot(agreementsRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id) {
          list.push(data);
        }
      });
      
      const isSynced = firebaseConfig && localStorage.getItem('wms_synced_project_id') === firebaseConfig.projectId;

      if (list.length > 0) {
        setAgreements(list);
        if (firebaseConfig) {
          localStorage.setItem('wms_synced_project_id', firebaseConfig.projectId);
        }
      } else if (isSynced) {
        setAgreements([]);
      }
    }, (error) => {
      console.error("Error listening to agreements:", error);
    });

    return () => unsubscribe();
  }, [db, firebaseConfig]);

  // 4bb. Real-time synchronisation for Claims
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
      
      const isSynced = firebaseConfig && localStorage.getItem('wms_synced_project_id') === firebaseConfig.projectId;

      if (list.length > 0) {
        // Normalize images structure for backward compatibility
        const normalized = list.map(c => {
          const normalizedImages = {};
          const steps = ['found', 'claim', 'returned'];
          steps.forEach(step => {
            if (c.images && c.images[step]) {
              normalizedImages[step] = Array.isArray(c.images[step]) 
                ? c.images[step] 
                : [c.images[step]];
            } else {
              normalizedImages[step] = [];
            }
          });
          return { ...c, images: normalizedImages };
        });

        setClaims(normalized);
        if (firebaseConfig) {
          localStorage.setItem('wms_synced_project_id', firebaseConfig.projectId);
        }
      } else if (isSynced) {
        setClaims([]);
      }
    }, (error) => {
      console.error("Error listening to claims:", error);
    });

    return () => unsubscribe();
  }, [db, firebaseConfig]);

  // 4c. Set project as synced automatically if local storage is already empty on boot
  useEffect(() => {
    if (db && firebaseConfig && firebaseConfig.projectId) {
      const isLocalEmpty = inventory.length === 0 && agreements.length === 0;
      if (isLocalEmpty) {
        localStorage.setItem('wms_synced_project_id', firebaseConfig.projectId);
      }
    }
  }, [db, firebaseConfig, inventory.length, agreements.length]);

  // Save data to LocalStorage as cache
  useEffect(() => {
    safeSetLocalStorage('wms_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    safeSetLocalStorage('wms_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    safeSetLocalStorage('wms_agreements', JSON.stringify(agreements));
  }, [agreements]);

  useEffect(() => {
    safeSetLocalStorage('wms_claims', JSON.stringify(claims));
  }, [claims]);

  // 5. Intercept state updates to sync with Firestore
  const updateItems = (newItemsOrFunc) => {
    setItems(prev => {
      const next = typeof newItemsOrFunc === 'function' ? newItemsOrFunc(prev) : newItemsOrFunc;
      
      if (db && Array.isArray(next)) {
        next.forEach(item => {
          if (item && item.name && item.name.trim()) {
            const safeId = encodeURIComponent(item.name.trim());
            setDoc(doc(db, 'items', safeId), item)
              .catch(err => console.error("Error syncing item:", err));
          }
        });
        if (Array.isArray(prev)) {
          prev.forEach(prevItem => {
            if (prevItem && prevItem.name && prevItem.name.trim()) {
              const stillExists = next.some(n => n && n.name === prevItem.name);
              if (!stillExists) {
                const safeId = encodeURIComponent(prevItem.name.trim());
                deleteDoc(doc(db, 'items', safeId))
                  .catch(err => console.error("Error deleting item:", err));
              }
            }
          });
        }
      }
      return next;
    });
  };

  const updateInventory = (newInvOrFunc) => {
    setInventory(prev => {
      const next = typeof newInvOrFunc === 'function' ? newInvOrFunc(prev) : newInvOrFunc;
      
      if (db && Array.isArray(next)) {
        next.forEach(item => {
          if (item && item.id) {
            const prevItem = Array.isArray(prev) ? prev.find(p => p && p.id === item.id) : null;
            if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
              setDoc(doc(db, 'inventory', String(item.id)), item)
                .catch(err => console.error("Error syncing inventory:", err));
            }
          }
        });
        if (Array.isArray(prev)) {
          prev.forEach(prevItem => {
            if (prevItem && prevItem.id) {
              const stillExists = next.some(n => n && n.id === prevItem.id);
              if (!stillExists) {
                deleteDoc(doc(db, 'inventory', String(prevItem.id))).catch(err => console.error("Error deleting doc:", err));
              }
            }
          });
        }
      }
      return next;
    });
  };

  const updateAgreements = (newAgreementsOrFunc) => {
    setAgreements(prev => {
      const next = typeof newAgreementsOrFunc === 'function' ? newAgreementsOrFunc(prev) : newAgreementsOrFunc;
      
      if (db && Array.isArray(next)) {
        next.forEach(agreement => {
          if (agreement && agreement.id) {
            const prevAgreement = Array.isArray(prev) ? prev.find(p => p && p.id === agreement.id) : null;
            if (!prevAgreement || JSON.stringify(prevAgreement) !== JSON.stringify(agreement)) {
              setDoc(doc(db, 'agreements', String(agreement.id)), agreement)
                .catch(err => console.error("Error syncing agreement:", err));
            }
          }
        });
        if (Array.isArray(prev)) {
          prev.forEach(prevAgreement => {
            if (prevAgreement && prevAgreement.id) {
              const stillExists = next.some(n => n && n.id === prevAgreement.id);
              if (!stillExists) {
                deleteDoc(doc(db, 'agreements', String(prevAgreement.id)))
                  .catch(err => console.error("Error deleting agreement:", err));
              }
            }
          });
        }
      }
      return next;
    });
  };

  const updateClaims = (newClaimsOrFunc) => {
    setClaims(prev => {
      const next = typeof newClaimsOrFunc === 'function' ? newClaimsOrFunc(prev) : newClaimsOrFunc;
      
      if (db && Array.isArray(next)) {
        next.forEach(claim => {
          if (claim && claim.id) {
            const prevClaim = Array.isArray(prev) ? prev.find(p => p && p.id === claim.id) : null;
            if (!prevClaim || JSON.stringify(prevClaim) !== JSON.stringify(claim)) {
              setDoc(doc(db, 'claims', String(claim.id)), claim)
                .catch(err => console.error("Error syncing claim:", err));
            }
          }
        });
        if (Array.isArray(prev)) {
          prev.forEach(prevClaim => {
            if (prevClaim && prevClaim.id) {
              const stillExists = next.some(n => n && n.id === prevClaim.id);
              if (!stillExists) {
                deleteDoc(doc(db, 'claims', String(prevClaim.id)))
                  .catch(err => console.error("Error deleting claim doc:", err));
              }
            }
          });
        }
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
        if (item && item.name) {
          const safeId = encodeURIComponent(item.name.trim());
          await setDoc(doc(db, 'items', safeId), item);
        }
      }
      
      // Upload Inventory
      for (const lot of inventory) {
        await setDoc(doc(db, 'inventory', String(lot.id)), lot);
      }
      
      // Upload Agreements
      for (const ag of agreements) {
        await setDoc(doc(db, 'agreements', String(ag.id)), ag);
      }
      
      // Upload Claims from local storage
      const savedClaimsText = localStorage.getItem('wms_claims');
      if (savedClaimsText) {
        const savedClaims = JSON.parse(savedClaimsText);
        for (const claim of savedClaims) {
          await setDoc(doc(db, 'claims', String(claim.id)), claim);
        }
      }
      
      if (firebaseConfig && firebaseConfig.projectId) {
        localStorage.setItem('wms_synced_project_id', firebaseConfig.projectId);
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
      localClaims,
      localAgreements: agreements.length
    };
  };

  const handleBackup = () => {
    try {
      const claimsText = localStorage.getItem('wms_claims');
      const claims = claimsText ? JSON.parse(claimsText) : [];

      const backupData = {
        items,
        inventory,
        agreements,
        claims,
        backupVersion: "1.0",
        createdAt: new Date().toISOString()
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `nbc_stock_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed:", error);
      alert("การสำรองข้อมูลล้มเหลว: " + error.message);
    }
  };

  const handleRestore = async (backupData) => {
    if (!backupData || !Array.isArray(backupData.items) || !Array.isArray(backupData.inventory) || !Array.isArray(backupData.agreements)) {
      alert("ไฟล์สำรองข้อมูลไม่ถูกต้อง กรุณาตรวจสอบรูปแบบไฟล์");
      return;
    }

    if (window.confirm("⚠️ คำเตือนการกู้คืนข้อมูล ⚠️\nการกู้คืนข้อมูลจะทำการเขียนทับข้อมูลสินค้า สต็อกสินค้า สัญญา และการเคลม NCP ทั้งหมดปัจจุบันด้วยข้อมูลจากไฟล์สำรอง\n\nหากเชื่อมต่อกับระบบคลาวด์ ข้อมูลออนไลน์จะซิงค์เปลี่ยนตามทันที!\nคุณแน่ใจหรือไม่ที่จะกู้คืนข้อมูล?")) {
      try {
        // Update local React states
        updateItems(backupData.items);
        updateInventory(backupData.inventory);
        updateAgreements(backupData.agreements);

        // Update NCP claims in LocalStorage
        const claims = backupData.claims || [];
        safeSetLocalStorage('wms_claims', JSON.stringify(claims));

        // If cloud database is connected, synchronize claims
        if (db && claims.length > 0) {
          for (const claim of claims) {
            await setDoc(doc(db, 'claims', String(claim.id)), claim);
          }
        }

        if (firebaseConfig && firebaseConfig.projectId) {
          localStorage.setItem('wms_synced_project_id', firebaseConfig.projectId);
        }
        alert("กู้คืนฐานข้อมูลและซิงค์ระบบคลาวด์เรียบร้อยแล้ว!");
      } catch (error) {
        console.error("Restore failed:", error);
        alert("การกู้คืนข้อมูลล้มเหลว: " + error.message);
      }
    }
  };

  const handleResetDatabase = async () => {
    const warningMessage = 
      "⚠️ คำเตือน: คุณกำลังจะทำการล้างข้อมูลระบบทั้งหมด! ⚠️\n\n" +
      "การรีเซ็ตนี้จะลบข้อมูลต่อไปนี้ทั้งหมดอย่างถาวร:\n" +
      "1. ทะเบียนพัสดุ (จะถูกรีเซ็ตกลับเป็นค่าเริ่มต้น)\n" +
      "2. รายการพัสดุในคลังทั้งหมด\n" +
      "3. ประวัติการรับเข้าและการตัดจ่ายทั้งหมด\n" +
      "4. สัญญาจัดซื้อ (Mod 5) ทั้งหมด\n" +
      "5. รายการเคลมสินค้า NCP (Mod 4) ทั้งหมด\n\n" +
      "*** ข้อมูลในฐานข้อมูลคลาวด์ (หากมีการเชื่อมต่อ) จะถูกลบถาวรทันที! ***\n\n" +
      "แนะนำให้คุณทำการสำรองข้อมูล (Download Backup) ไว้ก่อนดำเนินการต่อเพื่อความปลอดภัย\n\n" +
      "คุณยืนยันที่จะทำการล้างข้อมูลทั้งหมดและเริ่มใหม่ใช่หรือไม่?";

    if (window.confirm(warningMessage)) {
      if (window.confirm("🚨 ยืนยันอีกครั้ง: คุณแน่ใจจริงๆ ใช่หรือไม่? ข้อมูลทั้งหมดที่ทำมาจะหายหมดแบบถาวรและไม่สามารถกู้คืนได้ (ยกเว้นมีไฟล์สำรอง) 🚨")) {
        try {
          if (db) {
            // Delete all items from Firestore
            const itemsSnap = await getDocs(collection(db, 'items')).catch(() => null);
            if (itemsSnap) {
              for (const docSnap of itemsSnap.docs) {
                await deleteDoc(doc(db, 'items', docSnap.id)).catch(err => console.error("Error deleting item:", err));
              }
            }

            // Delete all inventory from Firestore
            const invSnap = await getDocs(collection(db, 'inventory')).catch(() => null);
            if (invSnap) {
              for (const docSnap of invSnap.docs) {
                await deleteDoc(doc(db, 'inventory', docSnap.id)).catch(err => console.error("Error deleting inventory:", err));
              }
            }

            // Delete all agreements from Firestore
            const agSnap = await getDocs(collection(db, 'agreements')).catch(() => null);
            if (agSnap) {
              for (const docSnap of agSnap.docs) {
                await deleteDoc(doc(db, 'agreements', docSnap.id)).catch(err => console.error("Error deleting agreement:", err));
              }
            }

            // Delete all claims from Firestore
            const claimsSnap = await getDocs(collection(db, 'claims')).catch(() => null);
            if (claimsSnap) {
              for (const docSnap of claimsSnap.docs) {
                await deleteDoc(doc(db, 'claims', docSnap.id)).catch(err => console.error("Error deleting claim:", err));
              }
            }
          }

          setItems(INITIAL_ITEMS);
          setInventory([]);
          setAgreements([]);
          setClaims([]);
          safeSetLocalStorage('wms_claims', '[]');

          if (firebaseConfig && firebaseConfig.projectId) {
            localStorage.setItem('wms_synced_project_id', firebaseConfig.projectId);
          }
          alert("🎉 รีเซ็ตโปรแกรมและล้างฐานข้อมูลระบบสำเร็จเรียบร้อยแล้ว!");
        } catch (error) {
          console.error("Database reset failed:", error);
          alert("เกิดข้อผิดพลาดในการล้างฐานข้อมูล: " + error.message);
        }
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard inventory={inventory} items={items} claims={claims} agreements={agreements} setActiveTab={setActiveTab} />;
      case 'items':
        return <ProductRegistry items={items} setItems={updateItems} />;
      case 'inventory':
        return <Inventory inventory={inventory} setInventory={updateInventory} items={items} agreements={agreements} />;
      case 'inbound':
        return <Inbound setInventory={updateInventory} items={items} inventory={inventory} agreements={agreements} />;
      case 'withdrawal':
        return <Withdrawal inventory={inventory} setInventory={updateInventory} items={items} agreements={agreements} />;
      case 'analytics':
        return <Analytics inventory={inventory} items={items} agreements={agreements} />;
      case 'ncp':
        return <NCP inventory={inventory} items={items} claims={claims} setClaims={updateClaims} />;
      case 'agreements':
        return <Agreements agreements={agreements} setAgreements={updateAgreements} inventory={inventory} setInventory={updateInventory} items={items} />;
      case 'labels':
        return <StatusLabels inventory={inventory} />;
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
            onBackup={handleBackup}
            onRestore={handleRestore}
            onReset={handleResetDatabase}
          />
        );
      default:
        return <Dashboard inventory={inventory} items={items} claims={claims} agreements={agreements} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <header className="mobile-header glass">
        <button className="menu-toggle-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-logo" onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}>
          <Package size={24} color="var(--accent-color)" />
          <span>NBC STOCK</span>
        </div>
        <div style={{ width: 24 }} /> {/* placeholder for spacing balance */}
      </header>

      {/* Backdrop overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`sidebar glass ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <div className="logo" onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} style={{ cursor: 'pointer', marginBottom: 0 }}>
            <Package size={32} />
            <span>NBC STOCK</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="logo logo-desktop" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <Package size={32} />
          <span>NBC STOCK</span>
        </div>
        
        <nav className="nav-links">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === 'items'} 
            onClick={() => { setActiveTab('items'); setIsMobileMenuOpen(false); }}
            icon={<Package size={20} />}
            label="ทะเบียนพัสดุ"
          />
          <NavItem 
            active={activeTab === 'inventory'} 
            onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }}
            icon={<History size={20} />}
            label="คลังพัสดุ"
          />
          <NavItem 
            active={activeTab === 'inbound'} 
            onClick={() => { setActiveTab('inbound'); setIsMobileMenuOpen(false); }}
            icon={<Plus size={20} />}
            label="รับเข้า"
          />
          <NavItem 
            active={activeTab === 'withdrawal'} 
            onClick={() => { setActiveTab('withdrawal'); setIsMobileMenuOpen(false); }}
            icon={<MinusCircle size={20} />}
            label="การตัดจ่าย"
          />
          <NavItem 
            active={activeTab === 'analytics'} 
            onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
            icon={<BarChart3 size={20} />}
            label="วิเคราะห์ Stock"
          />
          <NavItem 
            active={activeTab === 'ncp'} 
            onClick={() => { setActiveTab('ncp'); setIsMobileMenuOpen(false); }}
            icon={<AlertOctagon size={20} />}
            label="เคลมสินค้า NCP"
          />
          <NavItem 
            active={activeTab === 'agreements'} 
            onClick={() => { setActiveTab('agreements'); setIsMobileMenuOpen(false); }}
            icon={<ClipboardList size={20} />}
            label="สัญญาจัดซื้อ"
          />
          <NavItem 
            active={activeTab === 'labels'} 
            onClick={() => { setActiveTab('labels'); setIsMobileMenuOpen(false); }}
            icon={<Tag size={20} />}
            label="พิมพ์ป้ายสถานะ"
          />
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            icon={<Settings size={20} />} 
            label="ตั้งค่าแชร์คลาวด์" 
          />
        </div>
      </aside>

      <main className="main-content">
        <ErrorBoundary>{renderContent()}</ErrorBoundary>
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

const formatThaiDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  const thaiYear = parseInt(yyyy, 10) + 543;
  return `${dd}/${mm}/${thaiYear}`;
};

const Dashboard = ({ inventory, items, claims, agreements = [], setActiveTab }) => {
  // 1. Calculate Core Operational Stats
  const activeLots = useMemo(() => inventory.filter(i => !i.isCancelled), [inventory]);
  
  const totalPhysicalUnits = useMemo(() => {
    return activeLots.reduce((sum, l) => sum + Number(l.remainingQty || 0), 0);
  }, [activeLots]);

  const uniqueSkusCount = useMemo(() => {
    const fromItems = items ? items.map(i => i.name) : [];
    const fromInv = activeLots.map(l => l.itemName);
    return new Set([...fromItems, ...fromInv].filter(Boolean)).size;
  }, [items, activeLots]);

  const passLots = useMemo(() => activeLots.filter(i => i.qcStatus === 'Pass'), [activeLots]);
  const passTotalUnits = useMemo(() => passLots.reduce((sum, l) => sum + Number(l.remainingQty || 0), 0), [passLots]);

  const quarantineLots = useMemo(() => activeLots.filter(i => i.qcStatus === 'Quarantine'), [activeLots]);
  const pendingAcceptanceLots = useMemo(() => activeLots.filter(i => i.acceptanceStatus === 'Pending'), [activeLots]);

  const activeClaims = useMemo(() => (claims || []).filter(c => c.status !== 'Returned'), [claims]);
  const rejectLots = useMemo(() => activeLots.filter(i => i.qcStatus === 'Reject'), [activeLots]);

  // Today's Activity metrics
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayInboundCount = useMemo(() => {
    return activeLots.filter(l => l.date === todayStr || (l.createdAt && l.createdAt.startsWith(todayStr))).length;
  }, [activeLots, todayStr]);

  const todayWithdrawalCount = useMemo(() => {
    return activeLots.reduce((count, lot) => {
      const withs = (lot.withdrawals || []).filter(w => !w.isCancelled && (w.date === todayStr || (w.createdAt && w.createdAt.startsWith(todayStr))));
      return count + withs.length;
    }, 0);
  }, [activeLots, todayStr]);

  // 2. Upcoming Tentative Deliveries from Agreements
  const upcomingDeliveries = useMemo(() => {
    if (!agreements || agreements.length === 0) return [];
    
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    agreements.forEach(ag => {
      if (ag.status === 'Completed') return;
      const schedules = ag.tentativeSchedule || [];
      
      // Calculate fulfilled quantities per item for this agreement
      const deliveries = inventory.filter(lot => lot.agreementId === ag.id && !lot.isCancelled && lot.acceptanceStatus === 'Accepted');
      const deliveredMap = {};
      deliveries.forEach(lot => {
        const item = lot.itemName || 'default';
        deliveredMap[item] = (deliveredMap[item] || 0) + Number(lot.quantity || 0);
      });

      // Sort and accumulate tentative rounds
      const sortedRounds = [...schedules].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
      const cumulativePlanned = {};

      sortedRounds.forEach((round, rIdx) => {
        const itemName = round.itemName || (ag.itemsList && ag.itemsList[0] ? ag.itemsList[0].itemName : (ag.itemName || ''));
        const plannedQty = Number(round.quantity || 0);
        const prevCumulative = cumulativePlanned[itemName] || 0;
        const currentCumulative = prevCumulative + plannedQty;
        cumulativePlanned[itemName] = currentCumulative;

        const totalAccepted = deliveredMap[itemName] || 0;
        let isDone = false;
        let isPartial = false;
        let fulfilledQty = 0;

        if (totalAccepted >= currentCumulative) {
          isDone = true;
          fulfilledQty = plannedQty;
        } else if (totalAccepted > prevCumulative) {
          isPartial = true;
          fulfilledQty = totalAccepted - prevCumulative;
        }

        if (!isDone) {
          let daysDiff = null;
          if (round.date) {
            const targetD = new Date(round.date + 'T00:00:00');
            daysDiff = Math.round((targetD - today) / (1000 * 60 * 60 * 24));
          }

          list.push({
            id: round.id || `${ag.id}-${rIdx}`,
            agreementId: ag.id,
            supplier: ag.supplier || '-',
            round: round.round || (rIdx + 1),
            date: round.date,
            itemName,
            quantity: plannedQty,
            unit: round.unit || 'ชิ้น',
            fulfilledQty,
            isPartial,
            daysDiff,
            remarks: round.remarks || ''
          });
        }
      });
    });

    // Sort by date ascending (overdue first, then soonest upcoming)
    return list.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    }).slice(0, 5);
  }, [agreements, inventory]);

  // 3. Stock Status Alerts (Out of Stock & Low Stock Prediction)
  const alerts = useMemo(() => {
    const outOfStockList = [];
    const lowStockList = [];

    if (!items || items.length === 0) return { outOfStockList, lowStockList };

    items.forEach(item => {
      const itemLots = activeLots.filter(l => l.itemName === item.name);
      const totalQty = itemLots.reduce((sum, l) => sum + Number(l.remainingQty || 0), 0);
      const withdrawals = itemLots.flatMap(l => (l.withdrawals || []).filter(w => !w.isCancelled));
      const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);

      if (totalQty === 0) {
        if (totalWithdrawn > 0) {
          outOfStockList.push({
            name: item.name,
            unit: item.unit || 'ชิ้น'
          });
        }
      } else {
        let daysRemaining = null;

        if (withdrawals.length > 0) {
          const dates = withdrawals.map(w => new Date(w.date).getTime()).filter(t => !isNaN(t));
          if (dates.length > 0) {
            const minDate = Math.min(...dates);
            const minDateObj = new Date(minDate);
            minDateObj.setHours(0, 0, 0, 0);

            const todayObj = new Date();
            todayObj.setHours(0, 0, 0, 0);

            const diffTime = todayObj.getTime() - minDateObj.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const activeDays = Math.max(1, diffDays + 1);

            const dailyRate = totalWithdrawn / activeDays;
            if (dailyRate > 0) {
              daysRemaining = Math.ceil(totalQty / dailyRate);
            }
          }
        }

        if (daysRemaining !== null && daysRemaining <= 14) {
          lowStockList.push({
            name: item.name,
            qty: totalQty,
            unit: item.unit || 'ชิ้น',
            daysRemaining,
            reasonType: 'prediction'
          });
        } else if (daysRemaining === null && totalQty <= 200) {
          lowStockList.push({
            name: item.name,
            qty: totalQty,
            unit: item.unit || 'ชิ้น',
            daysRemaining: null,
            reasonType: 'lowQty'
          });
        }
      }
    });

    return { outOfStockList, lowStockList };
  }, [activeLots, items]);

  // 4. NCP Active Claims needing follow-up
  const ncpFollowUps = useMemo(() => {
    if (!claims || claims.length === 0) return [];
    return claims
      .filter(c => c.status !== 'Returned' && c.followUpDate)
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
      .slice(0, 5);
  }, [claims]);

  // 5. Recent Inbound Entries
  const recentEntries = useMemo(() => {
    return [...activeLots]
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 5);
  }, [activeLots]);

  // 6. Top 5 Fast-Moving Items (Most Withdrawn in last 30 days)
  const topFastMovingItems = useMemo(() => {
    const usageMap = {};
    activeLots.forEach(lot => {
      (lot.withdrawals || []).forEach(w => {
        if (!w.isCancelled) {
          const item = lot.itemName || 'Unknown';
          const unit = lot.unit || 'ชิ้น';
          if (!usageMap[item]) {
            usageMap[item] = { name: item, unit, totalAmount: 0, count: 0 };
          }
          usageMap[item].totalAmount += Number(w.amount || 0);
          usageMap[item].count += 1;
        }
      });
    });

    const list = Object.values(usageMap).sort((a, b) => b.totalAmount - a.totalAmount);
    const maxAmount = list.length > 0 ? list[0].totalAmount : 1;

    return list.slice(0, 5).map((item, idx) => ({
      ...item,
      rank: idx + 1,
      percentage: Math.min(100, Math.round((item.totalAmount / maxAmount) * 100))
    }));
  }, [activeLots]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header & Quick Action Bar */}
      <div className="glass card" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(15, 23, 42, 0.6))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <LayoutDashboard size={26} color="var(--accent-secondary)" /> Dashboard
            </h1>
            <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
              ศูนย์กลางควบคุมคลังสินค้า ตรวจสอบความเคลื่อนไหว และการแจ้งเตือนแบบเรียลไทม์
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              📥 วันนี้รับเข้า: <strong style={{ color: todayInboundCount > 0 ? '#10b981' : 'var(--text-primary)' }}>{todayInboundCount}</strong> รายการ
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              📤 วันนี้เบิกจ่าย: <strong style={{ color: todayWithdrawalCount > 0 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>{todayWithdrawalCount}</strong> รายการ
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.9rem', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={() => setActiveTab('inbound')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--accent-secondary)' }}
          >
            <Plus size={15} /> บันทึกรับเข้าพัสดุ
          </button>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => setActiveTab('withdrawal')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}
          >
            <MinusCircle size={15} color="var(--accent-color)" /> บันทึกเบิกจ่าย
          </button>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => setActiveTab('agreements')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Calendar size={15} color="#06b6d4" /> สัญญา & แผนส่งมอบ
          </button>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => setActiveTab('ncp')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ShieldAlert size={15} color="#ef4444" /> บันทึกเคลม NCP
          </button>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => setActiveTab('inventory')}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Package size={15} color="#10b981" /> ตรวจเช็กสต็อก
          </button>
        </div>
      </div>
      
      {/* 4 Enhanced KPI Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Card 1: Total SKUs & Units */}
        <div 
          className="stat-card glass" 
          onClick={() => setActiveTab('inventory')}
          style={{ borderTop: '4px solid var(--accent-secondary)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          title="คลิกเพื่อดูรายการสินค้าในคลังทั้งหมด"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">สินค้าคงคลังทั้งหมด</div>
            <Package size={18} color="var(--accent-secondary)" />
          </div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            {uniqueSkusCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>ชนิดสินค้า</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            ยอดคงเหลือรวม: <strong style={{ color: 'var(--text-primary)' }}>{totalPhysicalUnits.toLocaleString()}</strong> ชิ้น ({activeLots.length} Lots)
          </div>
        </div>

        {/* Card 2: Pass QC */}
        <div 
          className="stat-card glass" 
          onClick={() => setActiveTab('inventory')}
          style={{ borderTop: '4px solid var(--success)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          title="คลิกเพื่อดูรายการที่พร้อมใช้งาน"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">พร้อมใช้งาน (Pass QC)</div>
            <CheckCircle2 size={18} color="var(--success)" />
          </div>
          <div className="stat-value" style={{ color: '#10b981', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            {passLots.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Lots</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            จำนวนที่พร้อมเบิก: <strong style={{ color: '#10b981' }}>{passTotalUnits.toLocaleString()}</strong> ชิ้น
          </div>
        </div>

        {/* Card 3: Quarantine & Pending Acceptance */}
        <div 
          className="stat-card glass" 
          onClick={() => setActiveTab('inbound')}
          style={{ borderTop: '4px solid var(--quarantine)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          title="คลิกเพื่อไปที่หน้ารับเข้า/ตรวจรับสินค้า"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">รอผล QC / รอตรวจรับ</div>
            <Clock size={18} color="var(--quarantine)" />
          </div>
          <div className="stat-value" style={{ color: '#f59e0b', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            {quarantineLots.length + pendingAcceptanceLots.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Lots</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            กักกัน (Quarantine): <strong>{quarantineLots.length}</strong> | รอตรวจรับ: <strong>{pendingAcceptanceLots.length}</strong>
          </div>
        </div>

        {/* Card 4: NCP & Reject */}
        <div 
          className="stat-card glass" 
          onClick={() => setActiveTab('ncp')}
          style={{ borderTop: '4px solid var(--danger)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          title="คลิกเพื่อไปที่ระบบติดตามงานเคลม NCP"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">งานเคลม NCP / ไม่ผ่าน</div>
            <ShieldAlert size={18} color="var(--danger)" />
          </div>
          <div className="stat-value" style={{ color: '#ef4444', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            {activeClaims.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>งานเคลม</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            ติดตามเคลม: <strong>{activeClaims.length}</strong> | ตรวจไม่ผ่าน (Reject): <strong>{rejectLots.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left Column (Inbound & Deliveries) vs Right Column (Alerts & Top Usage) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Widget: Upcoming Tentative Deliveries from Agreements */}
          <div className="glass card" style={{ borderLeft: '4px solid #06b6d4', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#06b6d4' }}>
                  <Truck size={18} /> แผนการส่งมอบสินค้าเร็วๆ นี้ (Tentative Deliveries)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  งวดส่งมอบพัสดุตามสัญญาจัดซื้อที่ใกล้ถึงกำหนด
                </span>
              </div>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} 
                onClick={() => setActiveTab('agreements')}
              >
                ดูสัญญาทั้งหมด <ArrowUpRight size={13} />
              </button>
            </div>

            {upcomingDeliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                ไม่มีกำหนดการส่งมอบตามสัญญาที่ค้างอยู่ในช่วงนี้
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {upcomingDeliveries.map((item) => {
                  const isOverdue = item.daysDiff !== null && item.daysDiff < 0;
                  const isToday = item.daysDiff === 0;

                  return (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.7rem 0.85rem', 
                        borderRadius: '8px', 
                        background: isOverdue ? 'rgba(239, 68, 68, 0.06)' : 'rgba(6, 182, 212, 0.05)', 
                        border: isOverdue ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(6, 182, 212, 0.15)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={item.itemName}>
                            {item.itemName}
                          </span>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                            สัญญา: {item.agreementId}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ผู้ขาย: {item.supplier} | รอบที่ {item.round} {item.remarks ? `(${item.remarks})` : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                          {item.quantity.toLocaleString()} {item.unit}
                        </div>
                        <div>
                          {isOverdue ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <AlertTriangle size={11} /> เกินกำหนด ({Math.abs(item.daysDiff)} วัน)
                            </span>
                          ) : isToday ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              ⚡ กำหนดส่งวันนี้!
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              📅 {formatThaiDate(item.date)} (อีก {item.daysDiff} วัน)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget: Recent Inbound Entries */}
          <div className="glass card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} color="var(--accent-secondary)" /> รายการรับเข้าล่าสุด (Recent Inbound)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>พัสดุที่รับเข้าคลังล่าสุด 5 รายการ</span>
              </div>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} 
                onClick={() => setActiveTab('inventory')}
              >
                ดูสต็อกทั้งหมด <ArrowUpRight size={13} />
              </button>
            </div>

            {recentEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ไม่มีข้อมูลพัสดุรับเข้า</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {recentEntries.map(item => (
                  <div key={item.id} className="glass" style={{ padding: '0.8rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.itemName}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                          ({item.quantity} {item.unit || 'ชิ้น'})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Lot: <strong>{item.supplierLot}</strong> {item.inhouseLot ? `| QC Lot: ${item.inhouseLot}` : ''} | {formatDateToDDMMYYYY(item.date)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className={`status-badge status-${(item.qcStatus || 'pass').toLowerCase()}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                        {item.qcStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Widget: Smart Alert Center */}
          <div className="glass card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
              <PackageOpen size={18} /> ศูนย์รวมการแจ้งเตือนด่วน (Alert Center)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Alert 1: Out of Stock */}
              {alerts.outOfStockList.length > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.06)', borderLeft: '4px solid #ef4444', borderRadius: '6px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertOctagon size={15} /> สินค้าตัดหมดคลังแล้ว ({alerts.outOfStockList.length})
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('agreements')}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.72rem', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                    >
                      สั่งซื้อเพิ่ม ↗
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
                    {alerts.outOfStockList.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{item.name}</span>
                        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.7rem' }}>0 {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert 2: Low Stock Prediction */}
              {alerts.lowStockList.length > 0 && (
                <div style={{ background: 'rgba(245, 158, 11, 0.06)', borderLeft: '4px solid #f59e0b', borderRadius: '6px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Package size={15} /> ควรเตรียมสั่งซื้อสินค้า ({alerts.lowStockList.length})
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('agreements')}
                      style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '0.72rem', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                    >
                      เปิดสัญญา ↗
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {alerts.lowStockList.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>คงเหลือ: <strong>{item.qty}</strong> {item.unit}</div>
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {item.reasonType === 'prediction' ? `หมดใน ${item.daysRemaining} วัน` : 'เหลือน้อย'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert 3: NCP Claims Follow-up */}
              {ncpFollowUps.length > 0 && (
                <div style={{ background: 'rgba(2, 132, 199, 0.06)', borderLeft: '4px solid var(--accent-secondary)', borderRadius: '6px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={15} /> ติดตามงานเคลม NCP ({ncpFollowUps.length})
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('ncp')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.72rem', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                    >
                      จัดการเคลม ↗
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {ncpFollowUps.map((claim) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const followUp = new Date(claim.followUpDate);
                      followUp.setHours(0, 0, 0, 0);
                      const isOverdue = followUp < today;

                      return (
                        <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{claim.itemName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>จำนวน: {claim.quantity} {claim.unit || 'ชิ้น'} | Lot: {claim.lotNo || '-'}</div>
                          </div>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isOverdue ? '#ef4444' : 'var(--accent-secondary)' }}>
                            {isOverdue ? `เกินนัด: ${formatThaiDate(claim.followUpDate)}` : formatThaiDate(claim.followUpDate)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state when everything is normal */}
              {alerts.outOfStockList.length === 0 && alerts.lowStockList.length === 0 && ncpFollowUps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                  <ShieldCheck size={28} color="#10b981" style={{ marginBottom: '0.4rem' }} />
                  <div style={{ fontWeight: 600, color: '#10b981', fontSize: '0.85rem' }}>ระบบและระดับสต็อกอยู่ในเกณฑ์ปกติ</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>ไม่พบรายการพัสดุขาดแคลนหรืองานเคลมที่ต้องติดตามด่วน</div>
                </div>
              )}
            </div>
          </div>

          {/* Widget: Top Fast-Moving Items (Most Withdrawn) */}
          <div className="glass card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                  <Flame size={18} /> สินค้าเบิกใช้สูงสุด (Top Fast-Moving)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>สินค้าที่มีอัตราการเบิกใช้งานสูงสุด</span>
              </div>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} 
                onClick={() => setActiveTab('analytics')}
              >
                กราฟวิเคราะห์ ↗
              </button>
            </div>

            {topFastMovingItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ยังไม่มีประวัติการเบิกจ่ายสินค้า
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {topFastMovingItems.map(item => (
                  <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ 
                          width: '18px', 
                          height: '18px', 
                          borderRadius: '50%', 
                          background: item.rank === 1 ? '#f59e0b' : item.rank === 2 ? '#94a3b8' : item.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.1)', 
                          color: item.rank <= 3 ? '#000' : 'var(--text-primary)', 
                          fontSize: '0.68rem', 
                          fontWeight: 700, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          {item.rank}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.totalAmount.toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{item.unit}</span>
                      </span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #eab308)', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;
