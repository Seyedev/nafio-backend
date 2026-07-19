const express = require('express');
const router = express.Router();
const {
  listPros,
  getProDetails,
  addAvailability,
  deleteAvailability,
  getAvailabilities,
  updateMyProfile,
  uploadToGalerie,
  deleteFromGalerie,
  getAvailableFilters,
  getActiveDays
} = require('../controllers/proController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { uploadGallery } = require('../config/cloudinary');

router.get('/', protect, listPros);
router.get('/filtres-disponibles', protect, getAvailableFilters);
router.get('/:id', protect, getProDetails);
router.get('/:id/jours-actifs', protect, getActiveDays);

// Routes spécifiques Pro
router.put('/me', protect, authorize('pro'), updateMyProfile);
router.post('/me/galerie', protect, authorize('pro'), uploadGallery.single('photo'), uploadToGalerie);
router.delete('/me/galerie', protect, authorize('pro'), deleteFromGalerie); // Par URL dans le body

router.post('/availabilities', protect, authorize('pro'), addAvailability);
router.get('/my/availabilities', protect, authorize('pro'), getAvailabilities);
router.delete('/availabilities/:day_of_week', protect, authorize('pro'), deleteAvailability);

module.exports = router;
