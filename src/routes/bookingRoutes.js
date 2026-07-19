const express = require('express');
const router = express.Router();
const { createBooking, getClientBookings, getProBookings, updateBookingStatus, deleteBooking, getAvailableSlots, cancelBooking } = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/available-slots', protect, authorize('client'), getAvailableSlots);
router.post('/', protect, authorize('client'), createBooking);
router.get('/client', protect, authorize('client'), getClientBookings);
router.get('/pro', protect, authorize('pro'), getProBookings);
router.patch('/:id/status', protect, authorize('pro'), updateBookingStatus);
router.put('/:id/cancel', protect, authorize('client'), cancelBooking);
router.delete('/:id', protect, authorize('client'), deleteBooking);

module.exports = router;
