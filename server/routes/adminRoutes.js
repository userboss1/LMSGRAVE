const express = require('express');
const router = express.Router();
const { createClass, getClasses, deleteClass, addUser, getAllUsers, editUser, deleteUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/classes')
    .post(protect, authorize('superadmin'), createClass)
    .get(protect, authorize('superadmin', 'teacher'), getClasses);

router.route('/classes/:id')
    .delete(protect, authorize('superadmin'), deleteClass);

router.route('/users')
    .post(protect, authorize('superadmin'), addUser)
    .get(protect, authorize('superadmin'), getAllUsers);

router.route('/users/:id')
    .put(protect, authorize('superadmin'), editUser)
    .delete(protect, authorize('superadmin'), deleteUser);

module.exports = router;
