import { useState } from 'react';
import api from '../../../../api/axios';
import { toast } from 'react-toastify';

const SERVER = import.meta.env.VITE_SERVER_URL !== undefined ? import.meta.env.VITE_SERVER_URL : 'http://localhost:5000';

const subtypes = [
    {
        id: 'sort',
        label: 'Sorting',
        desc: 'Students arrange items in correct order',
        icon: '↕',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'match',
        label: 'Matching',
        desc: 'Students match pairs from two columns',
        icon: '⟷',
        color: 'from-violet-500 to-purple-500',
    },
    {
        id: 'label',
        label: 'Labeling',
        desc: 'Students label parts of an image',
        icon: '🏷',
        color: 'from-emerald-500 to-teal-500',
    },
    {
        id: 'identify',
        label: 'Identifying',
        desc: 'Students identify elements in an image',
        icon: '🔍',
        color: 'from-amber-500 to-orange-500',
    },
];

/* ── Helpers per subtype ── */
const emptyData = (sub) => {
    if (sub === 'sort') return { items: ['', '', '', ''] };
    if (sub === 'match') return { pairs: [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }] };
    if (sub === 'label') return { labels: ['', '', ''] };
    if (sub === 'identify') return { targets: ['', '', ''] };
    return {};
};

/* ── Sub-editors ── */
const SortEditor = ({ data, onChange }) => (
    <div className="space-y-2">
        <p className="text-xs text-slate-400 mb-2">Enter items in the CORRECT order — students will see them shuffled.</p>
        {data.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                <input
                    value={item}
                    onChange={e => {
                        const items = [...data.items];
                        items[i] = e.target.value;
                        onChange({ ...data, items });
                    }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                    placeholder={`Item ${i + 1}`}
                />
                {data.items.length > 2 && (
                    <button
                        type="button"
                        onClick={() => onChange({ ...data, items: data.items.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >×</button>
                )}
            </div>
        ))}
        <button
            type="button"
            onClick={() => onChange({ ...data, items: [...data.items, ''] })}
            className="text-xs text-blue-600 hover:underline mt-1"
        >+ Add item</button>
    </div>
);

const MatchEditor = ({ data, onChange }) => (
    <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Column A</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Column B</span>
        </div>
        {data.pairs.map((pair, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 items-center">
                <input
                    value={pair.left}
                    onChange={e => {
                        const pairs = [...data.pairs];
                        pairs[i] = { ...pair, left: e.target.value };
                        onChange({ ...data, pairs });
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                    placeholder={`A${i + 1}`}
                />
                <div className="flex gap-2">
                    <input
                        value={pair.right}
                        onChange={e => {
                            const pairs = [...data.pairs];
                            pairs[i] = { ...pair, right: e.target.value };
                            onChange({ ...data, pairs });
                        }}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                        placeholder={`B${i + 1}`}
                    />
                    {data.pairs.length > 2 && (
                        <button
                            type="button"
                            onClick={() => onChange({ ...data, pairs: data.pairs.filter((_, j) => j !== i) })}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                        >×</button>
                    )}
                </div>
            </div>
        ))}
        <button
            type="button"
            onClick={() => onChange({ ...data, pairs: [...data.pairs, { left: '', right: '' }] })}
            className="text-xs text-violet-600 hover:underline mt-1"
        >+ Add pair</button>
    </div>
);

const LabelEditor = ({ data, onChange }) => (
    <div className="space-y-2">
        <p className="text-xs text-slate-400 mb-2">Enter the labels students must place on the image.</p>
        {data.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-emerald-400">{i + 1}</span>
                <input
                    value={label}
                    onChange={e => {
                        const labels = [...data.labels];
                        labels[i] = e.target.value;
                        onChange({ ...data, labels });
                    }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                    placeholder={`Label ${i + 1}`}
                />
                {data.labels.length > 1 && (
                    <button
                        type="button"
                        onClick={() => onChange({ ...data, labels: data.labels.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >×</button>
                )}
            </div>
        ))}
        <button
            type="button"
            onClick={() => onChange({ ...data, labels: [...data.labels, ''] })}
            className="text-xs text-emerald-600 hover:underline mt-1"
        >+ Add label</button>
    </div>
);

const IdentifyEditor = ({ data, onChange }) => (
    <div className="space-y-2">
        <p className="text-xs text-slate-400 mb-2">Enter elements students must identify in the image.</p>
        {data.targets.map((target, i) => (
            <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-amber-400">{i + 1}</span>
                <input
                    value={target}
                    onChange={e => {
                        const targets = [...data.targets];
                        targets[i] = e.target.value;
                        onChange({ ...data, targets });
                    }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                    placeholder={`Element ${i + 1}`}
                />
                {data.targets.length > 1 && (
                    <button
                        type="button"
                        onClick={() => onChange({ ...data, targets: data.targets.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >×</button>
                )}
            </div>
        ))}
        <button
            type="button"
            onClick={() => onChange({ ...data, targets: [...data.targets, ''] })}
            className="text-xs text-amber-600 hover:underline mt-1"
        >+ Add element</button>
    </div>
);

const VisualMCQCreator = ({ onCreated }) => {
    const [step, setStep] = useState(1); // 1 = pick subtype, 2 = build question
    const [subtype, setSubtype] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [visualData, setVisualData] = useState({});
    const [saving, setSaving] = useState(false);

    const handleSubtypeSelect = (id) => {
        setSubtype(id);
        setVisualData(emptyData(id));
        setStep(2);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!questionText.trim()) { toast.error('Question text is required'); return; }
        setSaving(true);
        try {
            let finalImageUrl = imageUrl;
            if (imageFile) {
                const fd = new FormData();
                fd.append('image', imageFile);
                const { data } = await api.post('/api/teacher/questions/upload', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                finalImageUrl = data.imageUrl;
            }
            const payload = {
                type: 'VISUAL_MCQ',
                questionText,
                imageUrl: finalImageUrl || undefined,
                visualSubtype: subtype,
                visualData,
                correctVisualAnswer: visualData, // teacher creates question with reference data
            };
            await api.post('/api/teacher/questions', payload);
            toast.success('Visual MCQ created!');
            // reset
            setStep(1); setSubtype(''); setQuestionText('');
            setImageFile(null); setImagePreview(''); setImageUrl(''); setVisualData({});
            onCreated?.();
        } catch {
            toast.error('Failed to save Visual MCQ');
        } finally {
            setSaving(false);
        }
    };

    /* ── Step 1: pick subtype ── */
    if (step === 1) {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Create Visual MCQ</h2>
                        <p className="text-sm text-slate-500">Choose the type of visual activity</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subtypes.map(st => (
                        <button
                            key={st.id}
                            onClick={() => handleSubtypeSelect(st.id)}
                            className="text-left p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-300 hover:shadow-md transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${st.color} flex items-center justify-center text-white text-2xl mb-3 shadow-sm`}>
                                {st.icon}
                            </div>
                            <p className="font-bold text-slate-800 text-base group-hover:text-slate-900">{st.label}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{st.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    /* ── Step 2: build question ── */
    const sel = subtypes.find(s => s.id === subtype);
    return (
        <div>
            <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to type selection
            </button>

            <div className="flex items-center gap-3 mb-6">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sel.color} flex items-center justify-center text-white text-xl shadow-sm`}>
                    {sel.icon}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">New {sel.label} Question</h2>
                    <p className="text-sm text-slate-500">{sel.desc}</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
                {/* Question text */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Question / Instruction *</label>
                    <textarea
                        rows={3}
                        value={questionText}
                        onChange={e => setQuestionText(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white resize-none"
                        placeholder="e.g. Arrange the following steps in the correct order…"
                        required
                    />
                </div>

                {/* Image upload */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Supporting Image <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                    {imagePreview ? (
                        <div className="relative inline-block">
                            <img src={imagePreview} alt="preview" className="rounded-xl border border-slate-200 max-h-48 object-contain bg-slate-50" />
                            <button
                                type="button"
                                onClick={() => { setImageFile(null); setImagePreview(''); setImageUrl(''); }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center hover:bg-red-600"
                            >×</button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-slate-500">Click to upload image</span>
                            <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                        </label>
                    )}
                </div>

                {/* Dynamic data editor */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        {sel.label} Data *
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        {subtype === 'sort' && <SortEditor data={visualData} onChange={setVisualData} />}
                        {subtype === 'match' && <MatchEditor data={visualData} onChange={setVisualData} />}
                        {subtype === 'label' && <LabelEditor data={visualData} onChange={setVisualData} />}
                        {subtype === 'identify' && <IdentifyEditor data={visualData} onChange={setVisualData} />}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save Visual MCQ'}
                </button>
            </form>
        </div>
    );
};

export default VisualMCQCreator;
