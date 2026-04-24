const mongoose = require('mongoose');

const imageItemSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    label:    { type: String, default: '' },   // optional caption for the image
    order:    { type: Number, required: true }, // correct order (0-indexed)
});

const imageSortingExamSchema = new mongoose.Schema({
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    images:      [imageItemSchema],
    status:      { type: String, enum: ['draft', 'live', 'completed'], default: 'draft' },
    approvedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    resultsPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ImageSortingExam', imageSortingExamSchema);
