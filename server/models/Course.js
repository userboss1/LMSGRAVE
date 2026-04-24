const mongoose = require('mongoose');

const courseSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
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
    classIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    },
}, {
    timestamps: true,
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
