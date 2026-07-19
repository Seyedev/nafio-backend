const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { DOMAINES } = require('../constants/domainesServices');

const ProProfile = sequelize.define('ProProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT
  },
  zone: {
    type: DataTypes.STRING
  },
  domaine_activite: {
    type: DataTypes.ENUM(...DOMAINES),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8)
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8)
  },
  validated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  moyens_paiement: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  formations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  experience: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  informations_legales: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  photo_profil: {
    type: DataTypes.STRING,
    allowNull: true
  },
  galerie: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'photos'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pro_profiles',
  timestamps: false
});

module.exports = ProProfile;
