const express = require('express');
const {
  getAllUsers,
  approveInstructor,
  changeUserRole,
  deleteUser,
  getStudentProgress,
  getPlatformStatistics,
  getPendingInstructors
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

router.get('/users', protect, restrictTo('Admin'), getAllUsers);
router.put('/users/:userId/approve', protect, restrictTo('Admin'), approveInstructor);
router.put('/users/:userId/role', protect, restrictTo('Admin'), changeUserRole);
router.delete('/users/:userId', protect, restrictTo('Admin'), deleteUser);
router.get('/students/:userId/progress', protect, restrictTo('Admin'), getStudentProgress);
router.get('/statistics', protect, restrictTo('Admin'), getPlatformStatistics);
router.get('/notifications', protect, restrictTo('Admin'), getPendingInstructors);


module.exports = router;