const mongoose = require('mongoose');

const visualSubmissionSchema = new mongoose.Schema({
    examId:    { type: mongoose.Schema.Types.ObjectId, ref: 'VisualExam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:      { type: String, enum: ['sorting', 'labeling'] },

    // ── Sorting: array of imageItem _ids in student's chosen order ──
    submittedOrder: [{ type: mongoose.Schema.Types.ObjectId }],

    // ── Labeling: student's answers for each spot ───────────────────
    answers: [{
        spotId: { type: mongoose.Schema.Types.ObjectId },
        answer:  { type: String, default: '' },
    }],

    score:      { type: Number, default: 0 },
    total:      { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('VisualSubmission', visualSubmissionSchema);
