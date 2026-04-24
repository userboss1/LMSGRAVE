import { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios';
import CourseViewer from './CourseViewer';
import { toast } from 'react-toastify';

const CourseCatalog = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCourse, setActiveCourse] = useState(null);

    useEffect(() => {
        api.get('/api/student/courses')
            .then(res => setCourses(res.data))
            .catch(() => toast.error('Failed to load courses'))
            .finally(() => setLoading(false));
    }, []);

    const refetch = () => {
        api.get('/api/student/courses')
            .then(res => setCourses(res.data))
            .catch(() => { });
    };

    const resumeCourse = useMemo(() => {
        if (!courses.length) return null;
        return courses.find(c => c.percent > 0 && c.percent < 100) || courses[0];
    }, [courses]);

    if (activeCourse) {
        const courseWithProgress = courses.find(c => c._id === activeCourse._id) || activeCourse;
        return (
            <div className="fixed inset-0 bg-slate-50 z-[9999] overflow-auto">
                {/* Fullscreen top bar */}
                <div className="sticky top-0 bg-white border-b border-slate-200 shadow-sm z-10 px-4 md:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <span className="font-bold text-slate-700 text-sm truncate max-w-[200px] md:max-w-none">{courseWithProgress.title}</span>
                    </div>
                    <button
                        onClick={() => { setActiveCourse(null); refetch(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Exit Course
                    </button>
                </div>
                {/* Course content */}
                <div className="p-4 md:p-8">
                    <CourseViewer
                        course={courseWithProgress}
                        onBack={() => { setActiveCourse(null); refetch(); }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Hero Banner */}
            {!loading && resumeCourse && (
                <div className="bg-slate-800 rounded-xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700">
                    <div>
                        <span className="inline-block px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-semibold mb-3 border border-slate-600">
                            Continue Learning
                        </span>
                        <h2 className="text-xl md:text-2xl font-bold mb-2">{resumeCourse.title}</h2>
                        <p className="text-slate-400 text-sm max-w-2xl mb-4 line-clamp-2">
                            {resumeCourse.description || "Pick up where you left off and complete your assigned modules."}
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">{resumeCourse.percent}%</span>
                                <span className="text-xs text-slate-400 uppercase tracking-wide">Complete</span>
                            </div>
                            <div className="w-px h-5 bg-slate-600" />
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">{resumeCourse.completedLessons}/{resumeCourse.totalLessons}</span>
                                <span className="text-xs text-slate-400 uppercase tracking-wide">Lessons</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActiveCourse(resumeCourse)}
                        className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-500 transition-colors shadow-sm whitespace-nowrap"
                    >
                        Resume Course
                    </button>
                </div>
            )}

            {/* Course Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">All Assigned Courses</h3>
                    <span className="text-sm text-slate-500">{courses.length} Course{courses.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-base font-semibold text-slate-700">No courses available</p>
                        <p className="text-sm text-slate-500 mt-1">Your instructor hasn't assigned any courses to you yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {courses.map(course => (
                            <div
                                key={course._id}
                                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-indigo-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
                                onClick={() => setActiveCourse(course)}
                            >
                                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">
                                            {course.title.charAt(0)}
                                        </div>
                                        {course.percent >= 100 && (
                                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-xs font-semibold">Completed</span>
                                        )}
                                    </div>
                                    
                                    <h4 className="text-base font-bold text-slate-800 mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2">{course.title}</h4>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-5 flex-1">{course.description || "Course content and modules."}</p>
                                    
                                    <div className="mt-auto">
                                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                            <span className="font-medium">{course.percent}% completed</span>
                                            <span>{course.completedLessons}/{course.totalLessons} Lessons</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-700 ${course.percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                style={{ width: `${course.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCatalog;

