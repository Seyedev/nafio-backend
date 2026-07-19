const express = require('express');
const router = express.Router();
const { updateProfilePhoto } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadProfile } = require('../config/cloudinary');

router.post('/me/photo-profil', protect, uploadProfile.single('photo'), updateProfilePhoto);

module.exports = router;
