const express = require('express');
const router = express.Router();
const { getStudentExams, getExamQuestions, submitExam, getMySubmissions, getMyResult } = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/exams', protect, authorize('student'), getStudentExams);
router.get('/exams/:id', protect, authorize('student'), getExamQuestions);
router.post('/exams/:id/submit', protect, authorize('student'), submitExam);
router.get('/submissions', protect, authorize('student'), getMySubmissions);
router.get('/submissions/:examId', protect, authorize('student'), getMyResult);

module.exports = router;
