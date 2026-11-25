import React, { useState } from 'react';
import { Package, ShieldCheck, AlertCircle, Loader2, Database, KeyRound } from 'lucide-react';
import { loginWithGoogle } from '../firebase';

const LoginModal = ({ isOpen, onLoginSuccess, onOpenSettings, isFirebaseConfigured }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('หน้าต่างเข้าสู่ระบบถูกปิด กรุณาลองใหม่อีกครั้ง');
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        setError('ยังไม่ได้เปิดใช้งาน Google Sign-In ใน Firebase Console กรุณาไปเปิดใช้งานในเมนู Authentication ก่อน');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication (ไปที่ Authentication > Settings > Authorized domains เพื่อเพิ่มโดเมน)');
      } else {
        setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div className="glass card fade-in" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        borderRadius: '16px'
      }}>
        {/* Brand Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--accent-secondary), #0284c7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)'
        }}>
          <Package size={34} color="#ffffff" />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
          NBC STOCK
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--accent-secondary)', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
          ระบบบริหารจัดการคลังพัสดุอัจฉริยะ
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1.75rem 0' }}>
          ศูนย์บริการโลหิตแห่งชาติ สภากาชาดไทย
        </p>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            color: '#f87171',
            fontSize: '0.82rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button: Google Sign-In or Configure Settings */}
        {isFirebaseConfigured ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: '#ffffff',
                color: '#1f2937',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" color="#0284c7" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  {/* Google SVG G-Logo */}
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>เข้าสู่ระบบด้วย Google</span>
                </>
              )}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              marginTop: '0.5rem'
            }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>ระบบรักษาความปลอดภัย: ยืนยันตัวตนก่อนเข้าถึงสต็อกพัสดุ</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              color: 'var(--accent-color)',
              fontSize: '0.82rem',
              lineHeight: 1.4
            }}>
              ยังไม่ได้ระบุรหัสเชื่อมต่อ Firebase ของศูนย์บริการโลหิตฯ
            </div>

            <button
              onClick={onOpenSettings}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem'
              }}
            >
              <Database size={18} />
              <span>ไปที่หน้าตั้งค่าคลาวด์ (Cloud Settings)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginModal;