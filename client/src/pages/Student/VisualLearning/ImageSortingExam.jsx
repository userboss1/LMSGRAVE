import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../api/axios';
import { toast } from 'react-toastify';

const BASE = import.meta.env.VITE_API_URL || '';

/* ──────────────────────────────────────────────
   Full-screen image preview (click & hold feel)
─────────────────────────────────────────────── */
const ImagePreview = ({ src, label, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const k = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', k);
        return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k); };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center cursor-zoom-out"
            onClick={onClose}
        >
            <div className="absolute top-4 right-4">
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition">✕</button>
            </div>
            <img
                src={src}
                alt={label}
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl shadow-2xl"
                style={{ animation: 'zoomIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}
                onClick={e => e.stopPropagation()}
            />
            {label && (
                <p className="mt-4 text-white/80 text-sm font-medium px-6 text-center" style={{ animation: 'fadeUp 0.3s ease both' }}>
                    {label}
                </p>
            )}
            <p className="absolute bottom-5 text-white/30 text-xs">Click anywhere or press ESC to close</p>
            <style>{`
                @keyframes zoomIn {
                    from { opacity:0; transform: scale(0.7); }
                    to   { opacity:1; transform: scale(1); }
                }
                @keyframes fadeUp {
                    from { opacity:0; transform: translateY(8px); }
                    to   { opacity:1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

/* ──────────────────────────────────────────────
   A single image tile (source pool or sorted lane)
─────────────────────────────────────────────── */
const ImageTile = ({ item, index, isDragging, onPreview, onDragStart }) => {
    const holdTimer = useRef(null);

    const handlePointerDown = () => {
        holdTimer.current = setTimeout(() => {
            onPreview(item);
        }, 350); // hold 350ms to preview
    };
    const handlePointerUp = () => { clearTimeout(holdTimer.current); };

    return (
        <div
            draggable
            onDragStart={(e) => { clearTimeout(holdTimer.current); onDragStart(e, item, index); }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={() => onPreview(item)}
            className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-grab active:cursor-grabbing select-none
                ${isDragging ? 'border-indigo-400 shadow-lg shadow-indigo-100 scale-105 opacity-80' : 'border-transparent hover:border-indigo-300 hover:shadow-md'}`}
            style={{ touchAction: 'none' }}
        >
            <img
                src={`${BASE}${item.imageUrl}`}
                alt={item.label || `Image ${index + 1}`}
                draggable={false}
                className="w-full h-28 sm:h-32 object-cover block"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end p-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Click to preview
                </div>
            </div>
            {item.label && (
                <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full max-w-[80%] truncate">
                    {item.label}
                </div>
            )}
            {/* drag icon */}
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-80 transition bg-black/40 rounded p-1">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zM8 16h2v2H8v-2zm6 0h2v2h-2v-2z"/></svg>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   Results Screen
─────────────────────────────────────────────── */
const ResultScreen = ({ score, total, percentage, correctImages, submittedOrder, onBack }) => {
    const isPerfect = score === total;
    return (
        <div className="flex flex-col items-center py-8 px-4 max-w-2xl mx-auto">
            {/* Score card */}
            <div className={`w-full rounded-3xl p-8 text-center mb-8 ${isPerfect ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : percentage >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-rose-500 to-red-500'} text-white shadow-xl`}>
                <div className="text-6xl mb-3">{isPerfect ? '🏆' : percentage >= 50 ? '👍' : '📚'}</div>
                <p className="text-white/80 font-semibold text-sm uppercase tracking-widest mb-1">Your Score</p>
                <p className="text-6xl font-black">{score}<span className="text-3xl font-semibold opacity-60">/{total}</span></p>
                <p className="text-2xl font-bold mt-1 opacity-90">{percentage}%</p>
                <p className="text-white/80 mt-3 text-sm">{isPerfect ? 'Perfect! Every image in the right place! 🎉' : `${score} image${score !== 1 ? 's' : ''} in the correct position.`}</p>
            </div>

            {/* Correct order display */}
            <div className="w-full mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">✅ Correct Order</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {correctImages.map((img, i) => {
                        const studentPlaced = submittedOrder[i];
                        const correct = studentPlaced?.toString() === img._id?.toString();
                        return (
                            <div key={img._id} className="flex flex-col items-center flex-shrink-0 w-24">
                                <div className={`w-24 h-20 rounded-xl overflow-hidden border-3 ${correct ? 'border-emerald-400 ring-2 ring-emerald-300' : 'border-red-400 ring-2 ring-red-200'}`}>
                                    <img src={`${BASE}${img.imageUrl}`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className={`mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                    {correct ? '✓ Correct' : '✗ Wrong'}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">Step {i + 1}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={onBack}
                className="px-8 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition"
            >
                Back to Dashboard
            </button>
        </div>
    );
};

/* ──────────────────────────────────────────────
   MAIN: Image Sorting Exam for Student
─────────────────────────────────────────────── */
const ImageSortingExam = ({ examId, onBack }) => {
    const [exam, setExam]           = useState(null);
    const [pool, setPool]           = useState([]);      // unplaced tiles
    const [lane, setLane]           = useState([]);      // student's chosen order
    const [loading, setLoading]     = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult]       = useState(null);
    const [preview, setPreview]     = useState(null);   // item being previewed fullscreen
    const [dragging, setDragging]   = useState(null);   // { item, from: 'pool'|'lane', index }
    const [laneOver, setLaneOver]   = useState(false);

    useEffect(() => {
        api.get(`/api/visual/student/${examId}`)
            .then(r => {
                setExam(r.data);
                setPool(r.data.paperData?.images || []);
                setLane([]);
            })
            .catch(() => toast.error('Failed to load exam'))
            .finally(() => setLoading(false));
    }, [examId]);

    /* ── Drag handlers ── */
    const onDragStart = (e, item, idx, from) => {
        setDragging({ item, from, index: idx });
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOverLane = (e) => { e.preventDefault(); setLaneOver(true); };
    const onDragLeaveLane = () => setLaneOver(false);

    const onDropOnLane = (e, insertIdx = lane.length) => {
        e.preventDefault();
        setLaneOver(false);
        if (!dragging) return;
        const { item, from, index } = dragging;

        if (from === 'pool') {
            // move from pool to lane at insertIdx
            setPool(p => p.filter((_, i) => i !== index));
            setLane(l => {
                const next = [...l];
                next.splice(insertIdx, 0, item);
                return next;
            });
        } else if (from === 'lane') {
            // reorder within lane
            setLane(l => {
                const next = l.filter((_, i) => i !== index);
                next.splice(insertIdx > index ? insertIdx - 1 : insertIdx, 0, item);
                return next;
            });
        }
        setDragging(null);
    };

    const onDropOnPool = (e) => {
        e.preventDefault();
        if (!dragging || dragging.from !== 'lane') return;
        const { item, index } = dragging;
        setLane(l => l.filter((_, i) => i !== index));
        setPool(p => [...p, item]);
        setDragging(null);
    };

    // Click-to-move: click tile in pool → goes to end of lane; click in lane → back to pool
    const moveToLane = (item, idx) => {
        setPool(p => p.filter((_, i) => i !== idx));
        setLane(l => [...l, item]);
    };
    const moveToPool = (item, idx) => {
        setLane(l => l.filter((_, i) => i !== idx));
        setPool(p => [...p, item]);
    };

    const handleSubmit = async () => {
        if (lane.length !== totalImages) {
            toast.error('Place all images in the lane before submitting'); return;
        }
        setSubmitting(true);
        try {
            const r = await api.post(`/api/visual/student/${examId}/submit`, {
                submittedOrder: lane.map(it => it._id),
            });
            const resultData = await api.get(`/api/visual/student/${examId}/result`);
            setResult({ ...r.data, correctImages: resultData.data.correctData });
        } catch (e) {
            toast.error(e.response?.data?.message || 'Submission failed');
        } finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading your exam…</p>
        </div>
    );

    if (result) return (
        <ResultScreen
            score={result.score}
            total={result.total}
            percentage={result.percentage}
            correctImages={result.correctImages || []}
            submittedOrder={lane.map(it => it._id)}
            onBack={onBack}
        />
    );

    const totalImages = exam?.paperData?.images?.length || 0;

    return (
        <div className="max-w-4xl mx-auto px-2 pb-10">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-5 flex items-center gap-4 shadow-sm">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-slate-800 text-base truncate">{exam?.title}</h2>
                    {exam?.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{exam.description}</p>}
                </div>
                {/* Progress */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-sm font-bold text-indigo-600">{lane.length}/{totalImages}</div>
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(lane.length / totalImages) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-xs text-indigo-700">
                    <strong>How to sort:</strong> Click an image to preview it full-screen. Then drag or click each image tile from the <strong>pool</strong> below into the <strong>Answer Lane</strong> in the correct order. Click a lane tile to return it to the pool.
                </div>
            </div>

            {/* ── Answer Lane ── */}
            <div className="mb-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded flex items-center justify-center">→</span>
                    Your Answer — Lane ({lane.length} of {totalImages} placed)
                </p>
                <div
                    onDragOver={onDragOverLane}
                    onDragLeave={onDragLeaveLane}
                    onDrop={(e) => onDropOnLane(e)}
                    className={`min-h-[9rem] rounded-2xl border-2 border-dashed transition-all p-3 flex flex-nowrap gap-3 overflow-x-auto relative
                        ${laneOver ? 'border-indigo-500 bg-indigo-50' : lane.length === 0 ? 'border-slate-300 bg-slate-50' : 'border-indigo-200 bg-indigo-50/30'}`}
                >
                    {lane.length === 0 && !laneOver && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                            <p className="text-sm font-semibold">Drag images here in the correct order</p>
                            <p className="text-xs mt-1">Step 1 on the left → Step {totalImages} on the right</p>
                        </div>
                    )}
                    {lane.map((item, i) => (
                        <div
                            key={item._id}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => { e.stopPropagation(); onDropOnLane(e, i); }}
                            className="flex flex-col items-center flex-shrink-0 w-28 sm:w-32"
                        >
                            <div className="relative w-full">
                                {/* Step number */}
                                <div className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                                    {i + 1}
                                </div>
                                <div
                                    draggable
                                    onDragStart={(e) => onDragStart(e, item, i, 'lane')}
                                    onClick={() => moveToPool(item, i)}
                                    className="relative rounded-xl overflow-hidden border-2 border-indigo-300 cursor-pointer hover:border-rose-400 hover:scale-105 transition-all duration-200 group shadow-sm"
                                    title="Click to remove from lane"
                                >
                                    <img src={`${BASE}${item.imageUrl}`} alt="" draggable={false} className="w-full h-24 sm:h-28 object-cover" />
                                    <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/20 transition-colors flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </div>
                                </div>
                            </div>
                            {item.label && (
                                <p className="text-[10px] text-center text-slate-600 font-medium mt-1 px-1 leading-tight">{item.label}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Image Pool ── */}
            <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-slate-500 text-white text-[10px] font-bold rounded flex items-center justify-center">☰</span>
                    Image Pool {pool.length > 0 ? `(${pool.length} remaining)` : '— All placed!'}
                </p>
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropOnPool}
                    className={`rounded-2xl border-2 border-dashed p-4 transition-all ${pool.length === 0 ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'}`}
                >
                    {pool.length === 0 ? (
                        <div className="flex flex-col items-center py-6 text-emerald-600">
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <p className="font-semibold text-sm">All images placed in the lane!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {pool.map((item, i) => (
                                <div key={item._id} onClick={() => moveToLane(item, i)}>
                                    <ImageTile
                                        item={item}
                                        index={i}
                                        isDragging={dragging?.item?._id === item._id}
                                        onPreview={setPreview}
                                        onDragStart={(e, it, idx) => onDragStart(e, it, idx, 'pool')}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Submit ── */}
            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || lane.length !== totalImages}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-base transition-all
                        ${lane.length === totalImages
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-200'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    {submitting ? (
                        <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Submit My Answer
                        </>
                    )}
                </button>
            </div>

            {/* Full-screen preview */}
            {preview && (
                <ImagePreview
                    src={`${BASE}${preview.imageUrl}`}
                    label={preview.label}
                    onClose={() => setPreview(null)}
                />
            )}
        </div>
    );
};

export default ImageSortingExam;
