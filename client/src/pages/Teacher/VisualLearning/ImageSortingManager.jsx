import { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import { toast } from 'react-toastify';

const BASE = import.meta.env.VITE_API_URL || '';

// ─── DRAG-REORDER LIST for sorting images ─────────────────────────────────────
const DraggableList = ({ items, onChange }) => {
    const dragIdx = useRef(null);
    const onDragStart = i => (dragIdx.current = i);
    const onDragOver = (e, i) => {
        e.preventDefault();
        if (dragIdx.current === null || dragIdx.current === i) return;
        const next = [...items];
        const [m] = next.splice(dragIdx.current, 1);
        next.splice(i, 0, m);
        dragIdx.current = i;
        onChange(next);
    };
    const onDragEnd = () => (dragIdx.current = null);

    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={item._tempId || i} draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={e => onDragOver(e, i)}
                    onDragEnd={onDragEnd}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition group">
                    <div className="flex flex-col gap-0.5 opacity-30 group-hover:opacity-60">
                        {[0,1,2].map(r => <div key={r} className="flex gap-0.5">{[0,1].map(c => <div key={c} className="w-1 h-1 bg-slate-500 rounded-full"/>)}</div>)}
                    </div>
                    <div className="w-7 h-7 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center justify-center flex-shrink-0">{i+1}</div>
                    {item.imageUrl
                        ? <img src={`${BASE}${item.imageUrl}`} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0 border" />
                        : <div className="w-16 h-12 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                            {item.uploading ? <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"/> : <span className="text-slate-300 text-xs">img</span>}
                        </div>}
                    <input value={item.caption||''} onChange={e => onChange(items.map((it,idx)=>idx===i?{...it,caption:e.target.value}:it))}
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
                        placeholder={`Caption for step ${i+1} (optional)`}/>
                    <button type="button" onClick={() => onChange(items.filter((_,idx)=>idx!==i))}
                        className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
            ))}
        </div>
    );
};

