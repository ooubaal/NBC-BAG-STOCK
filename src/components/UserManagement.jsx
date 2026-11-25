import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  UserPlus, 
  Loader2, 
  RefreshCw,
  Mail,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

const UserManagement = ({ db, currentUser, isAdmin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'admin'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Subscribe to users collection in real time
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ ...data, id: docSnap.id });
      });
      // Sort: Pending first, then by createdAt desc
      list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        const timeA = new Date(a.createdAt || a.approvedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.approvedAt || 0).getTime();
        return timeB - timeA;
      });
      setUsers(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to users collection:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const pending = users.filter(u => u.status === 'pending').length;
    const approved = users.filter(u => u.status === 'approved').length;
    const admins = users.filter(u => u.role === 'admin' && u.status === 'approved').length;
    const staff = users.filter(u => u.role === 'staff' && u.status === 'approved').length;
    return { total, pending, approved, admins, staff };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        String(u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;

      if (activeFilter === 'pending') return u.status === 'pending';
      if (activeFilter === 'approved') return u.status === 'approved';
      if (activeFilter === 'admin') return u.role === 'admin' && u.status === 'approved';
      return true;
    });
  }, [users, searchTerm, activeFilter]);

  // Action handlers
  const handleApprove = async (user, role = 'staff') => {
    if (!db) return;
    setActionLoadingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        status: 'approved',
        role: role,
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.email || 'admin'
      });
    } catch (err) {
      console.error("Approve failed:", err);
      alert("เกิดข้อผิดพลาดในการอนุมัติ: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (user, newRole) => {
    if (!db) return;
    if (user.email === currentUser?.email) {
      alert("คุณไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้ เพื่อความปลอดภัย");
      return;
    }
    setActionLoadingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        role: newRole,
        roleUpdatedAt: new Date().toISOString(),
        roleUpdatedBy: currentUser?.email || 'admin'
      });
    } catch (err) {
      console.error("Change role failed:", err);
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBlock = async (user) => {
    if (!db) return;
    if (user.email === currentUser?.email) {
      alert("คุณไม่สามารถระงับสิทธิ์บัญชีของตนเองได้");
      return;
    }
    const isBlocking = user.status !== 'blocked';
    const confirmMsg = isBlocking 
      ? `คุณต้องการ "ระงับสิทธิ์" ของ ${user.displayName || user.email} ใช่หรือไม่? (ผู้ใช้จะไม่สามารถเข้าดูสต็อกได้)`
      : `คุณต้องการ "ปลดระงับสิทธิ์" ให้ ${user.displayName || user.email} กลับมาใช้งานได้ใช่หรือไม่?`;
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        status: isBlocking ? 'blocked' : 'approved',
        blockedAt: isBlocking ? new Date().toISOString() : null,
        blockedBy: isBlocking ? currentUser?.email : null
      });
    } catch (err) {
      console.error("Toggle block failed:", err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!db) return;
    if (user.email === currentUser?.email) {
      alert("คุณไม่สามารถลบบัญชีของตนเองได้");
      return;
    }
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการ "ลบผู้ใช้" ${user.displayName || user.email} ออกจากระบบอย่างถาวร?`)) {
      return;
    }

    setActionLoadingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      await deleteDoc(userRef);
    } catch (err) {
      console.error("Delete user failed:", err);
      alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={26} color="var(--accent-secondary)" />
          จัดการผู้ใช้งานและกำหนดสิทธิ์ (User Management)
        </h1>
        <p className="page-subtitle">
          อนุมัติคำขอเข้าใช้งานใหม่ มอบหมายสิทธิ์ Admin/Staff และควบคุมความปลอดภัยคลังพัสดุ
        </p>
      </div>

      {/* Statistics Bar */}
      <div className="grid-responsive-4col" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div className="glass card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #0ea5e9' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color="#0ea5e9" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ผู้ใช้งานทั้งหมด</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}</div>
          </div>
        </div>

        <div className="glass card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>รอการอนุมัติ (Pending)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stats.pending > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
              {stats.pending}
            </div>
          </div>
        </div>

        <div className="glass card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ผู้ดูแลระบบ (Admins)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{stats.admins}</div>
          </div>
        </div>

        <div className="glass card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>เจ้าหน้าที่ (Staff)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6' }}>{stats.staff}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="glass card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveFilter('all')}
              className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              ทั้งหมด ({stats.total})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`btn ${activeFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.45rem 1rem', 
                fontSize: '0.82rem',
                position: 'relative',
                borderColor: stats.pending > 0 ? '#f59e0b' : undefined,
                color: stats.pending > 0 && activeFilter !== 'pending' ? '#f59e0b' : undefined
              }}
            >
              รออนุมัติ ({stats.pending})
              {stats.pending > 0 && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  display: 'inline-block',
                  marginLeft: '0.4rem'
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveFilter('approved')}
              className={`btn ${activeFilter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              อนุมัติแล้ว ({stats.approved})
            </button>
            <button
              onClick={() => setActiveFilter('admin')}
              className={`btn ${activeFilter === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              ผู้ดูแลระบบ ({stats.admins})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ค้นหาตามชื่อ หรืออีเมล..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.8rem 0.5rem 2.2rem',
                fontSize: '0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={30} className="spin" style={{ margin: '0 auto 0.75rem auto' }} color="var(--accent-secondary)" />
            <p>กำลังโหลดรายชื่อผู้ใช้งาน...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>ไม่พบรายชื่อผู้ใช้งานที่ตรงตามเงื่อนไข</p>
            {activeFilter === 'pending' && (
              <p style={{ fontSize: '0.82rem', marginTop: '0.3rem', color: 'var(--success)' }}>
                ยอดเยี่ยม! ไม่มีผู้ใช้ใหม่ที่ค้างรอการอนุมัติในขณะนี้
              </p>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.75)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.9rem 1.25rem' }}>ผู้ใช้งาน</th>
                  <th style={{ padding: '0.9rem 1rem' }}>อีเมล</th>
                  <th style={{ padding: '0.9rem 1rem' }}>สถานะ</th>
                  <th style={{ padding: '0.9rem 1rem' }}>สิทธิ์ (Role)</th>
                  <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isCurrent = user.email === currentUser?.email;
                  const isLoading = actionLoadingId === user.id;

                  return (
                    <tr 
                      key={user.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: user.status === 'pending' ? 'rgba(245, 158, 11, 0.04)' : undefined,
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* Name & Photo */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt={user.displayName} 
                              style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: user.role === 'admin' ? '2px solid #f59e0b' : '2px solid #0ea5e9'
                              }} 
                            />
                          ) : (
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: user.role === 'admin' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.9rem'
                            }}>
                              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}

                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{user.displayName || 'ไม่ระบุชื่อ'}</span>
                              {isCurrent && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '0.1rem 0.4rem',
                                  background: 'rgba(2, 132, 199, 0.15)',
                                  color: '#38bdf8',
                                  borderRadius: '10px',
                                  fontWeight: 600
                                }}>
                                  (บัญชีของคุณ)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              สมัครเมื่อ: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                          {user.email}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {user.status === 'approved' && (
                          <span className="status-badge status-pass" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700 }}>
                            <CheckCircle2 size={12} /> อนุมัติแล้ว
                          </span>
                        )}
                        {user.status === 'pending' && (
                          <span className="status-badge status-quarantine" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: '#f59e0b' }}>
                            <Clock size={12} /> รอการอนุมัติ
                          </span>
                        )}
                        {user.status === 'blocked' && (
                          <span className="status-badge status-reject" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700 }}>
                            <XCircle size={12} /> ระงับสิทธิ์
                          </span>
                        )}
                      </td>

                      {/* Role Dropdown */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {user.status === 'pending' ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>รอกำหนดสิทธิ์</span>
                        ) : (
                          <select
                            value={user.role || 'staff'}
                            onChange={(e) => handleChangeRole(user, e.target.value)}
                            disabled={isCurrent || isLoading}
                            style={{
                              padding: '0.35rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              background: user.role === 'admin' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                              color: user.role === 'admin' ? '#fbbf24' : '#38bdf8',
                              border: user.role === 'admin' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(14, 165, 233, 0.4)',
                              cursor: isCurrent ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <option value="staff" style={{ background: '#1e293b', color: '#fff' }}>👤 เจ้าหน้าที่ (Staff)</option>
                            <option value="admin" style={{ background: '#1e293b', color: '#fbbf24' }}>🛡️ ผู้ดูแลระบบ (Admin)</option>
                          </select>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        {isLoading ? (
                          <Loader2 size={16} className="spin" color="var(--accent-secondary)" style={{ display: 'inline-block' }} />
                        ) : user.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleApprove(user, 'staff')}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#0284c7' }}
                              title="อนุมัติให้เป็นเจ้าหน้าที่ทั่วไป"
                            >
                              <UserCheck size={14} /> อนุมัติ (Staff)
                            </button>
                            <button
                              onClick={() => handleApprove(user, 'admin')}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                              title="อนุมัติให้เป็นผู้ดูแลระบบ"
                            >
                              <ShieldCheck size={14} /> เป็น Admin
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              title="ปฏิเสธคำขอและลบทิ้ง"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {!isCurrent && (
                              <>
                                <button
                                  onClick={() => handleToggleBlock(user)}
                                  className="btn btn-secondary"
                                  style={{ 
                                    padding: '0.35rem 0.6rem', 
                                    fontSize: '0.75rem',
                                    color: user.status === 'blocked' ? '#10b981' : '#f59e0b',
                                    borderColor: user.status === 'blocked' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                                  }}
                                  title={user.status === 'blocked' ? "ปลดบล็อกผู้ใช้" : "ระงับสิทธิ์ชั่วคราว"}
                                >
                                  {user.status === 'blocked' ? <CheckCircle2 size={14} /> : <UserX size={14} />}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                  title="ลบผู้ใช้ถาวร"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;