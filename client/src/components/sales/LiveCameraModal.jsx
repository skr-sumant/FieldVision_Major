import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, X, AlertCircle, FlipHorizontal } from 'lucide-react';

export default function LiveCameraModal({ isOpen, onClose, onCapturePhoto }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsStartingCamera(true);
    setCameraError('');
    stopCamera();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStartingCamera(false);
    } catch (err) {
      console.warn('Live camera error:', err);
      setCameraError('Browser live camera blocked or unavailable. You can upload photo from device library below.');
      setIsStartingCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Add live watermark on image
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, canvas.height - 40, 320, 30);
      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`FieldVision Verified • ${new Date().toLocaleTimeString('en-IN')}`, 20, canvas.height - 20);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapturePhoto(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '560px', padding: '20px', borderRadius: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Camera size={18} color="#ffffff" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              Live Camera Verification Proof
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.4rem' }}>
            &times;
          </button>
        </div>

        {/* Viewfinder / Captured Photo Area */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '320px',
          background: '#090d16',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          marginBottom: '16px'
        }}>
          {!capturedImage ? (
            <>
              {isStartingCamera && (
                <div style={{ color: '#60a5fa', textAlign: 'center' }}>
                  <RefreshCw size={28} className="spin" style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.85rem' }}>Initializing live camera feed...</p>
                </div>
              )}

              {cameraError ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#f87171' }}>
                  <AlertCircle size={32} style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.85rem', marginBottom: '12px' }}>{cameraError}</p>
                  <label className="btn btn-emerald btn-sm" style={{ cursor: 'pointer' }}>
                    <Camera size={14} /> Upload Photo from Gallery
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              {/* Viewfinder Target Overlays */}
              {!cameraError && !isStartingCamera && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span className="badge badge-verified" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      🔴 LIVE STREAM
                    </span>
                    <button
                      onClick={toggleFacingMode}
                      className="btn btn-secondary btn-sm"
                      style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.6)', border: 'none' }}
                      title="Flip Camera"
                    >
                      <FlipHorizontal size={14} /> Switch Camera
                    </button>
                  </div>

                  {/* Corner crosshairs */}
                  <div style={{
                    position: 'absolute',
                    width: '70%',
                    height: '70%',
                    border: '2px dashed rgba(16, 185, 129, 0.6)',
                    borderRadius: '12px',
                    pointerEvents: 'none'
                  }} />
                </>
              )}
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Snapshot Proof"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Hidden Canvas for capturing image */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Action Controls */}
        {!capturedImage ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={takeSnapshot}
              className="btn btn-emerald"
              disabled={!stream || isStartingCamera}
              style={{ flex: 1, padding: '14px', fontSize: '1rem' }}
            >
              <Camera size={18} /> Click Live Photo
            </button>

            <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '14px' }}>
              Upload File
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleRetake} className="btn btn-secondary" style={{ flex: 1 }}>
              <RefreshCw size={15} /> Retake Snapshot
            </button>
            <button onClick={handleConfirmPhoto} className="btn btn-emerald" style={{ flex: 2 }}>
              <CheckCircle2 size={16} /> Confirm & Use Photo Proof
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
