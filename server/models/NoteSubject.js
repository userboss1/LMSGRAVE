const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String }, // uploaded file (PDF or image)
    fileType: { type: String, enum: ['pdf', 'image', 'link'] },
    externalLink: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const noteSubjectSchema = new mongoose.Schema({
    title: { type: String, required: true },       // e.g. "Physics Chapter 1"
    description: { type: String },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }], // assigned classes
    notes: [noteSchema],
}, { timestamps: true });

const NoteSubject = mongoose.model('NoteSubject', noteSubjectSchema);
module.exports = NoteSubject;
