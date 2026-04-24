import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const statusConfig = {
    draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
    live: { label: 'Live', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    completed: { label: 'Ended', cls: 'bg-red-50 text-red-400', dot: 'bg-red-300' },
};

const ExamManagement = () => {
    const [exams, setExams] = useState([]);
    const [papers, setPapers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [tab, setTab] = useState('all');

    // Create form state
    const [title, setTitle] = useState('');
    const [series, setSeries] = useState('');
    const [classId, setClassId] = useState('');
    const [duration, setDuration] = useState(60);
    const [negativeMarking, setNegativeMarking] = useState(0);
    const [selectedPaperId, setSelectedPaperId] = useState('');

    // Approval modal
    const [approvingExam, setApprovingExam] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);

    // Delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteInput, setDeleteInput] = useState('');

    const fetchData = async () => {
        try {
            const [eR, pR, cR] = await Promise.all([
                api.get('/api/teacher/exams'),
                api.get('/api/teacher/question-papers'),
                api.get('/api/teacher/classes'),
            ]);
            setExams(eR.data);
            setPapers(pR.data);
            setClasses(cR.data);
        } catch {
            toast.error('Failed to load data');
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateExam = async (e) => {
        e.preventDefault();
        if (!selectedPaperId) { toast.error('Select a question paper'); return; }
        const paper = papers.find(p => p._id === selectedPaperId);
        if (!paper || !paper.questionIds?.length) { toast.error('Selected paper has no questions'); return; }
        try {
            const questionIds = paper.questionIds.map(q => q._id || q);
            await api.post('/api/teacher/exams', { title, series, classId, questionIds, duration, negativeMarking: parseFloat(negativeMarking) || 0 });
            toast.success('Exam created');
            setShowCreate(false);
            setTitle(''); setSeries(''); setClassId(''); setDuration(60); setNegativeMarking(0); setSelectedPaperId('');
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create exam'); }
    };

    const toggleStatus = async (id, current) => {
        const newStatus = current === 'live' ? 'completed' : 'live';
        try {
            await api.put(`/api/teacher/exams/${id}/status`, { status: newStatus });
            fetchData();
        } catch { toast.error('Failed to update status'); }
    };

  
    const openDeleteModal = (exam) => {
        if (exam.status === 'live') { toast.error('End the exam before deleting.'); return; }
        setDeleteTarget(exam);
        setDeleteInput('');
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/teacher/exams/${deleteTarget._id}`);
            toast.success('Exam deleted');
            setDeleteTarget(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

 
    const openApproveModal = async (exam) => {
        setApprovingExam(exam);
        setSelectedStudents(exam.approvedUserIds?.map(s => s._id || s) || []);
        try {
            const { data } = await api.get('/api/admin/classes');
            const examClassId = exam.classId?._id || exam.classId;
            const cls = data.find(c => c._id === examClassId);
            setClassStudents(cls?.studentIds || []);
        } catch { toast.error('Failed to load students'); }
    };

    const handleApprove = async () => {
        try {
            await api.put(`/api/teacher/exams/${approvingExam._id}/approve`, { studentIds: selectedStudents });
            toast.success('Students approved');
            setApprovingExam(null);
            fetchData();
        } catch { toast.error('Failed to approve students'); }
    };

    const toggleStudent = (id) => {
        setSelectedStudents(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
    };

    const visibleExams = tab === 'all' ? exams : exams.filter(e => e.status === tab);
    const counts = {
        all: exams.length,
        draft: exams.filter(e => e.status === 'draft').length,
        live: exams.filter(e => e.status === 'live').length,
        completed: exams.filter(e => e.status === 'completed').length,
    };

    return (
        <div>
       
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <h3 className="text-base font-bold text-slate-800 mr-auto">
                    Exam Management <span className="text-slate-400 font-normal text-sm">({exams.length})</span>
                </h3>
                <button
                    onClick={() => setShowCreate(f => !f)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showCreate ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                    </svg>
                    {showCreate ? 'Cancel' : 'Create Exam'}
                </button>
            </div>

            
            {showCreate && (
                <form onSubmit={handleCreateExam} className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
                    <h4 className="font-semibold text-slate-700">+ New Exam</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Title *</label>
                            <input type="text" placeholder="e.g. Unit Test 1" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Series</label>
                            <input type="text" placeholder="e.g. Mid-Term 2026" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white" value={series} onChange={e => setSeries(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Class *</label>
                            <select className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white" value={classId} onChange={e => setClassId(e.target.value)} required>
                                <option value="">Select a class…</option>
                                {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Duration (minutes) *</label>
                            <input type="number" min="1" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white" value={duration} onChange={e => setDuration(e.target.value)} required />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Negative Marking</label>
                        <select
                            className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                            value={negativeMarking}
                            onChange={e => setNegativeMarking(e.target.value)}
                        >
                            <option value="0">Disabled — no penalty</option>
                            <option value="0.25">−0.25 per wrong answer</option>
                            <option value="0.5">−0.5 per wrong answer</option>
                            <option value="1">−1 per wrong answer</option>
                            <option value="2">−2 per wrong answer</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                            Question Paper *
                        </label>
                        {papers.length === 0 ? (
                            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                ⚠️ No papers yet. Go to <strong>Test Builder → Create Paper</strong> to create one first.
                            </p>
                        ) : (
                            <div className="mt-1 space-y-2">
                                {papers.map(p => (
                                    <label
                                        key={p._id}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition ${
                                            selectedPaperId === p._id
                                                ? 'border-slate-700 bg-slate-50'
                                                : 'border-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paper"
                                            checked={selectedPaperId === p._id}
                                            onChange={() => setSelectedPaperId(p._id)}
                                            className="w-4 h-4"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                                            {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                                        </div>
                                        <span className="text-xs text-slate-400 flex-shrink-0">{p.questionIds?.length || 0} Qs</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition">
                        Create Exam
                    </button>
                </form>
            )}

           
            <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-full overflow-x-auto">
                {['all', 'draft', 'live', 'completed'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${(statusConfig[t] || {}).dot}`} />}
                        {t} <span className="opacity-60">({counts[t]})</span>
                    </button>
                ))}
            </div>

          
            {visibleExams.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">{exams.length === 0 ? 'No exams yet.' : `No ${tab} exams.`}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {visibleExams.map(exam => {
                        const sc = statusConfig[exam.status] || statusConfig.draft;
                        return (
                            <div key={exam._id} className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition flex flex-col">
                                <div className={`h-1 w-full ${exam.status === 'live' ? 'bg-green-400' : exam.status === 'completed' ? 'bg-red-300' : 'bg-slate-200'}`} />
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate text-sm leading-snug">{exam.title}</h4>
                                            {exam.series && <p className="text-xs text-slate-400 italic mt-0.5">{exam.series}</p>}
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1.5 ${sc.cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                            {sc.label}
                                        </span>
                                    </div>

                                    <div className="flex gap-3 text-xs text-slate-500 mb-4">
                                        <span>{exam.classId?.className || '—'}</span>
                                        <span>⏱ {exam.duration}m</span>
                                        <span>✓ {exam.approvedUserIds?.length || 0}</span>
                                        {exam.negativeMarking > 0 && <span className="text-amber-500">−{exam.negativeMarking}/q</span>}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        <button onClick={() => openApproveModal(exam)} className="flex-1 text-xs font-medium py-2 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                                            👥 Approve Students
                                        </button>
                                        {exam.status === 'draft' && (
                                            <button onClick={() => toggleStatus(exam._id, 'draft')} className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition">
                                                ▶ Go Live
                                            </button>
                                        )}
                                        {exam.status === 'live' && (
                                            <button onClick={() => toggleStatus(exam._id, 'live')} className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition">
                                                ■ End Exam
                                            </button>
                                        )}
                                    </div>

                                    {exam.status !== 'live' && (
                                        <button
                                            onClick={() => openDeleteModal(exam)}
                                            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-red-500 hover:text-white hover:bg-red-500 py-2 rounded-lg border border-red-100 hover:border-red-500 transition"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete Exam
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        {/* Red header bar */}
                        <div className="bg-red-500 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Delete Exam</h3>
                                    <p className="text-red-100 text-xs">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-slate-600">
                                You are about to permanently delete{' '}
                                <span className="font-bold text-slate-800">"{deleteTarget.title}"</span>.
                                All exam data will be lost.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Type the exam name to confirm:
                                    <span className="ml-1 font-bold text-slate-700 normal-case">{deleteTarget.title}</span>
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    className="w-full px-3 py-2.5 border-2 rounded-lg text-sm focus:outline-none transition border-slate-200 focus:border-red-400"
                                    placeholder={`Type "${deleteTarget.title}" here…`}
                                    value={deleteInput}
                                    onChange={e => setDeleteInput(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteInput !== deleteTarget.title}
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {approvingExam && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh]">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Approve Students</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{approvingExam.title}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {classStudents.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-8">No students in this class.</p>
                            ) : (
                                <div className="space-y-1">
                                    {/* Approve All row */}
                                    <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer bg-slate-50 border border-slate-200 mb-3">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded"
                                            checked={classStudents.length > 0 && selectedStudents.length === classStudents.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedStudents(classStudents.map(s => s._id || s));
                                                } else {
                                                    setSelectedStudents([]);
                                                }
                                            }}
                                        />
                                        <span className="text-sm font-bold text-slate-700">Approve All Students</span>
                                        <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{classStudents.length} total</span>
                                    </label>
                                    {classStudents.map(s => {
                                        const sid = s._id || s;
                                        const checked = selectedStudents.includes(sid);
                                        return (
                                            <label key={sid} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${checked ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                                                <input type="checkbox" checked={checked} onChange={() => toggleStudent(sid)} className="w-4 h-4 rounded" />
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {s.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{s.name || sid}</p>
                                                    <p className="text-xs text-slate-400 truncate">{s.email || ''}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-4 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setApprovingExam(null)} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                            <button onClick={handleApprove} className="flex-1 py-2.5 text-sm font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition">{selectedStudents.length} Selected — Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamManagement;
