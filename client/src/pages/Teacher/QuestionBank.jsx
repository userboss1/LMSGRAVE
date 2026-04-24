import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const SERVER = import.meta.env.VITE_SERVER_URL !== undefined ? import.meta.env.VITE_SERVER_URL : 'http://localhost:5000';
const EMPTY_FORM = { type: 'MCQ', questionText: '', options: ['', '', '', ''], correctAnswer: '', imageUrl: '' };

const QuestionBank = () => {
    const [questions, setQuestions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    const fetchQuestions = async () => {
        try {
            // Append a timestamp to completely bust any browser/proxy caching
            const { data } = await api.get(`/api/teacher/questions?t=${new Date().getTime()}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            });
            setQuestions(data);
        } catch {
            toast.error('Failed to fetch questions');
        }
    };

    useEffect(() => { fetchQuestions(); }, []);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
        setImageFile(null);
        setImagePreview('');
    };

    const openEdit = (q) => {
        setForm({
            type: q.type,
            questionText: q.questionText,
            options: q.type === 'MCQ' ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
            correctAnswer: q.correctAnswer || '',
            imageUrl: q.imageUrl || '',
        });
        setImagePreview(q.imageUrl ? `${SERVER}${q.imageUrl}` : '');
        setImageFile(null);
        setEditingId(q._id);
        setShowForm(true);
        setTimeout(() => document.getElementById('q-form-top')?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        setForm(f => ({ ...f, imageUrl: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrl = form.imageUrl;

            // Upload new image if selected
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const { data } = await api.post('/api/teacher/questions/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                imageUrl = data.imageUrl;
            }

            const payload = {
                type: form.type,
                questionText: form.questionText,
                options: form.type === 'MCQ' ? form.options.filter(Boolean) : [],
                correctAnswer: form.type === 'MCQ' ? form.correctAnswer : undefined,
                imageUrl: imageUrl || undefined,
            };

            if (editingId) {
                await api.put(`/api/teacher/questions/${editingId}`, payload);
                toast.success('Question updated');
            } else {
                await api.post('/api/teacher/questions', payload);
                toast.success('Question added');
            }
            fetchQuestions();
            resetForm();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to save question');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this question permanently?')) return;
        try {
            await api.delete(`/api/teacher/questions/${id}`);
            toast.success('Question deleted');
            fetchQuestions();
        } catch {
            toast.error('Failed to delete question');
        }
    };

    const filtered = questions.filter(q => {
        const matchType = filter === 'ALL' || q.type === filter;
        const matchSearch = q.questionText.toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    return (
        <div id="q-form-top">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h3 className="text-base font-bold text-slate-800">
                    Question Bank <span className="text-slate-400 font-normal text-sm">({questions.length})</span>
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            toast.info('Clearing cache and refreshing...', { autoClose: 1000 });
                            fetchQuestions();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition"
                        title="Force reload from database"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <button
                        onClick={() => { if (showForm && !editingId) { resetForm(); } else { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); } }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm && !editingId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                        </svg>
                        {showForm && !editingId ? 'Cancel' : 'New Question'}
                    </button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-700">{editingId ? '✏️ Edit Question' : '+ New Question'}</h4>
                        <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
                    </div>

                    {/* Type */}
                    <div className="flex gap-3">
                        {['MCQ', 'DESCRIPTIVE'].map(t => (
                            <label key={t} className={`flex items-center gap-2 flex-1 p-3 rounded-lg border-2 cursor-pointer transition text-sm font-medium ${form.type === t ? 'border-slate-700 bg-white text-slate-800' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                <input type="radio" name="qtype" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t, correctAnswer: '', options: ['', '', '', ''] }))} className="sr-only" />
                                {t === 'MCQ' ? '☑ Multiple Choice' : '✍ Descriptive'}
                            </label>
                        ))}
                    </div>

                    {/* Question text */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Question Text *</label>
                        <textarea
                            className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white resize-none"
                            rows={3}
                            placeholder="Write the question here…"
                            value={form.questionText}
                            onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))}
                            required
                        />
                    </div>

                    {/* MCQ options */}
                    {form.type === 'MCQ' && (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options *</label>
                                <div className="mt-1 grid grid-cols-2 gap-2">
                                    {['A', 'B', 'C', 'D'].map((letter, i) => (
                                        <div key={letter} className="flex items-center gap-2">
                                            <span className="w-6 h-6 flex-shrink-0 text-xs font-bold text-slate-500 flex items-center justify-center">{letter}</span>
                                            <input
                                                type="text"
                                                placeholder={`Option ${letter}`}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                                                value={form.options[i]}
                                                onChange={e => {
                                                    const opts = [...form.options];
                                                    opts[i] = e.target.value;
                                                    setForm(f => ({ ...f, options: opts }));
                                                }}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Correct Answer *</label>
                                <select
                                    className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                                    value={form.correctAnswer}
                                    onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}
                                    required
                                >
                                    <option value="">— Select correct option —</option>
                                    {form.options.filter(Boolean).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Image upload */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Question Image <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                        {imagePreview ? (
                            <div className="mt-1 relative inline-block">
                                <img src={imagePreview} alt="preview" className="rounded-lg border border-slate-200 max-h-40 object-contain bg-slate-50" />
                                <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600">✕</button>
                            </div>
                        ) : (
                            <label className="mt-1 flex items-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 rounded-lg p-3 hover:border-slate-400 transition">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-sm text-slate-500">Click to upload image…</span>
                                <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>

                    <button type="submit" disabled={uploading} className="w-full py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition disabled:opacity-60">
                        {uploading ? 'Saving…' : editingId ? 'Save Changes' : 'Add Question'}
                    </button>
                </form>
            )}

            {/* Search + filter bar */}
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-40">
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="Search questions…" className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {['ALL', 'MCQ', 'DESCRIPTIVE'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${filter === f ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{f}</button>
                ))}
            </div>

            {/* Questions */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">{questions.length === 0 ? 'No questions yet.' : 'No matches found.'}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((q, i) => (
                        <div key={q._id} className="group flex gap-3 p-4 border border-slate-100 rounded-xl bg-white hover:shadow-sm transition">
                            <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                                {q.imageUrl && (
                                    <img src={`${SERVER}${q.imageUrl}`} alt="question" className="mb-2 rounded-lg max-h-20 object-contain border border-slate-100 bg-slate-50" />
                                )}
                                <p className="text-sm font-medium text-slate-800">{q.questionText}</p>
                                {q.type === 'MCQ' && (
                                    <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
                                        {q.options.map((opt, oi) => (
                                            <span key={oi} className={`text-xs ${opt === q.correctAnswer ? 'text-green-600 font-semibold' : 'text-slate-400'} flex items-center gap-1`}>
                                                {opt === q.correctAnswer && <span className="text-green-500">✓</span>}
                                                {opt}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${q.type === 'MCQ' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{q.type}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => openEdit(q)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(q._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuestionBank;
