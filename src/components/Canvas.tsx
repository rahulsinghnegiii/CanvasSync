import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Circle, Text, Group, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import useCanvasHistory from '../hooks/useCanvasHistory';
import webSocketService from '../services/webSocketService';
import type { WebSocketMessage, User } from '../types';

interface CanvasProps {
  width: number;
  height: number;
  toolType: 'brush' | 'eraser';
  brushColor: string;
  brushSize: number;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport?: (dataUrl: string) => void;
}

interface CanvasHandle {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  exportToPNG: () => string;
  addImage: (dataUrl: string) => void;
  updateCanvasDimensions: (newWidth: number, newHeight: number) => void;
}

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  color: string;
  username: string;
}

interface ImageElement {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDragging: boolean;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ 
  width, 
  height, 
  toolType, 
  brushColor, 
  brushSize,
  onUndo,
  onRedo,
  onExport
}, ref) => {
  const [isDrawing, setIsDrawing] = React.useState(false);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [cursors, setCursors] = React.useState<CursorPosition[]>([]);
  const [images, setImages] = useState<ImageElement[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isMovingImage, setIsMovingImage] = useState(false);
  
  const {
    lines,
    setLines,
    addLine,
    updateLastLine,
    completeLine,
    undo: undoHistory,
    redo: redoHistory,
    clearCanvas,
    canUndo,
    canRedo
  } = useCanvasHistory();

  // Load image from data URL
  const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // Add image to canvas
  const addImage = async (dataUrl: string) => {
    try {
      // Generate a unique ID for the image
      const id = `img_${Date.now()}`;
      
      // Calculate image dimensions
      const img = await loadImage(dataUrl);
      const aspectRatio = img.width / img.height;
      
      // Ensure the image fits within the canvas
      const maxWidth = width * 0.5;
      const maxHeight = height * 0.5;
      
      let imgWidth = img.width;
      let imgHeight = img.height;
      
      if (imgWidth > maxWidth) {
        imgWidth = maxWidth;
        imgHeight = imgWidth / aspectRatio;
      }
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      // Position the image in the center of the canvas
      const x = (width - imgWidth) / 2;
      const y = (height - imgHeight) / 2;
      
      // Create a new image element
      const newImage: ImageElement = {
        id,
        imageUrl: dataUrl,
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        isDragging: false
      };
      
      // Add to the list of images
      setImages((prev) => [...prev, newImage]);
      
      // Share image with other collaborators
      webSocketService.sendMessage('drawing', {
        type: 'image',
        imageUrl: dataUrl,
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        id
      });
      
      // Set as selected
      setSelectedImageId(id);
      
      return id;
    } catch (error) {
      console.error('Error adding image to canvas:', error);
      return null;
    }
  };

  // Expose canvas methods via ref
  useImperativeHandle(ref, () => ({
    undo: () => {
      undoHistory();
      if (onUndo) onUndo();
    },
    redo: () => {
      redoHistory();
      if (onRedo) onRedo();
    },
    clear: () => {
      clearCanvas();
      setImages([]);
      // Broadcast clear event
      webSocketService.sendMessage('clear', {});
    },
    exportToPNG: () => {
      if (!stageRef.current) return Promise.reject('Canvas is not available');
      
      // Hide transformers and controls when exporting
      const currentSelection = selectedImageId;
      setSelectedImageId(null);
      
      // Use setTimeout to ensure the transformer is hidden before exporting
      return new Promise<string>((resolve, reject) => {
        try {
          setTimeout(() => {
            try {
              const dataUrl = stageRef.current.toDataURL({
                pixelRatio: 2,
                mimeType: 'image/png'
              });
              
              // Restore selection after export
              setSelectedImageId(currentSelection);
              resolve(dataUrl);
            } catch (error) {
              console.error('Error generating PNG:', error);
              setSelectedImageId(currentSelection);
              reject(error);
            }
          }, 10);
        } catch (error) {
          console.error('Error in exportToPNG:', error);
          setSelectedImageId(currentSelection);
          reject(error);
        }
      });
    },
    addImage: (dataUrl: string) => {
      return addImage(dataUrl);
    },
    updateCanvasDimensions: (newWidth: number, newHeight: number) => {
      // Only update if stage reference exists
      if (stageRef.current) {
        // Get current dimensions
        const currentWidth = stageRef.current.width();
        const currentHeight = stageRef.current.height();
        
        // Only update if there's a significant change (more than 5px)
        if (Math.abs(currentWidth - newWidth) > 5 || Math.abs(currentHeight - newHeight) > 5) {
          console.log(`Canvas dimensions updated: ${newWidth}x${newHeight}`);
          
          // Directly update stage dimensions without causing any state updates
        stageRef.current.width(newWidth);
        stageRef.current.height(newHeight);
        stageRef.current.batchDraw();
        }
      }
    }
  }));

  // Set initial stage dimensions
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.width(width);
      stageRef.current.height(height);
      stageRef.current.batchDraw();
    }
  }, []); // Only run once on initial render

  // Listen for WebSocket messages
  useEffect(() => {
    const unsubscribe = webSocketService.onMessage((message: WebSocketMessage) => {
      if (message.type === 'drawing') {
        // Handle drawing data from other users
        const data = message.payload;
        
        // Skip our own updates
        if (message.userId === webSocketService.getCurrentUser()?.username) {
          return;
        }
        
        if (data.type === 'image') {
          // Handle image addition
          setImages(prev => [
            ...prev, 
            {
              id: data.id,
              imageUrl: data.imageUrl,
              x: data.x,
              y: data.y,
              width: data.width,
              height: data.height,
              isDragging: false
            }
          ]);
        } else {
          // Handle line drawing
          setLines(prev => [...prev, data]);
        }
      } else if (message.type === 'cursor') {
        // Handle cursor position updates
        const { x, y } = message.payload;
        const user = webSocketService.getParticipants().find(p => p.username === message.userId);
        
        if (user && message.userId !== webSocketService.getCurrentUser()?.username) {
          setCursors(prev => {
            // Update cursor if exists, add if not
            const cursorExists = prev.some(c => c.userId === message.userId);
            if (cursorExists) {
              return prev.map(c => c.userId === message.userId 
                ? { ...c, x, y } 
                : c
              );
            } else {
              return [
                ...prev, 
                { 
                  x, 
                  y, 
                  userId: message.userId,
                  color: user.avatarColor || '#000000',
                  username: user.username 
                }
              ];
            }
          });
        }
      } else if (message.type === 'clear') {
        // Handle clear canvas event
        if (message.userId !== webSocketService.getCurrentUser()?.username) {
          clearCanvas();
          setImages([]);
        }
      }
    });
    
    return unsubscribe;
  }, [clearCanvas, setLines]);

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedImageId && transformerRef.current) {
      // Find the node by id
      const node = stageRef.current?.findOne(`#${selectedImageId}`);
      if (node) {
        // Attach the transformer to the selected node
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      // Clear selection
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedImageId]);

  // Handle undo
  const handleUndo = useCallback(() => {
    undoHistory();
    if (onUndo) onUndo();
  }, [undoHistory, onUndo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    redoHistory();
    if (onRedo) onRedo();
  }, [redoHistory, onRedo]);

  // Register keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          // Ctrl+Shift+Z or Cmd+Shift+Z (Redo)
          if (canRedo) {
            handleRedo();
          }
        } else {
          // Ctrl+Z or Cmd+Z (Undo)
          if (canUndo) {
            handleUndo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleRedo, handleUndo, canRedo, canUndo]);

  const handleExport = () => {
    if (!stageRef.current || !onExport) return;
    
    const dataUrl = stageRef.current.toDataURL({ 
      pixelRatio: 2,
      mimeType: 'image/png' 
    });
    
    onExport(dataUrl);
  };

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // Check if clicked on stage but not on an image
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      // Deselect image
      setSelectedImageId(null);
    }
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // If we're in resize/move mode or clicked on an image, don't start drawing
    if (isResizing || isMovingImage || selectedImageId) {
      return;
    }
    
    // Don't draw if we clicked on an image
    const clickedOnImage = e.target.findAncestor('Image');
    if (clickedOnImage) {
      return;
    }
    
    setIsDrawing(true);
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      const newLine = {
        tool: toolType,
        points: [pos.x, pos.y],
        color: toolType === 'eraser' ? '#ffffff' : brushColor,
        size: brushSize,
      };
      
      // Add line locally
      addLine(newLine);
      
      // Send to other users
      webSocketService.sendDrawingData(newLine);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    // Always send cursor position for collaboration
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      webSocketService.sendCursorPosition({ x: pos.x, y: pos.y });
    }
    
    if (!isDrawing) {
      return;
    }
    
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    const lastLine = lines[lines.length - 1];
    if (!lastLine) return;

    // Add point to last line
    const newPoints = [...lastLine.points, point.x, point.y];
    updateLastLine(newPoints);
    
    // Send updated line to other users
    webSocketService.sendDrawingData({
      ...lastLine,
      points: newPoints
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (lines.length > 0) {
      completeLine();
    }
  };

  // Select image
  const handleSelectImage = (id: string) => {
    setSelectedImageId(id);
  };

  // Handle image resize
  const handleTransformEnd = () => {
    setIsResizing(false);
    
    // Get the modified node
    const node = stageRef.current?.findOne(`#${selectedImageId}`);
    if (!node || !selectedImageId) return;
    
    // Get the new properties
    const newX = node.x();
    const newY = node.y();
    const newWidth = node.width() * node.scaleX();
    const newHeight = node.height() * node.scaleY();
    
    // Update the image in our local state
    setImages(prev => 
      prev.map(img => 
        img.id === selectedImageId 
          ? {
              ...img,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight
            }
          : img
      )
    );
    
    // Reset the scale on the node since we've applied it to the dimensions
    node.scaleX(1);
    node.scaleY(1);
    
    // Send update to other users
    const updatedImage = images.find(img => img.id === selectedImageId);
    if (updatedImage) {
      webSocketService.sendMessage('drawing', {
        type: 'image',
        id: selectedImageId,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        imageUrl: updatedImage.imageUrl
      });
    }
  };
  
  // Handle image drag start
  const handleImageDragStart = (id: string) => {
    setSelectedImageId(id);
    setIsMovingImage(true);
    setImages(prev => 
      prev.map(img => ({
        ...img,
        isDragging: img.id === id
      }))
    );
  };

  // Handle image drag end
  const handleImageDragEnd = (id: string, x: number, y: number) => {
    setIsMovingImage(false);
    setImages(prev => 
      prev.map(img => ({
        ...img,
        isDragging: false,
        x: img.id === id ? x : img.x,
        y: img.id === id ? y : img.y
      }))
    );
    
    // Broadcast image position update
    const updatedImage = images.find(img => img.id === id);
    if (updatedImage) {
      webSocketService.sendMessage('drawing', {
        type: 'image',
        id,
        x,
        y,
        width: updatedImage.width,
        height: updatedImage.height,
        imageUrl: updatedImage.imageUrl
      });
    }
  };

  // Handle image drag move
  const handleImageDragMove = (id: string, x: number, y: number) => {
    // Update image position in real-time during drag
    setImages(prev => 
      prev.map(img => ({
        ...img,
        x: img.id === id ? x : img.x,
        y: img.id === id ? y : img.y
      }))
    );
  };

  // Render control buttons for an image
  const renderImageControls = (img: ImageElement) => {
    if (img.id !== selectedImageId) return null;
    
    const controlSize = 28; // Even larger controls for better visibility
    const padding = 5;
    
    return (
      <Group>
        {/* Drag handle */}
        <Group
          x={img.x + img.width / 2 - controlSize / 2}
          y={img.y - controlSize - 5}
          width={controlSize}
          height={controlSize}
          onMouseDown={(e) => {
            e.cancelBubble = true;
            handleImageDragStart(img.id);
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'pointer';
            }
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'default';
            }
          }}
        >
          <Rect
            width={controlSize}
            height={controlSize}
            fill="#4285F4"
            cornerRadius={5}
            shadowColor="black"
            shadowBlur={3}
            shadowOpacity={0.4}
            strokeWidth={1}
            stroke="#ffffff"
          />
          <Text
            text="↕"
            fontSize={18}
            fontStyle="bold"
            fill="white"
            width={controlSize}
            height={controlSize}
            align="center"
            verticalAlign="middle"
          />
        </Group>

        {/* Drag button tooltip */}
        <Group
          x={img.x + img.width / 2 - 50}
          y={img.y - controlSize - 35}
          visible={!img.isDragging}
        >
          <Rect
            width={100}
            height={25}
            fill="rgba(0,0,0,0.7)"
            cornerRadius={3}
          />
          <Text
            text="Click to drag"
            fontSize={12}
            fill="white"
            width={100}
            height={25}
            align="center"
            verticalAlign="middle"
          />
        </Group>
        
        {/* Delete button */}
        <Group
          x={img.x + img.width + 5}
          y={img.y}
          width={controlSize}
          height={controlSize}
          onMouseDown={(e) => {
            e.cancelBubble = true;
            // Remove image from state
            setImages(prev => prev.filter(i => i.id !== img.id));
            setSelectedImageId(null);
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'pointer';
            }
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'default';
            }
          }}
        >
          <Rect
            width={controlSize}
            height={controlSize}
            fill="#DB4437"
            cornerRadius={5}
            shadowColor="black"
            shadowBlur={3}
            shadowOpacity={0.4}
            strokeWidth={1}
            stroke="#ffffff"
          />
          <Text
            text="×"
            fontSize={18}
            fontStyle="bold"
            fill="white"
            width={controlSize}
            height={controlSize}
            align="center"
            verticalAlign="middle"
          />
        </Group>

        {/* Drag instructions - shown when drag mode is active */}
        {img.isDragging && (
          <Group
            x={img.x + img.width / 2 - 75}
            y={img.y + img.height / 2 - 15}
            width={150}
            height={30}
          >
            <Rect
              width={150}
              height={30}
              fill="rgba(0,0,0,0.7)"
              cornerRadius={5}
            />
            <Text
              text="Click and drag to move"
              fontSize={12}
              fill="white"
              width={150}
              height={30}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )}
      </Group>
    );
  };

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onClick={handleStageClick}
      ref={stageRef}
      style={{ 
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}
    >
      <Layer>
        {/* Draw images */}
        {images.map((img) => (
          <React.Fragment key={img.id}>
            <KonvaImage
              id={img.id}
              x={img.x}
              y={img.y}
              width={img.width}
              height={img.height}
              image={(() => {
                const imageObj = new window.Image();
                imageObj.src = img.imageUrl;
                return imageObj;
              })()}
              onClick={(e) => {
                e.cancelBubble = true;
                handleSelectImage(img.id);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                handleSelectImage(img.id);
              }}
              draggable={img.isDragging}
              onDragStart={(e) => {
                e.cancelBubble = true;
              }}
              onDragMove={(e) => {
                handleImageDragMove(img.id, e.target.x(), e.target.y());
              }}
              onDragEnd={(e) => {
                handleImageDragEnd(img.id, e.target.x(), e.target.y());
              }}
              shadowColor={img.id === selectedImageId ? 'blue' : 'transparent'}
              shadowBlur={img.id === selectedImageId ? 5 : 0}
              shadowOpacity={0.3}
              name="Image"
              opacity={img.isDragging ? 0.7 : 1}
              listening={true}
              onMouseEnter={(e) => {
                // Change cursor only when in drag mode
                if (img.isDragging) {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = 'move';
                  }
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'default';
                }
              }}
            />
            {renderImageControls(img)}
          </React.Fragment>
        ))}
        
        {/* Draw lines */}
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke={line.color}
            strokeWidth={line.size}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation={
              line.tool === 'eraser' ? 'destination-out' : 'source-over'
            }
          />
        ))}
        
        {/* Transformer for resizing images */}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize to within canvas bounds
            if (
              newBox.width < 10 || 
              newBox.height < 10 ||
              newBox.x < 0 ||
              newBox.y < 0 ||
              newBox.x + newBox.width > width ||
              newBox.y + newBox.height > height
            ) {
              return oldBox;
            }
            setIsResizing(true);
            return newBox;
          }}
          onTransformEnd={handleTransformEnd}
          anchorSize={10}
          rotateEnabled={false}
          keepRatio={true}
        />
        
        {/* Render other users' cursors */}
        {cursors.map((cursor) => (
          <Group key={cursor.userId} x={cursor.x} y={cursor.y}>
            <Circle
              radius={5}
              fill={cursor.color}
              stroke="#ffffff"
              strokeWidth={1}
            />
            <Text
              text={cursor.username}
              fontSize={12}
              fill={cursor.color}
              padding={3}
              offsetY={-15}
              background="#ffffff"
            />
          </Group>
        ))}
      </Layer>
    </Stage>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas; 