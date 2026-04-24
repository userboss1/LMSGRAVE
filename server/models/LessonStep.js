const mongoose = require('mongoose');

// Annotation shape stored as plain JSON
const annotationSchema = new mongoose.Schema({
    type: { type: String }, // 'arrow', 'circle', 'highlight', 'label', 'underline', 'shape'
    x: Number,
    y: Number,
    x2: Number,
    y2: Number,
    width: Number,
    height: Number,
    text: String,
    color: { type: String, default: '#FF0000' },
}, { _id: false });

const lessonStepSchema = mongoose.Schema({
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    type: {
        type: String,
        enum: ['image', 'explanation', 'quote', 'example', 'practice'],
        required: true,
    },
    order: {
        type: Number,
        default: 0,
    },
    // Shared
    title: { type: String, default: '' },

    // For image steps
    imageUrl: { type: String },
    annotations: [annotationSchema],

    // For explanation / example steps
    text: { type: String, default: '' },

    // For quote / important note steps
    quoteType: {
        type: String,
        enum: ['important', 'exam-tip', 'remember', 'formula'],
        default: 'important',
    },

    // For practice steps (mini question)
    questionText: { type: String },
    questionType: {
        type: String,
        enum: ['MCQ', 'DESCRIPTIVE', 'DIAGRAM'],
        default: 'MCQ',
    },
    options: [{ type: String }],
    correctAnswer: { type: String },
}, {
    timestamps: true,
});

const LessonStep = mongoose.model('LessonStep', lessonStepSchema);

module.exports = LessonStep;
