import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../api/axios';
import { toast } from 'react-toastify';

/* ──────────────────────── Style helpers ──────────────────────── */
const quoteStyle = {
    important: { cls: 'border-red-500 bg-red-50 text-red-900', icon: '🔴', label: 'Critical' },
    'exam-tip': { cls: 'border-blue-500 bg-blue-50 text-blue-900', icon: '💡', label: 'Exam Note' },
    remember:   { cls: 'border-amber-500 bg-amber-50 text-amber-900', icon: '⚠️', label: 'Key Point' },
    formula:    { cls: 'border-purple-500 bg-purple-50 text-purple-900', icon: '🧮', label: 'Formula' },
};

/* ──────────────────────── Image Zoom Lightbox ──────────────────── */
const ImageLightbox = ({ src, onClose }) => {
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const dragging = useRef(false);
    const last = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const onWheel = (e) => {
        e.preventDefault();
        setScale(s => Math.max(0.5, Math.min(5, s - e.deltaY * 0.001)));
    };

    const onMouseDown = (e) => { dragging.current = true; last.current = { x: e.clientX, y: e.clientY }; };
    const onMouseMove = (e) => {
        if (!dragging.current) return;
        setPos(p => ({ x: p.x + e.clientX - last.current.x, y: p.y + e.clientY - last.current.y }));
        last.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { dragging.current = false; };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button onClick={() => setScale(s => Math.min(5, s + 0.5))} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition">+</button>
                <button onClick={() => setScale(1)} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition">{Math.round(scale * 100)}%</button>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition">−</button>
                <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/70 text-white text-lg flex items-center justify-center transition ml-2">✕</button>
            </div>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">Scroll to zoom · Drag to pan · ESC to close</p>
            {/* Image */}
            <div className="overflow-hidden w-full h-full flex items-center justify-center" onWheel={onWheel} style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}>
                <img
                    src={src}
                    alt="Zoom"
                    onMouseDown={onMouseDown}
                    draggable={false}
                    style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transformOrigin: 'center', transition: dragging.current ? 'none' : 'transform 0.15s ease', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', userSelect: 'none' }}
                />
            </div>
        </div>
    );
};

