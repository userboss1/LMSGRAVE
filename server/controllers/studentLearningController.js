const Course = require('../models/Course');
const CourseModule = require('../models/CourseModule');
const Lesson = require('../models/Lesson');
const LessonStep = require('../models/LessonStep');
const LearningProgress = require('../models/LearningProgress');

// GET /api/student/courses
// List all courses assigned to the student's class
const getStudentCourses = async (req, res) => {
    try {
        const student = req.user;
        if (!student.classId) return res.json([]);

        const courses = await Course.find({
            classIds: student.classId,
            status: 'published',
        }).populate('teacherId', 'name');

        // Attach progress to each course
        const progressDocs = await LearningProgress.find({
            studentId: student._id,
            courseId: { $in: courses.map(c => c._id) },
        });

        const totalLessonsCounts = await Promise.all(
            courses.map(c => Lesson.countDocuments({ courseId: c._id }))
        );

        const result = courses.map((course, i) => {
            const prog = progressDocs.find(p => p.courseId.toString() === course._id.toString());
            const completedLessons = prog ? prog.completedLessons : 0;
            const totalLessons = totalLessonsCounts[i];
            return {
                ...course.toObject(),
                completedLessons,
                totalLessons,
                percent: totalLessons > 0
                    ? Math.round((completedLessons / totalLessons) * 100)
                    : 0,
                courseCompleted: totalLessons > 0 && completedLessons >= totalLessons,
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/student/courses/:courseId
// Full course tree: modules → lessons → steps (for learning view)
const getStudentCourse = async (req, res) => {
    try {
        const student = req.user;
        const course = await Course.findById(req.params.courseId).populate('teacherId', 'name');
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (student.classId && !course.classIds.map(c => c.toString()).includes(student.classId.toString())) {
            return res.status(403).json({ message: 'You are not enrolled in this course' });
        }

        const modules = await CourseModule.find({ courseId: course._id }).sort({ order: 1 });
        const modulesWithLessons = await Promise.all(
            modules.map(async (mod) => {
                const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });
                const lessonsWithSteps = await Promise.all(
                    lessons.map(async (les) => {
                        const steps = await LessonStep.find({ lessonId: les._id }).sort({ order: 1 });
                        return { ...les.toObject(), steps };
                    })
                );
                return { ...mod.toObject(), lessons: lessonsWithSteps };
            })
        );

        // Attach student progress
        const prog = await LearningProgress.findOne({ studentId: student._id, courseId: course._id });

        res.json({
            ...course.toObject(),
            modules: modulesWithLessons,
            progress: prog || null,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/student/courses/progress
// Mark a step as completed; auto-update lesson/course completion
const markStepComplete = async (req, res) => {
    try {
        const student = req.user;
        const { courseId, lessonId, stepId } = req.body;

        if (!courseId || !lessonId || !stepId)
            return res.status(400).json({ message: 'courseId, lessonId, and stepId are required' });

        // Find or create progress document
        let prog = await LearningProgress.findOne({ studentId: student._id, courseId });
        if (!prog) {
            prog = await LearningProgress.create({
                studentId: student._id,
                courseId,
                lessons: [],
                completedLessons: 0,
                totalLessons: 0,
            });
        }

        // Find or create lesson progress entry
        let lessonProg = prog.lessons.find(l => l.lessonId.toString() === lessonId.toString());
        if (!lessonProg) {
            prog.lessons.push({ lessonId, completedSteps: [], lessonCompleted: false });
            lessonProg = prog.lessons[prog.lessons.length - 1];
        }

        // Add step if not already there
        const alreadyDone = lessonProg.completedSteps.map(s => s.toString()).includes(stepId.toString());
        if (!alreadyDone) {
            lessonProg.completedSteps.push(stepId);
        }

        // Check if lesson is now complete
        const totalStepsInLesson = await LessonStep.countDocuments({ lessonId });
        const isLessonDone = lessonProg.completedSteps.length >= totalStepsInLesson;
        
        // Update lesson status
        lessonProg.lessonCompleted = isLessonDone;

        // Recount completed lessons for the course
        prog.completedLessons = prog.lessons.filter(l => l.lessonCompleted).length;

        // Check course completion
        const totalLessonsInCourse = await Lesson.countDocuments({ courseId });
        prog.totalLessons = totalLessonsInCourse;
        prog.courseCompleted = prog.completedLessons >= totalLessonsInCourse;

        prog.lastAccessedAt = new Date();
        await prog.save();

        res.json({ message: 'Progress updated', progress: prog });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/student/courses/:courseId/progress
const getCourseProgress = async (req, res) => {
    try {
        const prog = await LearningProgress.findOne({
            studentId: req.user._id,
            courseId: req.params.courseId,
        });
        res.json(prog || { completedLessons: 0, lessons: [], courseCompleted: false });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getStudentCourses,
    getStudentCourse,
    markStepComplete,
    getCourseProgress,
};
