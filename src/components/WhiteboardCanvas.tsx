import React, { useState, useEffect, useRef } from 'react';
import Canvas from './Canvas';
import ImageUploader from './ImageUploader';
import ClassificationResult from './ClassificationResult';
import ExportDialog from './ExportDialog';
import { useAuth } from '../contexts/AuthContext';
import type { ImageClassification } from '../types';

const WhiteboardCanvas: React.FC = () => {
  const { authState } = useAuth();
  
  // Tool state
  const [toolType, setToolType] = useState<'brush' | 'eraser'>('brush');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  
  // Image and classification state
  const [classificationResult, setClassificationResult] = useState<ImageClassification | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  
  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>('');
  
  // Canvas refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<any>(null);
  const resizeTimeoutRef = useRef<number | null>(null);

  // Handle window resize to adjust canvas size
  useEffect(() => {
    // Function to update canvas dimensions based on container size
    const updateCanvasDimensions = () => {
      if (!containerRef.current || !canvasRef.current?.updateCanvasDimensions) return;
      
      // Get container dimensions
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.floor(rect.width);
      const newHeight = Math.floor(rect.height);
      
      // Update canvas using imperative method
      canvasRef.current.updateCanvasDimensions(newWidth, newHeight);
    };
    
    // Debounced resize handler
    const handleResize = () => {
      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = window.setTimeout(() => {
        updateCanvasDimensions();
        resizeTimeoutRef.current = null;
      }, 200);
    };
    
    // Initial update - delay to ensure container is properly rendered
    const initialTimeoutId = setTimeout(updateCanvasDimensions, 100);
    
    // Listen for window resize events
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialTimeoutId);
      
      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - run only once on mount

  // Handle tool selection
  const handleToolChange = (tool: 'brush' | 'eraser') => {
    setToolType(tool);
  };

  // Handle undo
  const handleUndo = () => {
    if (canvasRef.current) {
      canvasRef.current.undo();
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (canvasRef.current) {
      canvasRef.current.redo();
    }
  };

  // Handle clear canvas
  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      if (canvasRef.current) {
        canvasRef.current.clear();
      }
    }
  };

  // Show export dialog
  const handleShowExportDialog = async () => {
    if (canvasRef.current) {
      try {
        const dataUrl = await canvasRef.current.exportToPNG();
        setCanvasDataUrl(dataUrl);
        setShowExportDialog(true);
      } catch (error) {
        console.error('Error exporting canvas:', error);
      }
    }
  };

  // Handle close export dialog
  const handleCloseExportDialog = () => {
    setShowExportDialog(false);
  };

  // Handle image classification result
  const handleImageClassified = (result: ImageClassification) => {
    setClassificationResult(result);
    setShowUploader(false);
  };

  // Handle adding image to canvas
  const handleAddImageToCanvas = () => {
    if (classificationResult && canvasRef.current) {
      canvasRef.current.addImage(classificationResult.image);
      setClassificationResult(null);
    }
  };

  // Clear classification result
  const handleClearClassification = () => {
    setClassificationResult(null);
  };

  // Toggle image uploader
  const handleToggleUploader = () => {
    setShowUploader(prev => !prev);
  };

  // Color selection options
  const colorOptions = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
  ];

  // Brush size options
  const sizeOptions = [2, 5, 10, 15, 20];

  return (
    <div className="whiteboard-container">
      <div className="row">
        <div className="col-md-10">
          <div className="d-flex justify-content-between mb-2">
            <div>
              <button 
                className="btn btn-outline-secondary btn-sm me-2"
                title="Undo (Ctrl+Z)"
                onClick={handleUndo}
              >
                <i className="bi bi-arrow-counterclockwise"></i> Undo
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm me-2"
                title="Redo (Ctrl+Shift+Z)"
                onClick={handleRedo}
              >
                <i className="bi bi-arrow-clockwise"></i> Redo
              </button>
              <button 
                className="btn btn-outline-danger btn-sm me-2"
                title="Clear Canvas"
                onClick={handleClearCanvas}
              >
                <i className="bi bi-trash"></i> Clear
              </button>
            </div>
            <div>
              <button
                className="btn btn-outline-success btn-sm"
                title="Upload Image"
                onClick={handleToggleUploader}
              >
                <i className="bi bi-image"></i> Add Image
              </button>
            </div>
          </div>

          {showUploader && (
            <ImageUploader
              onImageClassified={handleImageClassified}
              onImageAdd={(imageDataUrl) => {
                if (canvasRef.current) {
                  canvasRef.current.addImage(imageDataUrl);
                  setShowUploader(false);
                }
              }}
            />
          )}
          
          <div 
            ref={containerRef}
            className="canvas-wrapper"
            style={{ 
              width: '100%',
              position: 'relative',
              height: 'calc(100% - 40px)' // Subtract the toolbar height
            }}
          >
            <Canvas
              width={800} // Fixed initial width - will be updated imperatively
              height={600} // Fixed initial height - will be updated imperatively
              toolType={toolType}
              brushColor={brushColor}
              brushSize={brushSize}
              ref={canvasRef}
            />
          </div>
        </div>
        <div className="col-md-2">
          {classificationResult ? (
            <ClassificationResult
              result={classificationResult}
              onAddToCanvas={handleAddImageToCanvas}
              onClear={handleClearClassification}
            />
          ) : (
            <>
              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="mb-0">Tools</h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button 
                      className={`btn ${toolType === 'brush' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                      onClick={() => handleToolChange('brush')}
                    >
                      <i className="bi bi-pencil"></i> Brush
                    </button>
                    <button 
                      className={`btn ${toolType === 'eraser' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                      onClick={() => handleToolChange('eraser')}
                    >
                      <i className="bi bi-eraser"></i> Eraser
                    </button>
                  </div>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="mb-0">Color</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-center">
                    {colorOptions.map((color) => (
                      <div 
                        key={color}
                        onClick={() => setBrushColor(color)}
                        style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: color,
                          margin: '4px',
                          cursor: 'pointer',
                          border: color === brushColor ? '2px solid #000' : '1px solid #ddd',
                          borderRadius: '4px',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="mb-0">Brush Size</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-center">
                    {sizeOptions.map((size) => (
                      <div 
                        key={size}
                        onClick={() => setBrushSize(size)}
                        style={{
                          width: `${size * 2}px`,
                          height: `${size * 2}px`,
                          backgroundColor: brushColor,
                          margin: '4px',
                          cursor: 'pointer',
                          border: size === brushSize ? '2px solid #000' : '1px solid #ddd',
                          borderRadius: '50%',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Export</h5>
            </div>
            <div className="card-body">
              <div className="d-grid">
                <button 
                  className="btn btn-outline-success btn-sm mb-2"
                  onClick={handleShowExportDialog}
                >
                  <i className="bi bi-download"></i> Export Whiteboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showExportDialog && (
        <ExportDialog 
          onClose={handleCloseExportDialog}
          canvasDataUrl={canvasDataUrl}
        />
      )}
    </div>
  );
};

export default WhiteboardCanvas; 