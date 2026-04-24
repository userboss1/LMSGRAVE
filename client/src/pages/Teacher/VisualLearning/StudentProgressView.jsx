import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from 'react-toastify';

const StudentProgressView = ({ course, onBack }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/api/teacher/courses/${course._id}/student-progress`)
            .then(res => setData(res.data))
            .catch(() => toast.error('Failed to load progress'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="text-indigo-600 hover:underline text-sm font-medium">← Back</button>
                <h2 className="text-lg font-bold text-slate-800">Student Progress — {course.title}</h2>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" /></div>
            ) : !data || data.progress.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <p className="font-medium">No students enrolled yet</p>
                    <p className="text-sm">Assign this course to a class first</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-blue-700">{data.progress.length}</p>
                            <p className="text-xs text-blue-500 font-medium">Students Enrolled</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-700">{data.progress.filter(p => p.courseCompleted).length}</p>
                            <p className="text-xs text-emerald-500 font-medium">Completed Course</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-purple-700">
                                {data.progress.length > 0 ? Math.round(data.progress.reduce((a, p) => a + p.percent, 0) / data.progress.length) : 0}%
                            </p>
                            <p className="text-xs text-purple-500 font-medium">Avg. Progress</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lessons</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.progress.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {row.student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{row.student.name}</p>
                                                    <p className="text-xs text-slate-400">{row.student.rollNumber || row.student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{row.student.className}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-100 rounded-full h-2 w-24">
                                                    <div
                                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${row.percent}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600">{row.percent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{row.completedLessons}/{row.totalLessons}</td>
                                        <td className="px-4 py-3">
                                            {row.courseCompleted ? (
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">✓ Complete</span>
                                            ) : row.percent > 0 ? (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">In Progress</span>
                                            ) : (
                                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Not Started</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProgressView;
