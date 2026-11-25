import React from 'react';
import { LogOut, ShieldCheck, UserCheck, User } from 'lucide-react';
import { logoutFirebase } from '../firebase';

const UserProfileBar = ({ currentUser, isAdmin, onLogout }) => {
  if (!currentUser) return null;

  const handleLogout = async () => {
    if (window.confirm("คุณต้องการออกจากระบบหรือไม่?")) {
      await logoutFirebase();
      if (onLogout) onLogout();
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.6rem',
      padding: '0.65rem 0.8rem',
      background: 'rgba(30, 41, 59, 0.65)',
      borderRadius: '10px',
      border: '1px solid var(--glass-border)',
      margin: '0 0.8rem 0.8rem 0.8rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
        {currentUser.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt={currentUser.displayName || 'User'} 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: isAdmin ? '2px solid #f59e0b' : '2px solid #0ea5e9',
              flexShrink: 0
            }} 
          />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            flexShrink: 0
          }}>
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User size={16} />}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'left' }}>
          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px'
          }}>
            {currentUser.displayName || currentUser.email.split('@')[0]}
          </span>

          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.2rem', 
            fontSize: '0.65rem', 
            fontWeight: 600,
            color: isAdmin ? '#fbbf24' : '#38bdf8' 
          }}>
            {isAdmin ? (
              <>
                <ShieldCheck size={11} color="#fbbf24" /> ผู้ดูแลระบบ (Admin)
              </>
            ) : (
              <>
                <UserCheck size={11} color="#38bdf8" /> เจ้าหน้าที่ (Staff)
              </>
            )}
          </span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        title="ออกจากระบบ"
        style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#f87171',
          padding: '0.4rem',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
      >
        <LogOut size={15} />
      </button>
    </div>
  );
};

export default UserProfileBar;