import React, { useState, useRef, useCallback } from 'react';
import mlClassificationService from '../services/mlClassificationService';
import type { ImageClassification } from '../types';

interface ImageUploaderProps {
  onImageClassified: (result: ImageClassification) => void;
  onImageAdd: (imageDataUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageClassified, onImageAdd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  }, []);

  // Process the image file
  const processImage = useCallback(async (file: File) => {
    // Reset error state
    setError(null);
    
    // Basic validation
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (png, jpeg, jpg).');
      return;
    }

    try {
      // Convert file to data URL
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const imageDataUrl = e.target.result;
          
          // Start classification
          setIsClassifying(true);
          
          try {
            // Call ML service to classify image
            const result = await mlClassificationService.classifyImage(imageDataUrl);
            
            // Notify parent components
            onImageClassified(result);
            onImageAdd(imageDataUrl);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Image classification failed');
          } finally {
            setIsClassifying(false);
          }
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error processing the image.');
      setIsClassifying(false);
    }
  }, [onImageClassified, onImageAdd]);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processImage(file);
      e.dataTransfer.clearData();
    }
  }, [processImage]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processImage(file);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [processImage]);

  // Trigger file input click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="image-uploader mb-3">
      <div 
        className={`drop-area p-4 rounded border text-center ${isDragging ? 'border-primary bg-light' : 'border-dashed'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ cursor: 'pointer' }}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          accept="image/*"
          className="d-none"
          onChange={handleFileInputChange}
          ref={fileInputRef}
        />

        {isClassifying ? (
          <div className="text-center p-3">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Classifying...</span>
            </div>
            <p className="mb-0">Analyzing image...</p>
          </div>
        ) : (
          <>
            <i className="bi bi-cloud-upload fs-1 text-primary"></i>
            <p className="mb-1">Drag & drop an image here or click to upload</p>
            <small className="text-muted">The image will be classified using our ML model</small>
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-danger mt-2">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 