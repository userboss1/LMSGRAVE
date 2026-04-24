import CourseManager from './CourseManager';

// Main entry for the Visual Learning section (shown inside TeacherDashboard)
const VisualLearning = () => {
    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Interactive Visual Learning</h1>
                    <p className="text-sm text-slate-500">Create structured visual lessons with images, annotations, and step-by-step content</p>
                </div>
            </div>
            <CourseManager />
        </div>
    );
};

export default VisualLearning;
