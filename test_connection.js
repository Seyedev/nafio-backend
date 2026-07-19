const sequelize = require('./src/config/database');
const { User } = require('./src/models');

async function testConnection() {
  try {
    // Vérifier la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à MySQL réussie via Sequelize.');

    // Compter les utilisateurs
    const count = await User.count();
    console.log(`📊 Nombre d'utilisateurs dans la base : ${count}`);

  } catch (error) {
    console.error('❌ Erreur de connexion ou de requête :', error);
  } finally {
    await sequelize.close();
  }
}

testConnection();
