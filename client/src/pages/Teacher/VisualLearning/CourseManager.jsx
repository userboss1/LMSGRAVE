import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import ModuleManager from './ModuleManager';
import StudentProgressView from './StudentProgressView';
import { toast } from 'react-toastify';

const statusBadge = {
    draft: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
};

const CourseManager = () => {
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', classIds: [], status: 'draft' });
    const [activeCourse, setActiveCourse] = useState(null); // drill into modules
    const [showProgress, setShowProgress] = useState(null); // course for progress view
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [cRes, clRes] = await Promise.all([
                api.get('/api/teacher/courses'),
                api.get('/api/teacher/classes'),
            ]);
            setCourses(cRes.data);
            setClasses(clRes.data);
        } catch (e) {
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const openForm = (course = null) => {
        setEditingCourse(course);
        setForm(course
            ? { title: course.title, description: course.description, classIds: course.classIds.map(c => c._id || c), status: course.status }
            : { title: '', description: '', classIds: [], status: 'draft' });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await api.put(`/api/teacher/courses/${editingCourse._id}`, form);
                toast.success('Course updated');
            } else {
                await api.post('/api/teacher/courses', form);
                toast.success('Course created');
            }
            setShowForm(false);
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Error saving course');
        }
    };

    const handleDelete = async () => {
        if (!courseToDelete) return;
        if (deleteConfirmText !== courseToDelete.title) {
            toast.error('Class name does not match');
            return;
        }
        try {
            await api.delete(`/api/teacher/courses/${courseToDelete._id}`);
            toast.success('Course deleted');
            setCourseToDelete(null);
            setDeleteConfirmText('');
            fetchData();
        } catch (e) {
            toast.error('Failed to delete course');
        }
    };

    const toggleClass = (classId) => {
        setForm(f => ({
            ...f,
            classIds: f.classIds.includes(classId)
                ? f.classIds.filter(id => id !== classId)
                : [...f.classIds, classId],
        }));
    };

    if (activeCourse) {
        return <ModuleManager course={activeCourse} onBack={() => setActiveCourse(null)} />;
    }

    if (showProgress) {
        return <StudentProgressView course={showProgress} onBack={() => setShowProgress(null)} />;
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">My Courses</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{courses.length} course{courses.length !== 1 ? 's' : ''} created</p>
                </div>
                <button
                    onClick={() => openForm()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Course
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="font-medium">No courses yet</p>
                    <p className="text-sm mt-1">Create your first visual learning course</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                        <div key={course._id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-slate-800 text-base leading-tight">{course.title}</h3>
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${statusBadge[course.status]}`}>
                                        {course.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{course.description || 'No description'}</p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {course.classIds && course.classIds.map(c => (
                                        <span key={c._id || c} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                            {c.className || 'Class'}
                                        </span>
                                    ))}
                                    {(!course.classIds || course.classIds.length === 0) && (
                                        <span className="text-[11px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">No class assigned</span>
                                    )}
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-gray-50">
                                    <button
                                        onClick={() => setActiveCourse(course)}
                                        className="flex-1 text-xs font-medium py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        Open →
                                    </button>
                                    <button
                                        onClick={() => setShowProgress(course)}
                                        className="px-3 text-xs font-medium py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                                        title="Student Progress"
                                    >
                                        📊
                                    </button>
                                    <button
                                        onClick={() => openForm(course)}
                                        className="px-3 text-xs font-medium py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setCourseToDelete(course)}
                                        className="px-3 text-xs font-medium py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-bold text-slate-800 text-lg">{editingCourse ? 'Edit Course' : 'Create Course'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder="e.g. Physics — Kinematics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                    placeholder="Brief course description…"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Classes</label>
                                <div className="flex flex-wrap gap-2">
                                    {classes.map(cls => (
                                        <label key={cls._id} className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.classIds.includes(cls._id)}
                                                onChange={() => toggleClass(cls._id)}
                                                className="rounded"
                                            />
                                            <span className="text-sm text-slate-600">{cls.className}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                                >
                                    {editingCourse ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {courseToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-red-500 px-6 py-4">
                            <h3 className="font-bold text-white text-lg">Delete Course</h3>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-slate-600">
                                This will permanently delete <strong>{courseToDelete.title}</strong> and all its modules, lessons, and steps.
                            </p>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Type course name to confirm</label>
                                <input
                                    autoFocus
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-semibold"
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder={courseToDelete.title}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setCourseToDelete(null); setDeleteConfirmText(''); }}
                                    className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== courseToDelete.title}
                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:bg-red-400"
                                >
                                    Delete Course
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManager;
