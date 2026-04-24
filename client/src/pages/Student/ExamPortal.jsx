import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// Shuffle helper (Fisher-Yates)
const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const ExamPortal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);
    const handleSubmitRef = useRef(null);

    // Fetch Exam
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const { data } = await api.get(`/api/student/exams/${id}`);
                setExam(data);
                // Shuffle questions and each MCQ's options
                const questions = (data.questionIds || []).map(q => ({
                    ...q,
                    options: q.type === 'MCQ' ? shuffle(q.options || []) : q.options,
                }));
                setShuffledQuestions(shuffle(questions));
                if (data.duration) setTimeLeft(data.duration * 60);
                setLoading(false);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load exam');
                navigate('/');
            }
        };
        fetchExam();
    }, [id, navigate]);

    // Timer — only restart when fullscreen state changes, NOT on every tick
    useEffect(() => {
        if (isFullscreen) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        if (handleSubmitRef.current) handleSubmitRef.current(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isFullscreen]);

    // Fullscreen enforcement (no violations — just a warning)
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                toast.warning('You exited fullscreen. Please return to continue.', { toastId: 'fs-exit' });
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch(err => toast.error(`Fullscreen error: ${err.message}`));
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async (auto = false) => {
        if (!auto && !window.confirm('Are you sure you want to submit?')) return;

        const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
            questionId: qId,
            answer: val,
        }));

        try {
            await api.post(`/api/student/exams/${id}/submit`, {
                answers: formattedAnswers,
                violations: 0       // kept for schema compat but always 0
            });
            if (document.exitFullscreen) document.exitFullscreen();
            toast.success('Exam submitted successfully!');
            navigate('/');
        } catch (error) {
            toast.error('Failed to submit exam');
        }
    };
    // Keep ref in sync so the timer interval always calls the freshest handleSubmit
    useEffect(() => { handleSubmitRef.current = handleSubmit; });

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const answered = Object.keys(answers).length;
    const total = shuffledQuestions.length;

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-slate-500 animate-pulse">Loading exam...</p>
        </div>
    );

    // Pre-exam gate
    if (!isFullscreen) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-slate-100">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">{exam?.title}</h2>
                    <p className="text-slate-500 text-sm mb-6">{total} questions · {exam?.duration} minutes</p>
                    <ul className="text-left text-sm text-slate-600 bg-slate-50 rounded-xl p-4 space-y-2 mb-8">
                        <li className="flex items-start gap-2"><span className="text-slate-400 font-bold">•</span> Exam runs in fullscreen mode.</li>
                        <li className="flex items-start gap-2"><span className="text-slate-400 font-bold">•</span> Questions and options are randomly shuffled.</li>
                        <li className="flex items-start gap-2"><span className="text-slate-400 font-bold">•</span> Timer starts once you enter fullscreen.</li>
                        <li className="flex items-start gap-2"><span className="text-slate-400 font-bold">•</span> You can only submit once.</li>
                    </ul>
                    <button
                        onClick={enterFullscreen}
                        className="w-full py-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                    >
                        I Agree — Start Exam
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Fixed header */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-100 shadow-sm px-6 py-3 z-10 flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-slate-800 truncate max-w-sm">{exam?.title}</h2>
                    <p className="text-xs text-slate-400">{answered}/{total} answered</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Progress */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-slate-800 rounded-full transition-all"
                                style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                    {/* Timer */}
                    <div className={`font-mono font-bold text-lg px-4 py-1.5 rounded-xl border-2 ${
                        timeLeft < 300 ? 'text-red-600 border-red-200 bg-red-50 animate-pulse' : 'text-slate-700 border-slate-200 bg-slate-50'
                    }`}>
                        {formatTime(timeLeft)}
                    </div>
                    <button
                        onClick={() => handleSubmit(false)}
                        className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-700 transition"
                    >
                        Submit
                    </button>
                </div>
            </div>

            {/* Questions */}
            <div className="mt-20 max-w-4xl mx-auto space-y-6 p-6 pb-16">
                {shuffledQuestions.map((q, index) => (
                    <div key={q._id} className="p-6 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition bg-white">
                        <h4 className="text-base font-semibold text-slate-800 mb-3 flex gap-2">
                            <span className="text-slate-400 font-bold">{index + 1}.</span>
                            <span>{q.questionText}</span>
                        </h4>

                        {q.imageUrl && (
                            <img
                                src={q.imageUrl.startsWith('http') ? q.imageUrl : `${import.meta.env.VITE_API_URL || ''}${q.imageUrl}`}
                                alt="Question"
                                className="mb-4 max-h-64 rounded-xl object-contain border border-slate-100 bg-slate-50 w-full"
                            />
                        )}

                        {q.type === 'MCQ' ? (
                            <div className="space-y-2">
                                {q.options.map((opt, i) => {
                                    const selected = typeof answers[q._id] === 'string'
                                        ? answers[q._id] === opt
                                        : (answers[q._id] || '').split(',').map(s => s.trim()).includes(opt);
                                    const isMulti = q.correctAnswers?.length > 1;
                                    return (
                                        <label key={i} className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition select-none ${
                                            selected
                                                ? 'bg-slate-800 border-slate-800 text-white'
                                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                        }`}>
                                            <input
                                                type={isMulti ? 'checkbox' : 'radio'}
                                                name={q._id}
                                                value={opt}
                                                checked={selected}
                                                onChange={() => {
                                                    if (isMulti) {
                                                        const curr = (answers[q._id] || '').split(',').map(s => s.trim()).filter(Boolean);
                                                        const next = curr.includes(opt) ? curr.filter(s => s !== opt) : [...curr, opt];
                                                        handleAnswerChange(q._id, next.join(', '));
                                                    } else {
                                                        handleAnswerChange(q._id, opt);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            {q.optionImages?.[i] && (
                                                <img src={q.optionImages[i].startsWith('http') ? q.optionImages[i] : `${import.meta.env.VITE_API_URL || ''}${q.optionImages[i]}`} alt={`Option ${i + 1}`} className="w-20 h-14 object-cover rounded-lg" />
                                            )}
                                            <span className="text-sm font-medium">{opt}</span>
                                        </label>
                                    );
                                })}
                                {q.correctAnswers?.length > 1 && (
                                    <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">Select all correct answers</p>
                                )}
                            </div>
                        ) : (
                            <textarea
                                className="w-full p-4 border-2 border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm resize-none bg-slate-50"
                                rows="5"
                                placeholder="Type your answer here..."
                                value={answers[q._id] || ''}
                                onChange={e => handleAnswerChange(q._id, e.target.value)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamPortal;
