const NoteSubject = require('../models/NoteSubject');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const deleteFile = async (fileUrl) => {
    if (!fileUrl) return;
    try {
        // fileUrl is like "/uploads/notes/abc.pdf" — strip leading slash
        const rel = fileUrl.replace(/^\//, '');
        const abs = path.join(__dirname, '..', rel);
        await fs.promises.unlink(abs);
    } catch (e) {
        // Silently ignore if file doesn't exist
        if (e.code !== 'ENOENT') console.warn('File delete warn:', e.message);
    }
};

// @desc    Create a new subject for notes
// @route   POST /api/notes/teacher/subjects   (see noteRoutes)
// @access  Teacher
exports.createSubject = async (req, res) => {
    try {
        const { title, description, assignedClasses } = req.body;
        const subject = await NoteSubject.create({
            title,
            description,
            teacherId: req.user._id,
            classIds: assignedClasses || [],
            notes: []
        });
        const populated = await NoteSubject.findById(subject._id).populate('classIds', 'className');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all subjects for the teacher
// @route   GET /api/notes/teacher/subjects
// @access  Teacher
exports.getSubjects = async (req, res) => {
    try {
        const subjects = await NoteSubject.find({ teacherId: req.user._id })
            .populate('classIds', 'className');
        // Rename classIds -> assignedClasses for UI compatibility
        const shaped = subjects.map(s => {
            const obj = s.toObject();
            obj.assignedClasses = obj.classIds;
            return obj;
        });
        res.json(shaped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update subject (title, description, or assigned classes)
// @route   PUT /api/notes/teacher/subjects/:id
// @access  Teacher
exports.updateSubject = async (req, res) => {
    try {
        const subject = await NoteSubject.findById(req.params.id);
        if (!subject || subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        const { title, description, assignedClasses } = req.body;
        if (title) subject.title = title;
        if (description !== undefined) subject.description = description;
        if (assignedClasses) subject.classIds = assignedClasses;
        await subject.save();
        const populated = await NoteSubject.findById(subject._id).populate('classIds', 'className');
        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete subject
// @route   DELETE /api/notes/teacher/subjects/:id
// @access  Teacher
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await NoteSubject.findById(req.params.id);
        if (!subject || subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        // Delete all associated files
        for (const note of subject.notes) {
            await deleteFile(note.fileUrl);
        }
        await NoteSubject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a note to a subject
// @route   POST /api/notes/teacher/subjects/:id/notes
// @access  Teacher
exports.addNote = async (req, res) => {
    try {
        const subject = await NoteSubject.findById(req.params.id);
        if (!subject || subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        const { title, description, fileUrl, fileType, externalLink } = req.body;
        subject.notes.push({ title, description, fileUrl, fileType, externalLink });
        await subject.save();
        const populated = await NoteSubject.findById(subject._id).populate('classIds', 'className');
        const obj = populated.toObject();
        obj.assignedClasses = obj.classIds;
        res.status(201).json(obj);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a note from a subject
// @route   DELETE /api/notes/teacher/subjects/:id/notes/:noteId
// @access  Teacher
exports.deleteNote = async (req, res) => {
    try {
        const subject = await NoteSubject.findById(req.params.id);
        if (!subject || subject.teacherId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        // Find the note to get its file URL before removing
        const note = subject.notes.find(n => n._id.toString() === req.params.noteId);
        if (note) await deleteFile(note.fileUrl);

        subject.notes.pull({ _id: req.params.noteId });
        await subject.save();
        const populated = await NoteSubject.findById(subject._id).populate('classIds', 'className');
        const obj = populated.toObject();
        obj.assignedClasses = obj.classIds;
        res.json(obj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get notes for student's class
// @route   GET /api/notes/student
// @access  Student
exports.getStudentNotes = async (req, res) => {
    try {
        const classId = req.user.classId;
        if (!classId) {
            return res.status(400).json({ message: 'Student not assigned to a class' });
        }
        const subjects = await NoteSubject.find({ classIds: classId })
            .populate('classIds', 'className')
            .lean();
        // Shape for UI
        const shaped = subjects.map(s => ({ ...s, assignedClasses: s.classIds }));
        res.json(shaped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
