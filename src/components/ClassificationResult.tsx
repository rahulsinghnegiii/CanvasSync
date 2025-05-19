import React from 'react';
import type { ImageClassification } from '../types';

interface ClassificationResultProps {
  result: ImageClassification;
  onAddToCanvas: () => void;
  onClear: () => void;
}

const ClassificationResult: React.FC<ClassificationResultProps> = ({ 
  result, 
  onAddToCanvas,
  onClear
}) => {
  const confidencePercentage = Math.round(result.confidence * 100);
  
  // Determine the confidence level color
  const getConfidenceColor = () => {
    if (confidencePercentage >= 80) return 'bg-success';
    if (confidencePercentage >= 60) return 'bg-info';
    if (confidencePercentage >= 40) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="classification-result card mb-3">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Classification Result</h5>
        <button 
          className="btn btn-sm btn-outline-light"
          onClick={onClear}
          title="Clear result"
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
      
      <div className="card-body">
        <div className="text-center mb-3">
          <img 
            src={result.image} 
            alt="Classified image" 
            className="img-thumbnail" 
            style={{ maxHeight: '150px', maxWidth: '100%' }}
          />
        </div>
        
        <div className="mb-3">
          <h5 className="text-center mb-1">
            Prediction: <strong className="text-capitalize">{result.prediction}</strong>
          </h5>
          
          <div className="confidence-meter mt-3">
            <label className="form-label d-flex justify-content-between">
              <span>Confidence</span>
              <span>{confidencePercentage}%</span>
            </label>
            <div className="progress">
              <div 
                className={`progress-bar ${getConfidenceColor()}`} 
                role="progressbar" 
                style={{ width: `${confidencePercentage}%` }}
                aria-valuenow={confidencePercentage} 
                aria-valuemin={0} 
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="d-grid">
          <button 
            className="btn btn-primary" 
            onClick={onAddToCanvas}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassificationResult; 