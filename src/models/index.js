const User = require('./User');
const ProProfile = require('./ProProfile');
const Service = require('./Service');
const Availability = require('./Availability');
const Booking = require('./Booking');
const Review = require('./Review');
const Notification = require('./Notification');

// Associations

// User <-> Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> ProProfile (One-to-One)
User.hasOne(ProProfile, { foreignKey: 'user_id', as: 'proProfile' });
ProProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ProProfile <-> Service (One-to-Many)
ProProfile.hasMany(Service, { foreignKey: 'pro_id', as: 'services' });
Service.belongsTo(ProProfile, { foreignKey: 'pro_id', as: 'pro' });

// ProProfile <-> Availability (One-to-Many)
ProProfile.hasMany(Availability, { foreignKey: 'pro_id', as: 'availabilities' });
Availability.belongsTo(ProProfile, { foreignKey: 'pro_id', as: 'pro' });

// User (Client) <-> Booking (One-to-Many)
User.hasMany(Booking, { foreignKey: 'client_id', as: 'clientBookings' });
Booking.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

// User (Pro) <-> Booking (One-to-Many)
User.hasMany(Booking, { foreignKey: 'pro_id', as: 'proBookings' });
Booking.belongsTo(User, { foreignKey: 'pro_id', as: 'pro' });

// Service <-> Booking (One-to-Many)
Service.hasMany(Booking, { foreignKey: 'service_id', as: 'bookings' });
Booking.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// Booking <-> Review (One-to-One)
Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

module.exports = {
  User,
  ProProfile,
  Service,
  Availability,
  Booking,
  Review,
  Notification
};
