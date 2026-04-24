const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
    },
    completedSteps: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LessonStep',
    }],
    lessonCompleted: {
        type: Boolean,
        default: false,
    },
}, { _id: false });

const learningProgressSchema = mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    // Array of per-lesson progress objects
    lessons: [lessonProgressSchema],

    // Aggregated counters
    completedLessons: {
        type: Number,
        default: 0,
    },
    totalLessons: {
        type: Number,
        default: 0,
    },
    courseCompleted: {
        type: Boolean,
        default: false,
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Compound unique index so each student has one progress doc per course
learningProgressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const LearningProgress = mongoose.model('LearningProgress', learningProgressSchema);

module.exports = LearningProgress;
