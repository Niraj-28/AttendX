import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { Camera, RefreshCw, Check, X, Clock, Smartphone, Loader } from 'lucide-react';
import './QRCameraCapture.css';

const QRCameraCapture = ({ sessionId, onImageReceived, onCancel }) => {
  const [qrUrl, setQrUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [receivedImage, setReceivedImage] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [expiresIn, setExpiresIn] = useState(600); // 10 minutes
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    generateQRCode();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isWaiting && expiresIn > 0) {
      timerRef.current = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            setError('QR code expired. Please generate a new one.');
            setIsWaiting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [isWaiting, expiresIn]);

  const setupWebSocket = () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    const wsUrl = API_URL.replace('/api', '');
    
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      newSocket.emit('join-session', sessionId);
    });

    newSocket.on('image-received', (data) => {
      console.log('📸 Image received from phone:', data);
      setReceivedImage(data.image_url);
      setIsWaiting(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Notify parent component
      if (onImageReceived) {
        onImageReceived(data);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    newSocket.on('error', (err) => {
      console.error('WebSocket error:', err);
      setError('Connection error. Please refresh the page.');
    });

    setSocket(newSocket);
  };

  const generateQRCode = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/phone-capture/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      const data = await response.json();

      if (data.success) {
        setQrUrl(data.data.qr_url);
        setExpiresIn(data.data.expires_in);
        setIsWaiting(true);
        console.log('✅ QR code generated:', data.data.qr_url);
      } else {
        throw new Error(data.message || 'Failed to generate QR code');
      }
    } catch (err) {
      console.error('QR generation error:', err);
      setError(err.message || 'Failed to generate QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProcessAttendance = async () => {
    if (!receivedImage) return;

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token');

      // Fetch the image and convert to blob
      const imageResponse = await fetch(receivedImage);
      const imageBlob = await imageResponse.blob();

      const formData = new FormData();
      formData.append('image', imageBlob, 'classroom.jpg');
      formData.append('session_id', sessionId);

      const response = await fetch(`${API_URL}/attendance/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `✅ Attendance Processed Successfully!\n\n` +
          `Faces Detected: ${result.data.faces_detected}\n` +
          `Students Matched: ${result.data.students_matched}\n` +
          `Present: ${result.data.present_count}/${result.data.total_students}\n` +
          `Attendance: ${result.data.attendance_percentage}%`
        );
        
        // Close modal or notify parent
        if (onCancel) {
          onCancel();
        }
      } else {
        throw new Error(result.message || 'Failed to process attendance');
      }
    } catch (err) {
      console.error('Process attendance error:', err);
      alert('❌ ' + (err.message || 'Failed to process attendance. Please try again.'));
    }
  };

  const handleRetake = () => {
    setReceivedImage(null);
    generateQRCode();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="qr-camera-capture">
      {!receivedImage ? (
        // QR Code Display Mode
        <div className="qr-section">
          <div className="qr-header">
            <Smartphone size={32} />
            <h3>Scan QR Code with Your Phone</h3>
          </div>

          {isGenerating ? (
            <div className="qr-loading">
              <Loader className="spinner-icon" size={48} />
              <p>Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="qr-error">
              <X size={48} color="#f44336" />
              <p>{error}</p>
              <button onClick={generateQRCode} className="retry-btn">
                <RefreshCw size={20} />
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="qr-code-container">
                <div className="qr-code-wrapper">
                  {qrUrl && (
                    <QRCodeSVG 
                      value={qrUrl} 
                      size={280}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  )}
                </div>
                
                {isWaiting && expiresIn > 0 && (
                  <div className="qr-timer">
                    <Clock size={18} />
                    <span>Expires in {formatTime(expiresIn)}</span>
                  </div>
                )}
              </div>

              <div className="instructions-box">
                <h4>📱 Instructions</h4>
                <ol>
                  <li>Open your phone's <strong>camera app</strong></li>
                  <li>Point at the <strong>QR code</strong> above</li>
                  <li>Tap the notification to <strong>open link</strong></li>
                  <li>Take photo of <strong>classroom</strong></li>
                  <li>Photo will appear here <strong>automatically</strong></li>
                </ol>
              </div>

              {isWaiting && (
                <div className="waiting-indicator">
                  <div className="pulse-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>Waiting for photo from phone...</p>
                </div>
              )}

              <div className="qr-actions">
                <button onClick={generateQRCode} className="refresh-btn">
                  <RefreshCw size={20} />
                  Generate New QR
                </button>
                <button onClick={onCancel} className="cancel-qr-btn">
                  <X size={20} />
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        // Image Preview Mode
        <div className="preview-section">
          <div className="preview-header">
            <Check size={28} color="#4CAF50" />
            <h3>Photo Received from Phone</h3>
          </div>

          <div className="image-preview-container">
            <img src={receivedImage} alt="Captured from phone" className="received-image" />
          </div>

          <div className="preview-info">
            <p className="preview-note">
              ✅ Image successfully received from your phone
            </p>
          </div>

          <div className="preview-actions">
            <button onClick={handleRetake} className="retake-action-btn">
              <Camera size={20} />
              Retake Photo
            </button>
            <button onClick={handleProcessAttendance} className="process-action-btn">
              <Check size={20} />
              Process Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCameraCapture;
