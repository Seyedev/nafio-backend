const { User, ProProfile } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DOMAINES } = require('../constants/domainesServices');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  const { phone, password, name, role, bio, zone, domaine_activite } = req.body;

  try {
    const userExists = await User.findOne({ where: { phone } });
    if (userExists) {
      return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
    }

    if (role === 'pro' && !DOMAINES.includes(domaine_activite)) {
      return res.status(400).json({ message: 'Veuillez choisir un domaine d\'activité valide.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      phone,
      password_hash,
      name,
      role
    });

    if (role === 'pro') {
      await ProProfile.create({
        user_id: user.id,
        bio: bio || '',
        zone: zone || '',
        domaine_activite,
        validated: false
      });
    }

    res.status(201).json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      photo_profil: user.photo_profil,
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
};

exports.login = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ where: { phone } });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      res.json({
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        photo_profil: user.photo_profil,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Identifiants invalides' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password_hash'] },
    include: req.user.role === 'pro' ? [{ model: ProProfile, as: 'proProfile' }] : []
  });
  res.json(user);
};
