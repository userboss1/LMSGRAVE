const mongoose = require('mongoose');

const visualExamSchema = new mongoose.Schema({
    title:       { type: String, required: true },
    paperId:     { type: mongoose.Schema.Types.ObjectId, ref: 'VisualPaper', required: true },
    paperType:   { type: String, enum: ['sorting', 'labeling'], required: true },
    teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    status:      { type: String, enum: ['draft', 'live', 'completed'], default: 'draft' },
    approvedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    resultsPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('VisualExam', visualExamSchema);
