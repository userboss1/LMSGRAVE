import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const FIELD = 'px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white w-full';
const LABEL = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

// ---------- Edit Student Modal (reusable from inside class view) ----------
const EditStudentModal = ({ user, classes, onClose, onSaved }) => {
    const [name, setName] = useState(user.name || '');
    const [email, setEmail] = useState(user.email || '');
    const [password, setPassword] = useState('');
    const [classId, setClassId] = useState(user.classId?._id || user.classId || '');
    const [rollNumber, setRollNumber] = useState(user.rollNumber || '');
    const [showPwd, setShowPwd] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { name, email, classId, rollNumber };
        if (password) payload.password = password;
        try {
            await api.put(`/api/admin/users/${user._id}`, payload);
            toast.success('Student updated');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800">Edit Student</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div><label className={LABEL}>Full Name</label><input className={FIELD} value={name} onChange={e => setName(e.target.value)} required /></div>
                    <div><label className={LABEL}>Email</label><input type="email" className={FIELD} value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    <div>
                        <label className={LABEL}>Class</label>
                        <select className={FIELD} value={classId} onChange={e => setClassId(e.target.value)}>
                            <option value="">— No class —</option>
                            {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                        </select>
                    </div>
                    <div><label className={LABEL}>Roll Number</label><input className={FIELD} value={rollNumber} onChange={e => setRollNumber(e.target.value)} /></div>
                    <div>
                        <label className={LABEL}>Current Password <span className="normal-case font-normal text-slate-400 text-xs">(stored)</span></label>
                        <div className="relative">
                            <input type={showPwd ? 'text' : 'password'} readOnly className={`${FIELD} pr-10 bg-slate-50 cursor-default`} value={user.tempPassword || '(not available)'} />
                            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">{showPwd ? '🙈' : '👁'}</button>
                        </div>
                    </div>
                    <div><label className={LABEL}>Set New Password <span className="normal-case font-normal text-slate-400 text-xs">(leave blank to keep)</span></label><input type="text" className={FIELD} placeholder="New password…" value={password} onChange={e => setPassword(e.target.value)} /></div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ---------- Excel Import Panel ----------
const ExcelImportPanel = ({ classes, defaultClassId, onImported, onCancel }) => {
    const [dragging, setDragging] = useState(false);
    const [rows, setRows] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();

    const processFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
                const normalized = data.map((row, idx) => {
                    const get = (...keys) => {
                        for (const k of keys) {
                            const found = Object.keys(row).find(rk => rk.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, ''));
                            if (found && row[found] !== '') return String(row[found]);
                        }
                        return '';
                    };
                    const className = get('class', 'classname', 'className');
                    const match = className ? classes.find(c => c.className.toLowerCase() === className.toLowerCase()) : null;
                    return {
                        _key: idx,
                        name: get('name', 'fullname', 'studentname'),
                        email: get('email'),
                        password: get('password', 'pass'),
                        rollNumber: get('rollnumber', 'roll', 'rollno'),
                        classId: match ? match._id : (defaultClassId || ''),
                        className,
                        error: null,
                    };
                });
                setRows(normalized);
            } catch { toast.error('Failed to parse Excel file.'); }
        };
        reader.readAsArrayBuffer(file);
    };

    const updateRow = (key, field, value) => setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value, error: null } : r));
    const removeRow = (key) => setRows(prev => prev.filter(r => r._key !== key));

    const downloadSample = () => {
        const sampleData = [
            { Name: 'Alice Johnson', Email: 'alice@school.com', Password: 'alice123', RollNumber: '101', Class: classes[0]?.className || 'Class 10-A' },
            { Name: 'Bob Smith', Email: 'bob@school.com', Password: 'bob456', RollNumber: '102', Class: classes[0]?.className || 'Class 10-A' },
        ];
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb2 = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb2, ws, 'Students');
        XLSX.writeFile(wb2, 'students_sample.xlsx');
    };

    const handleSave = async () => {
        const validated = rows.map(r => ({ ...r, error: !r.name ? 'Name required' : !r.email ? 'Email required' : !r.password ? 'Password required' : null }));
        setRows(validated);
        if (validated.some(r => r.error)) { toast.error('Fix errors first.'); return; }
        setSaving(true);
        let ok = 0; const errors = [];
        for (const r of rows) {
            try {
                await api.post('/api/admin/users', { name: r.name, email: r.email, password: r.password, role: 'student', classId: r.classId || undefined, rollNumber: r.rollNumber || undefined });
                ok++;
            } catch (err) { errors.push(`${r.name}: ${err.response?.data?.message || 'Failed'}`); }
        }
        setSaving(false);
        if (ok > 0) toast.success(`${ok} student${ok > 1 ? 's' : ''} imported`);
        if (errors.length > 0) toast.error(errors.join('\n'), { autoClose: 7000 });
        onImported(); onCancel();
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-slate-700">Import Students via Excel</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Drag & drop or click to browse · .xlsx files</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Sample File
                    </button>
                    <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
                </div>
            </div>
            {!rows ? (
                <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}
                >
                    <svg className={`w-12 h-12 mb-3 ${dragging ? 'text-indigo-400' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-sm font-semibold text-slate-600">{dragging ? 'Drop it!' : 'Drop Excel file here'}</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={e => processFile(e.target.files[0])} className="hidden" />
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">{rows.length} student{rows.length !== 1 ? 's' : ''} — review before importing</p>
                        <button type="button" onClick={() => setRows(null)} className="text-xs text-slate-400 hover:text-slate-600">← Re-upload</button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm text-left">
                            <thead><tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                                <th className="px-4 py-2">#</th><th className="px-4 py-2">Name *</th><th className="px-4 py-2">Email *</th>
                                <th className="px-4 py-2">Password *</th><th className="px-4 py-2">Roll No.</th><th className="px-4 py-2">Class</th><th className="px-4 py-2"></th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((r, i) => (
                                    <tr key={r._key} className={r.error ? 'bg-red-50' : 'hover:bg-slate-50'}>
                                        <td className="px-4 py-2 text-slate-400 text-xs font-mono">{i + 1}</td>
                                        <td className="px-4 py-2"><input className={`w-full min-w-[110px] px-2 py-1.5 text-xs border rounded-lg focus:outline-none ${r.error && !r.name ? 'border-red-400' : 'border-slate-200'}`} value={r.name} onChange={e => updateRow(r._key, 'name', e.target.value)} placeholder="Name" /></td>
                                        <td className="px-4 py-2"><input className={`w-full min-w-[140px] px-2 py-1.5 text-xs border rounded-lg focus:outline-none ${r.error && !r.email ? 'border-red-400' : 'border-slate-200'}`} value={r.email} onChange={e => updateRow(r._key, 'email', e.target.value)} placeholder="email@school.com" /></td>
                                        <td className="px-4 py-2"><input className={`w-full min-w-[100px] px-2 py-1.5 text-xs border rounded-lg focus:outline-none ${r.error && !r.password ? 'border-red-400' : 'border-slate-200'}`} value={r.password} onChange={e => updateRow(r._key, 'password', e.target.value)} placeholder="password" /></td>
                                        <td className="px-4 py-2"><input className="w-full min-w-[70px] px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none" value={r.rollNumber} onChange={e => updateRow(r._key, 'rollNumber', e.target.value)} placeholder="101" /></td>
                                        <td className="px-4 py-2"><select className="w-full min-w-[120px] px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white" value={r.classId} onChange={e => updateRow(r._key, 'classId', e.target.value)}>
                                            <option value="">— No class —</option>
                                            {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                                        </select></td>
                                        <td className="px-4 py-2">{r.error && <p className="text-xs text-red-500 mb-1">{r.error}</p>}<button type="button" onClick={() => removeRow(r._key)} className="text-red-400 hover:text-red-600 p-1 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                        <button type="button" onClick={handleSave} disabled={saving || rows.length === 0} className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Saving...</> : <>✓ Import {rows.length} Student{rows.length !== 1 ? 's' : ''}</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ---------- Class Detail View ----------
const ClassDetail = ({ cls, allClasses, onBack, onRefresh }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingStudent, setEditingStudent] = useState(null);
    const [deletingStudent, setDeletingStudent] = useState(null);
    const [showImport, setShowImport] = useState(false);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/admin/users');
            const classStudents = data.filter(u => u.role === 'student' && (u.classId?._id === cls._id || u.classId === cls._id));
            setStudents(classStudents.sort((a, b) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0)));
        } catch {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStudents(); }, [cls._id]);

    const handleDelete = async () => {
        if (!deletingStudent) return;
        try {
            await api.delete(`/api/admin/users/${deletingStudent._id}`);
            toast.success(`${deletingStudent.name} removed`);
            setDeletingStudent(null);
            fetchStudents();
            onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete student');
        }
    };

    return (
        <div>
            {/* Back Header */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    All Classes
                </button>
                <div className="h-5 w-px bg-slate-200" />
                <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-800">{cls.className}</h3>
                    <p className="text-xs text-slate-400">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
                </div>
                <button
                    onClick={() => setShowImport(v => !v)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {showImport ? 'Cancel Import' : 'Import Students'}
                </button>
            </div>

            {showImport && (
                <ExcelImportPanel
                    classes={allClasses}
                    defaultClassId={cls._id}
                    onImported={() => { fetchStudents(); onRefresh(); }}
                    onCancel={() => setShowImport(false)}
                />
            )}

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-slate-600">No students in this class</p>
                    <p className="text-xs text-slate-400 mt-1">Use the <strong>Import Students</strong> button above to add students to this class.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                                <th className="px-5 py-3 whitespace-nowrap">Roll #</th>
                                <th className="px-5 py-3 whitespace-nowrap">Name</th>
                                <th className="px-5 py-3 whitespace-nowrap">Email</th>
                                <th className="px-5 py-3 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(s => (
                                <tr key={s._id} className="hover:bg-slate-50 transition-colors group/row">
                                    <td className="px-5 py-3.5 font-mono text-slate-500 font-medium whitespace-nowrap">#{s.rollNumber || '—'}</td>
                                    <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {s.name?.charAt(0).toUpperCase()}
                                            </div>
                                            {s.name}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{s.email}</td>
                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setEditingStudent(s)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                                title="Edit Student"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => setDeletingStudent(s)}
                                                className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="Remove Student"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingStudent && (
                <EditStudentModal
                    user={editingStudent}
                    classes={allClasses}
                    onClose={() => setEditingStudent(null)}
                    onSaved={fetchStudents}
                />
            )}

            {deletingStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-red-500 px-6 py-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Remove Student</h3>
                                <p className="text-red-100 text-xs">This cannot be undone</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-slate-600">Remove <span className="font-bold text-slate-800">{deletingStudent.name}</span> from the system?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeletingStudent(null)} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition font-medium">Cancel</button>
                                <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition">Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ---------- Main ManageClasses Component ----------
const ManageClasses = () => {
    const [classes, setClasses] = useState([]);
    const [className, setClassName] = useState('');
    const [adding, setAdding] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [allStudentCounts, setAllStudentCounts] = useState({});

    const fetchClasses = async () => {
        try {
            const { data } = await api.get('/api/admin/classes');
            setClasses(data);
        } catch {
            toast.error('Failed to fetch classes');
        }
    };

    const fetchStudentCounts = async () => {
        try {
            const { data } = await api.get('/api/admin/users');
            const counts = {};
            data.filter(u => u.role === 'student').forEach(s => {
                const cid = s.classId?._id || s.classId;
                if (cid) counts[cid] = (counts[cid] || 0) + 1;
            });
            setAllStudentCounts(counts);
        } catch { }
    };

    useEffect(() => {
        fetchClasses();
        fetchStudentCounts();
    }, []);

    const handleAddClass = async (e) => {
        e.preventDefault();
        setAdding(true);
        try {
            await api.post('/api/admin/classes', { className });
            setClassName('');
            fetchClasses();
            toast.success('Class created');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add class');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteClass = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this class? Students will be unassigned.')) return;
        try {
            await api.delete(`/api/admin/classes/${id}`);
            fetchClasses();
            fetchStudentCounts();
            toast.success('Class deleted');
        } catch {
            toast.error('Failed to delete class');
        }
    };

    if (selectedClass) {
        return (
            <ClassDetail
                cls={selectedClass}
                allClasses={classes}
                onBack={() => setSelectedClass(null)}
                onRefresh={() => { fetchClasses(); fetchStudentCounts(); }}
            />
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Classes</h3>
                <span className="text-sm text-gray-500">{classes.length} total</span>
            </div>

            {/* Add class form */}
            <form onSubmit={handleAddClass} className="flex gap-3 mb-8">
                <input
                    type="text"
                    placeholder="e.g. Class 10-A"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    disabled={adding}
                    className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Class
                </button>
            </form>

            {/* Classes grid */}
            {classes.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                    </svg>
                    <p className="text-sm">No classes yet. Add one above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => {
                        const studentCount = allStudentCounts[cls._id] || cls.studentIds?.length || 0;
                        const teacherCount = cls.teacherIds?.length || 0;
                        return (
                            <div
                                key={cls._id}
                                onClick={() => setSelectedClass(cls)}
                                className="group flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-violet-200 hover:bg-violet-50/30 transition-all bg-gray-50 cursor-pointer"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-base flex-shrink-0">
                                        {cls.className?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 group-hover:text-violet-700 transition-colors">{cls.className}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {studentCount} student{studentCount !== 1 ? 's' : ''} · {teacherCount} teacher{teacherCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <button
                                        onClick={(e) => handleDeleteClass(cls._id, e)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50"
                                        title="Delete class"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ManageClasses;
