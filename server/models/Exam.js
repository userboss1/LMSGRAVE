const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    series: {
        type: String,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    questionIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }],
    duration: {
        type: Number, // in minutes
    },
    negativeMarking: {
        type: Number, // deduction per wrong MCQ (0 = disabled, e.g. 0.25, 0.5, 1, 2)
        default: 0,
    },
    status: {
        type: String,
        enum: ['draft', 'live', 'completed'],
        default: 'draft',
    },
    approvedUserIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    resultsPublished: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
