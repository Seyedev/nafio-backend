const sequelize = require('./config/database');
require('./models');

async function sync() {
  try {
    await sequelize.authenticate();
    console.log('Connexion établie.');
    // Alter: true permet de créer la table si elle manque sans tout écraser
    await sequelize.sync({ alter: true });
    console.log('Base de données synchronisée (les tables manquantes ont été créées).');
    process.exit(0);
  } catch (error) {
    console.error('Erreur de synchronisation :', error);
    process.exit(1);
  }
}

sync();
