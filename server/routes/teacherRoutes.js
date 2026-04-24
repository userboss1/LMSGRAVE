const express = require('express');
const router = express.Router();
const { createUpload } = require('../middlewares/uploadMiddleware');
const uploadQuestion = createUpload('questions');

const {
    createQuestion, getQuestions, deleteQuestion, updateQuestion,
    getTeacherClasses,
    createExam, getExams, updateExamStatus, approveStudents, deleteExam,
    getExamResults, gradeSubmission,
    createQuestionPaper, getQuestionPapers, updateQuestionPaper, deleteQuestionPaper,
    publishResults,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/authMiddleware');


// Image upload
router.post('/questions/upload',
    protect, authorize('teacher'),
    uploadQuestion.single('image'),
    (req, res) => {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        res.json({ imageUrl: `/uploads/questions/${req.file.filename}` });
    }
);

router.route('/questions')
    .post(protect, authorize('teacher'), createQuestion)
    .get(protect, authorize('teacher'), getQuestions);

router.route('/questions/:id')
    .delete(protect, authorize('teacher'), deleteQuestion)
    .put(protect, authorize('teacher'), updateQuestion);

router.route('/classes')
    .get(protect, authorize('teacher'), getTeacherClasses);

router.route('/exams')
    .post(protect, authorize('teacher'), createExam)
    .get(protect, authorize('teacher'), getExams);

router.route('/exams/:id/status')
    .put(protect, authorize('teacher'), updateExamStatus);

router.route('/exams/:id/approve')
    .put(protect, authorize('teacher'), approveStudents);

router.route('/exams/:id')
    .delete(protect, authorize('teacher'), deleteExam);

router.route('/exams/:id/results')
    .get(protect, authorize('teacher'), getExamResults);

router.route('/exams/:id/publish')
    .put(protect, authorize('teacher'), publishResults);

router.route('/submissions/:id/grade')
    .put(protect, authorize('teacher'), gradeSubmission);

// ── Question Papers ───────────────────────────────────────────────────────────
router.route('/question-papers')
    .post(protect, authorize('teacher'), createQuestionPaper)
    .get(protect, authorize('teacher'), getQuestionPapers);

router.route('/question-papers/:id')
    .put(protect, authorize('teacher'), updateQuestionPaper)
    .delete(protect, authorize('teacher'), deleteQuestionPaper);

module.exports = router;