/* ──────────────────────── Annotated Image (with zoom click) ──── */
const AnnotatedImage = ({ imageUrl, annotations = [] }) => {
    const [zoomed, setZoomed] = useState(false);
    const getBaseURL = () => {
        if (!imageUrl) return '';
        if (imageUrl.startsWith('http')) return '';
        return import.meta.env.VITE_API_URL || '';
    };
    const src = `${getBaseURL()}${imageUrl}`;

    return (
        <>
            <div className="relative inline-block w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-50 group cursor-zoom-in" onClick={() => setZoomed(true)}>
                <img src={src} alt="Lesson Content" className="w-full h-auto max-h-[55vh] object-contain transition group-hover:opacity-95" />
                {/* Zoom hint overlay */}
                <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                        Click to zoom
                    </div>
                </div>
                {annotations.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                        {annotations.filter(a => a.type === 'label').map((ann, i) => (
                            <div key={i} className="absolute text-[10px] md:text-sm font-bold text-white px-2 py-1 rounded shadow-sm"
                                style={{ left: `${(ann.x / 1000) * 100}%`, top: `${(ann.y / 1000) * 100}%`, backgroundColor: ann.color || '#6366f1', transform: 'translateY(-100%)' }}>
                                {ann.text}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {zoomed && <ImageLightbox src={src} onClose={() => setZoomed(false)} />}
        </>
    );
};

/* ──────────────────────── Practice Step ──────────────────────── */
const PracticeStep = ({ step }) => {
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [answer, setAnswer] = useState('');
    const check = () => setSubmitted(true);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-sm">?</div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Knowledge Check</span>
            </div>
            {step.title && <h4 className="text-base font-bold text-slate-800">{step.title}</h4>}
            <p className="text-sm font-semibold text-slate-700">{step.questionText}</p>

            {step.questionType === 'MCQ' && (
                <div className="grid grid-cols-1 gap-2">
                    {step.options?.filter(o => o).map((opt, i) => (
                        <button key={i} onClick={() => { if (!submitted) setSelected(opt); }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition
                                ${submitted
                                    ? opt === step.correctAnswer
                                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                        : opt === selected ? 'bg-red-50 border-red-400 text-red-800' : 'bg-white border-slate-100 text-slate-400'
                                    : selected === opt ? 'bg-indigo-50 border-indigo-400 text-indigo-800' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}>
                            <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + i)}.</span>{opt}
                        </button>
                    ))}
                    {!submitted ? (
                        <button onClick={check} disabled={!selected} className="mt-1 w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-500 transition disabled:opacity-40">Check Answer</button>
                    ) : (
                        <div className={`p-3 rounded-xl flex items-start gap-2 border ${selected === step.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <span className="text-lg">{selected === step.correctAnswer ? '✓' : '✗'}</span>
                            <div>
                                <p className="font-bold text-xs">{selected === step.correctAnswer ? 'Correct!' : 'Incorrect'}</p>
                                <p className="text-xs mt-0.5">{selected === step.correctAnswer ? 'Great, you got it!' : `Correct: ${step.correctAnswer}`}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step.questionType === 'DESCRIPTIVE' && (
                <div className="space-y-3">
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} disabled={submitted}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white"
                        placeholder="Write your response…" />
                    {!submitted ? (
                        <button onClick={check} disabled={!answer.trim()} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-500 transition disabled:opacity-40">Submit</button>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">✓</div>
                            <p className="text-sm text-slate-600">Response recorded for review.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ──────────────────────── Step Content ──────────────────────── */
const StepContent = ({ step }) => {
    switch (step.type) {
        case 'image':
            return (
                <div className="space-y-4">
                    {step.title && <h3 className="text-xl font-bold text-slate-800">{step.title}</h3>}
                    {step.imageUrl && <AnnotatedImage imageUrl={step.imageUrl} annotations={step.annotations} />}
                    {step.text && <p className="text-sm text-slate-600 leading-relaxed">{step.text}</p>}
                </div>
            );
        case 'explanation':
            return (
                <div className="space-y-3">
                    {step.title && <h3 className="text-xl font-bold text-slate-800">{step.title}</h3>}
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{step.text}</p>
                </div>
            );
        case 'quote': {
            const qs = quoteStyle[step.quoteType] || quoteStyle.important;
            return (
                <div className={`border-l-4 rounded-r-xl p-5 ${qs.cls}`}>
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide opacity-70">
                        <span>{qs.icon}</span><span>{qs.label}</span>
                    </div>
                    {step.title && <h4 className="text-base font-bold mb-1">{step.title}</h4>}
                    <p className="text-sm font-medium leading-relaxed italic">{step.text}</p>
                </div>
            );
        }
        case 'example':
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>📘</span><span>Example</span>
                    </div>
                    {step.title && <h4 className="text-lg font-bold mb-2">{step.title}</h4>}
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900/50 p-4 rounded-lg">{step.text}</pre>
                </div>
            );
        case 'practice':
            return <PracticeStep step={step} />;
        default:
            return <p className="text-slate-400 italic text-sm text-center py-10">Exploring content…</p>;
    }
};

/* ──────────────────────── Main LessonViewer ──────────────────── */
const LessonViewer = ({ lesson, course, onBack, onLessonComplete }) => {
    const [steps, setSteps] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completedStepIds, setCompletedStepIds] = useState(new Set());
    const [lessonDone, setLessonDone] = useState(false);
    const [animDir, setAnimDir] = useState('next'); // 'next' | 'prev'
    const [animating, setAnimating] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        Promise.all([
            api.get(`/api/teacher/courses/lessons/${lesson._id}/steps`),
            api.get(`/api/student/courses/${course._id}/progress`),
        ]).then(([stepsRes, progressRes]) => {
            const stepsData = stepsRes.data;
            setSteps(stepsData);
            const lessonProg = progressRes.data?.lessons?.find(l => l.lessonId === lesson._id);
            if (lessonProg) {
                const doneIds = new Set(lessonProg.completedSteps);
                setCompletedStepIds(doneIds);
                setLessonDone(lessonProg.lessonCompleted && stepsData.length <= doneIds.size);
            }
        }).catch(() => toast.error('Failed to load lesson'))
            .finally(() => setLoading(false));
    }, [lesson._id, course._id]);

    const flipPage = useCallback(async (dir) => {
        if (animating) return;
        if (dir === 'next') {
            // Mark current step done
            const step = steps[currentIdx];
            if (step && !completedStepIds.has(step._id)) {
                try {
                    await api.post('/api/student/courses/progress', { courseId: course._id, lessonId: lesson._id, stepId: step._id });
                    setCompletedStepIds(prev => new Set([...prev, step._id]));
                } catch {}
            }
            if (currentIdx >= steps.length - 1) {
                setLessonDone(true);
                onLessonComplete && onLessonComplete(lesson._id);
                return;
            }
        }
        if (dir === 'prev' && currentIdx === 0) return;

        setAnimDir(dir);
        setAnimating(true);
        setTimeout(() => {
            setCurrentIdx(i => dir === 'next' ? i + 1 : i - 1);
            setAnimating(false);
        }, 280);
    }, [animating, currentIdx, steps, completedStepIds, course._id, lesson._id, onLessonComplete]);

    // Keyboard nav
    useEffect(() => {
        const onKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') flipPage('next');
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') flipPage('prev');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [flipPage]);

    const step = steps[currentIdx];
    const progress = steps.length ? ((currentIdx + 1) / steps.length) * 100 : 0;

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading lesson…</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto" style={{ minHeight: 'calc(100vh - 80px)' }}>

            {/* ── Top Strip: back + title + progress ── */}
            <div className="flex-none bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="flex-none flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    <span className="hidden sm:inline">Back</span>
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-indigo-600 font-semibold truncate">{course.title}</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{lesson.title}</p>
                </div>
                <span className="flex-none text-xs font-bold text-slate-400">{currentIdx + 1}/{steps.length}</span>
            </div>

            {/* ── Progress bar ── */}
            <div className="flex-none h-1 bg-slate-100">
                <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>

            {lessonDone ? (
                /* ── Completion card ── */
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-sm w-full">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Lesson Complete!</h3>
                        <p className="text-sm text-slate-500 mb-6">You've covered all concepts in "<span className="font-semibold">{lesson.title}</span>".</p>
                        <div className="flex gap-3">
                            <button onClick={onBack} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-500 transition">Back to Course</button>
                            <button onClick={() => { setLessonDone(false); setCurrentIdx(0); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition">Review</button>
                        </div>
                    </div>
                </div>
            ) : steps.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <p className="text-slate-400 text-sm mb-4">No content available for this lesson yet.</p>
                        <button onClick={onBack} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition">Return</button>
                    </div>
                </div>
            ) : (
                /* ── Notebook page area ── */
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Step dot pips */}
                    <div className="flex-none flex items-center justify-center gap-1.5 py-2 px-4">
                        {steps.map((s, i) => (
                            <button key={s._id} onClick={() => i !== currentIdx && (i < currentIdx ? flipPage('prev') : flipPage('next'))}
                                className={`rounded-full transition-all duration-300 ${i === currentIdx ? 'bg-indigo-500 w-5 h-2' : completedStepIds.has(s._id) ? 'bg-indigo-300 w-2 h-2 hover:bg-indigo-400' : 'bg-slate-200 w-2 h-2 hover:bg-slate-300'}`} />
                        ))}
                    </div>

                    {/* Page content with flip animation */}
                    <div className="flex-1 overflow-y-auto px-4 pb-2" ref={contentRef}>
                        <div
                            className="min-h-full"
                            style={{
                                animation: animating
                                    ? `${animDir === 'next' ? 'pageFlipOut' : 'pageFlipBackOut'} 0.28s ease-in forwards`
                                    : `${animDir === 'next' ? 'pageFlipIn' : 'pageFlipBackIn'} 0.3s ease-out both`,
                            }}
                        >
                            {/* Notebook-style card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden"
                                style={{ boxShadow: '0 2px 0 #e2e8f0, 0 4px 16px -4px rgba(0,0,0,0.08)' }}>
                                {/* Card header: step type badge */}
                                <div className="px-6 pt-5 pb-2 border-b border-slate-50 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                                        {step?.type === 'image' ? '🖼 Image' : step?.type === 'explanation' ? '📝 Explanation' : step?.type === 'quote' ? '💬 Note' : step?.type === 'example' ? '📘 Example' : step?.type === 'practice' ? '🧪 Practice' : 'Content'}
                                    </span>
                                    <span className="ml-auto text-[10px] text-slate-300 font-mono">{currentIdx + 1} / {steps.length}</span>
                                </div>
                                {/* Content */}
                                <div className="px-6 py-5">
                                    {step && <StepContent key={step._id} step={step} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Fixed Navigation Bar ── */}
                    <div className="flex-none bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => flipPage('prev')}
                            disabled={currentIdx === 0 || animating}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition select-none"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Prev
                        </button>

                        {/* Middle info */}
                        <div className="flex-1 text-center">
                            <p className="text-xs text-slate-400 font-medium">Use ← → arrow keys to flip</p>
                        </div>

                        <button
                            onClick={() => flipPage('next')}
                            disabled={animating}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white select-none transition
                                ${currentIdx === steps.length - 1 ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                        >
                            {currentIdx === steps.length - 1 ? (
                                <>Finish <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>
                            ) : (
                                <>Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ── CSS animations (page flip) ── */}
            <style>{`
                @keyframes pageFlipOut {
                    from { opacity: 1; transform: translateX(0) rotateY(0deg); }
                    to   { opacity: 0; transform: translateX(-32px) rotateY(8deg); }
                }
                @keyframes pageFlipIn {
                    from { opacity: 0; transform: translateX(32px) rotateY(-8deg); }
                    to   { opacity: 1; transform: translateX(0) rotateY(0deg); }
                }
                @keyframes pageFlipBackOut {
                    from { opacity: 1; transform: translateX(0) rotateY(0deg); }
                    to   { opacity: 0; transform: translateX(32px) rotateY(-8deg); }
                }
                @keyframes pageFlipBackIn {
                    from { opacity: 0; transform: translateX(-32px) rotateY(8deg); }
                    to   { opacity: 1; transform: translateX(0) rotateY(0deg); }
                }
            `}</style>
        </div>
    );
};

export default LessonViewer;
