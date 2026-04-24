import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from './Admin/AdminDashboard';
import TeacherDashboard from './Teacher/TeacherDashboard';
import StudentDashboard from './Student/StudentDashboard';

const navItems = {
    superadmin: [
        { id: 'administration', label: 'Administration', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    ],
    teacher: [
        { id: 'courses', label: 'Courses', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
        { id: 'notes', label: 'Notes', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
        { id: 'students', label: 'Students', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5V4H2v16h5m10 0h-5m5 0v-4m-15 4v-4m10 4V8m-5 12v-8m5 12H7" /> },
        { id: 'exam_zone', label: 'Exam Zone', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
        { id: 'sorting', label: 'Visual Exams', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    ],
    student: [
        { id: 'my_exams', label: 'My Exams', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
        { id: 'sorting', label: 'Sorting Exams', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
        { id: 'courses', label: 'My Courses', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
        { id: 'my_notes', label: 'My Notes', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
        { id: 'results', label: 'My Results', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    ],
};

const accent = {
    superadmin: { dot: 'bg-violet-400', badge: 'bg-violet-500/20 text-violet-300', ring: 'ring-violet-500', active: 'bg-violet-500/15 text-violet-200' },
    teacher: { dot: 'bg-blue-400', badge: 'bg-blue-500/20 text-blue-300', ring: 'ring-blue-500', active: 'bg-blue-500/15 text-blue-200' },
    student: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', ring: 'ring-emerald-500', active: 'bg-emerald-500/15 text-emerald-200' },
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [activeTab, setActiveTab] = useState(
        user?.role === 'superadmin' ? 'administration' 
        : user?.role === 'teacher' ? 'courses' 
        : 'my_exams'
    );
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar on route/tab change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [activeTab, location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;
    const ac = accent[user.role] || accent.student;

    return (
        <div className="min-h-screen flex bg-[#F0F2F5] overflow-hidden">

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Dark sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Logo & Close Button (Mobile) */}
                <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v5" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-white font-bold text-base">LMSgrave</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${ac.dot} inline-block ml-1 mb-0.5`} />
                        </div>
                    </div>
                    <button 
                        className="md:hidden text-slate-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* User */}
                <div className="px-4 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-2 ${ac.ring} ring-offset-1 ring-offset-[#0F172A]`}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ac.badge} capitalize`}>{user.role}</span>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    <p className="text-white/25 text-[10px] uppercase tracking-widest px-2 mb-2">Menu</p>
                    {(navItems[user.role] || []).map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === item.id ? ac.active : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
                    <button
                        onClick={handleLogout}
                        id="logout-btn"
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-all group"
                    >
                        <svg className="w-4 h-4 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                <header className="h-14 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shadow-sm z-10 w-full">
                    <div className="flex items-center gap-3">
                        <button 
                            className="md:hidden text-slate-500 hover:text-slate-700 bg-slate-50 p-1.5 rounded-md border border-slate-200"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h1 className="text-base font-bold text-slate-800 hidden sm:block">
                            {user.role === 'superadmin' ? 'Administration Panel' : user.role === 'teacher' ? 'Teacher Workspace' : 'Student Portal'}
                        </h1>
                        <h1 className="text-base font-bold text-slate-800 sm:hidden">
                            LMSgrave
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 hidden sm:inline-block">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-200">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto bg-slate-50 w-full relative">
                    <div className="absolute inset-0 p-4 md:p-6 min-h-max">
                        {user.role === 'superadmin' && <AdminDashboard />}
                        {user.role === 'teacher' && <TeacherDashboard activeTab={activeTab} />}
                        {user.role === 'student' && <StudentDashboard activeTab={activeTab} />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
