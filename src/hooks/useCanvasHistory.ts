import { useState, useCallback } from 'react';

interface Line {
  tool: string;
  points: number[];
  color: string;
  size: number;
}

export const useCanvasHistory = () => {
  const [lines, setLines] = useState<Line[]>([]);
  const [history, setHistory] = useState<Line[][]>([]);
  const [redoStack, setRedoStack] = useState<Line[][]>([]);

  // Add a new line to the canvas
  const addLine = useCallback((line: Line) => {
    setLines(prevLines => {
      const newLines = [...prevLines, line];
      setHistory(prev => [...prev, prevLines]);
      setRedoStack([]);
      return newLines;
    });
  }, []);

  // Update the last line (during drawing)
  const updateLastLine = useCallback((updatedPoints: number[]) => {
    setLines(prevLines => {
      if (prevLines.length === 0) return prevLines;
      
      const lastIndex = prevLines.length - 1;
      const lastLine = prevLines[lastIndex];
      
      // Create a new array to ensure state update
      const newLines = [...prevLines];
      newLines[lastIndex] = {
        ...lastLine,
        points: updatedPoints,
      };
      
      return newLines;
    });
  }, []);

  // Complete a line (when drawing ends)
  const completeLine = useCallback(() => {
    setHistory(prev => [...prev, lines]);
    setRedoStack([]);
  }, [lines]);

  // Undo the last action
  const undo = useCallback(() => {
    if (history.length === 0) return;
    
    const previousLines = history[history.length - 1];
    setLines(previousLines);
    
    setHistory(prev => prev.slice(0, -1));
    setRedoStack(prev => [lines, ...prev]);
  }, [history, lines]);

  // Redo the last undone action
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    const nextLines = redoStack[0];
    setLines(nextLines);
    
    setHistory(prev => [...prev, lines]);
    setRedoStack(prev => prev.slice(1));
  }, [redoStack, lines]);

  // Clear the canvas
  const clearCanvas = useCallback(() => {
    setHistory(prev => [...prev, lines]);
    setLines([]);
    setRedoStack([]);
  }, [lines]);

  return {
    lines,
    setLines,
    addLine,
    updateLastLine,
    completeLine,
    undo,
    redo,
    clearCanvas,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
  };
};

export default useCanvasHistory; 