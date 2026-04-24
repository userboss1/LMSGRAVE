import { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import { toast } from 'react-toastify';

const BASE = import.meta.env.VITE_API_URL || '';

/* ── Full-screen image preview ── */
const Preview = ({ src, onClose }) => {
    useEffect(() => {
        const k = e => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center cursor-zoom-out" onClick={onClose}>
            <img src={src} alt="preview" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl" style={{animation:'zoomIn .2s cubic-bezier(.34,1.56,.64,1) both'}}/>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition text-lg">✕</button>
            <style>{`@keyframes zoomIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
    );
};

/* ── Result Screen ── */
const LabelResultScreen = ({ score, total, percentage, correctData, myAnswers, onBack }) => {
    const isPerfect = score === total;
    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div className={`rounded-3xl p-8 text-center text-white shadow-xl ${isPerfect?'bg-gradient-to-br from-emerald-500 to-teal-500':percentage>=50?'bg-gradient-to-br from-amber-400 to-orange-500':'bg-gradient-to-br from-rose-500 to-red-500'}`}>
                <div className="text-5xl mb-3">{isPerfect?'🏆':percentage>=50?'👍':'📚'}</div>
                <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-1">Your Score</p>
                <p className="text-6xl font-black">{score}<span className="text-3xl opacity-60">/{total}</span></p>
                <p className="text-2xl font-bold mt-1 opacity-90">{percentage}%</p>
                <p className="text-white/80 mt-2 text-sm">{isPerfect?'Perfect! Every label correct!':score===0?'Keep studying — review the material!':'Keep it up, almost there!'}</p>
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Label by Label Breakdown</h3>
                <div className="space-y-2">
                    {(correctData||[]).map((spot, i) => {
                        const mine = myAnswers.find(a => a.spotId?.toString() === spot._id?.toString());
                        const correct = mine?.answer.trim().toLowerCase() === spot.label.trim().toLowerCase();
                        return (
                            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${correct?'border-emerald-200 bg-emerald-50':'border-red-200 bg-red-50'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${correct?'bg-emerald-500 text-white':'bg-red-400 text-white'}`}>{i+1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500">Your answer: <strong className={correct?'text-emerald-700':'text-red-600'}>{mine?.answer||'(blank)'}</strong></p>
                                    {!correct&&<p className="text-xs text-slate-500">Correct: <strong className="text-emerald-700">{spot.label}</strong></p>}
                                </div>
                                <span className={`text-sm ${correct?'text-emerald-500':'text-red-400'}`}>{correct?'✓':'✗'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="text-center">
                <button onClick={onBack} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition">Back to Dashboard</button>
            </div>
        </div>
    );
};

/* ── Main Component ── */
const ImageLabelingExam = ({ examId, onBack }) => {
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({}); // {spotId: answer}
    const [preview, setPreview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [activeSpot, setActiveSpot] = useState(null);
    const inputRefs = useRef({});

    useEffect(() => {
        api.get(`/api/visual/student/${examId}`)
            .then(r => { setExam(r.data); })
            .catch(() => toast.error('Failed to load exam'))
            .finally(() => setLoading(false));
    }, [examId]);

    const setAnswer = (spotId, value) => setAnswers(prev => ({ ...prev, [spotId]: value }));

    const handleSpotClick = (spotId, idx) => {
        setActiveSpot(spotId);
        inputRefs.current[spotId]?.focus();
    };

    const handleSubmit = async () => {
        const spots = exam.paperData?.spots || [];
        const answerArr = spots.map(s => ({ spotId: s._id, answer: answers[s._id] || '' }));
        const blanks = answerArr.filter(a => !a.answer.trim()).length;
        if (blanks > 0 && !window.confirm(`${blanks} answer(s) are blank. Submit anyway?`)) return;

        setSubmitting(true);
        try {
            const r = await api.post(`/api/visual/student/${examId}/submit`, { answers: answerArr });
            const resultData = await api.get(`/api/visual/student/${examId}/result`);
            setResult({ ...r.data, correctData: resultData.data.correctData, myAnswers: answerArr });
        } catch (e) {
            toast.error(e.response?.data?.message || 'Submission failed');
        } finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 mt-3">Loading exam…</p>
        </div>
    );

    if (result) return <LabelResultScreen {...result} onBack={onBack} />;

    const spots = exam?.paperData?.spots || [];
    const bgUrl = exam?.paperData?.backgroundImageUrl;
    const filledCount = spots.filter(s => (answers[s._id] || '').trim()).length;

    return (
        <div className="max-w-4xl mx-auto px-2 pb-10">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-5 flex items-center gap-4 shadow-sm">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-slate-800 text-base truncate">{exam?.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Image Labeling · {spots.length} spots</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-purple-600">{filledCount}/{spots.length}</span>
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{width:`${spots.length?(filledCount/spots.length)*100:0}%`}}/>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p className="text-xs text-purple-700"><strong>How to label:</strong> Study the diagram carefully. Click a numbered circle on the image to jump to its answer box. Fill in all labels, then submit.</p>
            </div>

            {/* Image with hotspots */}
            {bgUrl && (
                <div className="mb-6">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                        <img
                            src={`${BASE}${bgUrl}`}
                            alt="diagram"
                            className="w-full block cursor-zoom-in"
                            onClick={() => setPreview(true)}
                        />
                        {/* Numbered circles */}
                        {spots.map((spot, i) => {
                            const filled = !!(answers[spot._id]||'').trim();
                            const isActive = activeSpot === spot._id;
                            return (
                                <button
                                    key={spot._id}
                                    onClick={() => handleSpotClick(spot._id, i)}
                                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg transition-all -translate-x-1/2 -translate-y-1/2 hover:scale-110 active:scale-95
                                        ${isActive ? 'ring-4 ring-white ring-offset-1 scale-110' : ''}
                                        ${filled ? 'bg-emerald-500' : 'bg-purple-600'}`}
                                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                                    title={`Spot ${i + 1}`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer" onClick={() => setPreview(true)}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            Zoom
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2">Click a numbered circle to focus its answer · Click image to zoom</p>
                </div>
            )}

            {/* Answer grid */}
            <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Your Labels</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {spots.map((spot, i) => {
                        const filled = !!(answers[spot._id]||'').trim();
                        const isActive = activeSpot === spot._id;
                        return (
                            <div key={spot._id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isActive?'border-purple-400 bg-purple-50 shadow-sm':filled?'border-emerald-200 bg-emerald-50/30':'border-slate-200 bg-white'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${filled?'bg-emerald-500 text-white':isActive?'bg-purple-600 text-white':'bg-slate-200 text-slate-600'}`}>
                                    {i + 1}
                                </div>
                                <input
                                    ref={el => inputRefs.current[spot._id] = el}
                                    value={answers[spot._id] || ''}
                                    onChange={e => setAnswer(spot._id, e.target.value)}
                                    onFocus={() => setActiveSpot(spot._id)}
                                    onBlur={() => setActiveSpot(null)}
                                    className="flex-1 bg-transparent text-sm font-medium text-slate-700 focus:outline-none placeholder-slate-300"
                                    placeholder={`Label for spot ${i + 1}…`}
                                />
                                {filled && <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button onClick={handleSubmit} disabled={submitting}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-base transition-all ${filledCount===spots.length?'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-100':'bg-slate-200 text-slate-400'}`}>
                    {submitting
                        ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Submitting…</>
                        : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Submit My Labels</>}
                </button>
            </div>

            {preview && <Preview src={`${BASE}${bgUrl}`} onClose={() => setPreview(false)} />}
        </div>
    );
};

export default ImageLabelingExam;
