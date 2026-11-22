import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Zap, Upload, Sparkles, Check, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { matchScannedText } from '../utils/smartMatcher';

const SmartCameraModal = ({
  isOpen,
  onClose,
  onSelectMatch,
  inventory = [],
  items = []
}) => {
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [matches, setMatches] = useState([]);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const tesseractWorkerRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      setCameraError('');

      // Enumerate available video input devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);
      }

      const constraints = {
        video: currentDeviceId
          ? { deviceId: { exact: currentDeviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      // Check for torch capability
      const track = mediaStream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const caps = track.getCapabilities();
        if (caps.torch) {
          setHasTorch(true);
        }
      }
    } catch (err) {
      console.warn("Camera init warning:", err);
      setCameraError(err.name === 'NotAllowedError' 
        ? 'เบราว์เซอร์ยังไม่ได้รับอนุญาตให้เข้าถึงกล้อง กรุณากด "อนุญาต (Allow)" การใช้กล้อง'
        : 'ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการเชื่อมต่อ หรือใช้วิธีอัปโหลดรูปภาพแทน'
      );
    }
  }, [currentDeviceId, stopCamera]);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setRecognizedText('');
    setMatches([]);
    setCameraError('');
    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, currentDeviceId, startCamera, stopCamera]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate().catch(() => {});
        tesseractWorkerRef.current = null;
      }
    };
  }, []);

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn("Torch error:", e);
      }
    }
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setCurrentDeviceId(devices[nextIndex].deviceId);
    }
  };

  // Preprocess image on canvas: crop to focus region, enhance contrast for faster OCR
  const preprocessImage = (imageSource, isFileInput = false) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let srcW = imageSource.videoWidth || imageSource.width;
    let srcH = imageSource.videoHeight || imageSource.height;

    if (!srcW || !srcH) return null;

    // Viewfinder region: focus on the middle 70% width and 50% height
    let cropX = 0;
    let cropY = 0;
    let cropW = srcW;
    let cropH = srcH;

    if (!isFileInput) {
      cropX = Math.floor(srcW * 0.15);
      cropY = Math.floor(srcH * 0.25);
      cropW = Math.floor(srcW * 0.70);
      cropH = Math.floor(srcH * 0.50);
    }

    // Set canvas dimensions
    canvas.width = cropW;
    canvas.height = cropH;

    // Draw cropped region
    ctx.drawImage(imageSource, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Apply high contrast grayscale to dramatically improve OCR speed & accuracy
    const imgData = ctx.getImageData(0, 0, cropW, cropH);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      // High contrast thresholding
      const contrast = avg > 120 ? 255 : 0;
      d[i] = contrast;
      d[i + 1] = contrast;
      d[i + 2] = contrast;
    }
    ctx.putImageData(imgData, 0, 0);

    return canvas;
  };

  // Perform OCR and Fuzzy Match
  const processImageForOCR = async (imageSource, isFileInput = false) => {
    setIsProcessing(true);
    setProcessStatus('กำลังเตรียมภาพ...');

    try {
      const processedCanvas = preprocessImage(imageSource, isFileInput);
      if (!processedCanvas) {
        throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
      }

      setProcessStatus('กำลังอ่านตัวหนังสือ (AI OCR)...');

      // Lazy load Tesseract worker only when needed (keeps main app lightweight!)
      const { createWorker } = await import('tesseract.js');
      
      if (!tesseractWorkerRef.current) {
        setProcessStatus('กำลังเตรียม AI Engine...');
        const worker = await createWorker('eng');
        tesseractWorkerRef.current = worker;
      }

      const worker = tesseractWorkerRef.current;
      setProcessStatus('กำลังวิเคราะห์รายละเอียด...');
      const { data } = await worker.recognize(processedCanvas);
      const text = data && data.text ? data.text.trim() : '';

      setRecognizedText(text);

      if (!text) {
        setProcessStatus('ไม่พบตัวหนังสือในบริเวณกรอบ กรุณาลองจัดมุมกล้องอีกครั้ง');
        setMatches([]);
        setIsProcessing(false);
        return;
      }

      setProcessStatus('กำลังคำนวณความน่าจะเป็น...');
      const matchedResults = matchScannedText(text, inventory, items);
      setMatches(matchedResults);

      if (matchedResults.length === 0) {
        setProcessStatus('อ่านข้อความได้แล้ว แต่ไม่พบรายการพัสดุหรือ Lot ที่ตรงกันในคลัง');
      } else {
        setProcessStatus(`ประมวลผลสำเร็จ พบ ${matchedResults.length} รายการที่น่าจะเป็นไปได้`);
      }
    } catch (err) {
      console.error("OCR process error:", err);
      setProcessStatus('เกิดข้อผิดพลาดในการอ่านข้อความ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    processImageForOCR(videoRef.current, false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      processImageForOCR(img, true);
    };
    img.src = url;
  };

  const handleSelect = (candidate) => {
    if (onSelectMatch && candidate) {
      onSelectMatch(candidate.searchKeyword || candidate.itemName);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
      padding: '1rem'
    }}>
      <div className="glass card" style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: '1px solid var(--accent-color, #0ea5e9)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Camera size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                กล้องสแกนพัสดุอัจฉริยะ <Sparkles size={16} color="#f59e0b" />
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ส่องข้อความหรือรหัส Lot ข้างกล่อง เพื่อค้นหาพัสดุในคลังอัตโนมัติ (On-Device 100%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Camera Viewport Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            backgroundColor: '#000',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
          }}>
            {/* Live Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraError ? 'none' : 'block'
              }}
            />

            {/* Error Message if camera failed */}
            {cameraError && (
              <div style={{
                padding: '1.5rem',
                textAlign: 'center',
                color: '#f87171',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={32} />
                <p style={{ fontSize: '0.85rem', margin: 0 }}>{cameraError}</p>
                <label className="btn btn-primary" style={{ marginTop: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <Upload size={15} style={{ marginRight: '0.3rem' }} /> เลือกรูปจากแกลเลอรี่แทน
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}

            {/* Viewfinder Target Guide */}
            {!cameraError && (
              <div style={{
                position: 'absolute',
                top: '25%',
                left: '15%',
                width: '70%',
                height: '50%',
                border: '2px dashed #10b981',
                borderRadius: '10px',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  letterSpacing: '0.5px'
                }}>
                  เล็งตัวหนังสือข้างกล่องในกรอบนี้
                </span>
              </div>
            )}

            {/* Camera Controls Overlay (Torch, Switch Camera) */}
            {!cameraError && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                gap: '0.5rem'
              }}>
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    style={{
                      background: torchOn ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                      color: torchOn ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="เปิด/ปิด ไฟฉาย"
                  >
                    <Zap size={16} />
                  </button>
                )}
                {devices.length > 1 && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="สลับกล้องหน้า/หลัง"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCapture}
              disabled={isProcessing || !stream}
              style={{
                padding: '0.65rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="spin" /> {processStatus}
                </>
              ) : (
                <>
                  <Camera size={18} /> ถ่ายและสแกนข้อความ (AI Scan)
                </>
              )}
            </button>

            <label
              className="btn btn-secondary"
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Upload size={16} /> เลือกภาพจากเครื่อง
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Status Bar */}
          {processStatus && (
            <div style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: isProcessing ? 'var(--accent-color)' : 'var(--text-secondary)'
            }}>
              {isProcessing ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} color="#f59e0b" />}
              <span>{processStatus}</span>
            </div>
          )}

          {/* Recognized text preview */}
          {recognizedText && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              fontSize: '0.78rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>ข้อความที่ตรวจพบ: </span>
              <strong style={{ color: 'var(--text-primary)' }}>"{recognizedText.replace(/\n+/g, ' ')}"</strong>
            </div>
          )}

          {/* Matched Candidates Result List */}
          {matches.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Check size={16} color="var(--success)" /> รายการที่น่าจะเป็นไปได้ (เลือกเพื่อค้นหา):
              </div>

              {matches.map((item, idx) => {
                const isHighConfidence = item.confidence >= 75;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(item)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: idx === 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: idx === 0 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = idx === 0 ? 'rgba(16, 185, 129, 0.35)' : 'var(--glass-border)'; }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: isHighConfidence ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isHighConfidence ? '#10b981' : '#f59e0b',
                          border: isHighConfidence ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          🎯 มั่นใจ {item.confidence}%
                        </span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {item.itemName}
                        </strong>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {item.supplierLot && (
                          <span>Lot: <strong style={{ color: 'var(--accent-color)' }}>{item.supplierLot}</strong></span>
                        )}
                        {item.inhouseLot && (
                          <span>QC Lot: <strong style={{ color: 'var(--text-secondary)' }}>{item.inhouseLot}</strong></span>
                        )}
                        {item.location && (
                          <span>ที่เก็บ: <strong>{item.location}</strong></span>
                        )}
                        {item.remainingQty !== undefined && (
                          <span>คงเหลือ: <strong>{Number(item.remainingQty).toLocaleString()} {item.unit}</strong></span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                        เหตุผล: {item.matchReason}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      เลือก <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default SmartCameraModal;
