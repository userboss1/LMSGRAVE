import { useRef, useEffect, useState } from 'react';

const SERVER = import.meta.env.VITE_SERVER_URL !== undefined ? import.meta.env.VITE_SERVER_URL : 'http://localhost:5000';

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const toolLabel = {
    arrow: 'Arrow',
    circle: 'Circle',
    highlight: 'Highlight',
    label: 'Label',
    underline: 'Underline',
};

const ImageAnnotationEditor = ({ imageUrl, annotations = [], onChange }) => {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [tool, setTool] = useState('arrow');
    const [color, setColor] = useState('#EF4444');
    const [drawing, setDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [labelText, setLabelText] = useState('');
    const [showLabelInput, setShowLabelInput] = useState(false);
    const [pendingLabel, setPendingLabel] = useState(null);
    const [imgLoaded, setImgLoaded] = useState(false);

    // Draw everything on canvas whenever annotations change
    useEffect(() => {
        if (!imgLoaded) return;
        redraw();
    }, [annotations, imgLoaded]);

    const redraw = () => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        annotations.forEach(ann => drawAnnotation(ctx, ann));
    };

    const drawAnnotation = (ctx, ann) => {
        ctx.strokeStyle = ann.color || '#EF4444';
        ctx.fillStyle = ann.color || '#EF4444';
        ctx.lineWidth = 3;
        switch (ann.type) {
            case 'arrow': {
                drawArrow(ctx, ann.x, ann.y, ann.x2, ann.y2);
                break;
            }
            case 'circle': {
                ctx.beginPath();
                ctx.ellipse(
                    (ann.x + ann.x2) / 2,
                    (ann.y + ann.y2) / 2,
                    Math.abs(ann.x2 - ann.x) / 2,
                    Math.abs(ann.y2 - ann.y) / 2,
                    0, 0, 2 * Math.PI
                );
                ctx.stroke();
                break;
            }
            case 'highlight': {
                ctx.globalAlpha = 0.3;
                ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
                ctx.globalAlpha = 1;
                break;
            }
            case 'underline': {
                ctx.beginPath();
                ctx.moveTo(ann.x, ann.y);
                ctx.lineTo(ann.x2, ann.y2);
                ctx.stroke();
                break;
            }
            case 'label': {
                ctx.font = 'bold 18px Arial';
                ctx.fillStyle = ann.color || '#EF4444';
                // Badge background
                const tw = ctx.measureText(ann.text).width;
                ctx.fillStyle = ann.color || '#EF4444';
                ctx.fillRect(ann.x - 4, ann.y - 20, tw + 8, 24);
                ctx.fillStyle = '#fff';
                ctx.fillText(ann.text, ann.x, ann.y);
                break;
            }
        }
    };

    const drawArrow = (ctx, x1, y1, x2, y2) => {
        const headLen = 16;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // head
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7));
        ctx.closePath();
        ctx.fill();
    };

    const getCanvasPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const handleMouseDown = (e) => {
        if (tool === 'label') {
            const pos = getCanvasPos(e);
            setPendingLabel(pos);
            setShowLabelInput(true);
            return;
        }
        setDrawing(true);
        setStartPos(getCanvasPos(e));
    };

    const handleMouseUp = (e) => {
        if (!drawing) return;
        setDrawing(false);
        const endPos = getCanvasPos(e);
        const ann = {
            type: tool,
            color,
            x: startPos.x,
            y: startPos.y,
            x2: endPos.x,
            y2: endPos.y,
            width: endPos.x - startPos.x,
            height: endPos.y - startPos.y,
        };
        onChange([...annotations, ann]);
    };

    const addLabel = () => {
        if (!labelText.trim()) { setShowLabelInput(false); return; }
        const ann = { type: 'label', color, x: pendingLabel.x, y: pendingLabel.y, text: labelText };
        onChange([...annotations, ann]);
        setLabelText('');
        setShowLabelInput(false);
    };

    const undo = () => {
        onChange(annotations.slice(0, -1));
    };

    const clearAll = () => {
        if (confirm('Clear all annotations?')) onChange([]);
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {Object.keys(toolLabel).map(t => (
                    <button
                        key={t}
                        onClick={() => setTool(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tool === t ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-100'}`}
                    >
                        {toolLabel[t]}
                    </button>
                ))}
                <div className="h-6 w-px bg-slate-200 mx-1" />
                {COLORS.map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-125' : 'hover:scale-110'}`}
                    />
                ))}
                <div className="ml-auto flex gap-2">
                    <button onClick={undo} disabled={annotations.length === 0} className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-slate-600 hover:bg-gray-100 disabled:opacity-40">↩ Undo</button>
                    <button onClick={clearAll} disabled={annotations.length === 0} className="px-3 py-1.5 text-xs bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 disabled:opacity-40">Clear</button>
                </div>
            </div>

            {/* Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-crosshair">
                {/* Hidden img for natural resolution */}
                <img
                    ref={imgRef}
                    src={imageUrl.startsWith('http') ? imageUrl : `${SERVER}${imageUrl}`}
                    alt=""
                    className="hidden"
                    onLoad={() => { setImgLoaded(true); }}
                />
                <canvas
                    ref={canvasRef}
                    className="w-full h-auto max-h-[60vh] object-contain"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                />
                {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {showLabelInput && (
                <div className="flex gap-2 mt-2">
                    <input
                        autoFocus
                        value={labelText}
                        onChange={e => setLabelText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addLabel()}
                        placeholder="Label text…"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button onClick={addLabel} className="px-4 py-1.5 bg-slate-800 text-white text-sm rounded-lg">Add</button>
                    <button onClick={() => setShowLabelInput(false)} className="px-3 py-1.5 border border-gray-200 text-slate-600 text-sm rounded-lg">Cancel</button>
                </div>
            )}

            <p className="text-xs text-slate-400 mt-2">
                {tool === 'label' ? 'Click on the image to place a label.' : `Draw ${toolLabel[tool].toLowerCase()} by clicking and dragging.`}
            </p>
        </div>
    );
};

export default ImageAnnotationEditor;
