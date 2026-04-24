import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const MyNotes = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const { data } = await api.get('/api/notes/student');
                setSubjects(data);
            } catch (err) {
                toast.error('Failed to load notes');
            } finally {
                setLoading(false);
            }
        };
        fetchNotes();
    }, []);

    if (loading) return <div className="py-20 text-center text-slate-400">Loading your study material...</div>;

    if (subjects.length === 0) {
        return (
            <div className="text-center py-24 text-slate-400">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-500 mb-1">No notes assigned</h3>
                <p className="text-sm">Your teachers haven't shared any study material with your class yet.</p>
            </div>
        );
    }

    if (selectedSubject) {
        return (
            <div>
                <button 
                    onClick={() => setSelectedSubject(null)}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition font-bold"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    Back to Subjects
                </button>

                <div className="bg-slate-800 text-white rounded-3xl p-8 mb-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold">{selectedSubject.title}</h2>
                    </div>
                    <p className="text-slate-300 text-sm max-w-2xl">{selectedSubject.description || 'Study material shared by your teacher.'}</p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Study Material</h3>
                    {selectedSubject.notes.length === 0 ? (
                        <p className="text-center py-12 text-slate-400 italic">No notes found for this subject.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedSubject.notes.map(n => (
                                <div key={n._id} className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${n.fileType === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {n.fileType === 'pdf' ? (
                                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 18V5l7 0 4 4v9h-11z"/><path d="M13 5v4h4"/></svg>
                                            ) : (
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 line-clamp-1">{n.title}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{n.description || 'Reference material'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {n.fileUrl && (
                                            <a 
                                                href={n.fileUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="flex-1 py-3 bg-slate-800 text-white text-[10px] font-bold text-center rounded-2xl hover:bg-slate-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12" /></svg>
                                                Open File
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">MY STUDY VAULT</h1>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">Access your shared study material</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map(s => (
                    <div 
                        key={s._id} 
                        onClick={() => setSelectedSubject(s)}
                        className="bg-white border border-slate-100 rounded-[2.5rem] p-8 cursor-pointer hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-500 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-16 translate-y--16 group-hover:scale-150 transition-transform duration-700"></div>
                        
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-slate-200 group-hover:rotate-12 transition-transform">
                                <span className="text-xl font-black text-white">{s.title.charAt(0)}</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900">{s.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10">{s.description || 'Tap to view shared notes for this subject.'}</p>
                            
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.notes.length} RESOURCES</span>
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyNotes;