// ─── SORTING PAPER FORM ────────────────────────────────────────────────────────
const SortingPaperForm = ({ existing, onSaved, onCancel }) => {
    const [title, setTitle] = useState(existing?.title||'');
    const [description, setDesc] = useState(existing?.description||'');
    const [items, setItems] = useState(()=>(existing?.images||[]).map(img=>({...img,_tempId:Math.random().toString(36)})));
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();

    const addImages = async (files) => {
        const placeholders = Array.from(files).map(f=>({_tempId:Math.random().toString(36),imageUrl:'',caption:'',uploading:true,_file:f}));
        setItems(p=>[...p,...placeholders]);
        for (const ph of placeholders) {
            try {
                const fd = new FormData(); fd.append('image', ph._file);
                const {data} = await api.post('/api/visual/upload', fd);
                setItems(p=>p.map(it=>it._tempId===ph._tempId?{...it,imageUrl:data.imageUrl,uploading:false}:it));
            } catch { toast.error('Upload failed'); setItems(p=>p.filter(it=>it._tempId!==ph._tempId)); }
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (items.length < 2) { toast.error('Add at least 2 images'); return; }
        if (items.some(it=>it.uploading)) { toast.error('Wait for uploads to finish'); return; }
        const images = items.map((it,i)=>({imageUrl:it.imageUrl,caption:it.caption||'',order:i}));
        setSaving(true);
        try {
            if (existing) { await api.put(`/api/visual/papers/${existing._id}`,{title,description,images}); toast.success('Updated'); }
            else { await api.post('/api/visual/papers',{type:'sorting',title,description,images}); toast.success('Paper created'); }
            onSaved();
        } catch(e){ toast.error(e.response?.data?.message||'Error'); } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{existing?'Edit':'New'} Sorting Paper</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Upload images · Drag to set the correct order</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
                </div>
                <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Title *</label>
                            <input required value={title} onChange={e=>setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="e.g. Network Setup Sequence"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                            <input value={description} onChange={e=>setDesc(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="Brief instructions…"/>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Images — Correct Order (Drag to Reorder)</label>
                            <button type="button" onClick={()=>fileRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                                Add Images
                            </button>
                            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e=>addImages(e.target.files)}/>
                        </div>
                        {items.length===0
                            ? <div onClick={()=>fileRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition">
                                <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                <p className="font-semibold text-slate-500 text-sm">Click to upload images</p>
                                <p className="text-xs text-slate-400 mt-1">Select multiple · Drag to reorder after</p>
                            </div>
                            : <DraggableList items={items} onChange={setItems}/>}
                        {items.length>=2&&<p className="text-xs text-indigo-600 font-semibold mt-2 text-center">↕ This order above = correct answer. Students see images shuffled.</p>}
                    </div>
                </form>
                <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
                    <button type="button" onClick={onCancel} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                    <button onClick={submit} disabled={saving||items.some(it=>it.uploading)}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving?<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving…</>:(existing?'Update Paper':'Create Paper')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── LABELING PAPER FORM ───────────────────────────────────────────────────────
const LabelingPaperForm = ({ existing, onSaved, onCancel }) => {
    const [title, setTitle] = useState(existing?.title||'');
    const [description, setDesc] = useState(existing?.description||'');
    const [bgUrl, setBgUrl] = useState(existing?.backgroundImageUrl||'');
    const [spots, setSpots] = useState(existing?.spots||[]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const imgRef = useRef();

    const uploadBg = async (file) => {
        setUploading(true);
        try {
            const fd = new FormData(); fd.append('image', file);
            const {data} = await api.post('/api/visual/upload', fd);
            setBgUrl(data.imageUrl);
        } catch { toast.error('Upload failed'); } finally { setUploading(false); }
    };

    const handleImageClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        if (spots.length >= 12) { toast.warning('Max 12 spots per paper'); return; }
        setSpots(prev => [...prev, { _tempId: Math.random().toString(36), x, y, label: '' }]);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!bgUrl) { toast.error('Upload a background image'); return; }
        if (spots.length < 1) { toast.error('Add at least 1 label spot'); return; }
        if (spots.some(s=>!s.label.trim())) { toast.error('Fill in all label answers'); return; }
        setSaving(true);
        try {
            const spotsData = spots.map(({x,y,label,_id})=>({x,y,label,...(_id?{_id}:{})}));
            if (existing) {
                await api.put(`/api/visual/papers/${existing._id}`,{title,description,backgroundImageUrl:bgUrl,spots:spotsData});
                toast.success('Updated');
            } else {
                await api.post('/api/visual/papers',{type:'labeling',title,description,backgroundImageUrl:bgUrl,spots:spotsData});
                toast.success('Paper created');
            }
            onSaved();
        } catch(e){ toast.error(e.response?.data?.message||'Error'); } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{existing?'Edit':'New'} Labeling Paper</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Upload diagram · Click to place numbered spots · Enter correct labels</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
                </div>
                <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Title *</label>
                            <input required value={title} onChange={e=>setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="e.g. Label the Network Diagram"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                            <input value={description} onChange={e=>setDesc(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="Instructions for students…"/>
                        </div>
                    </div>

                    {/* Background image upload or display */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Diagram Image *</label>
                        {!bgUrl ? (
                            <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition">
                                <input type="file" accept="image/*" className="hidden" onChange={e=>e.target.files[0]&&uploadBg(e.target.files[0])}/>
                                {uploading
                                    ? <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mb-2"/>
                                    : <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
                                <p className="font-semibold text-slate-500 text-sm">Click to upload diagram / chart / anatomy image</p>
                            </label>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-purple-600 font-semibold">Click on the image to place numbered spots →</p>
                                    <button type="button" onClick={()=>{setBgUrl('');setSpots([]);}} className="text-xs text-red-400 hover:text-red-600 font-semibold">Remove image</button>
                                </div>
                                <div className="relative rounded-xl overflow-hidden border border-slate-200 cursor-crosshair" onClick={handleImageClick} ref={imgRef}>
                                    <img src={`${BASE}${bgUrl}`} alt="diagram" className="w-full block select-none pointer-events-none"/>
                                    {spots.map((s,i)=>(
                                        <div key={s._tempId||s._id||i}
                                            className="absolute w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-500 transition -translate-x-1/2 -translate-y-1/2 select-none"
                                            style={{left:`${s.x}%`,top:`${s.y}%`}}
                                            onClick={e=>{e.stopPropagation();setSpots(spots.filter((_,idx)=>idx!==i));}}
                                            title="Click to remove">
                                            {i+1}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 text-center">Click a circle to remove it · Max 12 spots</p>
                            </div>
                        )}
                    </div>

                    {/* Labels for each spot */}
                    {spots.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Correct Labels for Each Spot</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {spots.map((s,i)=>(
                                    <div key={s._tempId||s._id||i} className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                                        <div className="w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">{i+1}</div>
                                        <input value={s.label||''} onChange={e=>setSpots(spots.map((it,idx)=>idx===i?{...it,label:e.target.value}:it))}
                                            className="flex-1 bg-transparent text-sm font-medium text-slate-700 focus:outline-none placeholder-slate-400"
                                            placeholder={`Correct label for spot ${i+1}…`}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </form>
                <div className="flex gap-3 px-6 pb-5 pt-3 border-t border-slate-100 flex-shrink-0">
                    <button type="button" onClick={onCancel} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                    <button onClick={submit} disabled={saving||uploading}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-500 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving?<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving…</>:(existing?'Update Paper':'Create Paper')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── CREATE EXAM MODAL ─────────────────────────────────────────────────────────
const CreateExamModal = ({ classes, onSaved, onCancel }) => {
    const [paperType, setPaperType] = useState('sorting');
    const [papers, setPapers] = useState([]);
    const [paperId, setPaperId] = useState('');
    const [title, setTitle] = useState('');
    const [classId, setClassId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(()=>{
        api.get(`/api/visual/papers?type=${paperType}`).then(r=>{ setPapers(r.data); setPaperId(''); });
    },[paperType]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/api/visual/exams',{title,paperId,classId});
            toast.success('Exam created');
            onSaved();
        } catch(e){ toast.error(e.response?.data?.message||'Error'); } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">Create Visual Exam</h3>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Paper Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['sorting','labeling'].map(t=>(
                                <button type="button" key={t} onClick={()=>setPaperType(t)}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition border-2 ${paperType===t?t==='sorting'?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-purple-500 bg-purple-50 text-purple-700':'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                    {t==='sorting'?'🃏 Image Sorting':'🔍 Image Labeling'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Select Paper *</label>
                        <select required value={paperId} onChange={e=>{ setPaperId(e.target.value); const p=papers.find(x=>x._id===e.target.value); if(p&&!title) setTitle(p.title); }}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400">
                            <option value="">Choose a {paperType} paper…</option>
                            {papers.map(p=><option key={p._id} value={p._id}>{p.title}</option>)}
                        </select>
                        {papers.length===0&&<p className="text-xs text-amber-500 mt-1">No {paperType} papers yet. Create one first.</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Exam Title *</label>
                        <input required value={title} onChange={e=>setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            placeholder="Auto-filled from paper, or customize"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Class *</label>
                        <select required value={classId} onChange={e=>setClassId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400">
                            <option value="">Select class…</option>
                            {classes.map(c=><option key={c._id} value={c._id}>{c.className}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onCancel} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition disabled:opacity-50">
                            {saving?'Creating…':'Create Exam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── APPROVE PANEL ───────────────────────────────────────────────────
const ApprovePanel = ({ exam, onClose, onUpdated }) => {
    const [students, setStudents] = useState([]);
    const [approved, setApproved] = useState(new Set((exam.approvedUserIds||[]).map(id=>id._id||id.toString())));
    const [saving, setSaving] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        // Use teacher/classes which populates studentIds -> students
        api.get('/api/teacher/classes').then(r => {
            const cId = exam.classId?._id || exam.classId?.toString() || exam.classId;
            const cls = r.data.find(c => c._id.toString() === cId.toString());
            setStudents(cls?.students || []);
        }).catch(() => toast.error('Could not load students'))
          .finally(() => setLoadingStudents(false));
    }, [exam]);

    const toggle = id => setApproved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const approveAll = () => setApproved(new Set(students.map(s => s._id)));
    const clearAll = () => setApproved(new Set());

    const save = async () => {
        setSaving(true);
        try {
            await api.put(`/api/visual/exams/${exam._id}/approve`, { studentIds: [...approved] });
            toast.success('Approvals saved');
            onUpdated(); onClose();
        } catch { toast.error('Failed to save'); } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800">Approve Students</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{exam.title}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                    </div>
                    {students.length > 0 && (
                        <div className="flex gap-2 mt-3">
                            <button onClick={approveAll} className="flex-1 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition">Select All</button>
                            <button onClick={clearAll} className="flex-1 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">Clear All</button>
                        </div>
                    )}
                </div>
                <div className="p-5 max-h-72 overflow-y-auto space-y-2">
                    {loadingStudents
                        ? <div className="flex justify-center py-6"><div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"/></div>
                        : students.length === 0
                            ? <div className="text-center py-6">
                                <p className="text-sm text-slate-400">No students found in this class</p>
                                <p className="text-xs text-slate-300 mt-1">Make sure students are assigned to the class</p>
                              </div>
                            : students.map(s => (
                                <label key={s._id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition ${approved.has(s._id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                    <input type="checkbox" checked={approved.has(s._id)} onChange={() => toggle(s._id)} className="rounded text-indigo-600 w-4 h-4 flex-shrink-0"/>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 truncate">{s.name}</p>
                                        <p className="text-xs text-slate-400">{s.email}</p>
                                    </div>
                                    <span className="text-xs text-slate-300 flex-shrink-0">#{s.rollNumber}</span>
                                </label>
                            ))
                    }
                </div>
                <div className="px-5 pb-5 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                    <button onClick={save} disabled={saving || loadingStudents}
                        className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving…</> : `Save (${approved.size} approved)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── RESULTS PANEL ─────────────────────────────────────────────────────────────
const ResultsPanel = ({ exam, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inspecting, setInspecting] = useState(null);
    const [overrideScores, setOverrideScores] = useState({});
    const [saving, setSaving] = useState(false);

    const loadData = () => {
        setLoading(true);
        api.get(`/api/visual/exams/${exam._id}/results`).then(r => {
            setData(r.data);
            const initialScores = {};
            r.data.submissions.forEach(s => initialScores[s._id] = s.score);
            setOverrideScores(initialScores);
        }).catch(() => toast.error('Failed')).finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, [exam._id]);

    const handleSaveScore = async (subId) => {
        setSaving(true);
        try {
            await api.put(`/api/visual/exams/${exam._id}/submissions/${subId}/score`, { score: overrideScores[subId] });
            toast.success('Marks updated');
            loadData();
        } catch (e) {
            toast.error('Update failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800">{exam.title}</h3>
                        <p className="text-xs text-slate-400">Results · {data?.submissions?.length||0} submissions</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={()=>api.put(`/api/visual/exams/${exam._id}/publish`).then(()=>toast.success('Results published!'))}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 transition">Publish</button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
                    {loading ? <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"/></div>
                    : !data?.submissions?.length ? <p className="text-center text-slate-400 py-8 text-sm">No submissions yet</p>
                    : data.submissions.map((sub,i)=>(
                        <div key={sub._id} className={`flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden ${i===0?'border-amber-200':'border-slate-200'}`}>
                            <div className="flex items-center gap-4 px-4 py-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${i===0?'bg-amber-400 text-white':'bg-slate-200 text-slate-600'}`}>{i+1}</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-800 text-sm">{sub.studentId?.name}</p>
                                    <p className="text-xs text-slate-400">#{sub.studentId?.rollNumber}</p>
                                </div>
                                {exam.paperId?.type === 'labeling' && (
                                    <button onClick={() => setInspecting(inspecting === sub._id ? null : sub._id)}
                                        className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition ${inspecting === sub._id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        {inspecting === sub._id ? 'Close' : 'Inspect'}
                                    </button>
                                )}
                                <div className="text-right w-16">
                                    <p className="font-bold text-lg">{sub.score}/{sub.total}</p>
                                    <p className={`text-xs font-semibold ${sub.percentage>=70?'text-emerald-600':sub.percentage>=40?'text-amber-600':'text-red-500'}`}>{sub.percentage}%</p>
                                </div>
                            </div>
                            
                            {inspecting === sub._id && exam.paperId?.type === 'labeling' && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Student Answers vs Correct Labels</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {exam.paperId.spots.map((spot, spotIdx) => {
                                            const stAns = sub.answers?.find(a => a.spotId?.toString() === spot._id?.toString())?.answer || '';
                                            const isCorrect = spot.label.trim().toLowerCase() === stAns.trim().toLowerCase();
                                            return (
                                                <div key={spot._id} className="bg-white border border-slate-200 p-2.5 rounded-lg">
                                                    <span className="font-bold text-[10px] text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded">Spot {spotIdx + 1}</span>
                                                    <div className="mt-2 text-xs flex justify-between items-center">
                                                        <span className="text-slate-500">Correct:</span>
                                                        <strong className="text-emerald-600">{spot.label}</strong>
                                                    </div>
                                                    <div className="mt-1 text-xs flex justify-between items-center">
                                                        <span className="text-slate-500">Student:</span>
                                                        <strong className={isCorrect ? "text-emerald-600" : "text-slate-700"}>{stAns || <span className="italic text-slate-300">blank</span>}</strong>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-end justify-between pt-3 border-t border-slate-200 mt-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Override Final Score</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" min="0" max={sub.total} 
                                                    value={overrideScores[sub._id] ?? sub.score} 
                                                    onChange={e => setOverrideScores({...overrideScores, [sub._id]: e.target.value})}
                                                    className="w-16 px-2 py-1.5 border border-slate-300 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                                                <span className="text-sm font-semibold text-slate-400">/ {sub.total}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleSaveScore(sub._id)} disabled={saving}
                                            className="px-5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition disabled:opacity-50">
                                            {saving ? 'Saving…' : 'Save Marks'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const VisualExamManager = () => {
    const [tab, setTab] = useState('exams');           // exams | sorting | labeling
    const [exams, setExams] = useState([]);
    const [papers, setPapers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSortForm, setShowSortForm] = useState(false);
    const [showLabelForm, setShowLabelForm] = useState(false);
    const [editPaper, setEditPaper] = useState(null);
    const [showCreateExam, setShowCreateExam] = useState(false);
    const [approveExam, setApproveExam] = useState(null);
    const [resultsExam, setResultsExam] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteText, setDeleteText] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [eRes, cRes] = await Promise.all([api.get('/api/visual/exams'), api.get('/api/teacher/classes')]);
            setExams(eRes.data); setClasses(cRes.data);
        } catch { toast.error('Failed to load'); } finally { setLoading(false); }
    };

    const fetchPapers = async (type) => {
        const {data} = await api.get(`/api/visual/papers?type=${type}`);
        setPapers(data);
    };

    useEffect(()=>{ fetchAll(); },[]);
    useEffect(()=>{ if(tab!=='exams') fetchPapers(tab); },[tab]);

    const setStatus = async (id, status) => {
        await api.put(`/api/visual/exams/${id}/status`,{status});
        toast.success(`Set to ${status}`); fetchAll();
    };

    const confirmDelete = async () => {
        if (!deleting||deleteText!==deleting.title){ toast.error('Name does not match'); return; }
        try {
            const url = deleting._type==='exam'?`/api/visual/exams/${deleting._id}`:`/api/visual/papers/${deleting._id}`;
            await api.delete(url);
            toast.success('Deleted'); setDeleting(null); setDeleteText('');
            deleting._type==='exam'?fetchAll():fetchPapers(tab);
        } catch { toast.error('Delete failed'); }
    };

    const statusColor = {draft:'bg-slate-100 text-slate-600',live:'bg-emerald-100 text-emerald-700',completed:'bg-blue-100 text-blue-700'};
    const typeColor   = {sorting:'bg-indigo-100 text-indigo-700',labeling:'bg-purple-100 text-purple-700'};

    const renderPapers = () => (
        <div>
            <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-slate-500">{papers.length} paper{papers.length!==1?'s':''}</p>
                <button onClick={()=>{ setEditPaper(null); tab==='sorting'?setShowSortForm(true):setShowLabelForm(true); }}
                    className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition ${tab==='sorting'?'bg-indigo-600 hover:bg-indigo-500':'bg-purple-600 hover:bg-purple-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    New {tab==='sorting'?'Sorting':'Labeling'} Paper
                </button>
            </div>
            {papers.length===0
                ? <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <p className="font-semibold">No {tab} papers yet</p>
                    <p className="text-sm mt-1">Create a paper first, then use it in an exam</p>
                </div>
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {papers.map(p=>(
                        <div key={p._id} className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden ${tab==='sorting'?'border-indigo-100':'border-purple-100'}`}>
                            {/* Preview strip */}
                            {p.type==='sorting'&&(
                                <div className="flex h-16 overflow-hidden">
                                    {(p.images||[]).slice(0,5).map((img,i)=>(
                                        <div key={i} className="flex-1 relative overflow-hidden">
                                            <img src={`${BASE}${img.imageUrl}`} alt="" className="w-full h-full object-cover"/>
                                            <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1 py-0.5 rounded">{i+1}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {p.type==='labeling'&&p.backgroundImageUrl&&(
                                <div className="h-24 overflow-hidden relative">
                                    <img src={`${BASE}${p.backgroundImageUrl}`} alt="" className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"/>
                                    <div className="absolute bottom-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{p.spots?.length||0} spots</div>
                                </div>
                            )}
                            <div className="p-4">
                                <h4 className="font-bold text-slate-800 mb-1">{p.title}</h4>
                                {p.description&&<p className="text-xs text-slate-500 mb-3 line-clamp-1">{p.description}</p>}
                                <div className="flex gap-2">
                                    <button onClick={()=>{setEditPaper(p);tab==='sorting'?setShowSortForm(true):setShowLabelForm(true);}}
                                        className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition">Edit</button>
                                    <button onClick={()=>{setDeleting({...p,_type:'paper'});setDeleteText('');}}
                                        className="px-3 py-2 text-xs font-semibold bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>}
        </div>
    );

    return (
        <div>
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Visual Exams</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Image-based interactive exams for deep learning</p>
                </div>
                {tab==='exams'&&(
                    <button onClick={()=>setShowCreateExam(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                        New Exam
                    </button>
                )}
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
                {[{id:'exams',label:'📋 Live Exams'},{id:'sorting',label:'🃏 Sort Papers'},{id:'labeling',label:'🔍 Label Papers'}].map(t=>(
                    <button key={t.id} onClick={()=>setTab(t.id)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab===t.id?'bg-white shadow text-slate-800':'text-slate-500 hover:text-slate-700'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── EXAMS TAB ── */}
            {tab==='exams'&&(
                loading
                ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse"/>)}</div>
                : exams.length===0
                    ? <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                        <p className="font-semibold">No visual exams yet</p>
                        <p className="text-sm mt-1">Create a paper in Sort/Label tabs, then create an exam here</p>
                    </div>
                    : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exams.map(exam=>(
                            <div key={exam._id} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
                                {/* Paper preview */}
                                {exam.paperId?.type==='sorting'&&(exam.paperId.images||[]).length>0&&(
                                    <div className="flex h-16 overflow-hidden">
                                        {exam.paperId.images.slice(0,4).map((img,i)=>(
                                            <div key={i} className="flex-1 overflow-hidden"><img src={`${BASE}${img.imageUrl}`} alt="" className="w-full h-full object-cover"/></div>
                                        ))}
                                    </div>
                                )}
                                {exam.paperId?.type==='labeling'&&exam.paperId.backgroundImageUrl&&(
                                    <div className="h-16 overflow-hidden"><img src={`${BASE}${exam.paperId.backgroundImageUrl}`} alt="" className="w-full h-full object-cover"/></div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-slate-800 text-sm leading-snug flex-1">{exam.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColor[exam.paperType]}`}>{exam.paperType}</span>
                                        <span className="text-[10px] text-slate-400">{exam.classId?.className}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${statusColor[exam.status]}`}>{exam.status.toUpperCase()}</span>
                                    </div>

                                    {/* Status selector — clean dropdown */}
                                    <div className="mb-3">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Status</label>
                                        <select value={exam.status} onChange={e => setStatus(exam._id, e.target.value)}
                                            className={`w-full px-3 py-2 rounded-xl text-xs font-bold border-2 focus:outline-none transition cursor-pointer ${
                                                exam.status==='draft' ? 'border-slate-200 bg-slate-50 text-slate-600' :
                                                exam.status==='live'  ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                                                                        'border-blue-200 bg-blue-50 text-blue-700'
                                            }`}>
                                            <option value="draft">⬜ Draft — not visible to students</option>
                                            <option value="live">🟢 Live — students can attend</option>
                                            <option value="completed">🔵 Completed — closed</option>
                                        </select>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-1.5">
                                        {exam.status === 'live'
                                            ? <button onClick={() => setApproveExam(exam)}
                                                className="flex-1 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition flex items-center justify-center gap-1">
                                                ✓ Approve ({exam.approvedUserIds?.length || 0})
                                              </button>
                                            : <div className="flex-1 py-1.5 text-xs font-semibold bg-slate-100 text-slate-400 rounded-lg text-center cursor-not-allowed" title="Set to Live first">
                                                🔒 Set Live to Approve
                                              </div>
                                        }
                                        <button onClick={() => setResultsExam(exam)} className="flex-1 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition">Results</button>
                                        <button onClick={() => { setDeleting({...exam, _type:'exam'}); setDeleteText(''); }} className="px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">Del</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
            )}

            {(tab==='sorting'||tab==='labeling')&&renderPapers()}

            {/* Modals */}
            {showSortForm&&<SortingPaperForm existing={editPaper} onSaved={()=>{setShowSortForm(false);setEditPaper(null);fetchPapers('sorting');}} onCancel={()=>{setShowSortForm(false);setEditPaper(null);}}/>}
            {showLabelForm&&<LabelingPaperForm existing={editPaper} onSaved={()=>{setShowLabelForm(false);setEditPaper(null);fetchPapers('labeling');}} onCancel={()=>{setShowLabelForm(false);setEditPaper(null);}}/>}
            {showCreateExam&&<CreateExamModal classes={classes} onSaved={()=>{setShowCreateExam(false);fetchAll();}} onCancel={()=>setShowCreateExam(false)}/>}
            {approveExam&&<ApprovePanel exam={approveExam} onClose={()=>setApproveExam(null)} onUpdated={fetchAll}/>}
            {resultsExam&&<ResultsPanel exam={resultsExam} onClose={()=>setResultsExam(null)}/>}

            {deleting&&(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="bg-red-500 px-6 py-4"><h3 className="font-bold text-white">Delete {deleting._type==='exam'?'Exam':'Paper'}</h3></div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-slate-600">Permanently delete <strong>{deleting.title}</strong>?</p>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type name to confirm</label>
                                <input autoFocus value={deleteText} onChange={e=>setDeleteText(e.target.value)} placeholder={deleting.title}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"/>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={()=>{setDeleting(null);setDeleteText('');}} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                                <button onClick={confirmDelete} disabled={deleteText!==deleting.title} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition disabled:opacity-50">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualExamManager;
