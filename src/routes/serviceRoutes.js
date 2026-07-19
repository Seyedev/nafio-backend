const express = require('express');
const router = express.Router();
const { createService, updateService, deleteService, getProServices, getMyServices } = require('../controllers/serviceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', getProServices);
router.get('/me', protect, authorize('pro'), getMyServices);
router.post('/', protect, authorize('pro'), createService);
router.put('/:id', protect, authorize('pro'), updateService);
router.delete('/:id', protect, authorize('pro'), deleteService);

module.exports = router;
