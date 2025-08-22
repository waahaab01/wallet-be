const express = require('express');
const { getAllUsers, getSingleUser, deleteLast10Users,getProfile,updateProfile } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/upload');

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/me', protect, getProfile);
router.put('/me', protect, upload.single('image'), updateProfile);
router.get('/', protect, adminMiddleware, getAllUsers);
// GET /api/users/:id - Get single user by ID (admin only)
router.get('/:id', protect, adminMiddleware, getSingleUser);
// DELETE /api/users/delete-last-10 - Delete last 10 users (admin only)
router.delete('/delete-last-10', protect, adminMiddleware, deleteLast10Users);
module.exports = router;
