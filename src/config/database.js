const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuration de la connexion Sequelize à MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // Désactive les logs SQL dans la console
    timezone: '+00:00', // Force le stockage en UTC
    define: {
      underscored: true, // Utilise snake_case pour les colonnes créées par Sequelize
      timestamps: false // Désactivé par défaut car géré manuellement ou via created_at dans le schéma
    }
  }
);

module.exports = sequelize;
