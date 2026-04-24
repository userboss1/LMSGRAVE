const mongoose = require('mongoose');

const imageSortingSubmissionSchema = new mongoose.Schema({
    examId:     { type: mongoose.Schema.Types.ObjectId, ref: 'ImageSortingExam', required: true },
    studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The order the student submitted: array of imageItem _ids in their chosen sequence
    submittedOrder: [{ type: mongoose.Schema.Types.ObjectId }],
    score:      { type: Number, default: 0 }, // out of images.length
    total:      { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ImageSortingSubmission', imageSortingSubmissionSchema);
