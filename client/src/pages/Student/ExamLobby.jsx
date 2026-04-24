import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ExamLobby = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    const fetchExams = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const { data } = await api.get('/api/student/exams');
            setExams(data);
        } catch {
            toast.error('Failed to fetch exams');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchExams();
        // Poll every 15 seconds to check for approval status changes
        const interval = setInterval(() => fetchExams(true), 15000);
        return () => clearInterval(interval);
    }, [fetchExams]);

    const startExam = (examId) => {
        if (window.confirm('Ready to start? The exam will go fullscreen and the timer will begin.')) {
            navigate(`/exam/${examId}`);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
                ))}
            </div>
        );
    }

    if (exams.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-medium text-gray-500">No live exams right now</p>
                <p className="text-sm mt-1">Check back later or ask your teacher to go live.</p>
                <button
                    onClick={() => fetchExams()}
                    className="mt-4 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                    🔄 Refresh
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{exams.length} live exam{exams.length !== 1 ? 's' : ''} in your class</p>
                <button
                    onClick={() => fetchExams(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                >
                    <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {refreshing ? 'Checking...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map(exam => {
                    const approved = exam.isApproved;
                    return (
                        <div
                            key={exam._id}
                            className={`border rounded-xl p-5 flex flex-col transition ${
                                approved
                                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 hover:shadow-md'
                                    : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-800">{exam.title}</h4>
                                    {exam.series && <p className="text-xs text-gray-500 italic mt-0.5">{exam.series}</p>}
                                </div>
                                <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                                    approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${approved ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    {approved ? 'APPROVED' : 'LIVE · AWAITING'}
                                </span>
                            </div>

                            <div className="flex gap-4 text-xs text-gray-500 mb-5">
                                <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {exam.duration} min
                                </span>
                                {exam.negativeMarking && (
                                    <span className="flex items-center gap-1 text-amber-600">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Negative marking
                                    </span>
                                )}
                            </div>

                            {approved ? (
                                <button
                                    onClick={() => startExam(exam._id)}
                                    className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Enter Exam
                                </button>
                            ) : (
                                <div className="mt-auto space-y-2">
                                    <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-xl cursor-not-allowed select-none">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Waiting for Teacher Approval
                                    </div>
                                    <p className="text-[10px] text-center text-amber-600 font-medium">
                                        Your teacher needs to approve you. This page refreshes automatically.
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ExamLobby;
