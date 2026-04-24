import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const Results = () => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [editingSubmission, setEditingSubmission] = useState(null);
    const [descriptiveScore, setDescriptiveScore] = useState(0);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const { data } = await api.get('/api/teacher/exams');
                setExams(data);
            } catch {
                toast.error('Failed to fetch exams');
            }
        };
        fetchExams();
    }, []);

    const fetchSubmissions = async (examId) => {
        try {
            const { data } = await api.get(`/api/teacher/exams/${examId}/results`);
            setSelectedExam(data.exam);
            setSubmissions(data.submissions);
        } catch {
            toast.error('Failed to fetch results');
        }
    };

    const handleGrade = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/teacher/submissions/${editingSubmission._id}/grade`, {
                descriptiveScore: Number(descriptiveScore)
            });
            toast.success('Grading saved');
            setEditingSubmission(null);
            fetchSubmissions(selectedExam._id);
        } catch {
            toast.error('Failed to save grade');
        }
    };

    const handlePublishToggle = async () => {
        if (!selectedExam) return;
        setPublishing(true);
        try {
            const { data } = await api.put(`/api/teacher/exams/${selectedExam._id}/publish`);
            toast.success(data.message);
            setSelectedExam(prev => ({ ...prev, resultsPublished: data.resultsPublished }));
            // Update exams list too
            setExams(prev => prev.map(e => e._id === selectedExam._id ? { ...e, resultsPublished: data.resultsPublished } : e));
        } catch {
            toast.error('Failed to toggle publish status');
        } finally {
            setPublishing(false);
        }
    };

    const questionMap = {};
    if (selectedExam?.questionIds) {
        selectedExam.questionIds.forEach(q => { questionMap[q._id] = q; });
    }

    const completedExams = exams.filter(e => e.status === 'completed');

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Exam Results</h1>
                    <p className="text-sm text-slate-500">Grade submissions and publish results to students</p>
                </div>
            </div>

            {!selectedExam ? (
                <>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">Completed Exams</p>
                    {completedExams.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <svg className="w-14 h-14 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6M5 8h14M5 8a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V10a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2" />
                            </svg>
                            <p className="font-medium text-slate-500">No completed exams yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {completedExams.map(exam => (
                                <div
                                    key={exam._id}
                                    onClick={() => fetchSubmissions(exam._id)}
                                    className="bg-white border border-slate-100 rounded-xl p-5 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-slate-900">{exam.title}</h4>
                                            {exam.series && <p className="text-xs text-slate-400 mt-0.5">{exam.series}</p>}
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${exam.resultsPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {exam.resultsPublished ? '✓ Published' : 'Unpublished'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3">Click to view submissions →</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div>
                    {/* Back + header */}
                    <div className="flex items-center justify-between mb-5">
                        <button
                            onClick={() => { setSelectedExam(null); setSubmissions([]); }}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Exams
                        </button>

                        {/* Publish toggle */}
                        <button
                            onClick={handlePublishToggle}
                            disabled={publishing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                selectedExam.resultsPublished
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedExam.resultsPublished
                                    ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                    : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}
                                />
                            </svg>
                            {selectedExam.resultsPublished ? 'Unpublish Results' : 'Publish Results'}
                        </button>
                    </div>

                    <h4 className="font-bold text-slate-800 text-base mb-1">{selectedExam.title}</h4>
                    <p className="text-sm text-slate-500 mb-4">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>

                    {submissions.length === 0 ? (
                        <p className="text-center py-10 text-slate-400 text-sm">No submissions yet for this exam.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {['Student', 'Roll No', 'MCQ', 'Descriptive', 'Final', 'Action'].map(h => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {submissions.map(sub => (
                                        <tr key={sub._id} className="hover:bg-slate-50 transition">
                                            <td className="px-5 py-3.5 text-sm font-medium text-slate-900 whitespace-nowrap">{sub.studentId?.name}</td>
                                            <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{sub.studentId?.rollNumber || '—'}</td>
                                            <td className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">{sub.mcqScore}</td>
                                            <td className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">{sub.descriptiveScore}</td>
                                            <td className="px-5 py-3.5 text-sm font-bold text-slate-900 whitespace-nowrap">{sub.finalScore}</td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <button
                                                    onClick={() => { setEditingSubmission(sub); setDescriptiveScore(sub.descriptiveScore); }}
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition"
                                                >
                                                    Grade
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Grading Modal */}
            {editingSubmission && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800">Grade Submission</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{editingSubmission.studentId?.name}</p>
                            </div>
                            <button onClick={() => setEditingSubmission(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Answers</p>
                            <div className="space-y-3">
                                {editingSubmission.answers.map((ans, i) => {
                                    const q = questionMap[ans.questionId?._id || ans.questionId];
                                    return (
                                        <div key={i} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                            <p className="font-semibold text-sm text-slate-700">
                                                Q{i + 1}: {q?.questionText || 'Question'}
                                                <span className="ml-2 text-xs font-normal text-slate-400">[{q?.type}]</span>
                                            </p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                <span className="font-medium">Answer: </span>
                                                {ans.answer || <span className="italic text-slate-400">No answer</span>}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={handleGrade} className="p-6 border-t border-slate-100">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descriptive Score</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                value={descriptiveScore}
                                onChange={e => setDescriptiveScore(e.target.value)}
                            />
                            <div className="mt-4 flex gap-3">
                                <button type="button" onClick={() => setEditingSubmission(null)} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition">Save Grade</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Results;
