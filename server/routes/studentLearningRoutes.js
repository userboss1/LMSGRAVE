const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

const {
    getStudentCourses,
    getStudentCourse,
    markStepComplete,
    getCourseProgress,
} = require('../controllers/studentLearningController');

const auth = [protect, authorize('student')];

router.route('/')
    .get(...auth, getStudentCourses);

router.route('/progress')
    .post(...auth, markStepComplete);

router.route('/:courseId')
    .get(...auth, getStudentCourse);

router.route('/:courseId/progress')
    .get(...auth, getCourseProgress);

module.exports = router;
