const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pro_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  periode: {
    type: DataTypes.STRING,
    allowNull: true // 'matin', 'midi', 'soir'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'refused', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bookings'
});

module.exports = Booking;
