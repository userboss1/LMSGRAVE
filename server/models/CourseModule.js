const mongoose = require('mongoose');

const courseModuleSchema = mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

const CourseModule = mongoose.model('CourseModule', courseModuleSchema);

module.exports = CourseModule;
