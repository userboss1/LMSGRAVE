const express = require('express');
const router = express.Router();
const { createUpload } = require('../middlewares/uploadMiddleware');
const uploadNote = createUpload('notes');

const { 
    createSubject, getSubjects, updateSubject, deleteSubject,
    addNote, deleteNote, getStudentNotes 
} = require('../controllers/noteController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ── Teacher routes ───────────────────────────────────────────────────────────

// File upload for notes (PDFs + images)
router.post('/upload',
    protect, authorize('teacher'),
    uploadNote.single('file'),
    (req, res) => {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
        res.json({ fileUrl: `/uploads/notes/${req.file.filename}`, fileType });
    }
);

// CRUD for note subjects
router.route('/teacher/subjects')
    .post(protect, authorize('teacher'), createSubject)
    .get(protect, authorize('teacher'), getSubjects);

router.route('/teacher/subjects/:id')
    .put(protect, authorize('teacher'), updateSubject)
    .delete(protect, authorize('teacher'), deleteSubject);

router.route('/teacher/subjects/:id/notes')
    .post(protect, authorize('teacher'), addNote);

router.route('/teacher/subjects/:id/notes/:noteId')
    .delete(protect, authorize('teacher'), deleteNote);

// ── Student routes ───────────────────────────────────────────────────────────

router.route('/student')
    .get(protect, authorize('student'), getStudentNotes);

module.exports = router;
