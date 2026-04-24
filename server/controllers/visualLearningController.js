const Course = require('../models/Course');
const CourseModule = require('../models/CourseModule');
const Lesson = require('../models/Lesson');
const LessonStep = require('../models/LessonStep');
const LearningProgress = require('../models/LearningProgress');
const Question = require('../models/Question');
const Class = require('../models/Class');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const deleteFile = async (fileUrl) => {
    if (!fileUrl) return;
    try {
        const rel = fileUrl.replace(/^\//, '');
        const abs = path.join(__dirname, '..', rel);
        await fs.promises.unlink(abs);
    } catch (e) {
        if (e.code !== 'ENOENT') console.warn('File delete warn:', e.message);
    }
};

const deleteStepsAndFiles = async (lessonId) => {
    const steps = await LessonStep.find({ lessonId });
    for (const s of steps) await deleteFile(s.imageUrl);
    await LessonStep.deleteMany({ lessonId });
};

// ─── COURSES ─────────────────────────────────────────────────────────────────

// POST /api/teacher/courses
const createCourse = async (req, res) => {
    try {
        const { title, description, classIds } = req.body;
        const course = await Course.create({
            title,
            description: description || '',
            teacherId: req.user._id,
            classIds: classIds || [],
        });
        res.status(201).json(course);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// GET /api/teacher/courses
const getCourses = async (req, res) => {
    try {
        const courses = await Course.find({ teacherId: req.user._id })
            .populate('classIds', 'className')
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/teacher/courses/:courseId
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const { title, description, classIds, status } = req.body;
        if (title !== undefined) course.title = title;
        if (description !== undefined) course.description = description;
        if (classIds !== undefined) course.classIds = classIds;
        if (status !== undefined) course.status = status;
        await course.save();
        res.json(course);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/teacher/courses/:courseId
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        // Cascade delete with file cleanup
        const modules = await CourseModule.find({ courseId: course._id });
        for (const mod of modules) {
            const lessons = await Lesson.find({ moduleId: mod._id });
            for (const les of lessons) {
                await deleteStepsAndFiles(les._id);
            }
            await Lesson.deleteMany({ moduleId: mod._id });
        }
        await CourseModule.deleteMany({ courseId: course._id });
        await LearningProgress.deleteMany({ courseId: course._id });
        await Course.findByIdAndDelete(course._id);
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── MODULES ─────────────────────────────────────────────────────────────────

// POST /api/teacher/courses/:courseId/modules
const createModule = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const count = await CourseModule.countDocuments({ courseId: course._id });
        const mod = await CourseModule.create({
            courseId: course._id,
            title: req.body.title,
            description: req.body.description || '',
            order: count,
        });
        res.status(201).json(mod);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// GET /api/teacher/courses/:courseId/modules
const getModules = async (req, res) => {
    try {
        const mods = await CourseModule.find({ courseId: req.params.courseId }).sort({ order: 1 });
        res.json(mods);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/teacher/modules/:moduleId
const updateModule = async (req, res) => {
    try {
        const mod = await CourseModule.findById(req.params.moduleId);
        if (!mod) return res.status(404).json({ message: 'Module not found' });

        // Verify ownership via course
        const course = await Course.findById(mod.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const { title, description, order } = req.body;
        if (title !== undefined) mod.title = title;
        if (description !== undefined) mod.description = description;
        if (order !== undefined) mod.order = order;
        await mod.save();
        res.json(mod);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/teacher/modules/:moduleId
const deleteModule = async (req, res) => {
    try {
        const mod = await CourseModule.findById(req.params.moduleId);
        if (!mod) return res.status(404).json({ message: 'Module not found' });

        const course = await Course.findById(mod.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const lessons = await Lesson.find({ moduleId: mod._id });
        for (const les of lessons) {
            await deleteStepsAndFiles(les._id);
        }
        await Lesson.deleteMany({ moduleId: mod._id });
        await CourseModule.findByIdAndDelete(mod._id);
        res.json({ message: 'Module deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── LESSONS ─────────────────────────────────────────────────────────────────

// POST /api/teacher/modules/:moduleId/lessons
const createLesson = async (req, res) => {
    try {
        const mod = await CourseModule.findById(req.params.moduleId);
        if (!mod) return res.status(404).json({ message: 'Module not found' });

        const course = await Course.findById(mod.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const count = await Lesson.countDocuments({ moduleId: mod._id });
        const lesson = await Lesson.create({
            moduleId: mod._id,
            courseId: mod.courseId,
            title: req.body.title,
            description: req.body.description || '',
            order: count,
        });
        res.status(201).json(lesson);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// GET /api/teacher/modules/:moduleId/lessons
const getLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find({ moduleId: req.params.moduleId }).sort({ order: 1 });
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/teacher/lessons/:lessonId
const updateLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

        const course = await Course.findById(lesson.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const { title, description, order } = req.body;
        if (title !== undefined) lesson.title = title;
        if (description !== undefined) lesson.description = description;
        if (order !== undefined) lesson.order = order;
        await lesson.save();
        res.json(lesson);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/teacher/lessons/:lessonId
const deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

        const course = await Course.findById(lesson.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        await deleteStepsAndFiles(lesson._id);
        await Lesson.findByIdAndDelete(lesson._id);
        res.json({ message: 'Lesson deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── LESSON STEPS ─────────────────────────────────────────────────────────────

// POST /api/teacher/lessons/:lessonId/steps
const createStep = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

        const course = await Course.findById(lesson.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const count = await LessonStep.countDocuments({ lessonId: lesson._id });
        const {
            type, title, imageUrl, annotations, text,
            quoteType, questionText, questionType, options, correctAnswer
        } = req.body;

        const step = await LessonStep.create({
            lessonId: lesson._id,
            courseId: lesson.courseId,
            type,
            order: count,
            title: title || '',
            imageUrl,
            annotations: annotations || [],
            text: text || '',
            quoteType: quoteType || 'important',
            questionText,
            questionType: questionType || 'MCQ',
            options: options || [],
            correctAnswer,
        });
        res.status(201).json(step);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// GET /api/teacher/lessons/:lessonId/steps
const getSteps = async (req, res) => {
    try {
        const steps = await LessonStep.find({ lessonId: req.params.lessonId }).sort({ order: 1 });
        res.json(steps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/teacher/steps/:stepId
const updateStep = async (req, res) => {
    try {
        const step = await LessonStep.findById(req.params.stepId);
        if (!step) return res.status(404).json({ message: 'Step not found' });

        const course = await Course.findById(step.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const fields = [
            'title', 'imageUrl', 'annotations', 'text', 'quoteType',
            'questionText', 'questionType', 'options', 'correctAnswer', 'order'
        ];
        fields.forEach(f => { if (req.body[f] !== undefined) step[f] = req.body[f]; });
        await step.save();
        res.json(step);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE /api/teacher/steps/:stepId
const deleteStep = async (req, res) => {
    try {
        const step = await LessonStep.findById(req.params.stepId);
        if (!step) return res.status(404).json({ message: 'Step not found' });

        const course = await Course.findById(step.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        await deleteFile(step.imageUrl);
        await LessonStep.findByIdAndDelete(step._id);
        res.json({ message: 'Step deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/teacher/steps/:stepId/to-question
// Converts a lesson step into a question in the question bank
const stepToQuestion = async (req, res) => {
    try {
        const step = await LessonStep.findById(req.params.stepId);
        if (!step) return res.status(404).json({ message: 'Step not found' });

        const course = await Course.findById(step.courseId);
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const { type: qType, questionText: overrideText } = req.body;

        const questionText = overrideText || step.questionText || step.text || step.title || 'Question from lesson';
        const type = qType || (step.questionType === 'DESCRIPTIVE' ? 'DESCRIPTIVE' : 'MCQ');

        const question = await Question.create({
            teacherId: req.user._id,
            type,
            questionText,
            imageUrl: step.imageUrl || undefined,
            options: type === 'MCQ' ? (step.options || []) : undefined,
            correctAnswer: type === 'MCQ' ? (step.correctAnswer || '') : undefined,
        });

        res.status(201).json({ message: 'Question created from lesson step', question });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// GET /api/teacher/courses/:courseId/student-progress
const getCourseStudentProgress = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        // Find all students in the classes assigned to this course
        const classes = await Class.find({ _id: { $in: course.classIds } })
            .populate('studentIds', 'name rollNumber email');

        const studentIds = [];
        const studentMap = {};
        for (const cls of classes) {
            for (const s of cls.studentIds) {
                studentMap[s._id.toString()] = { _id: s._id, name: s.name, rollNumber: s.rollNumber, email: s.email, className: cls.className };
                studentIds.push(s._id);
            }
        }

        const progressDocs = await LearningProgress.find({
            courseId: course._id,
            studentId: { $in: studentIds }
        });

        const totalLessons = await Lesson.countDocuments({ courseId: course._id });

        const result = Object.values(studentMap).map(student => {
            const prog = progressDocs.find(p => p.studentId.toString() === student._id.toString());
            return {
                student,
                completedLessons: prog ? prog.completedLessons : 0,
                totalLessons,
                courseCompleted: prog ? prog.courseCompleted : false,
                percent: totalLessons > 0 ? Math.round(((prog ? prog.completedLessons : 0) / totalLessons) * 100) : 0,
                lastAccessedAt: prog ? prog.lastAccessedAt : null,
            };
        });

        res.json({ course, progress: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/teacher/courses/:courseId/full  — full course tree for editor
const getCourseTree = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).populate('classIds', 'className');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (course.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

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

        res.json({ ...course.toObject(), modules: modulesWithLessons });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createCourse,
    getCourses,
    updateCourse,
    deleteCourse,
    createModule,
    getModules,
    updateModule,
    deleteModule,
    createLesson,
    getLessons,
    updateLesson,
    deleteLesson,
    createStep,
    getSteps,
    updateStep,
    deleteStep,
    stepToQuestion,
    getCourseStudentProgress,
    getCourseTree,
};
