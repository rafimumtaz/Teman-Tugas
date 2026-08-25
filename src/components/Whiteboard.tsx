import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Triangle,
  MoveRight,
  Minus,
  Grid,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Sparkles,
  Type,
  Maximize2,
  RotateCcw,
  Sigma,
  Pi,
  Divide,
  Check,
  Hand,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { WhiteboardElement, WhiteboardPoint } from '../types';

interface WhiteboardProps {
  initialElements?: WhiteboardElement[];
  onElementsChange?: (elements: WhiteboardElement[]) => void;
  readOnly?: boolean;
  currentUser?: { id: string; name: string };
  partnerName?: string;
  roomTitle?: string;
  presetFormula?: string;
  pusherChannel?: any;
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'triangle' | 'axis' | 'text' | 'formula' | 'pan';
type BgMode = 'grid' | 'dots' | 'plain' | 'dark_grid';

const MATH_SYMBOLS = [
  { label: '∫ dx', latex: '\\int f(x) dx' },
  { label: '∑', latex: '\\sum_{i=1}^n' },
  { label: 'lim', latex: '\\lim_{x \\to 0}' },
  { label: '√x', latex: '\\sqrt{x}' },
  { label: 'dy/dx', latex: '\\frac{dy}{dx}' },
  { label: '±', latex: '\\pm' },
  { label: 'π', latex: '\\pi' },
  { label: 'θ', latex: '\\theta' },
  { label: 'Δ', latex: '\\Delta' },
  { label: '∞', latex: '\\infty' },
  { label: '≈', latex: '\\approx' },
  { label: 'λ', latex: '\\lambda' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: 'F=ma', latex: '\\vec{F} = m\\vec{a}' },
  { label: 'E=mc²', latex: 'E = mc^2' },
];

const COLORS = [
  '#0f172a', // Slate Black
  '#2563eb', // Royal Blue
  '#dc2626', // Crimson Red
  '#16a34a', // Emerald Green
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#f59e0b', // Amber
];

export const Whiteboard: React.FC<WhiteboardProps> = ({
  initialElements = [],
  onElementsChange,
  readOnly = false,
  currentUser = { id: 'usr_me', name: 'You' },
  partnerName = 'Peer Partner',
  roomTitle = 'Collaborative Whiteboard',
  presetFormula,
  pusherChannel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [elements, setElements] = useState<WhiteboardElement[]>(initialElements);
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [activeColor, setActiveColor] = useState<string>('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [bgMode, setBgMode] = useState<BgMode>('grid');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<WhiteboardPoint[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [isAddingText, setIsAddingText] = useState<boolean>(false);
  const [textPos, setTextPos] = useState<WhiteboardPoint | null>(null);
  const [customEquationInput, setCustomEquationInput] = useState<string>('');
  const [showFormulaPalette, setShowFormulaPalette] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pan and Zoom State
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // If preset formula arrives from homework question, inject it cleanly
  useEffect(() => {
    if (presetFormula && elements.length === 0) {
      const formulaEl: WhiteboardElement = {
        id: 'elem_init_formula',
        tool: 'formula',
        color: '#2563eb',
        size: 18,
        points: [{ x: 80, y: 80 }],
        formula: presetFormula,
        text: `Target Equation: ${presetFormula}`,
        authorId: 'system',
        authorName: 'Problem Statement',
        timestamp: Date.now(),
      };
      const newEls = [formulaEl];
      setElements(newEls);
      if (onElementsChange) onElementsChange(newEls);
    }
  }, [presetFormula]);

  // Sync canvas dimensions
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      redrawCanvas();
    }
  }, [elements, bgMode]);

