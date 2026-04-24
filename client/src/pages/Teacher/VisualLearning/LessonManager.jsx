import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import LessonStepEditor from './LessonStepEditor';
import { toast } from 'react-toastify';

const LessonManager = ({ module, course, onBack }) => {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [form, setForm] = useState({ title: '', description: '' });
    const [activeLesson, setActiveLesson] = useState(null);

    useEffect(() => { fetchLessons(); }, []);

    const fetchLessons = async () => {
        try {
            const res = await api.get(`/api/teacher/courses/modules/${module._id}/lessons`);
            setLessons(res.data);
        } catch { toast.error('Failed to load lessons'); }
        finally { setLoading(false); }
    };

    const openForm = (lesson = null) => {
        setEditingLesson(lesson);
        setForm(lesson ? { title: lesson.title, description: lesson.description } : { title: '', description: '' });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLesson) {
                await api.put(`/api/teacher/courses/lessons/${editingLesson._id}`, form);
                toast.success('Lesson updated');
            } else {
                await api.post(`/api/teacher/courses/modules/${module._id}/lessons`, form);
                toast.success('Lesson created');
            }
            setShowForm(false);
            fetchLessons();
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this lesson and all its steps?')) return;
        try {
            await api.delete(`/api/teacher/courses/lessons/${id}`);
            toast.success('Lesson deleted');
            fetchLessons();
        } catch { toast.error('Failed to delete lesson'); }
    };

    if (activeLesson) {
        return <LessonStepEditor lesson={activeLesson} course={course} module={module} onBack={() => setActiveLesson(null)} />;
    }

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <button onClick={() => onBack()} className="text-indigo-600 hover:underline font-medium">Courses</button>
                <span className="text-slate-300">/</span>
                <button onClick={onBack} className="text-indigo-600 hover:underline font-medium">{course.title}</button>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800 font-semibold">{module.title}</span>
                <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-1">Lessons</span>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Lessons <span className="text-slate-400 font-normal text-base">({lessons.length})</span></h2>
                <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Lesson
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" /></div>
            ) : lessons.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <p className="font-medium">No lessons yet</p>
                    <p className="text-sm">Add the first lesson to this module</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {lessons.map((lesson, i) => (
                        <div key={lesson._id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-all">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold flex-shrink-0">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800">{lesson.title}</p>
                                <p className="text-sm text-slate-500 truncate">{lesson.description || 'No description'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setActiveLesson(lesson)} className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium">Edit Steps</button>
                                <button onClick={() => openForm(lesson)} className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Edit</button>
                                <button onClick={() => handleDelete(lesson._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="font-bold text-slate-800">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="e.g. Projectile Motion" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700">{editingLesson ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonManager;
