const mongoose = require('mongoose');

const sortImageSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    caption:  { type: String, default: '' },
    order:    { type: Number, required: true }, // 0-indexed correct position
});

const spotSchema = new mongoose.Schema({
    x:     { type: Number, required: true }, // % from left of image
    y:     { type: Number, required: true }, // % from top of image
    label: { type: String, required: true }, // correct answer
});

const visualPaperSchema = new mongoose.Schema({
    type:        { type: String, enum: ['sorting', 'labeling'], required: true },
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Sorting fields ────────────────────────────────────
    images: [sortImageSchema],

    // ── Labeling fields ───────────────────────────────────
    backgroundImageUrl: { type: String },
    spots: [spotSchema],
}, { timestamps: true });

module.exports = mongoose.model('VisualPaper', visualPaperSchema);
