import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const TeacherStudents = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedClass, setExpandedClass] = useState(null);
    const [revealedPasswords, setRevealedPasswords] = useState({});

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const { data } = await api.get('/api/teacher/classes');
                setClasses(data);
            } catch (err) {
                toast.error('Failed to load classes');
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    const togglePassword = (studentId) => {
        setRevealedPasswords(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    if (loading) return <div className="py-16 text-center text-slate-400">Loading your students...</div>;

    if (classes.length === 0) {
        return (
            <div className="text-center py-16 text-slate-400">
                <svg className="w-14 h-14 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="font-medium text-slate-500">No classes assigned to you yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">My Students</h1>
                    <p className="text-sm text-slate-500">View students across your assigned classes</p>
                </div>
            </div>

            <div className="space-y-3">
                {classes.map(cls => {
                    const isOpen = expandedClass === cls._id;
                    const students = (cls.students || []).sort((a, b) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0));
                    return (
                        <div key={cls._id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <button
                                onClick={() => setExpandedClass(isOpen ? null : cls._id)}
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600">
                                        {cls.className?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{cls.className}</p>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{students.length} Student{students.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isOpen && (
                                <div className="border-t border-slate-100">
                                    {students.length === 0 ? (
                                        <div className="px-6 py-8 text-center text-slate-400 text-sm italic">
                                            No students enrolled in this class yet.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                                        <th className="px-6 py-3 whitespace-nowrap">Roll No</th>
                                                        <th className="px-6 py-3 whitespace-nowrap">Name</th>
                                                        <th className="px-6 py-3 whitespace-nowrap">Email</th>
                                                        <th className="px-6 py-3 whitespace-nowrap">Password</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 bg-white">
                                                    {students.map(student => (
                                                        <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                                                                    #{student.rollNumber || '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase flex-shrink-0">
                                                                        {student.name?.charAt(0)}
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{student.email}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <code className="text-xs font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-700">
                                                                        {revealedPasswords[student._id]
                                                                            ? (student.tempPassword || '(not available)')
                                                                            : '••••••••'
                                                                        }
                                                                    </code>
                                                                    {student.tempPassword && (
                                                                        <button
                                                                            onClick={() => togglePassword(student._id)}
                                                                            className="text-slate-400 hover:text-slate-700 transition p-1"
                                                                            title={revealedPasswords[student._id] ? 'Hide password' : 'Show password'}
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={revealedPasswords[student._id]
                                                                                    ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                                                    : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeacherStudents;