  useEffect(() => {
    updateCanvasSize();
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  // Pusher real-time sync
  useEffect(() => {
    if (!pusherChannel) return;

    const handleAdd = (data: { element: WhiteboardElement }) => {
      setElements((prev) => {
        const updated = [...prev, data.element];
        if (onElementsChange) onElementsChange(updated);
        return updated;
      });
    };

    const handleClear = () => {
      setElements([]);
      if (onElementsChange) onElementsChange([]);
    };

    const handleFullSync = (data: { elements: WhiteboardElement[] }) => {
      setElements(data.elements);
      if (onElementsChange) onElementsChange(data.elements);
    };

    pusherChannel.bind('room-whiteboard-add', handleAdd);
    pusherChannel.bind('room-whiteboard-clear', handleClear);
    pusherChannel.bind('room-whiteboard-full-sync', handleFullSync);

    return () => {
      pusherChannel.unbind('room-whiteboard-add', handleAdd);
      pusherChannel.unbind('room-whiteboard-clear', handleClear);
      pusherChannel.unbind('room-whiteboard-full-sync', handleFullSync);
    };
  }, [pusherChannel, currentUser.id]);

  // Helper to trigger events via server API
  const triggerEvent = (eventName: string, eventData: any) => {
    if (pusherChannel) {
      const socketId = pusherChannel.pusher?.connection?.socket_id;
      fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: pusherChannel.name,
          event: eventName,
          data: eventData,
          socket_id: socketId
        })
      }).catch(console.error);
    }
  };

  const broadcastAdd = (el: WhiteboardElement) => {
    triggerEvent('room-whiteboard-add', { element: el });
  };

  const broadcastClear = () => {
    triggerEvent('room-whiteboard-clear', {});
  };

  // Main canvas redraw engine
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // 1. Draw Background
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    
    // Draw solid background first without transform
    if (bgMode === 'dark_grid') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    } else if (bgMode === 'grid' || bgMode === 'plain') {
      ctx.fillStyle = bgMode === 'grid' ? '#f8fafc' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else if (bgMode === 'dots') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // Apply transform for grid and elements
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    const startX = -pan.x / scale;
    const startY = -pan.y / scale;
    const endX = (width - pan.x) / scale;
    const endY = (height - pan.y) / scale;

    if (bgMode === 'dark_grid' || bgMode === 'grid') {
      ctx.strokeStyle = bgMode === 'dark_grid' ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 1 / scale;
      const step = 30;
      
      const offsetX = startX % step;
      const offsetY = startY % step;
      
      for (let x = startX - offsetX - step; x <= endX + step; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY - offsetY - step; y <= endY + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
    } else if (bgMode === 'dots') {
      ctx.fillStyle = '#cbd5e1';
      const step = 25;
      
      const offsetX = startX % step;
      const offsetY = startY % step;
      
      for (let x = startX - offsetX - step; x <= endX + step; x += step) {
        for (let y = startY - offsetY - step; y <= endY + step; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5 / scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw Elements
    elements.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = el.size * 3.5;
      }

      if (el.tool === 'pen' || el.tool === 'highlighter') {
        if (el.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        } else if (el.points.length === 1) {
          ctx.beginPath();
          ctx.arc(el.points[0].x, el.points[0].y, el.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (el.tool === 'line' && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (el.tool === 'arrow' && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headlen = 14 + el.size;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (el.tool === 'rect' && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        const w = end.x - start.x;
        const h = end.y - start.y;
        ctx.strokeRect(start.x, start.y, w, h);
      } else if (el.tool === 'circle' && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.tool === 'triangle' && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x + (end.x - start.x) / 2, start.y);
        ctx.lineTo(start.x, end.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();
      } else if (el.tool === 'axis' && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        ctx.lineWidth = 2;
        // X axis
        ctx.beginPath();
        ctx.moveTo(start.x, cy);
        ctx.lineTo(end.x, cy);
        ctx.stroke();
        // Y axis
        ctx.beginPath();
        ctx.moveTo(cx, start.y);
        ctx.lineTo(cx, end.y);
        ctx.stroke();
        // Origin label
        ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText('(0,0)', cx + 4, cy - 4);
      } else if (el.tool === 'text' || el.tool === 'formula') {
        const pt = el.points[0] || { x: 50, y: 50 };
        ctx.font = el.tool === 'formula' ? 'bold 18px "Cambria Math", "Latin Modern Math", serif' : '15px Inter, system-ui, sans-serif';

        // Formula background pill
        if (el.tool === 'formula') {
          const text = el.formula || el.text || '';
          const metrics = ctx.measureText(text);
          ctx.fillStyle = bgMode === 'dark_grid' ? '#1e293b' : '#eff6ff';
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(pt.x - 8, pt.y - 22, metrics.width + 16, 32, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = bgMode === 'dark_grid' ? '#93c5fd' : '#1d4ed8';
          ctx.fillText(text, pt.x, pt.y);
        } else {
          ctx.fillStyle = el.color;
          ctx.fillText(el.text || '', pt.x, pt.y);
        }
      }

      ctx.restore();
    });

    // 3. Draw in-progress live stroke
    if (isDrawing && currentStroke.length > 0) {
      ctx.save();
      ctx.strokeStyle = activeColor;
      ctx.fillStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeTool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = strokeWidth * 3.5;
      }

      if (activeTool === 'pen' || activeTool === 'highlighter') {
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) {
          ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
        ctx.stroke();
      } else if (activeTool === 'line' && currentStroke.length >= 2) {
        const start = currentStroke[0];
        const end = currentStroke[currentStroke.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (activeTool === 'arrow' && currentStroke.length >= 2) {
        const start = currentStroke[0];
        const end = currentStroke[currentStroke.length - 1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headlen = 14 + strokeWidth;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (activeTool === 'rect' && currentStroke.length >= 2) {
        const start = currentStroke[0];
        const end = currentStroke[currentStroke.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (activeTool === 'circle' && currentStroke.length >= 2) {
        const start = currentStroke[0];
        const end = currentStroke[currentStroke.length - 1];
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeTool === 'triangle' && currentStroke.length >= 2) {
        const start = currentStroke[0];
        const end = currentStroke[currentStroke.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x + (end.x - start.x) / 2, start.y);
        ctx.lineTo(start.x, end.y);
        ctx.lineTo(end.x, end.y);
        ctx.closePath();
        ctx.stroke();
      } else if (activeTool === 'axis' && currentStroke.length >= 2) {
        const start = currentStroke[0];
        const end = currentStroke[currentStroke.length - 1];
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        ctx.beginPath();
        ctx.moveTo(start.x, cy);
        ctx.lineTo(end.x, cy);
        ctx.moveTo(cx, start.y);
        ctx.lineTo(cx, end.y);
        ctx.stroke();
      }
      ctx.restore();
    }
    
    ctx.restore();
  }, [elements, bgMode, isDrawing, currentStroke, activeTool, activeColor, strokeWidth, pan, scale]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): WhiteboardPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    // Middle click or Pan tool
    const isMiddleClick = 'button' in e && (e as React.MouseEvent).button === 1;
    if (isMiddleClick || activeTool === 'pan') {
      setIsPanning(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setLastPanPoint({ x: clientX, y: clientY });
      return;
    }

    const pt = getCanvasCoords(e);
    if (!pt) return;

    if (activeTool === 'text') {
      setTextPos(pt);
      setIsAddingText(true);
      return;
    }

    if (activeTool === 'eraser') {
      // Find and remove elements close to point
      const threshold = 18;
      const filtered = elements.filter((el) => {
        return !el.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < threshold);
      });
      if (filtered.length !== elements.length) {
        setRedoStack([]);
        setElements(filtered);
        if (onElementsChange) onElementsChange(filtered);
      }
      return;
    }

    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    if (isPanning && lastPanPoint) {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const dx = clientX - lastPanPoint.x;
      const dy = clientY - lastPanPoint.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: clientX, y: clientY });
      return;
    }

    if (!isDrawing) return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentStroke((prev) => [...prev, pt]);
    } else {
      // Shape tools: start point + moving end point
      setCurrentStroke((prev) => [prev[0], pt]);
    }
  };

  const handlePointerUp = () => {
    if (readOnly) return;

    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 0) {
      const newEl: WhiteboardElement = {
        id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        tool: activeTool,
        color: activeColor,
        size: strokeWidth,
        points: currentStroke,
        authorId: currentUser.id,
        authorName: currentUser.name,
        timestamp: Date.now(),
      };

      const updated = [...elements, newEl];
      setRedoStack([]);
      setElements(updated);
      if (onElementsChange) onElementsChange(updated);
      broadcastAdd(newEl);
    }
    setCurrentStroke([]);
  };

  const handleAddTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !textPos) {
      setIsAddingText(false);
      setTextInput('');
      return;
    }

    const newEl: WhiteboardElement = {
      id: `elem_txt_${Date.now()}`,
      tool: 'text',
      color: activeColor,
      size: strokeWidth,
      points: [textPos],
      text: textInput.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      timestamp: Date.now(),
    };

    const updated = [...elements, newEl];
    setRedoStack([]);
    setElements(updated);
    if (onElementsChange) onElementsChange(updated);
    broadcastAdd(newEl);

    setIsAddingText(false);
    setTextInput('');
    setTextPos(null);
  };

  const insertFormulaStamp = (latexStr: string) => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width / (window.devicePixelRatio || 1) : 400;
    const h = canvas ? canvas.height / (window.devicePixelRatio || 1) : 300;

    const newEl: WhiteboardElement = {
      id: `elem_form_${Date.now()}`,
      tool: 'formula',
      color: activeColor,
      size: 18,
      points: [{ x: w / 2 - 80, y: h / 2 }],
      formula: latexStr,
      text: latexStr,
      authorId: currentUser.id,
      authorName: currentUser.name,
      timestamp: Date.now(),
    };

    const updated = [...elements, newEl];
    setRedoStack([]);
    setElements(updated);
    if (onElementsChange) onElementsChange(updated);
    broadcastAdd(newEl);
    setShowFormulaPalette(false);
    showToast(`Rumus ${latexStr} disematkan ke kanvas!`);
  };

  const broadcastFullSync = (els: WhiteboardElement[]) => {
    triggerEvent('room-whiteboard-full-sync', { elements: els });
  };

  const handleUndo = () => {
    if (elements.length === 0) return;
    const last = elements[elements.length - 1];
    const remaining = elements.slice(0, -1);
    setRedoStack((prev) => [...prev, [last]]);
    setElements(remaining);
    if (onElementsChange) onElementsChange(remaining);
    broadcastFullSync(remaining);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextGroup = redoStack[redoStack.length - 1];
    const updated = [...elements, ...nextGroup];
    setRedoStack((prev) => prev.slice(0, -1));
    setElements(updated);
    if (onElementsChange) onElementsChange(updated);
    broadcastFullSync(updated);
  };

  const handleClear = () => {
    if (elements.length === 0) return;
    if (window.confirm('Bersihkan seluruh kanvas papan tulis?')) {
      setRedoStack((prev) => [...prev, elements]);
      setElements([]);
      if (onElementsChange) onElementsChange([]);
      broadcastClear();
      showToast('Papan tulis dikosongkan.');
    }
  };

  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `TemanTugas_Whiteboard_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    showToast('Gambar papan tulis berhasil diunduh!');
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  // Add passive: false to wheel event listener for preventDefault to work
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomFactor = 0.001;
        const delta = -e.deltaY * zoomFactor;
        const newScale = Math.min(Math.max(0.1, scale * (1 + delta)), 5);
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        const mousePointTo = {
          x: (clientX - pan.x) / scale,
          y: (clientY - pan.y) / scale,
        };

        const newPan = {
          x: clientX - mousePointTo.x * newScale,
          y: clientY - mousePointTo.y * newScale,
        };

        setScale(newScale);
        setPan(newPan);
      } else {
        setPan(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [scale, pan]);

  return (
    <div id="whiteboard-container" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md flex items-center gap-2 animate-fade-in">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Whiteboard Header */}
      <div className="bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between gap-3 text-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wide text-slate-900 uppercase">{roomTitle}</span>
          <span className="hidden sm:inline-block text-slate-300 text-xs">|</span>
          <span className="hidden sm:inline-block text-xs text-slate-500">
            Kolaborator: <strong className="text-slate-800">{partnerName}</strong> & <strong className="text-slate-800">{currentUser.name}</strong>
          </span>
        </div>

        {/* Top Actions: Undo, Redo, Background Mode, Export */}
        <div className="flex items-center gap-1.5">
          <button
            id="wb-btn-undo"
            onClick={handleUndo}
            disabled={elements.length === 0 || readOnly}
            title="Urungkan (Undo)"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            id="wb-btn-redo"
            onClick={handleRedo}
            disabled={redoStack.length === 0 || readOnly}
            title="Ulangi (Redo)"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Grid Background Switcher */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setBgMode('grid')}
              className={`px-2 py-1 rounded transition cursor-pointer ${bgMode === 'grid' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              title="Grid Kotak Matematika"
            >
              Grid
            </button>
            <button
              onClick={() => setBgMode('dots')}
              className={`px-2 py-1 rounded transition cursor-pointer ${bgMode === 'dots' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              title="Dot Matrix"
            >
              Dots
            </button>
            <button
              onClick={() => setBgMode('dark_grid')}
              className={`px-2 py-1 rounded transition cursor-pointer ${bgMode === 'dark_grid' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              title="Dark Mode Grid"
            >
              Dark
            </button>
            <button
              onClick={() => setBgMode('plain')}
              className={`px-2 py-1 rounded transition cursor-pointer ${bgMode === 'plain' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              title="Putih Polos"
            >
              Plain
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Zoom Controls */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={zoomOut}
              className="p-1 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="px-2 text-slate-600 hover:text-slate-900 font-mono text-[10px] flex items-center justify-center cursor-pointer font-bold"
              title="Reset View"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-1 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            id="wb-btn-export"
            onClick={handleExportImage}
            title="Unduh Tangkapan Layar (PNG)"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas + Floating Toolbar Area */}
      <div ref={containerRef} className={`flex-1 relative w-full h-full overflow-hidden bg-slate-50 ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}>
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-full h-full block touch-none"
        />

        {/* Text Input Modal when Clicking Canvas */}
        {isAddingText && textPos && (
          <form
            onSubmit={handleAddTextSubmit}
            style={{ left: `${textPos.x}px`, top: `${textPos.y}px` }}
            className="absolute z-40 bg-white border-2 border-indigo-600 rounded-xl shadow-2xl p-2 flex items-center gap-2"
          >
            <input
              type="text"
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Tulis catatan atau variabel..."
              className="bg-slate-50 text-slate-900 text-xs px-3 py-1.5 rounded-lg outline-none border border-slate-200 w-56 focus:border-indigo-600"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingText(false);
                setTextPos(null);
              }}
              className="text-slate-400 hover:text-slate-700 text-xs px-1"
            >
              ✕
            </button>
          </form>
        )}

        {/* Floating Tool Palette (Left side or Bottom center) */}
        {!readOnly && (
          <div className="absolute left-3 top-3 z-30 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 p-2 rounded-2xl shadow-xl">
            {/* Drawing Tools */}
            <div className="flex flex-col gap-1">
              <button
                id="tool-pan"
                onClick={() => setActiveTool('pan')}
                title="Geser Kanvas (Pan)"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'pan' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Hand className="w-4 h-4" />
              </button>

              <div className="h-px bg-slate-200 my-1" />

              <button
                id="tool-pen"
                onClick={() => setActiveTool('pen')}
                title="Pena Matematika (Pen)"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'pen' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                id="tool-highlighter"
                onClick={() => setActiveTool('highlighter')}
                title="Stabilo Transparan (Highlighter)"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'highlighter' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Highlighter className="w-4 h-4" />
              </button>

              <button
                id="wb-btn-clear"
                onClick={handleClear}
                disabled={elements.length === 0 || readOnly}
                title="Bersihkan Semua (Clear All)"
                className="p-2 rounded-xl transition cursor-pointer text-rose-500 hover:text-white hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                id="tool-eraser"
                onClick={() => setActiveTool('eraser')}
                title="Penghapus (Eraser)"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'eraser' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Eraser className="w-4 h-4" />
              </button>

              <button
                id="tool-line"
                onClick={() => setActiveTool('line')}
                title="Garis Lurus (Line)"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'line' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                id="tool-arrow"
                onClick={() => setActiveTool('arrow')}
                title="Panah Vektor / Alur (Vector Arrow)"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'arrow' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <MoveRight className="w-4 h-4" />
              </button>

              <button
                id="tool-rect"
                onClick={() => setActiveTool('rect')}
                title="Kotak / Diagram Balok"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'rect' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                id="tool-circle"
                onClick={() => setActiveTool('circle')}
                title="Lingkaran / Diagram Venn"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'circle' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Circle className="w-4 h-4" />
              </button>

              <button
                id="tool-triangle"
                onClick={() => setActiveTool('triangle')}
                title="Segitiga Trigonometri"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'triangle' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Triangle className="w-4 h-4" />
              </button>

              <button
                id="tool-axis"
                onClick={() => setActiveTool('axis')}
                title="Sumbu Koordinat Kartesius (X-Y)"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'axis' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Grid className="w-4 h-4" />
              </button>

              <button
                id="tool-text"
                onClick={() => setActiveTool('text')}
                title="Sisipkan Teks Catatan"
                className={`p-2 rounded-xl transition cursor-pointer ${activeTool === 'text' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Type className="w-4 h-4" />
              </button>

              <div className="h-px bg-slate-200 my-1" />

              {/* Math Formula Palette Trigger */}
              <button
                id="tool-formula-palette"
                onClick={() => setShowFormulaPalette(!showFormulaPalette)}
                title="Palet Rumus & Simbol Matematika"
                className={`p-2 rounded-xl transition cursor-pointer ${showFormulaPalette ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
              >
                <Sigma className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Formula Quick Palette */}
        {showFormulaPalette && !readOnly && (
          <div className="absolute left-16 top-3 z-40 bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-2xl shadow-2xl w-72 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Sigma className="w-3.5 h-3.5" /> Simbol & Rumus Cepat
              </span>
              <button
                onClick={() => setShowFormulaPalette(false)}
                className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {MATH_SYMBOLS.map((sym, idx) => (
                <button
                  key={idx}
                  onClick={() => insertFormulaStamp(sym.latex)}
                  className="bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-xs font-mono py-1.5 px-2 rounded-lg text-slate-800 transition text-center cursor-pointer"
                  title={sym.latex}
                >
                  {sym.label}
                </button>
              ))}
            </div>

            {/* Custom Formula Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-600 font-semibold">Ketik Rumus Kustom (LaTeX / Teks):</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customEquationInput}
                  onChange={(e) => setCustomEquationInput(e.target.value)}
                  placeholder="Contoh: \int_0^\infty e^{-x^2} dx"
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs px-2.5 py-1.5 rounded-lg focus:border-emerald-600 outline-none placeholder:text-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customEquationInput.trim()) {
                      insertFormulaStamp(customEquationInput.trim());
                      setCustomEquationInput('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (customEquationInput.trim()) {
                      insertFormulaStamp(customEquationInput.trim());
                      setCustomEquationInput('');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                >
                  Pasang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Floating Properties Bar (Colors & Stroke Size) */}
        {!readOnly && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 px-4 py-2 rounded-2xl shadow-xl text-slate-700">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${activeColor === c ? 'scale-125 ring-2 ring-indigo-600 ring-offset-2 ring-offset-white' : 'hover:scale-110 opacity-80 hover:opacity-100'}`}
                  title={c}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Stroke Thickness Picker */}
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <span className="text-[11px] text-slate-500">Tebal:</span>
              <input
                type="range"
                min="1"
                max="16"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-16 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <span className="w-4 text-center font-mono text-[11px] font-bold text-slate-900">{strokeWidth}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
