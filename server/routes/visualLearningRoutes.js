const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { protect, authorize } = require('../middlewares/authMiddleware');

const {
    createCourse, getCourses, updateCourse, deleteCourse,
    createModule, getModules, updateModule, deleteModule,
    createLesson, getLessons, updateLesson, deleteLesson,
    createStep, getSteps, updateStep, deleteStep,
    stepToQuestion, getCourseStudentProgress, getCourseTree,
} = require('../controllers/visualLearningController');

const auth = [protect, authorize('teacher')];

// Image upload for lesson steps (reuses existing uploads folder & middleware)
router.post('/upload-image', ...auth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ imageUrl: `/uploads/resources/${req.file.filename}` });
});

// ── Courses ──────────────────────────────────────────────────────────────────
router.route('/')
    .post(...auth, createCourse)
    .get(...auth, getCourses);

router.route('/:courseId')
    .put(...auth, updateCourse)
    .delete(...auth, deleteCourse);

router.route('/:courseId/full')
    .get(...auth, getCourseTree);

router.route('/:courseId/student-progress')
    .get(...auth, getCourseStudentProgress);

// ── Modules ───────────────────────────────────────────────────────────────────
router.route('/:courseId/modules')
    .post(...auth, createModule)
    .get(...auth, getModules);

router.route('/modules/:moduleId')
    .put(...auth, updateModule)
    .delete(...auth, deleteModule);

// ── Lessons ───────────────────────────────────────────────────────────────────
router.route('/modules/:moduleId/lessons')
    .post(...auth, createLesson)
    .get(protect, authorize('teacher', 'student'), getLessons);

router.route('/lessons/:lessonId')
    .put(...auth, updateLesson)
    .delete(...auth, deleteLesson);

// ── Lesson Steps ──────────────────────────────────────────────────────────────
router.route('/lessons/:lessonId/steps')
    .post(...auth, createStep)
    .get(protect, authorize('teacher', 'student'), getSteps);

router.route('/steps/:stepId')
    .put(...auth, updateStep)
    .delete(...auth, deleteStep);

router.route('/steps/:stepId/to-question')
    .post(...auth, stepToQuestion);

module.exports = router;
