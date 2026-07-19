const { User } = require('../models');
const { cloudinary } = require('../config/cloudinary');

exports.updateProfilePhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier uploadé' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    console.log('--- DIAGNOSTIC ÉTAPE 1 ---');
    console.log('URL reçue de Cloudinary:', req.file.path);
    console.log('ID Utilisateur connecté:', req.user.id);

    await user.update({ photo_profil: req.file.path });

    // On recharge l'objet pour être sûr de ce qu'il y a en base
    await user.reload();
    console.log('URL après sauvegarde en base:', user.photo_profil);

    res.json({ url: req.file.path });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la photo' });
  }
};
