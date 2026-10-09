import React, { useRef, useState } from 'react';
import { Camera, Upload, Check, AlertCircle, Trash2 } from 'lucide-react';
import { processAvatarImage } from '../../utils/imageUtils';

export default function AvatarUpload({
  value,
  onChange,
  defaultAvatar,
  size = 72,
  label = 'Profile Avatar',
  description = 'Upload photo from your computer or phone'
}) {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const displayAvatar = value || defaultAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setIsProcessing(true);
    try {
      const base64 = await processAvatarImage(file, 256, 0.85);
      onChange(base64);
    } catch (err) {
      setError(err.message || 'Error processing image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset file input so same file can be picked again if desired
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#94a3b8',
          marginBottom: '8px'
        }}>
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 14px',
          background: isDragOver ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
          border: isDragOver ? '1.5px dashed #3b82f6' : '1px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Avatar Circle with Badge */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: 'relative',
            width: `${size}px`,
            height: `${size}px`,
            minWidth: `${size}px`,
            cursor: 'pointer',
            borderRadius: '50%',
            overflow: 'visible'
          }}
          title="Click to upload new image from device"
        >
          <img
            src={displayAvatar}
            alt="Avatar Preview"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              border: '1.5px solid #0f172a'
            }}
          >
            <Camera size={13} />
          </div>
        </div>

        {/* Action text & Upload button */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: isProcessing ? 'wait' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Upload size={14} />
              {isProcessing ? 'Processing...' : 'Upload from Device'}
            </button>

            {value && value !== defaultAvatar && (
              <button
                type="button"
                onClick={() => onChange(defaultAvatar || '')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                title="Reset to default photo"
              >
                <Trash2 size={12} />
                Reset
              </button>
            )}
          </div>

          <p style={{
            margin: '6px 0 0 0',
            fontSize: '0.72rem',
            color: '#94a3b8'
          }}>
            {description}
          </p>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '6px',
              fontSize: '0.72rem',
              color: '#f87171'
            }}>
              <AlertCircle size={13} />
              {error}
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
