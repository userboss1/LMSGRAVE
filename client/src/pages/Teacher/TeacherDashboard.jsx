import CourseManager from './VisualLearning/CourseManager';
import ExamZone from './ExamZone/index';
import TestBuilder from './TestBuilder/index';
import NotesManager from './NotesManager';
import TeacherStudents from './TeacherStudents';
import ImageSortingManager from './VisualLearning/ImageSortingManager';

const TeacherDashboard = ({ activeTab }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[calc(100vh-8rem)]">
            {activeTab === 'courses' && <CourseManager />}
            {activeTab === 'notes' && <NotesManager />}
            {activeTab === 'students' && <TeacherStudents />}
            {activeTab === 'exam_zone' && <ExamZone />}
            {activeTab === 'sorting' && <ImageSortingManager />}
        </div>
    );
};

export default TeacherDashboard;
