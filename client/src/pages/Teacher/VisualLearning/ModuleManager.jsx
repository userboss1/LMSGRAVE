import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import LessonManager from './LessonManager';
import { toast } from 'react-toastify';

const ModuleManager = ({ course, onBack }) => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMod, setEditingMod] = useState(null);
    const [form, setForm] = useState({ title: '', description: '' });
    const [activeModule, setActiveModule] = useState(null);

    useEffect(() => { fetchModules(); }, []);

    const fetchModules = async () => {
        try {
            const res = await api.get(`/api/teacher/courses/${course._id}/modules`);
            setModules(res.data);
        } catch { toast.error('Failed to load modules'); }
        finally { setLoading(false); }
    };

    const openForm = (mod = null) => {
        setEditingMod(mod);
        setForm(mod ? { title: mod.title, description: mod.description } : { title: '', description: '' });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMod) {
                await api.put(`/api/teacher/courses/modules/${editingMod._id}`, form);
                toast.success('Module updated');
            } else {
                await api.post(`/api/teacher/courses/${course._id}/modules`, form);
                toast.success('Module created');
            }
            setShowForm(false);
            fetchModules();
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this module and all its lessons?')) return;
        try {
            await api.delete(`/api/teacher/courses/modules/${id}`);
            toast.success('Module deleted');
            fetchModules();
        } catch { toast.error('Failed to delete module'); }
    };

    if (activeModule) {
        return <LessonManager module={activeModule} course={course} onBack={() => setActiveModule(null)} />;
    }

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <button onClick={onBack} className="text-indigo-600 hover:underline font-medium">Courses</button>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800 font-semibold">{course.title}</span>
                <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-1">Modules</span>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Modules <span className="text-slate-400 font-normal text-base">({modules.length})</span></h2>
                <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Module
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" /></div>
            ) : modules.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <p className="font-medium">No modules yet</p>
                    <p className="text-sm">Add the first module to this course</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {modules.map((mod, i) => (
                        <div key={mod._id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-all">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800">{mod.title}</p>
                                <p className="text-sm text-slate-500 truncate">{mod.description || 'No description'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setActiveModule(mod)} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium">Open</button>
                                <button onClick={() => openForm(mod)} className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 font-medium">Edit</button>
                                <button onClick={() => handleDelete(mod._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="font-bold text-slate-800">{editingMod ? 'Edit Module' : 'Add Module'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" placeholder="e.g. Kinematics" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700">{editingMod ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleManager;
