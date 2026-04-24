import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import LessonViewer from './LessonViewer';
import { toast } from 'react-toastify';

const CourseViewer = ({ course: initialCourse, onBack }) => {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(null);
    const [activeLesson, setActiveLesson] = useState(null);
    const [expandedModules, setExpandedModules] = useState({});

    useEffect(() => { fetchCourse(); }, []);

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/api/student/courses/${initialCourse._id}`);
            setCourse(res.data);
            setProgress(res.data.progress);
            // Auto-expand first module
            if (res.data.modules?.length > 0) {
                setExpandedModules({ [res.data.modules[0]._id]: true });
            }
        } catch { toast.error('Failed to load course'); }
        finally { setLoading(false); }
    };

    const handleLessonComplete = (lessonId) => {
        fetchCourse();
    };

    const isLessonCompleted = (l) => {
        if (!progress?.lessons) return false;
        const lp = progress.lessons.find(p => p.lessonId === l._id);
        if (!lp) return false;
        return lp.lessonCompleted && lp.completedSteps.length >= (l.steps?.length || 0);
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    if (activeLesson) {
        return (
            <LessonViewer
                lesson={activeLesson}
                course={course}
                onBack={() => { setActiveLesson(null); fetchCourse(); }}
                onLessonComplete={handleLessonComplete}
            />
        );
    }

    const percent = initialCourse.percent || 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Navigation */}
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-lg w-fit shadow-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Catalog
            </button>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            ) : !course ? null : (
                <div className="space-y-8 pb-20">
                    {/* Clean Course Header */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="flex-1">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">{course.title}</h2>
                                <p className="text-slate-500 leading-relaxed max-w-2xl">{course.description || "Master the core concepts through our interactive visual learning system."}</p>
                            </div>
                            
                            <div className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Progress</span>
                                    <span className="text-sm font-bold text-indigo-600">{percent}% Complete</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                                    <div 
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <p className="text-xs font-medium text-slate-500">{initialCourse.completedLessons} of {initialCourse.totalLessons} lessons completed</p>
                            </div>
                        </div>
                    </div>

                    {/* Syllabus / Modules */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            Course Syllabus
                        </h3>
                        
                        {course.modules?.map((mod, mi) => {
                            const isOpen = !!expandedModules[mod._id];
                            const lessonsDone = mod.lessons?.filter(l => isLessonCompleted(l)).length || 0;
                            const modPercent = mod.lessons?.length > 0 ? Math.round((lessonsDone / mod.lessons.length) * 100) : 0;

                            return (
                                <div key={mod._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300">
                                    <button
                                        onClick={() => toggleModule(mod._id)}
                                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${modPercent === 100 ? 'bg-emerald-100 text-emerald-700' : modPercent > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {modPercent === 100 ? '✓' : mi + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 text-base">{mod.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">{lessonsDone} of {mod.lessons?.length || 0} Lessons Completed</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {modPercent === 100 ? (
                                                <span className="hidden md:block text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded font-semibold border border-emerald-100">Completed</span>
                                            ) : modPercent > 0 ? (
                                                <span className="hidden md:block text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded font-semibold border border-indigo-100">In Progress</span>
                                            ) : null}
                                            <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-slate-100 bg-slate-50 px-5 pb-5 pt-3 space-y-2">
                                            {mod.lessons?.length === 0 ? (
                                                <p className="text-sm text-slate-500 py-3 italic">No lessons released yet.</p>
                                            ) : mod.lessons.map((lesson, li) => {
                                                const done = isLessonCompleted(lesson);
                                                return (
                                                    <button
                                                        key={lesson._id}
                                                        onClick={() => setActiveLesson(lesson)}
                                                        className="w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm group"
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                                            {done ? '✓' : li + 1}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className={`text-sm font-semibold ${done ? 'text-slate-600' : 'text-slate-800'}`}>{lesson.title}</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">{lesson.steps?.length || 0} Concepts</p>
                                                        </div>
                                                        <div className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${done ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'}`}>
                                                            {done ? 'Review' : 'Start'}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseViewer;
