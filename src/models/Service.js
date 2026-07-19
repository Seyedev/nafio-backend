const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pro_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sous_categorie: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  duree_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    validate: {
      isMultipleOf15(value) {
        if (value % 15 !== 0) {
          throw new Error('La durée doit être un multiple de 15 minutes.');
        }
      }
    }
  },
  type_reservation: {
    type: DataTypes.ENUM('exclusif', 'capacite_horaire', 'capacite_periode'),
    allowNull: false,
    defaultValue: 'exclusif'
  },
  capacite_max: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  capacites_periodes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'services',
  timestamps: false
});

module.exports = Service;
