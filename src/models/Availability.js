const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Availability = sequelize.define('Availability', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pro_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  day_of_week: {
    type: DataTypes.STRING, // "lundi", "mardi", ...
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  }
}, {
  tableName: 'availabilities',
  timestamps: false
});

module.exports = Availability;
