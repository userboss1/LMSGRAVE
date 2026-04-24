const Class = require('../models/Class');
const User = require('../models/User');

const createClass = async (req, res) => {
    try {
        const { className } = req.body;
        const newClass = await Class.create({ className });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getClasses = async (req, res) => {
    try {
        const classes = await Class.find({})
            .populate('teacherIds', 'name email tempPassword')
            .populate('studentIds', 'name email rollNumber tempPassword classId');
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a class
// @route   DELETE /api/admin/classes/:id
// @access  SuperAdmin
const deleteClass = async (req, res) => {
    try {
        const deleted = await Class.findByIdAndDelete(req.params.id);
        if (deleted) {
            res.json({ message: 'Class removed' });
        } else {
            res.status(404).json({ message: 'Class not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a user (Teacher or Student)
// @route   POST /api/admin/users
// @access  SuperAdmin
const addUser = async (req, res) => {
    try {
        const { name, email, password, role, classId, rollNumber } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const userData = { name, email, password, role };
        if (classId) userData.classId = classId;
        if (role === 'student' && rollNumber) userData.rollNumber = rollNumber;

        const user = await User.create(userData);

        if (user) {
            if (role === 'student' && classId) {
                await Class.findByIdAndUpdate(classId, { $push: { studentIds: user._id } });
            }
            if (role === 'teacher' && classId) {
                await Class.findByIdAndUpdate(classId, { $push: { teacherIds: user._id } });
            }

            // Mongoose pre-save hook handles auth generation
            res.status(201).json({ 
                _id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                tempPassword: user.tempPassword
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Add User error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  SuperAdmin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate('classId', 'className');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit a user (name, email, password, classId, rollNumber)
// @route   PUT /api/admin/users/:id
// @access  SuperAdmin
const editUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email, password, classId, rollNumber } = req.body;

        // Handle class reassignment
        if (classId && classId !== user.classId?.toString()) {
            // Remove from old class
            if (user.classId) {
                const field = user.role === 'teacher' ? 'teacherIds' : 'studentIds';
                await Class.findByIdAndUpdate(user.classId, { $pull: { [field]: user._id } });
            }
            // Add to new class
            const field = user.role === 'teacher' ? 'teacherIds' : 'studentIds';
            await Class.findByIdAndUpdate(classId, { $push: { [field]: user._id } });
            user.classId = classId;
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password;  // pre-save hook hashes + syncs tempPassword
        if (rollNumber !== undefined) user.rollNumber = rollNumber;

        await user.save();
        res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, tempPassword: user.tempPassword });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  SuperAdmin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Remove from class if assigned
        if (user.classId) {
            const field = user.role === 'teacher' ? 'teacherIds' : 'studentIds';
            await Class.findByIdAndUpdate(user.classId, { $pull: { [field]: user._id } });
        }

        await User.findByIdAndDelete(user._id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createClass,
    getClasses,
    deleteClass,
    addUser,
    getAllUsers,
    editUser,
    deleteUser,
};
