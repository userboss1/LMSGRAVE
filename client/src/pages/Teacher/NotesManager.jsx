import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const LABEL = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5';
const FIELD = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 transition-all';

const NotesManager = () => {
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list | create | edit | details
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showAddNote, setShowAddNote] = useState(false);
    
    // For delete confirmation modal
    const [itemToDelete, setItemToDelete] = useState(null); // { type: 'subject' | 'note', item: Object }
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedClasses, setAssignedClasses] = useState([]);

    const [noteTitle, setNoteTitle] = useState('');
    const [noteDesc, setNoteDesc] = useState('');
    const [noteFile, setNoteFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subRes, clsRes] = await Promise.all([
                api.get('/api/notes/teacher/subjects'),
                api.get('/api/teacher/classes')
            ]);
            setSubjects(subRes.data);
            setClasses(clsRes.data);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/notes/teacher/subjects', { title, description, assignedClasses });
            toast.success('Subject created');
            setView('list');
            resetForm();
            fetchData();
        } catch (err) {
            toast.error('Failed to create subject');
        }
    };

    const handleUpdateSubject = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/notes/teacher/subjects/${selectedSubject._id}`, { 
                title, 
                description, 
                assignedClasses 
            });
            toast.success('Subject updated');
            setView('list');
            resetForm();
            fetchData();
        } catch (err) {
            toast.error('Failed to update subject');
        }
    };

    const resetForm = () => {
        setTitle(''); 
        setDescription(''); 
        setAssignedClasses([]);
        setSelectedSubject(null);
    };

    const startEdit = (s) => {
        setSelectedSubject(s);
        setTitle(s.title);
        setDescription(s.description || '');
        setAssignedClasses(s.assignedClasses.map(c => c._id));
        setView('edit');
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let fileUrl = '';
            let fileType = '';
            
            if (noteFile) {
                const formData = new FormData();
                formData.append('file', noteFile);
                const { data } = await api.post('/api/notes/upload', formData);
                fileUrl = data.fileUrl;
                fileType = data.fileType;
            }

            await api.post(`/api/notes/teacher/subjects/${selectedSubject._id}/notes`, {
                title: noteTitle,
                description: noteDesc,
                fileUrl,
                fileType,
                externalLink: ''
            });

            toast.success('Note added');
            setNoteTitle(''); setNoteDesc(''); setNoteFile(null);
            setShowAddNote(false);
            
            // Refresh details
            const subRes = await api.get('/api/notes/teacher/subjects');
            setSubjects(subRes.data);
            setSelectedSubject(subRes.data.find(s => s._id === selectedSubject._id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add note');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        const { type, item } = itemToDelete;
        if (deleteConfirmText !== item.title) {
            toast.error('Name does not match');
            return;
        }

        try {
            if (type === 'subject') {
                await api.delete(`/api/notes/teacher/subjects/${item._id}`);
                toast.success('Subject deleted');
                setView('list'); // if we were viewing it
                fetchData();
            } else if (type === 'note') {
                await api.delete(`/api/notes/teacher/subjects/${selectedSubject._id}/notes/${item._id}`);
                toast.success('Note removed');
                const subRes = await api.get('/api/notes/teacher/subjects');
                setSubjects(subRes.data);
                setSelectedSubject(subRes.data.find(s => s._id === selectedSubject._id));
            }
            setItemToDelete(null);
            setDeleteConfirmText('');
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    if (loading) return <div className="py-20 text-center text-slate-400">Loading notes...</div>;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Study Notes</h1>
                    <p className="text-sm text-slate-500">Create subjects and share study material with classes</p>
                </div>
                {view === 'list' && (
                    <button 
                        onClick={() => { resetForm(); setView('create'); }}
                        className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        New Subject
                    </button>
                )}
                {(view === 'create' || view === 'edit' || view === 'details') && (
                    <button 
                        onClick={() => { setView('list'); resetForm(); }}
                        className="text-sm font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        Back to List
                    </button>
                )}
            </div>

            {/* List View */}
            {view === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subjects.length === 0 ? (
                        <div className="col-span-2 py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                            <p className="text-slate-400">No subjects created yet. Start by adding one!</p>
                        </div>
                    ) : (
                        subjects.map(s => (
                            <div key={s._id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                                        <svg className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEdit(s)} className="p-2 text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => setItemToDelete({ type: 'subject', item: s })} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{s.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{s.description || 'No description provided'}</p>
                                
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {(s.assignedClasses || []).map(c => (
                                        <span key={c._id} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-tight">{c.className}</span>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => { setSelectedSubject(s); setView('details'); }}
                                    className="w-full py-3 bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl hover:bg-slate-800 hover:text-white transition-all duration-300"
                                >
                                    Manage Notes ({s.notes.length})
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create/Edit Subject View */}
            {(view === 'create' || view === 'edit') && (
                <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">{view === 'create' ? 'Create New Subject' : 'Edit Subject'}</h2>
                    <form onSubmit={view === 'create' ? handleCreateSubject : handleUpdateSubject} className="space-y-5">
                        <div>
                            <label className={LABEL}>Subject Title *</label>
                            <input className={FIELD} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Physics - Mechanics" required />
                        </div>
                        <div>
                            <label className={LABEL}>Description</label>
                            <textarea className={FIELD} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief overview of what this subject covers..." />
                        </div>
                        <div>
                            <label className={LABEL}>Assigned Classes *</label>
                            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto">
                                {classes.map(c => (
                                    <label key={c._id} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded text-slate-800 focus:ring-slate-800 border-slate-300"
                                            checked={assignedClasses.includes(c._id)}
                                            onChange={e => {
                                                if (e.target.checked) setAssignedClasses([...assignedClasses, c._id]);
                                                else setAssignedClasses(assignedClasses.filter(id => id !== c._id));
                                            }}
                                        />
                                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors uppercase tracking-tight">{c.className}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all">
                            {view === 'create' ? 'Create Subject' : 'Update Subject'}
                        </button>
                    </form>
                </div>
            )}

            {/* Subject Details View */}
            {view === 'details' && selectedSubject && (
                <div className="space-y-6">
                    <div className="bg-slate-800 text-white rounded-3xl p-8 shadow-xl flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{selectedSubject.title}</h2>
                            <p className="text-slate-300 text-sm">{selectedSubject.description || 'Managing study notes for assigned classes.'}</p>
                        </div>
                        {!showAddNote && (
                            <button 
                                onClick={() => setShowAddNote(true)}
                                className="px-5 py-3 bg-white text-slate-800 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                Add Note
                            </button>
                        )}
                    </div>

                    {showAddNote && (
                        <div className="bg-white border-2 border-slate-800 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800">New Note Entry</h3>
                                <button onClick={() => setShowAddNote(false)} className="text-slate-400 hover:text-slate-600 font-bold">CANCEL</button>
                            </div>
                            <form onSubmit={handleAddNote} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={LABEL}>Note Title *</label>
                                        <input className={FIELD} value={noteTitle} onChange={e => setNoteTitle(e.target.value)} required placeholder="e.g. Newton's Third Law PDF" />
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL}>Short Description</label>
                                    <input className={FIELD} value={noteDesc} onChange={e => setNoteDesc(e.target.value)} placeholder="What's in this note?" />
                                </div>
                                <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50 relative group">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={e => setNoteFile(e.target.files[0])}
                                        accept=".pdf,image/*"
                                    />
                                    <div className="space-y-2">
                                        <div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-sm">
                                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">
                                            {noteFile ? noteFile.name : 'Click or Drag to upload PDF or Image'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Max 20MB</p>
                                    </div>
                                </div>
                                <button 
                                    disabled={uploading}
                                    type="submit" 
                                    className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Adding Note...
                                        </>
                                    ) : 'Add to Subject'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subject Notes</h3>
                        {selectedSubject.notes.length === 0 ? (
                            <div className="py-20 text-center text-slate-300 italic bg-white border border-slate-100 rounded-3xl">
                                No notes added inside this subject yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedSubject.notes.map(n => (
                                    <div key={n._id} className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center gap-5 group hover:border-slate-800 transition-all shadow-sm">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.fileType === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {n.fileType === 'pdf' ? (
                                                <svg className="w-8 h-8 font-bold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 18V5l7 0 4 4v9h-11z"/><path d="M13 5v4h4"/></svg>
                                            ) : (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate">{n.title}</h4>
                                            <p className="text-xs text-slate-500 truncate">{n.description || 'No description'}</p>
                                            <div className="flex gap-3 mt-2">
                                                {n.fileUrl && (
                                                    <a href={n.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-800 underline uppercase tracking-widest">Download File</a>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => setItemToDelete({ type: 'note', item: n })} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-red-500 px-6 py-4">
                            <h3 className="font-bold text-white text-lg">Delete {itemToDelete.type === 'subject' ? 'Subject' : 'Note'}</h3>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-slate-600">
                                This will permanently delete <strong>{itemToDelete.item.title}</strong>
                                {itemToDelete.type === 'subject' ? ' and all its associated notes.' : '.'}
                            </p>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Type name to confirm</label>
                                <input
                                    autoFocus
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-semibold"
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder={itemToDelete.item.title}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setItemToDelete(null); setDeleteConfirmText(''); }}
                                    className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteConfirmText !== itemToDelete.item.title}
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:bg-red-400"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesManager;
