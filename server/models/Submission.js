const mongoose = require('mongoose');

const submissionSchema = mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
        },
        answer: {
            type: String,
        },
    }],
    mcqScore: {
        type: Number,
        default: 0,
    },
    descriptiveScore: {
        type: Number,
        default: 0,
    },
    finalScore: {
        type: Number,
        default: 0,
    },
    violations: {
        type: Number,
        default: 0,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
