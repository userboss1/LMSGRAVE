const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['MCQ', 'DESCRIPTIVE', 'VISUAL_MCQ'],
        required: true,
    },
    visualSubtype: {
        type: String,
        enum: ['sort', 'match', 'label', 'identify'],
    },
    visualData: {
        type: mongoose.Schema.Types.Mixed, // flexible JSON per subtype
    },
    questionText: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    options: [{
        type: String,
    }],
    optionImages: [{
        type: String,
    }],
    correctAnswer: {
        type: String,
    },
    correctAnswers: [{
        type: String,
    }],
    // For VISUAL_MCQ: structured answer (e.g. ordered array, matched pairs)
    correctVisualAnswer: {
        type: mongoose.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
