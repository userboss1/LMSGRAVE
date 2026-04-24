import { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const FIELD = 'px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white w-full';
const LABEL = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

// ---------- Edit Modal ----------
const EditModal = ({ user, classes, onClose, onSaved }) => {
    const [name, setName] = useState(user.name || '');
    const [email, setEmail] = useState(user.email || '');
    const [password, setPassword] = useState('');
    const [classId, setClassId] = useState(user.classId?._id || user.classId || '');
    const [rollNumber, setRollNumber] = useState(user.rollNumber || '');
    const [showPwd, setShowPwd] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = { name, email, classId };
        if (user.role === 'student') payload.rollNumber = rollNumber;
        if (password) payload.password = password;
        try {
            await api.put(`/api/admin/users/${user._id}`, payload);
            toast.success('User updated');
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
                        <h3 className="font-bold text-slate-800">Edit {user.role === 'student' ? 'Student' : 'Teacher'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className={LABEL}>Full Name</label>
                        <input className={FIELD} value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className={LABEL}>Email</label>
                        <input type="email" className={FIELD} value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className={LABEL}>Class</label>
                        <select className={FIELD} value={classId} onChange={e => setClassId(e.target.value)}>
                            <option value="">— No class —</option>
                            {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                        </select>
                    </div>
                    {user.role === 'student' && (
                        <div>
                            <label className={LABEL}>Roll Number</label>
                            <input className={FIELD} value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
                        </div>
                    )}
                    <div>
                        <label className={LABEL}>Current Password
                            <span className="ml-2 normal-case font-normal text-slate-400 text-xs">(stored)</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                readOnly
                                className={`${FIELD} pr-10 bg-slate-50 cursor-default`}
                                value={user.tempPassword || '(not available)'}
                            />
                            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                                {showPwd ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className={LABEL}>Set New Password <span className="normal-case font-normal text-slate-400 text-xs">(leave blank to keep)</span></label>
                        <input type="text" className={FIELD} placeholder="New password…" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ---------- User Row ----------
const UserRow = ({ user, classes, onEdit, onDelete }) => (
    <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition group">
        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(user)}>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(user); }} title="Delete user" className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
        <button onClick={() => onEdit(user)} title="Edit user" className="p-1.5 text-slate-300 group-hover:text-slate-500 rounded-lg hover:bg-slate-100 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
    </div>
);

// ---------- Excel Student Import Panel ----------
const ExcelImportPanel = ({ classes, onImported, onCancel }) => {
    const [dragging, setDragging] = useState(false);
    const [rows, setRows] = useState(null); // parsed rows
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
                // Normalize headers: name, email, password, rollNumber, class (className)
                const normalized = data.map((row, idx) => {
                    const get = (...keys) => {
                        for (const k of keys) {
                            const found = Object.keys(row).find(rk => rk.toLowerCase().replace(/\s/g,'') === k.toLowerCase().replace(/\s/g,''));
                            if (found && row[found] !== '') return String(row[found]);
                        }
                        return '';
                    };
                    return {
                        _key: idx,
                        name: get('name', 'fullname', 'studentname'),
                        email: get('email'),
                        password: get('password', 'pass'),
                        rollNumber: get('rollnumber', 'roll', 'rollno'),
                        classId: '', // will be matched below
                        className: get('class', 'classname', 'className'),
                        error: null,
                    };
                }).map(r => {
                    // Try to match className to a class ID
                    if (r.className) {
                        const match = classes.find(c => c.className.toLowerCase() === r.className.toLowerCase());
                        if (match) r.classId = match._id;
                    }
                    return r;
                });
                setRows(normalized);
            } catch {
                toast.error('Failed to parse the Excel file. Make sure it is a valid .xlsx file.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const handleFileChange = (e) => processFile(e.target.files[0]);

    const updateRow = (key, field, value) => {
        setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value, error: null } : r));
    };

    const removeRow = (key) => setRows(prev => prev.filter(r => r._key !== key));

    const handleSave = async () => {
        // Validate
        const validated = rows.map(r => ({
            ...r,
            error: !r.name ? 'Name required' : !r.email ? 'Email required' : !r.password ? 'Password required' : null,
        }));
        setRows(validated);
        if (validated.some(r => r.error)) {
            toast.error('Please fix validation errors before saving.');
            return;
        }
        setSaving(true);
        let successCount = 0;
        const errors = [];
        for (const r of rows) {
            try {
                await api.post('/api/admin/users', {
                    name: r.name,
                    email: r.email,
                    password: r.password,
                    role: 'student',
                    classId: r.classId || undefined,
                    rollNumber: r.rollNumber || undefined,
                });
                successCount++;
            } catch (err) {
                errors.push(`${r.name}: ${err.response?.data?.message || 'Failed'}`);
            }
        }
        setSaving(false);
        if (successCount > 0) toast.success(`${successCount} student${successCount > 1 ? 's' : ''} added`);
        if (errors.length > 0) toast.error(errors.join('\n'), { autoClose: 6000 });
        onImported();
        onCancel();
    };

    const downloadSample = () => {
        const sampleData = [
            { Name: 'Alice Johnson', Email: 'alice@school.com', Password: 'alice123', RollNumber: '101', Class: 'Class 10-A' },
            { Name: 'Bob Smith', Email: 'bob@school.com', Password: 'bob456', RollNumber: '102', Class: 'Class 10-A' },
            { Name: 'Carol White', Email: 'carol@school.com', Password: 'carol789', RollNumber: '103', Class: 'Class 10-B' },
        ];
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, 'students_sample.xlsx');
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-slate-700">Import Students via Excel</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Drag & drop an .xlsx file or click to browse</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={downloadSample}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition"
                    >
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
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
                >
                    <svg className={`w-12 h-12 mb-3 ${dragging ? 'text-indigo-400' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-semibold text-slate-600">{dragging ? 'Drop it here!' : 'Drop your Excel file here'}</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse · .xlsx files only</p>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">{rows.length} student{rows.length !== 1 ? 's' : ''} detected · Review and edit before importing</p>
                        <button type="button" onClick={() => setRows(null)} className="text-xs text-slate-400 hover:text-slate-600">← Re-upload</button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                                    <th className="px-4 py-3 whitespace-nowrap">#</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Name *</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Email *</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Password *</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Roll No.</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Class</th>
                                    <th className="px-4 py-3 whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((r, i) => (
                                    <tr key={r._key} className={r.error ? 'bg-red-50' : 'hover:bg-slate-50 transition-colors'}>
                                        <td className="px-4 py-2 text-slate-400 font-mono text-xs">{i + 1}</td>
                                        <td className="px-4 py-2">
                                            <input
                                                className={`w-full min-w-[120px] px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 ${r.error && !r.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                                value={r.name}
                                                onChange={e => updateRow(r._key, 'name', e.target.value)}
                                                placeholder="Full name"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className={`w-full min-w-[150px] px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 ${r.error && !r.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                                value={r.email}
                                                onChange={e => updateRow(r._key, 'email', e.target.value)}
                                                placeholder="email@school.com"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className={`w-full min-w-[110px] px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 ${r.error && !r.password ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                                value={r.password}
                                                onChange={e => updateRow(r._key, 'password', e.target.value)}
                                                placeholder="password"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className="w-full min-w-[80px] px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                                                value={r.rollNumber}
                                                onChange={e => updateRow(r._key, 'rollNumber', e.target.value)}
                                                placeholder="101"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                className="w-full min-w-[130px] px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                                                value={r.classId}
                                                onChange={e => updateRow(r._key, 'classId', e.target.value)}
                                            >
                                                <option value="">— No class —</option>
                                                {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            {r.error && <p className="text-xs text-red-500 mb-1">{r.error}</p>}
                                            <button type="button" onClick={() => removeRow(r._key)} className="text-red-400 hover:text-red-600 p-1 rounded transition">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Cancel</button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || rows.length === 0}
                            className="px-6 py-2 text-sm font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Saving...</>
                            ) : (
                                <>✓ Verify &amp; Import {rows.length} Student{rows.length !== 1 ? 's' : ''}</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ---------- Add Teacher Form ----------
const AddTeacherPanel = ({ classes, onAdded, onCancel }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [classId, setClassId] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/users', { name, email, password, role: 'teacher', classId });
            toast.success('Teacher created');
            onAdded();
            onCancel();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create teacher');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-700">+ New Teacher</h4>
                <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={LABEL}>Name</label><input className={FIELD} value={name} onChange={e => setName(e.target.value)} required placeholder="Full name" /></div>
                <div><label className={LABEL}>Email</label><input type="email" className={FIELD} value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@school.com" /></div>
                <div><label className={LABEL}>Password</label><input type="text" className={FIELD} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Set password" /></div>
                <div>
                    <label className={LABEL}>Class</label>
                    <select className={FIELD} value={classId} onChange={e => setClassId(e.target.value)}>
                        <option value="">Select class…</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                    </select>
                </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition">Create Teacher</button>
        </form>
    );
};

// ---------- Main Component ----------
const ManageUsers = () => {
    const [classes, setClasses] = useState([]);
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addMode, setAddMode] = useState('teacher'); // 'teacher' | 'excel'
    const [deletingUser, setDeletingUser] = useState(null);

    const fetchData = async () => {
        try {
            const [classesRes, usersRes] = await Promise.all([
                api.get('/api/admin/classes'),
                api.get('/api/admin/users')
            ]);
            setClasses(classesRes.data);
            setUsers(usersRes.data);
        } catch {
            toast.error('Failed to fetch data');
        }
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        try {
            await api.delete(`/api/admin/users/${deletingUser._id}`);
            toast.success(`${deletingUser.name} deleted`);
            setDeletingUser(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        }
    };

    useEffect(() => { fetchData(); }, []);

    const teachers = users.filter(u => u.role === 'teacher');

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-800">Manage Users</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setAddMode('teacher'); setShowAddForm(f => !f); }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAddForm && addMode === 'teacher' ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
                        {showAddForm && addMode === 'teacher' ? 'Cancel' : 'Add Teacher'}
                    </button>
                </div>
            </div>

            {showAddForm && addMode === 'teacher' && (
                <AddTeacherPanel classes={classes} onAdded={fetchData} onCancel={() => setShowAddForm(false)} />
            )}

            {/* Teachers list */}
            <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Teachers ({teachers.length})
                </p>
                <div className="space-y-2">
                    {teachers.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-12">No teachers added yet.</p>
                    ) : teachers.map(t => (
                        <div key={t._id} className="bg-white border border-slate-100 rounded-xl px-4 py-2">
                            <UserRow user={t} classes={classes} onEdit={setEditingUser} onDelete={setDeletingUser} />
                            {t.classId && <p className="text-xs text-slate-400 pl-11 pb-1">Class: {t.classId.className}</p>}
                        </div>
                    ))}
                </div>
            </div>

            {editingUser && (
                <EditModal
                    user={editingUser}
                    classes={classes}
                    onClose={() => setEditingUser(null)}
                    onSaved={fetchData}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-red-500 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Delete User</h3>
                                    <p className="text-red-100 text-xs">This cannot be undone</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-slate-600">
                                Delete <span className="font-bold text-slate-800">{deletingUser.name}</span>? They will be removed from their class and all access will be revoked.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeletingUser(null)} className="flex-1 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition font-medium">Cancel</button>
                                <button onClick={handleDeleteUser} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
