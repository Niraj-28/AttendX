import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, RotateCw, Check, AlertCircle, Clock } from 'lucide-react';
import './PhoneCapture.css';

const PhoneCapture = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [tokenValid, setTokenValid] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Verify token on mount
  useEffect(() => {
    verifyToken();
  }, [token]);

  // Update remaining time countdown
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setTokenValid(false);
            setError('QR code expired. Please generate a new one on your laptop.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const verifyToken = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/phone-capture/verify/${token}`);
      const data = await response.json();

      if (data.success) {
        setTokenValid(true);
        setRemainingTime(data.data.remaining_seconds);
      } else {
        setTokenValid(false);
        setError(data.message || 'Invalid or expired QR code');
      }
    } catch (err) {
      setTokenValid(false);
      setError('Failed to verify QR code. Please check your connection.');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }

    setCapturedImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const formData = new FormData();
      formData.append('image', capturedImage);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${API_URL}/phone-capture/upload/${token}`, {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (data.success) {
        setUploadSuccess(true);
        
        // Reset after 3 seconds for next photo
        setTimeout(() => {
          setUploadSuccess(false);
          setCapturedImage(null);
          setPreviewUrl(null);
          setUploadProgress(0);
        }, 3000);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
    fileInputRef.current?.click();
  };

  const handleOpenCamera = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (tokenValid === null) {
    return (
      <div className="phone-capture-page">
        <div className="phone-header">
          <h2>📸 AttendX Camera</h2>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Verifying QR code...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <div className="phone-capture-page">
        <div className="phone-header error">
          <h2>❌ Invalid QR Code</h2>
        </div>
        <div className="error-state">
          <AlertCircle size={64} color="#f44336" />
          <h3>Cannot Access Camera</h3>
          <p>{error || 'This QR code is invalid or has expired.'}</p>
          <div className="error-instructions">
            <p><strong>What to do:</strong></p>
            <ol>
              <li>Go back to your laptop</li>
              <li>Generate a new QR code</li>
              <li>Scan the new code with your phone</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-capture-page">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="phone-header">
        <h2>📸 AttendX Camera</h2>
        {remainingTime > 0 && (
          <div className="timer">
            <Clock size={16} />
            <span>{formatTime(remainingTime)}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      {!capturedImage ? (
        // Capture Mode
        <div className="capture-mode">
          <div className="camera-icon-large">
            <Camera size={80} strokeWidth={1.5} />
          </div>
          
          <div className="instructions">
            <h3>Take Photo of Classroom</h3>
            <ul>
              <li>📱 Hold phone horizontally</li>
              <li>💡 Ensure good lighting</li>
              <li>👥 Students should face camera</li>
              <li>📏 Keep camera steady</li>
            </ul>
          </div>

          <button 
            onClick={handleOpenCamera}
            className="capture-button"
          >
            <Camera size={24} />
            Open Camera
          </button>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : uploadSuccess ? (
        // Success Mode
        <div className="success-mode">
          <div className="success-animation">
            <div className="success-checkmark">
              <Check size={64} strokeWidth={3} />
            </div>
          </div>
          
          <h3>✅ Photo Uploaded!</h3>
          <p className="success-message">Check your laptop screen</p>
          <p className="next-photo-hint">Ready for next photo...</p>

          <div className="success-actions">
            <button onClick={handleOpenCamera} className="take-another-btn">
              <Camera size={20} />
              Take Another Photo
            </button>
          </div>
        </div>
      ) : (
        // Preview Mode
        <div className="preview-mode">
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="preview-image" />
          </div>

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p>Uploading... {uploadProgress}%</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="preview-actions">
            <button 
              onClick={handleRetake}
              className="retake-button"
              disabled={isUploading}
            >
              <RotateCw size={20} />
              Retake
            </button>

            <button 
              onClick={handleUpload}
              className="upload-button"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="button-spinner"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Send to Laptop
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneCapture;
