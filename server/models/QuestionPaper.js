const mongoose = require('mongoose');

const questionPaperSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    questionIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }],
}, {
    timestamps: true,
});

const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

module.exports = QuestionPaper;
