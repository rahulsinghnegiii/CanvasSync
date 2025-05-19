import React, { useState } from 'react';
import exportService from '../services/exportService';

interface ExportDialogProps {
  onClose: () => void;
  canvasDataUrl: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ onClose, canvasDataUrl }) => {
  const [filename, setFilename] = useState('whiteboard');
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!canvasDataUrl) {
      setError('No canvas data available for export.');
      return;
    }
    
    setIsExporting(true);
    setError(null);
    
    try {
      if (format === 'png') {
        exportService.exportToPNG(canvasDataUrl, filename);
      } else if (format === 'pdf') {
        try {
          exportService.exportToPDF(canvasDataUrl, filename);
        } catch (pdfError) {
          console.error('PDF export failed:', pdfError);
          setError('PDF export failed. The canvas may be too large or contain too many elements. Try using PNG format instead.');
          setIsExporting(false);
          return;
        }
      }
      
      // Close dialog after successful export
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed. Please try again.';
      console.error('Export error:', errorMessage);
      setError(errorMessage);
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-backdrop show" style={{ display: 'block' }} onClick={onClose}>
      <div 
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Export Whiteboard</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}
            
            <div className="mb-3">
              <label htmlFor="filename" className="form-label">Filename</label>
              <input
                type="text"
                className="form-control"
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                disabled={isExporting}
              />
              <small className="text-muted">
                Date will be automatically added to the filename.
              </small>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Export Format</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="exportFormat"
                    id="formatPNG"
                    value="png"
                    checked={format === 'png'}
                    onChange={() => setFormat('png')}
                    disabled={isExporting}
                  />
                  <label className="form-check-label" htmlFor="formatPNG">
                    PNG Image
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="exportFormat"
                    id="formatPDF"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={() => setFormat('pdf')}
                    disabled={isExporting}
                  />
                  <label className="form-check-label" htmlFor="formatPDF">
                    PDF Document
                  </label>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-3">
              <img 
                src={canvasDataUrl} 
                alt="Preview" 
                className="img-thumbnail" 
                style={{ maxHeight: '200px', maxWidth: '100%' }}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary d-flex align-items-center"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <i className="bi bi-download me-2"></i>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog; 