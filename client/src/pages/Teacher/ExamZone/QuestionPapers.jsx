import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from 'react-toastify';

const EMPTY_Q = { type: 'MCQ', questionText: '', imageUrl: '', options: ['', '', '', ''], optionImages: ['', '', '', ''], correctAnswers: [], marks: 1 };
const FIELD = 'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white';
const LABEL = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

// ─── Inline Question Editor ────────────────────────────────────────────────────
const QuestionEditor = ({ q, idx, onChange, onRemove }) => {
    const [uploading, setUploading] = useState(null);

    const update = (field, val) => onChange(idx, { ...q, [field]: val });
    
    const handleFileUpload = async (e, type, optIdx = null) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('image', file);
        
        setUploading(optIdx !== null ? `opt-${optIdx}` : 'question');
        try {
            const { data } = await api.post('/api/teacher/questions/upload', formData);
            if (optIdx !== null) {
                const newOptImages = [...(q.optionImages || ['', '', '', ''])];
                newOptImages[optIdx] = data.imageUrl;
                update('optionImages', newOptImages);
            } else {
                update('imageUrl', data.imageUrl);
            }
            toast.success('Image uploaded');
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploading(null);
        }
    };

    const updateOption = (i, val) => {
        const opts = [...q.options];
        opts[i] = val;
        const newCorrect = q.correctAnswers.map(ca => ca === q.options[i] ? val : ca);
        onChange(idx, { ...q, options: opts, correctAnswers: newCorrect });
    };

    const toggleCorrect = (opt) => {
        if (!opt) return;
        const alreadyCorrect = q.correctAnswers.includes(opt);
        const updated = alreadyCorrect
            ? q.correctAnswers.filter(a => a !== opt)
            : [...q.correctAnswers, opt];
        update('correctAnswers', updated);
    };

    const isMultiCorrect = q.correctAnswers.length > 1;

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-1 rounded-md">Q{idx + 1}</span>
                    <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-400">Marks:</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-1 focus:ring-slate-300"
                            value={q.marks || 1}
                            onChange={e => update('marks', Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-semibold">
                        {['MCQ', 'DESCRIPTIVE'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => onChange(idx, { ...EMPTY_Q, type: t, marks: q.marks || 1 })}
                                className={`px-3 py-1.5 transition ${q.type === t ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                            >
                                {t === 'MCQ' ? 'MCQ' : 'Written'}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 transition p-1 hover:bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Question Text & Image */}
            <div className="space-y-2">
                <div>
                    <label className={LABEL}>Question Text *</label>
                    <textarea
                        className={`${FIELD} resize-none`}
                        rows={2}
                        value={q.questionText}
                        onChange={e => update('questionText', e.target.value)}
                        placeholder="Type the question here…"
                        required
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition text-xs font-medium text-slate-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {uploading === 'question' ? 'Uploading...' : q.imageUrl ? 'Change Image' : 'Add Question Image'}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'question')} />
                    </label>
                    {q.imageUrl && (
                        <div className="relative group">
                            <img src={q.imageUrl.startsWith('http') ? q.imageUrl : `${import.meta.env.VITE_API_URL || ''}${q.imageUrl}`} alt="Question" className="h-10 w-10 object-cover rounded border" />
                            <button 
                                onClick={() => update('imageUrl', '')}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                            >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MCQ Options */}
            {q.type === 'MCQ' && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className={LABEL}>Options — tick correct answer(s)</label>
                        {isMultiCorrect && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                Multi-correct ({q.correctAnswers.length} answers)
                            </span>
                        )}
                    </div>
                    {q.options.map((opt, i) => {
                        const isCorrect = q.correctAnswers.includes(opt) && opt !== '';
                        const optImg = q.optionImages?.[i];
                        return (
                            <div key={i} className={`space-y-2 p-2 rounded-xl border-2 transition ${isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-transparent bg-slate-50/50'}`}>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={!opt}
                                        onClick={() => toggleCorrect(opt)}
                                        className={`w-6 h-6 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition ${
                                            isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400 bg-white'
                                        } ${!opt ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        {isCorrect && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                    <span className="w-4 text-xs font-bold text-slate-400">{String.fromCharCode(65 + i)}</span>
                                    <input
                                        className={`${FIELD} flex-1 py-2`}
                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                        value={opt}
                                        onChange={e => updateOption(i, e.target.value)}
                                    />
                                    
                                    {/* Option Image Upload */}
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-400 hover:text-slate-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'option', i)} />
                                        </label>
                                        {optImg && (
                                            <div className="relative group">
                                                <img src={optImg.startsWith('http') ? optImg : `${import.meta.env.VITE_API_URL || ''}${optImg}`} alt="Option" className="h-9 w-9 object-cover rounded border bg-white" />
                                                <button 
                                                    onClick={() => {
                                                        const newImgs = [...q.optionImages];
                                                        newImgs[i] = '';
                                                        update('optionImages', newImgs);
                                                    }}
                                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-sm"
                                                >
                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {q.correctAnswers.length === 0 && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            ☑ Tick the ✓ box next to options to mark them as correct.
                        </p>
                    )}
                </div>
            )}

            {q.type === 'DESCRIPTIVE' && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    📝 Written answer — teacher grades manually after exam
                </p>
            )}
        </div>
    );
};

// ─── Paper Builder (Create / Edit) ────────────────────────────────────────────
const PaperBuilder = ({ editPaper, onDone }) => {
    const [title, setTitle] = useState(editPaper?.title || '');
    const [description, setDescription] = useState(editPaper?.description || '');
    const [questions, setQuestions] = useState(
        editPaper?.questionIds?.length
            ? editPaper.questionIds.map(q => ({
                _id: q._id,
                type: q.type || 'MCQ',
                questionText: q.questionText || '',
                imageUrl: q.imageUrl || '',
                options: q.options?.length ? [...q.options, ...Array(4 - q.options.length).fill('')].slice(0, 4) : ['', '', '', ''],
                optionImages: q.optionImages?.length ? [...q.optionImages, ...Array(4 - q.optionImages.length).fill('')].slice(0, 4) : ['', '', '', ''],
                correctAnswers: q.correctAnswers?.length ? q.correctAnswers : (q.correctAnswer ? [q.correctAnswer] : []),
                marks: q.marks || 1,
            }))
            : [{ ...EMPTY_Q }]
    );
    const [saving, setSaving] = useState(false);

    const addQuestion = () => setQuestions(qs => [...qs, { ...EMPTY_Q }]);
    const removeQuestion = (idx) => {
        if (questions.length === 1) { toast.warning('A paper must have at least one question'); return; }
        setQuestions(qs => qs.filter((_, i) => i !== idx));
    };
    const updateQuestion = (idx, updated) => setQuestions(qs => qs.map((q, i) => i === idx ? updated : q));

    const handleSave = async (e) => {
        e.preventDefault();
        if (!title.trim()) { toast.error('Paper title is required'); return; }
        if (questions.length === 0) { toast.error('Add at least one question'); return; }

        const emptyQ = questions.find(q => !q.questionText.trim());
        if (emptyQ) { toast.error('All questions must have question text'); return; }

        const badMCQ = questions.find(q => q.type === 'MCQ' && (q.correctAnswers.length === 0 || q.options.filter(Boolean).length < 2));
        if (badMCQ) { toast.error('MCQ questions need at least 2 options and at least one correct answer marked'); return; }

        setSaving(true);
        try {
            // Step 1: Create/update individual questions in the Question bank
            const questionIds = [];
            for (const q of questions) {
                const payload = {
                    type: q.type,
                    questionText: q.questionText.trim(),
                    imageUrl: q.imageUrl,
                    options: q.type === 'MCQ' ? q.options.filter(Boolean) : [],
                    optionImages: q.type === 'MCQ' ? q.optionImages : [],
                    correctAnswers: q.type === 'MCQ' ? q.correctAnswers : [],
                    correctAnswer: q.type === 'MCQ' ? (q.correctAnswers[0] || '') : '',
                    marks: q.marks || 1,
                };
                if (q._id) {
                    const { data } = await api.put(`/api/teacher/questions/${q._id}`, payload);
                    questionIds.push(data._id);
                } else {
                    const { data } = await api.post('/api/teacher/questions', payload);
                    questionIds.push(data._id);
                }
            }

            // Step 2: Save the paper
            const paperPayload = { title: title.trim(), description: description.trim(), questionIds };
            if (editPaper) {
                await api.put(`/api/teacher/question-papers/${editPaper._id}`, paperPayload);
                toast.success('Paper updated');
            } else {
                await api.post('/api/teacher/question-papers', paperPayload);
                toast.success('Paper created');
            }
            onDone();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save paper');
        } finally {
            setSaving(false);
        }
    };

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    return (
        <div>
            <button onClick={onDone} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to papers
            </button>

            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-800">
                    {editPaper ? '✏️ Edit Paper' : '+ New Question Paper'}
                </h3>
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                    {questions.length} Question{questions.length !== 1 ? 's' : ''} · <span className="font-semibold text-slate-700">{totalMarks} Marks Total</span>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
                {/* Paper Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div>
                        <label className={LABEL}>Paper Title *</label>
                        <input className={FIELD} placeholder="e.g. Biology Mid-Term Paper" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div>
                        <label className={LABEL}>Description (optional)</label>
                        <input className={FIELD} placeholder="e.g. Chapter 3 & 4" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                </div>

                {/* Questions */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className={LABEL}>Questions</label>
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Question
                        </button>
                    </div>
                    <div className="space-y-3">
                        {questions.map((q, idx) => (
                            <QuestionEditor key={idx} q={q} idx={idx} onChange={updateQuestion} onRemove={removeQuestion} />
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                    <button type="button" onClick={onDone} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-60">
                        {saving ? 'Saving…' : editPaper ? 'Update Paper' : 'Save Paper'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─── Papers List ───────────────────────────────────────────────────────────────
const QuestionPapers = () => {
    const [papers, setPapers] = useState([]);
    const [view, setView] = useState('list');
    const [editPaper, setEditPaper] = useState(null);

    const fetch = async () => {
        try {
            const { data } = await api.get('/api/teacher/question-papers');
            setPapers(data);
        } catch {
            toast.error('Failed to load papers');
        }
    };

    useEffect(() => { fetch(); }, []);

    const openCreate = () => { setEditPaper(null); setView('create'); };
    const openEdit = (p) => { setEditPaper(p); setView('edit'); };
    const done = () => { setView('list'); setEditPaper(null); fetch(); };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this question paper? Questions in it will remain in the Question Bank.')) return;
        try {
            await api.delete(`/api/teacher/question-papers/${id}`);
            toast.success('Paper deleted');
            fetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    if (view === 'create' || view === 'edit') {
        return <PaperBuilder editPaper={editPaper} onDone={done} />;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-800">
                    Question Papers <span className="text-slate-400 font-normal text-sm">({papers.length})</span>
                </h3>
                <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Paper
                </button>
            </div>

            {papers.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V10a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2" />
                    </svg>
                    <p className="font-medium text-slate-500">No papers yet</p>
                    <p className="text-xs mt-1">Create a question paper to reuse in exams</p>
                    <button onClick={openCreate} className="mt-4 px-5 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition">
                        Create First Paper
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {papers.map(paper => {
                        const mcqCount = paper.questionIds?.filter(q => q.type === 'MCQ').length || 0;
                        const descCount = paper.questionIds?.filter(q => q.type === 'DESCRIPTIVE').length || 0;
                        return (
                            <div key={paper._id} className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition flex flex-col">
                                <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500 w-full" />
                                <div className="p-4 flex-1 flex flex-col">
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{paper.title}</h4>
                                    {paper.description && <p className="text-xs text-slate-400 italic mb-2">{paper.description}</p>}

                                    <div className="flex gap-2 text-xs text-slate-500 mt-auto mb-3">
                                        <span className="bg-slate-50 px-2 py-1 rounded-lg">📋 {paper.questionIds?.length || 0} total</span>
                                        {mcqCount > 0 && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{mcqCount} MCQ</span>}
                                        {descCount > 0 && <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">{descCount} Written</span>}
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                                        <button onClick={() => openEdit(paper)} className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition">
                                            ✏️ Edit
                                        </button>
                                        <button onClick={(e) => handleDelete(paper._id, e)} className="px-3 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuestionPapers;
