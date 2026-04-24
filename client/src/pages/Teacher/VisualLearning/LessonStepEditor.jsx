import { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import ImageAnnotationEditor from './ImageAnnotationEditor';
import { toast } from 'react-toastify';

const SERVER = import.meta.env.VITE_SERVER_URL !== undefined ? import.meta.env.VITE_SERVER_URL : 'http://localhost:5000';

const STEP_TYPES = [
    { value: 'explanation', label: '📝 Explanation', color: 'bg-blue-50 text-blue-700' },
    { value: 'image', label: '🖼 Image', color: 'bg-purple-50 text-purple-700' },
    { value: 'quote', label: '💡 Quote / Note', color: 'bg-yellow-50 text-yellow-700' },
    { value: 'example', label: '🔍 Example', color: 'bg-green-50 text-green-700' },
    { value: 'practice', label: '✏️ Practice', color: 'bg-red-50 text-red-700' },
];

const QUOTE_TYPES = ['important', 'exam-tip', 'remember', 'formula'];

const quoteStyle = {
    important: 'border-red-400 bg-red-50',
    'exam-tip': 'border-blue-400 bg-blue-50',
    remember: 'border-yellow-400 bg-yellow-50',
    formula: 'border-purple-400 bg-purple-50',
};

const blankStep = (type) => ({
    type,
    title: '',
    imageUrl: '',
    annotations: [],
    text: '',
    quoteType: 'important',
    questionText: '',
    questionType: 'MCQ',
    options: ['', '', '', ''],
    correctAnswer: '',
});

const LessonStepEditor = ({ lesson, course, module, onBack }) => {
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingStep, setEditingStep] = useState(null); // null means no modal open
    const [stepDraft, setStepDraft] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [showAnnotator, setShowAnnotator] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [converting, setConverting] = useState(null); // step id being converted
    const [convertForm, setConvertForm] = useState({ type: 'MCQ', questionText: '' });
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [convertingStepId, setConvertingStepId] = useState(null);
    const fileInputRef = useRef(null);

    // drag state
    const dragIdx = useRef(null);

    useEffect(() => { fetchSteps(); }, []);

    const fetchSteps = async () => {
        try {
            const res = await api.get(`/api/teacher/courses/lessons/${lesson._id}/steps`);
            setSteps(res.data);
        } catch { toast.error('Failed to load steps'); }
        finally { setLoading(false); }
    };

    const openAddStep = (type) => {
        setStepDraft(blankStep(type));
        setIsNew(true);
        setEditingStep(null);
        setShowAnnotator(false);
    };

    const openEditStep = (step) => {
        setStepDraft({
            ...blankStep(step.type),
            ...step,
            options: step.options?.length ? step.options : ['', '', '', ''],
        });
        setEditingStep(step);
        setIsNew(false);
        setShowAnnotator(false);
    };

    const saveStep = async () => {
        try {
            const payload = { ...stepDraft };
            if (isNew) {
                await api.post(`/api/teacher/courses/lessons/${lesson._id}/steps`, payload);
                toast.success('Step added');
            } else {
                await api.put(`/api/teacher/courses/steps/${editingStep._id}`, payload);
                toast.success('Step updated');
            }
            setEditingStep(null);
            setStepDraft(null);
            fetchSteps();
        } catch (e) { toast.error(e.response?.data?.message || 'Error saving step'); }
    };

    const deleteStep = async (id) => {
        if (!confirm('Delete this step?')) return;
        try {
            await api.delete(`/api/teacher/courses/steps/${id}`);
            toast.success('Step deleted');
            fetchSteps();
        } catch { toast.error('Failed to delete step'); }
    };

    // Upload image for step
    const handleImageUpload = async (file) => {
        if (!file) return;
        setUploadingImage(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await api.post('/api/teacher/courses/upload-image', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setStepDraft(d => ({ ...d, imageUrl: res.data.imageUrl }));
            toast.success('Image uploaded');
        } catch { toast.error('Image upload failed'); }
        finally { setUploadingImage(false); }
    };

    // Reorder: persist new order to backend
    const reorderStep = async (from, to) => {
        const updated = [...steps];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        // Re-assign orders
        const withOrder = updated.map((s, i) => ({ ...s, order: i }));
        setSteps(withOrder);
        // Save new orders to backend
        try {
            await Promise.all(withOrder.map(s => api.put(`/api/teacher/courses/steps/${s._id}`, { order: s.order })));
        } catch { toast.error('Failed to save step order'); fetchSteps(); }
    };

    const handleDragStart = (idx) => { dragIdx.current = idx; };
    const handleDrop = (idx) => {
        if (dragIdx.current === null || dragIdx.current === idx) return;
        reorderStep(dragIdx.current, idx);
        dragIdx.current = null;
    };

    // Convert to question
    const openConvert = (step) => {
        setConvertingStepId(step._id);
        setConvertForm({ type: 'MCQ', questionText: step.questionText || step.text || '' });
        setShowConvertModal(true);
    };

    const handleConvert = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/api/teacher/courses/steps/${convertingStepId}/to-question`, convertForm);
            toast.success('Question added to Question Bank!');
            setShowConvertModal(false);
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const typeInfo = (type) => STEP_TYPES.find(t => t.value === type) || STEP_TYPES[0];

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <button onClick={onBack} className="text-indigo-600 hover:underline font-medium">← Back to Lessons</button>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800 font-semibold">{lesson.title}</span>
                <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-1">Steps</span>
            </div>

            <div className="flex items-start gap-6">
                {/* Step List */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800">Steps <span className="text-slate-400 font-normal text-base">({steps.length})</span></h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" /></div>
                    ) : steps.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <p className="font-medium">No steps yet</p>
                            <p className="text-sm">Choose a step type from the right to add content</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {steps.map((step, i) => (
                                <div
                                    key={step._id}
                                    draggable
                                    onDragStart={() => handleDragStart(i)}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={() => handleDrop(i)}
                                    className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 group hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
                                >
                                    {/* Drag handle */}
                                    <div className="text-slate-300 group-hover:text-slate-400 flex-shrink-0">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" /></svg>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${step.type === 'image' ? 'bg-purple-500' : step.type === 'explanation' ? 'bg-blue-500' : step.type === 'quote' ? 'bg-yellow-500' : step.type === 'example' ? 'bg-green-500' : 'bg-red-500'}`}>{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeInfo(step.type).color}`}>{typeInfo(step.type).label}</span>
                                            <span className="text-sm text-slate-700 font-medium truncate">{step.title || step.text?.slice(0, 60) || step.questionText?.slice(0, 60) || 'Untitled step'}</span>
                                        </div>
                                        {step.imageUrl && <p className="text-xs text-slate-400 mt-0.5">Has image</p>}
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <button onClick={() => openEditStep(step)} className="text-xs px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100">Edit</button>
                                        {['image', 'example', 'practice'].includes(step.type) && (
                                            <button onClick={() => openConvert(step)} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100" title="Convert to Question Bank">→ Q</button>
                                        )}
                                        <button onClick={() => deleteStep(step._id)} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Step Panel */}
                <div className="w-48 flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Add Step</p>
                    <div className="space-y-2">
                        {STEP_TYPES.map(t => (
                            <button
                                key={t.value}
                                onClick={() => openAddStep(t.value)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium border transition-all hover:shadow-sm ${t.color} border-current border-opacity-20`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step Edit Modal */}
            {stepDraft && (
                <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 overflow-y-auto py-8 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{isNew ? 'Add' : 'Edit'} — {typeInfo(stepDraft.type).label}</h3>
                            <button onClick={() => { setStepDraft(null); setEditingStep(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Common: title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Step Title</label>
                                <input value={stepDraft.title} onChange={e => setStepDraft(d => ({ ...d, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="Optional title for this step" />
                            </div>

                            {/* IMAGE */}
                            {stepDraft.type === 'image' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Upload Image</label>
                                        <div className="flex gap-2">
                                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files[0])} />
                                            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 disabled:opacity-50">
                                                {uploadingImage ? 'Uploading…' : '📁 Choose Image'}
                                            </button>
                                            {stepDraft.imageUrl && <span className="text-xs text-emerald-600 self-center">✓ Image set</span>}
                                        </div>
                                    </div>
                                    {stepDraft.imageUrl && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium text-slate-700">Annotate Image</label>
                                                <button onClick={() => setShowAnnotator(v => !v)} className="text-xs text-indigo-600 hover:underline">
                                                    {showAnnotator ? 'Hide' : 'Open'} Editor
                                                </button>
                                            </div>
                                            {showAnnotator && (
                                                <ImageAnnotationEditor
                                                    imageUrl={stepDraft.imageUrl}
                                                    annotations={stepDraft.annotations || []}
                                                    onChange={ann => setStepDraft(d => ({ ...d, annotations: ann }))}
                                                />
                                            )}
                                            {!showAnnotator && (
                                                <img src={`${SERVER}${stepDraft.imageUrl.startsWith('http') ? '' : stepDraft.imageUrl}`} alt="" className="max-h-40 rounded-lg border border-gray-200 object-contain" />
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Image Caption / Notes</label>
                                        <textarea value={stepDraft.text} onChange={e => setStepDraft(d => ({ ...d, text: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Optional caption or notes…" />
                                    </div>
                                </div>
                            )}

                            {/* EXPLANATION / EXAMPLE */}
                            {['explanation', 'example'].includes(stepDraft.type) && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                                    <textarea value={stepDraft.text} onChange={e => setStepDraft(d => ({ ...d, text: e.target.value }))} rows={6} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none font-mono" placeholder="Write your explanation or worked example here…" />
                                </div>
                            )}

                            {/* QUOTE */}
                            {stepDraft.type === 'quote' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Note Type</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {QUOTE_TYPES.map(qt => (
                                                <button
                                                    key={qt}
                                                    onClick={() => setStepDraft(d => ({ ...d, quoteType: qt }))}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${stepDraft.quoteType === qt ? `${quoteStyle[qt]} border-current` : 'bg-gray-50 border-gray-200 text-slate-600'}`}
                                                >
                                                    {qt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Note Text *</label>
                                        <textarea value={stepDraft.text} onChange={e => setStepDraft(d => ({ ...d, text: e.target.value }))} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" placeholder="Write your important note, exam tip, or formula…" />
                                    </div>
                                    <div className={`rounded-xl border-l-4 p-4 ${quoteStyle[stepDraft.quoteType]}`}>
                                        <p className="text-xs font-bold uppercase tracking-wide mb-1 opacity-70">{stepDraft.quoteType.replace('-', ' ')}</p>
                                        <p className="text-sm font-medium">{stepDraft.text || 'Preview will appear here…'}</p>
                                    </div>
                                </div>
                            )}

                            {/* PRACTICE */}
                            {stepDraft.type === 'practice' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Question Type</label>
                                        <select value={stepDraft.questionType} onChange={e => setStepDraft(d => ({ ...d, questionType: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                                            <option value="MCQ">Multiple Choice (MCQ)</option>
                                            <option value="DESCRIPTIVE">Descriptive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Question *</label>
                                        <textarea value={stepDraft.questionText} onChange={e => setStepDraft(d => ({ ...d, questionText: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" placeholder="Write the practice question…" />
                                    </div>
                                    {stepDraft.questionType === 'MCQ' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
                                            {(stepDraft.options || ['', '', '', '']).map((opt, oi) => (
                                                <div key={oi} className="flex gap-2 mb-2 items-center">
                                                    <input type="radio" name="correctAns" checked={stepDraft.correctAnswer === opt && opt !== ''} onChange={() => setStepDraft(d => ({ ...d, correctAnswer: opt }))} className="flex-shrink-0" />
                                                    <input
                                                        value={opt}
                                                        onChange={e => {
                                                            const opts = [...stepDraft.options];
                                                            opts[oi] = e.target.value;
                                                            setStepDraft(d => ({ ...d, options: opts }));
                                                        }}
                                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                                                        placeholder={`Option ${oi + 1}`}
                                                    />
                                                </div>
                                            ))}
                                            <p className="text-xs text-slate-400">Select the radio button next to the correct answer.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t border-gray-100 flex gap-3">
                            <button onClick={() => { setStepDraft(null); setEditingStep(null); }} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={saveStep} className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700">{isNew ? 'Add Step' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Convert to Question Modal */}
            {showConvertModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="font-bold text-slate-800">Convert Step → Question Bank</h3>
                        </div>
                        <form onSubmit={handleConvert} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Question Type</label>
                                <select value={convertForm.type} onChange={e => setConvertForm(f => ({ ...f, type: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                    <option value="MCQ">MCQ</option>
                                    <option value="DESCRIPTIVE">Descriptive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
                                <textarea value={convertForm.questionText} onChange={e => setConvertForm(f => ({ ...f, questionText: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowConvertModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500">Add to Question Bank</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonStepEditor;
