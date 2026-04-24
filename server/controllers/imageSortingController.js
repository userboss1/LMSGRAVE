const VisualPaper    = require('../models/VisualPaper');
const VisualExam     = require('../models/VisualExam');
const VisualSubmission = require('../models/VisualSubmission');
const User           = require('../models/User');
const fs             = require('fs');
const path           = require('path');

const deleteFile = async (url) => {
    if (!url) return;
    try { await fs.promises.unlink(path.join(__dirname, '..', url.replace(/^\//, ''))); }
    catch (e) { if (e.code !== 'ENOENT') console.warn('file rm:', e.message); }
};

const getEditDistance = (a, b) => {
    if (a.length === 0) return b.length; 
    if (b.length === 0) return a.length; 
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) == a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
};

// ══════════════════════════════════════════════════════════════
//  PAPER CRUD (teacher)
// ══════════════════════════════════════════════════════════════

exports.createPaper = async (req, res) => {
    try {
        const { type, title, description, images, backgroundImageUrl, spots } = req.body;
        if (type === 'sorting' && (!images || images.length < 2))
            return res.status(400).json({ message: 'Sorting paper needs at least 2 images' });
        if (type === 'labeling' && (!backgroundImageUrl || !spots?.length))
            return res.status(400).json({ message: 'Labeling paper needs an image and at least 1 spot' });

        const paper = await VisualPaper.create({
            type, title, description, teacherId: req.user._id,
            ...(type === 'sorting' ? { images } : { backgroundImageUrl, spots }),
        });
        res.status(201).json(paper);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.getPapers = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = { teacherId: req.user._id };
        if (type) filter.type = type;
        const papers = await VisualPaper.find(filter).sort({ createdAt: -1 });
        res.json(papers);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updatePaper = async (req, res) => {
    try {
        const paper = await VisualPaper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Not found' });
        if (paper.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const { title, description, images, backgroundImageUrl, spots } = req.body;
        if (title !== undefined) paper.title = title;
        if (description !== undefined) paper.description = description;
        if (images !== undefined) paper.images = images;
        if (backgroundImageUrl !== undefined) paper.backgroundImageUrl = backgroundImageUrl;
        if (spots !== undefined) paper.spots = spots;
        await paper.save();
        res.json(paper);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.deletePaper = async (req, res) => {
    try {
        const paper = await VisualPaper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Not found' });
        if (paper.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        if (paper.type === 'sorting') {
            for (const img of paper.images) await deleteFile(img.imageUrl);
        } else {
            await deleteFile(paper.backgroundImageUrl);
        }
        await VisualPaper.findByIdAndDelete(paper._id);
        res.json({ message: 'Paper deleted' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// ══════════════════════════════════════════════════════════════
//  EXAM CRUD (teacher)
// ══════════════════════════════════════════════════════════════

exports.createExam = async (req, res) => {
    try {
        const { title, paperId, classId } = req.body;
        const paper = await VisualPaper.findById(paperId);
        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.teacherId.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not your paper' });

        const exam = await VisualExam.create({
            title: title || paper.title,
            paperId, paperType: paper.type,
            classId, teacherId: req.user._id,
        });
        res.status(201).json(await exam.populate(['paperId', 'classId']));
    } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.getExams = async (req, res) => {
    try {
        const exams = await VisualExam.find({ teacherId: req.user._id })
            .populate('paperId', 'title type images backgroundImageUrl spots')
            .populate('classId', 'className')
            .sort({ createdAt: -1 });
        res.json(exams);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.setStatus = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Not found' });
        if (exam.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        exam.status = req.body.status;
        await exam.save();
        res.json(exam);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.approveStudents = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Not found' });
        if (exam.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        exam.approvedUserIds = req.body.studentIds || [];
        await exam.save();
        res.json(exam);
    } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.deleteExam = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Not found' });
        if (exam.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        await VisualSubmission.deleteMany({ examId: exam._id });
        await VisualExam.findByIdAndDelete(exam._id);
        res.json({ message: 'Exam deleted' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.overrideScore = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const sub = await VisualSubmission.findOne({ _id: req.params.subId, examId: exam._id });
        if (!sub) return res.status(404).json({ message: 'Submission not found' });

        sub.score = Number(req.body.score) || 0;
        sub.percentage = sub.total ? Math.round((sub.score / sub.total) * 100) : 0;
        await sub.save();
        res.json({ message: 'Score updated', sub });
    } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.getResults = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id).populate('paperId');
        if (!exam) return res.status(404).json({ message: 'Not found' });
        if (exam.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const subs = await VisualSubmission.find({ examId: exam._id })
            .populate('studentId', 'name rollNumber email')
            .sort({ score: -1 });
        res.json({ exam, submissions: subs });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.publishResults = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Not found' });
        if (exam.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        exam.resultsPublished = true;
        await exam.save();
        res.json({ message: 'Published' });
    } catch (e) { res.status(400).json({ message: e.message }); }
};

// ══════════════════════════════════════════════════════════════
//  STUDENT routes
// ══════════════════════════════════════════════════════════════

exports.getAvailableExams = async (req, res) => {
    try {
        const student = await User.findById(req.user._id);
        if (!student.classId) return res.json([]);

        const exams = await VisualExam.find({ classId: student.classId, status: 'live' })
            .populate('paperId', 'title type images backgroundImageUrl spots');

        const result = await Promise.all(exams.map(async (exam) => {
            const isApproved = exam.approvedUserIds.some(id => id.toString() === req.user._id.toString());
            const submitted  = await VisualSubmission.findOne({ examId: exam._id, studentId: req.user._id });
            const e = exam.toObject();
            // Strip correct answers from paper data
            if (e.paperId?.spots) {
                e.paperId.spots = e.paperId.spots.map(s => ({ _id: s._id, x: s.x, y: s.y }));
            }
            if (e.paperId?.images) {
                e.paperId.images = e.paperId.images.map(i => ({ _id: i._id, imageUrl: i.imageUrl, caption: i.caption }));
            }
            return { ...e, isApproved, hasSubmitted: !!submitted };
        }));
        res.json(result);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getExamForStudent = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id).populate('paperId');
        if (!exam || exam.status !== 'live')
            return res.status(404).json({ message: 'Exam not available' });

        const isApproved = exam.approvedUserIds.some(id => id.toString() === req.user._id.toString());
        if (!isApproved) return res.status(403).json({ message: 'Not approved yet' });

        const paper = exam.paperId;
        let paperData;

        if (paper.type === 'sorting') {
            // Shuffle images, hide correct order
            const images = paper.images.map(i => ({ _id: i._id, imageUrl: i.imageUrl, caption: i.caption }));
            for (let i = images.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [images[i], images[j]] = [images[j], images[i]];
            }
            paperData = { type: 'sorting', images };
        } else {
            // Labeling — send spots WITHOUT labels (correct answers)
            const spots = paper.spots.map(s => ({ _id: s._id, x: s.x, y: s.y }));
            paperData = { type: 'labeling', backgroundImageUrl: paper.backgroundImageUrl, spots };
        }

        res.json({ _id: exam._id, title: exam.title, paperData });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.submitExam = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id).populate('paperId');
        if (!exam || exam.status !== 'live')
            return res.status(404).json({ message: 'Exam not available' });

        const existing = await VisualSubmission.findOne({ examId: exam._id, studentId: req.user._id });
        if (existing) return res.status(400).json({ message: 'Already submitted' });

        const paper = exam.paperId;
        let score = 0, total = 0;

        // Build submission doc
        const subData = { examId: exam._id, studentId: req.user._id, type: paper.type };

        if (paper.type === 'sorting') {
            const { submittedOrder } = req.body;
            total = paper.images.length;
            const correctOrder = paper.images.slice().sort((a, b) => a.order - b.order).map(i => i._id.toString());
            submittedOrder.forEach((id, idx) => { if (correctOrder[idx] === id?.toString()) score++; });
            subData.submittedOrder = submittedOrder;

        } else {
            const { answers } = req.body; // [{spotId, answer}]
            total = paper.spots.length;
            answers.forEach(({ spotId, answer }) => {
                const spot = paper.spots.find(s => s._id.toString() === spotId?.toString());
                if (spot) {
                    const target = spot.label.trim().toLowerCase();
                    const given = (answer || '').trim().toLowerCase();
                    if (target === given) {
                        score++;
                    } else if (target.length >= 4) {
                        const dist = getEditDistance(target, given);
                        const allowedDist = target.length > 7 ? 2 : 1;
                        if (dist <= allowedDist) score++;
                    }
                }
            });
            subData.answers = answers;
        }

        const percentage = total ? Math.round((score / total) * 100) : 0;
        const sub = await VisualSubmission.create({ ...subData, score, total, percentage });
        res.status(201).json({ score, total, percentage, submissionId: sub._id });
    } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.getMyResult = async (req, res) => {
    try {
        const exam = await VisualExam.findById(req.params.id).populate('paperId');
        if (!exam) return res.status(404).json({ message: 'Not found' });

        const sub = await VisualSubmission.findOne({ examId: exam._id, studentId: req.user._id });
        if (!sub) return res.status(404).json({ message: 'No submission' });

        const paper = exam.paperId;
        let correctData;
        if (paper.type === 'sorting') {
            correctData = paper.images.slice().sort((a, b) => a.order - b.order);
        } else {
            correctData = paper.spots;
        }

        res.json({ submission: sub, correctData, paperType: paper.type });
    } catch (e) { res.status(500).json({ message: e.message }); }
};
