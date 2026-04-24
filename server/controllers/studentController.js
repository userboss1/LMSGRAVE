const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const Question = require('../models/Question');

// @desc    Get available exams for the student
// @route   GET /api/student/exams
// @access  Student
const getStudentExams = async (req, res) => {
    try {
        // Find exams assigned to the student's class that are live
        const exams = await Exam.find({
            classId: req.user.classId,
            status: 'live',
        }).select('-questionIds').lean();

        // Add isApproved flag for each exam
        const result = exams.map(exam => ({
            ...exam,
            isApproved: exam.approvedUserIds?.map(id => id.toString()).includes(req.user._id.toString()) ?? false,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get exam detail (questions)
// @route   GET /api/student/exams/:id
// @access  Student
const getExamQuestions = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check availability
        if (exam.status !== 'live') {
            return res.status(400).json({ message: 'Exam is not live' });
        }

        // Check access
        if (exam.classId.toString() !== req.user.classId.toString()) {
            return res.status(401).json({ message: 'Not authorized for this exam' });
        }

        if (!exam.approvedUserIds.some(id => id.toString() === req.user._id.toString())) {
            return res.status(401).json({ message: 'You are not approved to take this exam' });
        }

        // Check if already submitted
        const existingSubmission = await Submission.findOne({ examId: exam._id, studentId: req.user._id });
        if (existingSubmission) {
            return res.status(400).json({ message: 'You have already submitted this exam' });
        }

        // Populate questions but HIDE correct answers for MCQs
        const examWithQuestions = await Exam.findById(req.params.id).populate({
            path: 'questionIds',
            select: '-correctAnswer' // Exclude correct answer
        });

        res.json(examWithQuestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit exam
// @route   POST /api/student/exams/:id/submit
// @access  Student
const submitExam = async (req, res) => {
    try {
        const { answers, violations } = req.body; // answers: [{ questionId, answer }]
        const examId = req.params.id;
        const studentId = req.user._id;

        const exam = await Exam.findById(examId).populate('questionIds');

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if valid submission time (optional: add buffer)
        // Check duplicate
        const existingSubmission = await Submission.findOne({ examId, studentId });
        if (existingSubmission) {
            return res.status(400).json({ message: 'Already submitted' });
        }

        let mcqScore = 0;
        let formattedAnswers = [];

        // Evaluate MCQs
        for (const ans of answers) {
            const question = exam.questionIds.find(q => q._id.toString() === ans.questionId);

            if (question) {
                formattedAnswers.push({
                    questionId: ans.questionId,
                    answer: ans.answer
                });

                if (question.type === 'MCQ') {
                    // Multi-correct support: correctAnswers array takes priority
                    const isMultiCorrect = question.correctAnswers && question.correctAnswers.length > 1;
                    let isCorrect = false;

                    if (isMultiCorrect) {
                        // Student submits comma-separated selected options
                        const studentSelected = (ans.answer || '').split(',').map(s => s.trim()).filter(Boolean).sort();
                        const allCorrect = [...question.correctAnswers].sort();
                        isCorrect = JSON.stringify(studentSelected) === JSON.stringify(allCorrect);
                    } else {
                        // Single correct
                        const correct = question.correctAnswers?.[0] || question.correctAnswer;
                        isCorrect = ans.answer === correct;
                    }

                    if (isCorrect) {
                        mcqScore += 1;
                    } else if (exam.negativeMarking > 0 && ans.answer !== '' && ans.answer !== null) {
                        mcqScore -= exam.negativeMarking;
                    }
                }
            }
        }

        const submission = await Submission.create({
            examId,
            studentId,
            answers: formattedAnswers,
            mcqScore,
            violations,
            finalScore: mcqScore // initially just MCQ score; teacher adds descriptive later
        });

        res.status(201).json({ message: 'Exam submitted', score: mcqScore });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all attended exams (submitted by the student)
// @route   GET /api/student/submissions
// @access  Student
const getMySubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ studentId: req.user._id })
            .populate('examId', 'title status resultsPublished series')
            .sort({ submittedAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get result for a specific exam (only if published)
// @route   GET /api/student/submissions/:examId
// @access  Student
const getMyResult = async (req, res) => {
    try {
        const submission = await Submission.findOne({
            examId: req.params.examId,
            studentId: req.user._id,
        }).populate('examId', 'title resultsPublished series');

        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        if (!submission.examId.resultsPublished) {
            return res.status(403).json({ message: 'Results not yet published by teacher' });
        }

        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStudentExams,
    getExamQuestions,
    submitExam,
    getMySubmissions,
    getMyResult,
};
