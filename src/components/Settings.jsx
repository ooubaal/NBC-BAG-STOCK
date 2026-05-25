import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, Key, Save, RefreshCw, LogOut, Info } from 'lucide-react';

const Settings = ({ config, onSaveConfig, onDisconnect, onMigrate, syncStats, isMigrating }) => {
  const [rawConfigInput, setRawConfigInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const parseFirebaseConfig = (text) => {
    try {
      // Find JSON/JS Object inside text using regex
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("ไม่พบรูปแบบเครื่องหมายปีกกา { ... }");
      }
      
      const jsonLikeText = match[0]
        .replace(/([a-zA-Z0-9]+):/g, '"$1":') // Wrap keys in double quotes
        .replace(/'/g, '"')                 // Convert single quotes to double
        .replace(/,(\s*[\}\]])/g, '$1');   // Remove trailing commas

      const parsed = JSON.parse(jsonLikeText);
      
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error("ต้องมีฟิลด์ apiKey และ projectId เป็นอย่างน้อย");
      }
      
      return parsed;
    } catch (e) {
      console.error(e);
      // Fallback: try extraction via simple regex
      const extractField = (field, source) => {
        const regex = new RegExp(`['"]?${field}['"]?\\s*:\\s*['"]([^'"]+)['"]`);
        const m = source.match(regex);
        return m ? m[1] : null;
      };

      const apiKey = extractField('apiKey', text);
      const projectId = extractField('projectId', text);
      const authDomain = extractField('authDomain', text);
      const storageBucket = extractField('storageBucket', text);
      const messagingSenderId = extractField('messagingSenderId', text);
      const appId = extractField('appId', text);

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
