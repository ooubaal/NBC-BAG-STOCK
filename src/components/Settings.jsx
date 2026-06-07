import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, Key, Save, RefreshCw, LogOut, Info, AlertOctagon } from 'lucide-react';

const Settings = ({ config, onSaveConfig, onDisconnect, onMigrate, syncStats, isMigrating, onBackup, onRestore, onReset }) => {
  const [rawConfigInput, setRawConfigInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passError, setPassError] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === '5640502') {
      setIsAuthorized(true);
      setPassError('');
    } else {
      setPassError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      setPasswordInput('');
    }
  };

  const parseFirebaseConfig = (text) => {
    // 1. Clean and sanitize input text first to handle common mobile typing/copy-paste errors
    let cleaned = text.trim();
    // Replace all smart quotes (curly quotes) with standard double quotes
    cleaned = cleaned.replace(/[\u201C\u201D\u2018\u2019]/g, '"');
    // Replace multiple double quotes (like "" or """) with a single double quote
    cleaned = cleaned.replace(/""+/g, '"');
    // Replace multiple single quotes (like '' or ''') with a single double quote
    cleaned = cleaned.replace(/''+/g, '"');
    // Normalize any remaining single quotes to double quotes
    cleaned = cleaned.replace(/'/g, '"');

    try {
      // Find JSON/JS Object inside text using regex
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("ไม่พบรูปแบบเครื่องหมายปีกกา { ... }");
      }
      
      const jsonLikeText = match[0]
        .replace(/"?([a-zA-Z0-9]+)"?\s*:/g, '"$1":') // Wrap keys in double quotes, handling keys that are already quoted
        .replace(/,(\s*[\}\]])/g, '$1');   // Remove trailing commas

      const parsed = JSON.parse(jsonLikeText);
      
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error("ต้องมีฟิลด์ apiKey และ projectId เป็นอย่างน้อย");
      }
      
      return parsed;
    } catch (e) {
      console.error("JSON parsing failed, attempting regex fallback:", e);
      // Fallback: try extraction via simple regex on the cleaned text
      const extractField = (field, source) => {
        // Since we sanitized all quotes to standard double quotes, regex is much simpler
        const regex = new RegExp(`"?${field}"?\\s*:\\s*"([^"]+)"`);
        const m = source.match(regex);
        return m ? m[1] : null;
      };

      const apiKey = extractField('apiKey', cleaned);
      const projectId = extractField('projectId', cleaned);
      const authDomain = extractField('authDomain', cleaned);
      const storageBucket = extractField('storageBucket', cleaned);
      const messagingSenderId = extractField('messagingSenderId', cleaned);
      const appId = extractField('appId', cleaned);

      if (apiKey && projectId) {
        return { apiKey, projectId, authDomain, storageBucket, messagingSenderId, appId };
      }
      
      throw new Error("ไม่สามารถวิเคราะห์รูปแบบไฟล์ได้ กรุณาก๊อปปี้มาทั้งบล็อก firebaseConfig");
    }
  };

  const handleSave = () => {
    setErrorMsg('');
    if (!rawConfigInput.trim()) {
      setErrorMsg('กรุณากรอกรหัสการตั้งค่า Firebase');
      return;
    }

    try {
      const parsedConfig = parseFirebaseConfig(rawConfigInput);
      onSaveConfig(parsedConfig);
      setRawConfigInput('');
    } catch (e) {
      setErrorMsg(e.message || 'รูปแบบไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="glass card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Key size={30} color="var(--accent-color)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>จำเป็นต้องระบุรหัสผ่าน</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>กรุณากรอกรหัสผ่านเพื่อเข้าสู่โมดูลตั้งค่าแชร์คลาวด์</p>
          
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password"
              placeholder="กรอกรหัสผ่าน..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ textAlign: 'center', letterSpacing: '0.2rem', fontSize: '1.1rem', fontWeight: 'bold' }}
              autoFocus
            />
            {passError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                {passError}
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}>
              ยืนยันรหัสผ่าน
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">ระบบเชื่อมต่อคลาวด์และแชร์ข้อมูล (Cloud Database Settings)</h1>
        <p className="page-subtitle">แชร์คลังพัสดุและซิงค์ข้อมูลการตัดจ่ายกับเครื่องเพื่อนร่วมงานแบบ Real-time</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Status Card */}
          <div className="glass card" style={{ 
            borderTop: config ? '4px solid var(--success)' : '4px solid var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Database size={22} color={config ? 'var(--success)' : 'var(--text-muted)'} />
                สถานะการเชื่อมต่อ
              </h3>
              {config ? (
                <span className="status-badge status-pass" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                  <CheckCircle2 size={12} /> เชื่อมต่อคลาวด์แล้ว
                </span>
              ) : (
                <span className="status-badge status-quarantine" style={{ fontWeight: 700 }}>
                  ใช้งานเฉพาะในเครื่องคุณ
                </span>
              )}
            </div>

            {config ? (
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  ระบบคลาวด์เริ่มทำงานแล้ว ทุกเครื่องที่ใช้รหัสการตั้งค่า (Config) ชุดนี้จะเห็นข้อมูลสต็อก การรับเข้า การตัดจ่าย และข้อมูลเคส NCP ที่ตรงกันทันทีแบบ Real-time!
                </p>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Project ID:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-secondary)' }}>{config.projectId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ผู้ให้บริการ:</span>
                    <span>Firebase Firestore (Google Cloud)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>เครื่องมือซิงค์สต็อก:</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active (Real-time)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" onClick={onDisconnect} style={{ color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <LogOut size={16} /> ตัดการเชื่อมต่อฐานข้อมูลคลาวด์
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  ขณะนี้โปรแกรมกำลังบันทึกข้อมูลไว้เฉพาะภายในเบราว์เซอร์บนคอมพิวเตอร์ของคุณเท่านั้น หากต้องการให้เครื่องของคุณและเครื่องของเพื่อนซิงค์ข้อมูลตรงกันโดยอัตโนมัติ กรุณากรอกรหัสตั้งค่าฐานข้อมูลคลาวด์ Firebase Firestore ด้านล่างนี้ครับ
                </p>

                {errorMsg && (
                  <div style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: 'var(--danger)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={16} /> {errorMsg}
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    วางรหัส Firebase Configuration
                  </label>
                  <textarea 
                    value={rawConfigInput}
                    onChange={e => setRawConfigInput(e.target.value)}
                    placeholder={`ก๊อปปี้และวางโค้ดติดตั้งมาทั้งหมดได้เลย เช่น:\n\nconst firebaseConfig = {\n  apiKey: "...",\n  projectId: "...",\n  ...\n};`}
                    rows="6"
                    style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                  ></textarea>
                </div>

                <button className="btn btn-primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center' }}>
                  <Save size={18} /> บันทึกและเชื่อมต่อระบบแชร์ข้อมูลคลาวด์
                </button>
              </div>
            )}
          </div>

          {/* Sync & Migration Tools */}
          {config && (
            <div className="glass card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={20} color="var(--accent-color)" />
                เครื่องมือย้ายข้อมูลเดิมขึ้นคลาวด์
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                หากคุณมีข้อมูลสินค้า คลังพัสดุ หรือข้อมูลการตัดจ่ายเดิมที่บันทึกอยู่บนเครื่องนี้อยู่ก่อนแล้ว คุณสามารถส่งข้อมูลทั้งหมดขึ้นฐานข้อมูลคลาวด์ได้ทันที เพื่อแชร์ให้เครื่องอื่น ๆ เห็นข้อมูลเดียวกัน
              </p>

              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span>สินค้าพัสดุในเครื่อง:</span>
                  <span style={{ fontWeight: 600 }}>{syncStats.localItems} รายการ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span>จำนวน Lot สินค้าในคลังพัสดุ:</span>
                  <span style={{ fontWeight: 600 }}>{syncStats.localInventory} Lots</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ข้อมูลการเคลม NCP ในเครื่อง:</span>
                  <span style={{ fontWeight: 600 }}>{syncStats.localClaims} รายการ</span>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={onMigrate} 
                disabled={isMigrating}
                style={{ 
                  background: 'var(--accent-secondary)', 
                  color: '#fff', 
                  width: '100%', 
                  justifyContent: 'center',
                  cursor: isMigrating ? 'not-allowed' : 'pointer',
                  opacity: isMigrating ? 0.7 : 1
                }}
              >
                <RefreshCw size={18} className={isMigrating ? "spin" : ""} /> 
                {isMigrating ? "กำลังส่งข้อมูลขึ้นคลาวด์..." : "ส่งออกข้อมูลเก่าในเครื่องขึ้นคลาวด์ส่วนกลาง"}
              </button>
            </div>
          )}

          {/* Backup & Restore Tools */}
          <div className="glass card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={20} color="var(--accent-secondary)" />
              สำรองและกู้คืนข้อมูล (Backup & Restore)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
              เพื่อความปลอดภัย คุณสามารถดาวน์โหลดไฟล์ข้อมูลสำรองเก็บบันทึกไว้ในเครื่องคอมพิวเตอร์ของคุณ หรือนำไฟล์สำรองดังกล่าวมาอัปโหลดเพื่อกู้คืนฐานข้อมูลได้ตลอดเวลา
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={onBackup}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent-secondary), #0284c7)'
                }}
              >
                📥 สำรองข้อมูลเก็บลงเครื่องคอมพิวเตอร์ (Download Backup)
              </button>

              <div style={{ 
                borderTop: '1px solid var(--glass-border)', 
                paddingTop: '1.25rem',
                marginTop: '0.5rem'
              }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  📂 เลือกไฟล์สำรองข้อมูลเพื่อกู้คืน (.json)
                </label>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const parsed = JSON.parse(event.target.result);
                        onRestore(parsed);
                        // Reset input value so same file can be uploaded again
                        e.target.value = '';
                      } catch (err) {
                        alert("ไฟล์สำรองข้อมูลไม่ถูกต้อง กรุณาอัปโหลดไฟล์ .json ที่ถูกต้อง");
                      }
                    };
                    reader.readAsText(file);
                  }}
                  style={{ 
                    fontSize: '0.8rem', 
                    padding: '0.5rem',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ 
                background: 'rgba(245, 158, 11, 0.08)', 
                color: 'var(--warning)', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                lineHeight: 1.4
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>คำเตือน:</strong> การกู้คืนข้อมูลจะทำการเขียนทับข้อมูลสต็อกสินค้า สัญญาจัดซื้อ ทะเบียนสินค้า และ NCP เดิมทั้งหมด หากเชื่อมต่อคลาวด์อยู่ ข้อมูลกลางจะเปลี่ยนตามทันที</span>
              </div>
            </div>
          </div>

          {/* Reset Program Tools */}
          <div className="glass card" style={{ borderLeft: '3px solid var(--danger)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <AlertOctagon size={20} />
              รีเซ็ตระบบพัสดุทั้งหมด (Reset Database & System)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
              ทำการล้างข้อมูลการใช้งานทั้งหมดของแอปพลิเคชัน (ทะเบียนพัสดุ, ยอดในคลัง, ประวัติรับเข้า/ตัดจ่าย, สัญญาจัดซื้อ และคดี NCP) เสมือนเริ่มต้นโปรแกรมใหม่แบบสะอาด
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.08)', 
                color: 'var(--danger)', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                lineHeight: 1.4
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong>ข้อแนะนำสำคัญ:</strong> แนะนำให้กดปุ่ม <strong>"สำรองข้อมูลเก็บลงเครื่องคอมพิวเตอร์"</strong> ด้านบนก่อนเริ่มทำการรีเซ็ต เพื่อความปลอดภัยในการกู้ข้อมูลภายหลัง หากมีการรีเซ็ตแล้วข้อมูลกลางบนคลาวด์ (Firestore) จะถูกลบถาวรทันที!</span>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={onReset}
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  borderColor: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                }}
              >
                🚨 รีเซ็ตล้างข้อมูลทั้งหมดในระบบ (Reset System Database)
              </button>
            </div>
          </div>

        </div>

        {/* Step-by-Step Free Signup Guide */}
        <div className="glass card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '3px solid var(--accent-color)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Info size={22} color="var(--accent-color)" />
            คู่มือการสมัครใช้ฐานข้อมูลฟรี (5 นาทีเสร็จ)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ทำตามขั้นตอนนี้เพื่อสร้างฐานข้อมูลของตัวคุณเองฟรี ไม่มีวันหมดอายุ:
          </p>

          <ol style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li>
              <strong>สมัครใช้งานและสร้างโปรเจกต์:</strong>
              <div style={{ marginTop: '0.2rem' }}>
                เปิดหน้าเว็บ <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Firebase Console</a> ล็อกอินด้วย Google Account จากนั้นกดปุ่ม <strong>Create a project</strong> และตั้งชื่อโปรเจกต์ (เช่น nbc-inventory)
              </div>
            </li>
            <li>
              <strong>สร้าง Web App เพื่อรับรหัสคีย์:</strong>
              <div style={{ marginTop: '0.2rem' }}>
                เมื่อสร้างเสร็จ ในหน้าแดชบอร์ด ให้คลิกที่ไอคอน **เว็บ (รูป <code>&lt;/&gt;</code>)** เพื่อเพิ่ม Web App เข้าไป จากนั้นระบบจะแสดงรหัส <code>const firebaseConfig = &#123; ... &#125;;</code>
              </div>
              <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                👉 ทำการก๊อปปี้โค้ดในวงเล็บปีกกาปีกกาปีกกาหรือโค้ดทั้งหมด มาวางในช่องด้านซ้ายได้เลย!
              </div>
            </li>
            <li>
              <strong>สร้างฐานข้อมูล Firestore:</strong>
              <div style={{ marginTop: '0.2rem' }}>
                ในเมนูด้านซ้ายของเว็บ Firebase คลิกที่ <strong>Build</strong> &gt; <strong>Firestore Database</strong> แล้วกด <strong>Create database</strong>
              </div>
            </li>
            <li>
              <strong>ตั้งค่าสิทธิ์เข้าถึง (สำคัญมาก ⚠️):</strong>
              <div style={{ marginTop: '0.2rem' }}>
                ตอนเลือกการเริ่มตั้งค่า ให้เลือกเริ่มใน **Test Mode** (โหมดทดสอบ) เพื่อให้แอปของคุณและเพื่อนสามารถเขียนข้อมูลร่วมกันได้ทันที หรือกำหนด Rules เป็น:
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.3rem', fontSize: '0.75rem', overflowX: 'auto' }}>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                </pre>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Settings;
