const mongoose = require('mongoose');

const classSchema = mongoose.Schema({
    className: {
        type: String,
        required: true,
    },
    teacherIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    studentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, {
    timestamps: true,
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
