import React, { useState, useEffect, useRef } from 'react';
import { Layers, Square, Circle, Link, Type, Image, Zap } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '../../components/ui/tooltip';
import { Switch } from '../../components/ui/switch';
import { initializeEngine ,EngineContext,  useShapeOperations } from '../../core/engine/wasm-bridge';

const Canvas = () => {
    const { createShape, getAllShapes } = useShapeOperations();
    const svgRef = useRef<SVGSVGElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [selectedTool] = useState('rectangle');
    

    const getMousePosition = (event: React.MouseEvent) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };

        const CTM = svg.getScreenCTM();
        if (!CTM) return { x: 0, y: 0 };

        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const transformedPoint = point.matrixTransform(CTM.inverse());

        return {
            x: transformedPoint.x,
            y: transformedPoint.y
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const point = getMousePosition(e);
        setStartPoint(point);
        setIsDrawing(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;

        const currentPoint = getMousePosition(e);
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;

        // Update preview shape
        const previewShape = document.getElementById('preview-shape');
        if (previewShape) {
            if (selectedTool === 'rectangle') {
                previewShape.setAttribute('width', Math.abs(width).toString());
                previewShape.setAttribute('height', Math.abs(height).toString());
                previewShape.setAttribute('x', (width < 0 ? currentPoint.x : startPoint.x).toString());
                previewShape.setAttribute('y', (height < 0 ? currentPoint.y : startPoint.y).toString());
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDrawing) return;

        const endPoint = getMousePosition(e);
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);

        if (width > 0 && height > 0) {
            const x = Math.min(startPoint.x, endPoint.x);
            const y = Math.min(startPoint.y, endPoint.y);

            createShape('rectangle', { x, y, width, height });
        }

        setIsDrawing(false);
    };

    return (
        <svg
            ref={svgRef}
            className="w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <g dangerouslySetInnerHTML={{ __html: getAllShapes() }} />
            {isDrawing && (
                <rect
                    id="preview-shape"
                    x={startPoint.x}
                    y={startPoint.y}
                    width={0}
                    height={0}
                    fill="none"
                    stroke="blue"
                    strokeWidth="1"
                    strokeDasharray="4"
                />
            )}
        </svg>
    );
};

const VectorEditor = () => {
    const [engine, setEngine] = useState(null);
    const [isAnimationMode, setIsAnimationMode] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(58);
    const [selectedTool, setSelectedTool] = useState('select');
    const artboardRef = useRef(null);

  useEffect(() => {
    const init = async () => {
        const engineInstance = await initializeEngine();
        setEngine(engineInstance);
    };
    init();
}, []);

if (!engine) {
    return <div>Loading engine...</div>;
}

  const tools = [
    { id: 'select', icon: Layers, label: 'Select' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'link', icon: Link, label: 'Link' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'image', icon: Image, label: 'Image' },
    { id: 'effects', icon: Zap, label: 'Effects' },
  ];

  return (
    <EngineContext.Provider value={engine}>
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="h-12 border-b flex items-center justify-between px-4 bg-white">
        {/* Left Section - Tools */}
        <div className="flex space-x-2">
          {tools.map((tool) => (
            <TooltipProvider key={tool.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`p-2 rounded hover:bg-gray-100 ${
                      selectedTool === tool.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <tool.icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tool.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Middle Section - Animation Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm">Animate</span>
          <Switch
            checked={isAnimationMode}
            onCheckedChange={setIsAnimationMode}
          />
        </div>

        {/* Right Section - Share & Export */}
        <div className="flex items-center space-x-4">
          <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded">
            Share
          </button>
          <button className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
            Export
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{zoomLevel}%</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Layers */}
        <div className="w-60 border-r bg-white p-4">
          <h2 className="font-medium mb-4">Artboard 1</h2>
          <p className="text-gray-500 text-sm">
            Create a shape to get started.
          </p>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative overflow-auto bg-gray-100">
          <div
            ref={artboardRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-[1200px] h-[900px] bg-white shadow-sm border">
              {/* SVG Canvas will be rendered here */}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 border-l bg-white p-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">File size</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Width</label>
                  <input
                    type="number"
                    value="1200"
                    className="w-full mt-1 px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Height</label>
                  <input
                    type="number"
                    value="900"
                    className="w-full mt-1 px-2 py-1 border rounded"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Duration</h3>
                <div className="flex items-center">
                <input
                  type="number"
                  value="3"
                
                />
                <span className="ml-2">s</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Background</h3>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border rounded grid place-items-center">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16">
                    <path d="M8 0L0 8l8 8 8-8-8-8z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500">Transparent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline (Visible only in animation mode) */}
      {isAnimationMode && (
        <div className="h-32 border-t bg-white p-4">
          <div className="flex items-center space-x-4 mb-4">
            <button className="p-1 rounded hover:bg-gray-100">
              <svg className="w-4 h-4" viewBox="0 0 16 16">
                <path d="M4 4l8 4-8 4V4z" />
              </svg>
            </button>
            <div className="text-sm">0.00 / 3.00 s</div>
          </div>
          <div className="relative h-6 bg-gray-100 rounded">
            {/* Timeline markers will be rendered here */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 31 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-l border-gray-300 first:border-l-0"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </EngineContext.Provider>
  );
};

export default VectorEditor;