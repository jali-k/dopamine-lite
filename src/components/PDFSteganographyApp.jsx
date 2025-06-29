// PDFSteganographyApp.js - Main React component
import React, { useState, useRef } from 'react';
import PDFSteganographyAPI from './APIClient';

const PDFSteganographyApp = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeMethod, setActiveMethod] = useState('watermark');
  
  // Form data states
  const [watermarkText, setWatermarkText] = useState('');
  const [email, setEmail] = useState('');
  const [secretMessage, setSecretMessage] = useState('');
  const [coverText, setCoverText] = useState('');
  
  // Advanced options
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [enableQRCode, setEnableQRCode] = useState(false);
  const [enableFontStego, setEnableFontStego] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      setSuccess('');
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let resultBlob;
      let filename;

      switch (activeMethod) {
        case 'watermark':
          resultBlob = await PDFSteganographyAPI.addWatermark(selectedFile, watermarkText);
          filename = `watermarked_${selectedFile.name}`;
          break;

        case 'qr-code':
          if (!email) {
            throw new Error('Email is required for QR code method');
          }
          resultBlob = await PDFSteganographyAPI.addQRCode(selectedFile, email);
          filename = `qr_code_${selectedFile.name}`;
          break;

        case 'font-steganography':
          if (!secretMessage || !coverText) {
            throw new Error('Secret message and cover text are required for font steganography');
          }
          resultBlob = await PDFSteganographyAPI.addFontSteganography(
            selectedFile, 
            secretMessage, 
            coverText
          );
          filename = `font_stego_${selectedFile.name}`;
          break;

        case 'all-methods':
          const options = {
            enableWatermark,
            enableQRCode,
            enableFontStego,
            watermarkText: enableWatermark ? watermarkText : undefined,
            email: enableQRCode ? email : undefined,
            secretMessage: enableFontStego ? secretMessage : undefined,
            coverText: enableFontStego ? coverText : undefined,
          };
          
          // Validate required fields for enabled methods
          if (enableQRCode && !email) {
            throw new Error('Email is required when QR code is enabled');
          }
          if (enableFontStego && (!secretMessage || !coverText)) {
            throw new Error('Secret message and cover text are required when font steganography is enabled');
          }
          
          resultBlob = await PDFSteganographyAPI.applyAllMethods(selectedFile, options);
          filename = `processed_${selectedFile.name}`;
          break;

        default:
          throw new Error('Invalid method selected');
      }

      // Download the result
      downloadBlob(resultBlob, filename);
      setSuccess(`✅ Successfully processed! File downloaded as ${filename}`);
      
    } catch (err) {
      console.error('Error:', err);
      try {
        const errorObj = JSON.parse(err.message);
        setError(`❌ Error: ${JSON.stringify(errorObj, null, 2)}`);
      } catch {
        setError(`❌ Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderMethodForm = () => {
    switch (activeMethod) {
      case 'watermark':
        return (
          <div className="form-group">
            <label htmlFor="watermarkText">Watermark Text (optional):</label>
            <input
              type="text"
              id="watermarkText"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Leave empty for auto-generated ID"
              className="form-control"
            />
          </div>
        );

      case 'qr-code':
        return (
          <div className="form-group">
            <label htmlFor="email">Email for QR Code: *</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="form-control"
              required
            />
          </div>
        );

      case 'font-steganography':
        return (
          <>
            <div className="form-group">
              <label htmlFor="secretMessage">Secret Message: *</label>
              <input
                type="text"
                id="secretMessage"
                value={secretMessage}
                onChange={(e) => setSecretMessage(e.target.value)}
                placeholder="Your secret message"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="coverText">Cover Text: *</label>
              <textarea
                id="coverText"
                value={coverText}
                onChange={(e) => setCoverText(e.target.value)}
                placeholder="Long text to hide the secret message (must be 8x longer than secret message)"
                className="form-control"
                rows={4}
                required
              />
              <small className="form-text text-muted">
                Cover text should be at least {secretMessage.length * 8} characters long
              </small>
            </div>
          </>
        );

      case 'all-methods':
        return (
          <>
            <div className="form-group">
              <h4>Enable Methods:</h4>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={enableWatermark}
                    onChange={(e) => setEnableWatermark(e.target.checked)}
                  />
                  Watermark
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={enableQRCode}
                    onChange={(e) => setEnableQRCode(e.target.checked)}
                  />
                  QR Code
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={enableFontStego}
                    onChange={(e) => setEnableFontStego(e.target.checked)}
                  />
                  Font Steganography
                </label>
              </div>
            </div>

            {enableWatermark && (
              <div className="form-group">
                <label htmlFor="watermarkText">Watermark Text:</label>
                <input
                  type="text"
                  id="watermarkText"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Optional watermark text"
                  className="form-control"
                />
              </div>
            )}

            {enableQRCode && (
              <div className="form-group">
                <label htmlFor="email">Email for QR Code: *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="form-control"
                  required
                />
              </div>
            )}

            {enableFontStego && (
              <>
                <div className="form-group">
                  <label htmlFor="secretMessage">Secret Message: *</label>
                  <input
                    type="text"
                    id="secretMessage"
                    value={secretMessage}
                    onChange={(e) => setSecretMessage(e.target.value)}
                    placeholder="Your secret message"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="coverText">Cover Text: *</label>
                  <textarea
                    id="coverText"
                    value={coverText}
                    onChange={(e) => setCoverText(e.target.value)}
                    placeholder="Long text to hide the secret message"
                    className="form-control"
                    rows={4}
                    required
                  />
                </div>
              </>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pdf-steganography-app">
      <style jsx>{`
        .pdf-steganography-app {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-control {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .file-input-wrapper {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        
        .file-input-wrapper:hover {
          border-color: #007bff;
        }
        
        .file-input-wrapper.has-file {
          border-color: #28a745;
          background-color: #f8fff9;
        }
        
        .method-tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        
        .method-tab {
          padding: 10px 20px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s;
        }
        
        .method-tab.active {
          border-bottom-color: #007bff;
          color: #007bff;
          font-weight: bold;
        }
        
        .method-tab:hover {
          background-color: #f8f9fa;
        }
        
        .checkbox-group {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .btn-primary {
          background-color: #007bff;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .alert {
          padding: 12px;
          border-radius: 4px;
          margin: 10px 0;
        }
        
        .alert-error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .alert-success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <h1>🔒 PDF Steganography Tool</h1>
      
      <div className="method-tabs">
        <div 
          className={`method-tab ${activeMethod === 'watermark' ? 'active' : ''}`}
          onClick={() => setActiveMethod('watermark')}
        >
          Watermark
        </div>
        <div 
          className={`method-tab ${activeMethod === 'qr-code' ? 'active' : ''}`}
          onClick={() => setActiveMethod('qr-code')}
        >
          QR Code
        </div>
        <div 
          className={`method-tab ${activeMethod === 'font-steganography' ? 'active' : ''}`}
          onClick={() => setActiveMethod('font-steganography')}
        >
          Font Steganography
        </div>
        <div 
          className={`method-tab ${activeMethod === 'all-methods' ? 'active' : ''}`}
          onClick={() => setActiveMethod('all-methods')}
        >
          All Methods
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select PDF File: *</label>
          <div 
            className={`file-input-wrapper ${selectedFile ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <div>
                <strong>✅ {selectedFile.name}</strong><br />
                <small>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</small><br />
                <small>Click to select a different file</small>
              </div>
            ) : (
              <div>
                <strong>📄 Click to select PDF file</strong><br />
                <small>Or drag and drop a PDF file here</small>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {renderMethodForm()}

        {error && (
          <div className="alert alert-error">
            <pre>{error}</pre>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !selectedFile}
        >
          {loading && <div className="loading-spinner"></div>}
          {loading ? 'Processing...' : 'Process PDF'}
        </button>
      </form>
    </div>
  );
};

export default PDFSteganographyApp;