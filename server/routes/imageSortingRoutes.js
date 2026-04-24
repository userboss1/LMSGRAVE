const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createUpload } = require('../middlewares/uploadMiddleware');
const upload = createUpload('visual');
const ctrl = require('../controllers/imageSortingController');

// ── Image upload (shared for sorting images & labeling backgrounds) ──────────
router.post('/upload',
    protect, authorize('teacher'),
    upload.single('image'),
    (req, res) => {
        if (!req.file) return res.status(400).json({ message: 'No file' });
        res.json({ imageUrl: `/uploads/visual/${req.file.filename}` });
    }
);

// ── Teacher: Papers ──────────────────────────────────────────────────────────
router.route('/papers')
    .get(protect, authorize('teacher'), ctrl.getPapers)
    .post(protect, authorize('teacher'), ctrl.createPaper);

router.route('/papers/:id')
    .put(protect, authorize('teacher'), ctrl.updatePaper)
    .delete(protect, authorize('teacher'), ctrl.deletePaper);

// ── Teacher: Exams ───────────────────────────────────────────────────────────
router.route('/exams')
    .get(protect, authorize('teacher'), ctrl.getExams)
    .post(protect, authorize('teacher'), ctrl.createExam);

router.route('/exams/:id')
    .delete(protect, authorize('teacher'), ctrl.deleteExam);

router.route('/exams/:id/status')
    .put(protect, authorize('teacher'), ctrl.setStatus);

router.route('/exams/:id/approve')
    .put(protect, authorize('teacher'), ctrl.approveStudents);

router.route('/exams/:id/results')
    .get(protect, authorize('teacher'), ctrl.getResults);

router.route('/exams/:id/publish')
    .put(protect, authorize('teacher'), ctrl.publishResults);

router.route('/exams/:id/submissions/:subId/score')
    .put(protect, authorize('teacher'), ctrl.overrideScore);

// ── Student routes ────────────────────────────────────────────────────────────
// IMPORTANT: /student/available must be before /student/:id
router.route('/student/available')
    .get(protect, authorize('student'), ctrl.getAvailableExams);

router.route('/student/:id')
    .get(protect, authorize('student'), ctrl.getExamForStudent);

router.route('/student/:id/submit')
    .post(protect, authorize('student'), ctrl.submitExam);

router.route('/student/:id/result')
    .get(protect, authorize('student'), ctrl.getMyResult);

module.exports = router;
