const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Class = require('../models/Class');
const Submission = require('../models/Submission');
const QuestionPaper = require('../models/QuestionPaper');

// @desc    Create a new question
// @route   POST /api/teacher/questions
// @access  Teacher
const createQuestion = async (req, res) => {
    try {
        const { type, questionText, imageUrl, options, correctAnswer, correctAnswers, visualSubtype, visualData, correctVisualAnswer } = req.body;

        const question = await Question.create({
            teacherId: req.user._id,
            type,
            questionText,
            imageUrl,
            options: type === 'MCQ' ? options : undefined,
            optionImages: type === 'MCQ' ? (req.body.optionImages || []) : undefined,
            correctAnswer: type === 'MCQ' ? (correctAnswers?.length > 1 ? '' : (correctAnswer || '')) : undefined,
            correctAnswers: type === 'MCQ' ? (correctAnswers || []) : undefined,
            visualSubtype: type === 'VISUAL_MCQ' ? visualSubtype : undefined,
            visualData: type === 'VISUAL_MCQ' ? visualData : undefined,
            correctVisualAnswer: type === 'VISUAL_MCQ' ? correctVisualAnswer : undefined,
        });

        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all questions for the logged-in teacher
// @route   GET /api/teacher/questions
// @access  Teacher
const getQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ teacherId: req.user._id });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a question
// @route   DELETE /api/teacher/questions/:id
// @access  Teacher
const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        if (question.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a question
// @route   PUT /api/teacher/questions/:id
// @access  Teacher
const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        if (question.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });

        const { type, questionText, options, optionImages, correctAnswer, correctAnswers, imageUrl, visualSubtype, visualData, correctVisualAnswer } = req.body;
        
        if (type) question.type = type;
        if (questionText) question.questionText = questionText;
        if (options) question.options = options;
        if (optionImages !== undefined) question.optionImages = optionImages;
        
        if (type === 'MCQ') {
            question.correctAnswers = correctAnswers || question.correctAnswers;
            question.correctAnswer = (question.correctAnswers?.length > 1) ? '' : (correctAnswer || question.correctAnswer);
        }

        if (imageUrl !== undefined) question.imageUrl = imageUrl || undefined;
        if (visualSubtype !== undefined) question.visualSubtype = visualSubtype;
        if (visualData !== undefined) question.visualData = visualData;
        if (correctVisualAnswer !== undefined) question.correctVisualAnswer = correctVisualAnswer;

        await question.save();
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all classes (for exam assignment) with students populated
// @route   GET /api/teacher/classes
// @access  Teacher
const getTeacherClasses = async (req, res) => {
    try {
        const classes = await Class.find({})
            .populate('studentIds', 'name email rollNumber tempPassword')
            .lean();
        // Rename studentIds -> students for frontend
        const result = classes.map(c => ({
            ...c,
            students: c.studentIds || [],
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Create a new exam
// @route   POST /api/teacher/exams
// @access  Teacher
const createExam = async (req, res) => {
    try {
        const { title, series, classId, questionIds, duration, negativeMarking } = req.body;

        const exam = await Exam.create({
            title,
            series,
            teacherId: req.user._id,
            classId,
            questionIds,
            duration,
            negativeMarking: parseFloat(negativeMarking) || 0
        });

        res.status(201).json(exam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all exams created by the teacher
// @route   GET /api/teacher/exams
// @access  Teacher
const getExams = async (req, res) => {
    try {
        const exams = await Exam.find({ teacherId: req.user._id }).populate('classId', 'className');
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a draft/completed exam
// @route   DELETE /api/teacher/exams/:id
// @access  Teacher
const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        if (exam.status === 'live')
            return res.status(400).json({ message: 'Cannot delete a live exam. End it first.' });
        await Exam.findByIdAndDelete(req.params.id);
        res.json({ message: 'Exam deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Activate/Deactivate Exam
// @route   PUT /api/teacher/exams/:id/status
// @access  Teacher
const updateExamStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        if (exam.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        exam.status = status;
        await exam.save();
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve students for an exam
// @route   PUT /api/teacher/exams/:id/approve
// @access  Teacher
const approveStudents = async (req, res) => {
    try {
        const { studentIds } = req.body; // array of student ObjectId strings
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        if (exam.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        exam.approvedUserIds = studentIds;
        await exam.save();
        res.json({ message: 'Students approved', approvedUserIds: exam.approvedUserIds });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get exam results
// @route   GET /api/teacher/exams/:id/results
// @access  Teacher
const getExamResults = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).populate('questionIds', 'questionText type');
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Verify ownership
        if (exam.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const submissions = await Submission.find({ examId: req.params.id })
            .populate('studentId', 'name rollNumber email')
            .populate('answers.questionId', 'questionText type');

        res.json({ exam, submissions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Grade descriptive answers
// @route   PUT /api/teacher/submissions/:id/grade
// @access  Teacher
const gradeSubmission = async (req, res) => {
    try {
        const { descriptiveScore } = req.body;
        const submission = await Submission.findById(req.params.id);

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Verify teacher ownership of exam
        const exam = await Exam.findById(submission.examId);
        if (exam.teacherId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        submission.descriptiveScore = descriptiveScore;
        submission.finalScore = submission.mcqScore + descriptiveScore;

        await submission.save();
        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Question Papers ───────────────────────────────────────────────────────────

// @desc    Create a question paper
// @route   POST /api/teacher/question-papers
const createQuestionPaper = async (req, res) => {
    try {
        const { title, description, questionIds } = req.body;
        const paper = await QuestionPaper.create({
            title,
            description,
            teacherId: req.user._id,
            questionIds: questionIds || [],
        });
        res.status(201).json(paper);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all question papers for teacher
// @route   GET /api/teacher/question-papers
const getQuestionPapers = async (req, res) => {
    try {
        const papers = await QuestionPaper.find({ teacherId: req.user._id })
            .populate('questionIds', 'questionText type visualSubtype imageUrl');
        res.json(papers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a question paper
// @route   PUT /api/teacher/question-papers/:id
const updateQuestionPaper = async (req, res) => {
    try {
        const paper = await QuestionPaper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Question paper not found' });
        if (paper.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        const { title, description, questionIds } = req.body;
        if (title) paper.title = title;
        if (description !== undefined) paper.description = description;
        if (questionIds) paper.questionIds = questionIds;
        await paper.save();
        res.json(paper);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a question paper
// @route   DELETE /api/teacher/question-papers/:id
const deleteQuestionPaper = async (req, res) => {
    try {
        const paper = await QuestionPaper.findById(req.params.id);
        if (!paper) return res.status(404).json({ message: 'Question paper not found' });
        if (paper.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        await QuestionPaper.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question paper deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle publish results for an exam
// @route   PUT /api/teacher/exams/:id/publish
// @access  Teacher
const publishResults = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user._id.toString())
            return res.status(401).json({ message: 'Not authorized' });
        exam.resultsPublished = !exam.resultsPublished;
        await exam.save();
        res.json({ resultsPublished: exam.resultsPublished, message: exam.resultsPublished ? 'Results published' : 'Results unpublished' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createQuestion,
    getQuestions,
    deleteQuestion,
    updateQuestion,
    getTeacherClasses,
    createExam,
    getExams,
    updateExamStatus,
    approveStudents,
    deleteExam,
    getExamResults,
    gradeSubmission,
    createQuestionPaper,
    getQuestionPapers,
    updateQuestionPaper,
    deleteQuestionPaper,
    publishResults,
};
