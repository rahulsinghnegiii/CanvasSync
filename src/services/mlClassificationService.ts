import type { ImageClassification } from '../types';

// This is a mock ML classification service that simulates image classification
// In a real implementation, this would call a backend ML API
class MLClassificationService {
  // Mock labels for classification
  private labels: string[] = [
    'dog', 'cat', 'bird', 'fish', 'flower', 
    'tree', 'house', 'car', 'airplane', 'boat',
    'person', 'mountain', 'beach', 'city', 'sunset'
  ];

  // Simulate classification process
  async classifyImage(imageData: string): Promise<ImageClassification> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Select a random label and confidence score for the demo
    const randomIndex = Math.floor(Math.random() * this.labels.length);
    const prediction = this.labels[randomIndex];
    const confidence = Math.random() * 0.5 + 0.5; // Random confidence between 50% and 100%
    
    return {
      image: imageData,
      prediction,
      confidence: parseFloat(confidence.toFixed(2))
    };
  }

  // Get all possible labels (categories)
  getLabels(): string[] {
    return [...this.labels];
  }

  // Simulate a classification error
  async simulateError(): Promise<never> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    throw new Error('Classification failed. Please try again with a different image.');
  }
}

export default new MLClassificationService(); 