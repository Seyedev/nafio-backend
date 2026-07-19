const { User, ProProfile, Service, Availability } = require('../models');
const { cloudinary } = require('../config/cloudinary');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

exports.uploadToGalerie = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier uploadé' });
  }

  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profil non trouvé' });

    const galerie = profile.galerie ? [...profile.galerie] : [];

    if (galerie.length >= 3) {
      await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ message: 'Maximum 3 photos dans la galerie' });
    }

    galerie.push(req.file.path);
    await profile.update({ galerie });

    res.json({ url: req.file.path, galerie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout à la galerie' });
  }
};

exports.deleteFromGalerie = async (req, res) => {
  const { url } = req.body;
  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profil non trouvé' });

    let galerie = profile.galerie ? [...profile.galerie] : [];
    if (galerie.includes(url)) {
      galerie = galerie.filter(item => item !== url);
      await profile.update({ galerie });

      const parts = url.split('/');
      const filename = parts[parts.length - 1].split('.')[0];
      const publicId = `nafio/galerie/${filename}`;

      await cloudinary.uploader.destroy(publicId);

      res.json({ message: 'Photo supprimée', galerie });
    } else {
      res.status(404).json({ message: 'Photo non trouvée dans la galerie' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

exports.updateMyProfile = async (req, res) => {
  const { bio, zone, domaine_activite, moyens_paiement, formations, experience, informations_legales } = req.body;
  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profil non trouvé' });

    await profile.update({
      bio,
      zone,
      domaine_activite,
      moyens_paiement: moyens_paiement || profile.moyens_paiement,
      formations: formations || profile.formations,
      experience: experience || profile.experience,
      informations_legales: informations_legales || profile.informations_legales
    });

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.listPros = async (req, res) => {
  try {
    const { domaine_activite, zone, service, prix_min, prix_max } = req.query;

    const profileWhere = { validated: true };
    if (domaine_activite && domaine_activite.trim() !== '') {
      profileWhere.domaine_activite = domaine_activite;
    }
    if (zone && zone.trim() !== '') {
      profileWhere.zone = { [Op.like]: `%${zone}%` };
    }

    const serviceWhere = {};
    let filterByService = false;

    if (service && service.trim() !== '') {
      serviceWhere.name = { [Op.like]: `%${service}%` };
      filterByService = true;
    }

    const hasMin = prix_min !== undefined && prix_min !== '';
    const hasMax = prix_max !== undefined && prix_max !== '';

    if (hasMin || hasMax) {
      filterByService = true;
      if (hasMin && hasMax) {
        serviceWhere.price = { [Op.between]: [parseFloat(prix_min), parseFloat(prix_max)] };
      } else if (hasMin) {
        serviceWhere.price = { [Op.gte]: parseFloat(prix_min) };
      } else if (hasMax) {
        serviceWhere.price = { [Op.lte]: parseFloat(prix_max) };
      }
    }

    const pros = await User.findAll({
      where: { role: 'pro' },
      attributes: ['id', 'name', 'phone', 'photo_profil'],
      distinct: true,
      include: [
        {
          model: ProProfile,
          as: 'proProfile',
          where: profileWhere,
          required: true,
          include: [
            {
              model: Service,
              as: 'services',
              attributes: ['name', 'price', 'duree_minutes', 'description'],
              where: filterByService ? serviceWhere : undefined,
              required: filterByService
            }
          ]
        }
      ]
    });

    res.json(pros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des professionnelles' });
  }
};

exports.getAvailableFilters = async (req, res) => {
  try {
    const domaines = await ProProfile.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('domaine_activite')), 'domaine']],
      where: { domaine_activite: { [Op.ne]: null }, validated: true },
      raw: true
    });

    const zones = await ProProfile.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('zone')), 'zone']],
      where: { zone: { [Op.ne]: null }, validated: true },
      raw: true
    });

    const services = await Service.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('name')), 'service']],
      raw: true
    });

    const prices = await Service.findAll({
      attributes: [
        [sequelize.fn('MIN', sequelize.col('price')), 'minPrice'],
        [sequelize.fn('MAX', sequelize.col('price')), 'maxPrice']
      ],
      raw: true
    });

    res.json({
      domaines: domaines.map(d => d.domaine).filter(Boolean),
      zones: zones.map(z => z.zone).filter(Boolean),
      services: services.map(s => s.service).filter(Boolean),
      minPrice: parseFloat(prices[0]?.minPrice || 0),
      maxPrice: parseFloat(prices[0]?.maxPrice || 100000)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des filtres' });
  }
};

exports.getProDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const pro = await User.findByPk(id, {
      attributes: ['id', 'name', 'phone', 'photo_profil'],
      include: [
        {
          model: ProProfile,
          as: 'proProfile',
          include: [
            { model: Service, as: 'services' },
            { model: Availability, as: 'availabilities' }
          ]
        }
      ]
    });
    if (!pro) return res.status(404).json({ message: 'Professionnelle non trouvée' });

    const result = pro.toJSON();
    result.services = result.proProfile?.services || [];
    result.availabilities = result.proProfile?.availabilities || [];
    result.bio = result.proProfile?.bio || '';
    result.domaine_activite = result.proProfile?.domaine_activite || '';
    result.moyens_paiement = result.proProfile?.moyens_paiement || [];
    result.formations = result.proProfile?.formations || '';
    result.experience = result.proProfile?.experience || '';
    result.informations_legales = result.proProfile?.informations_legales || '';
    result.galerie = result.proProfile?.galerie || [];

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des détails' });
  }
};

exports.getActiveDays = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await ProProfile.findOne({ where: { user_id: id } });
    if (!profile) return res.status(404).json({ message: 'Profil non trouvé' });

    const availabilities = await Availability.findAll({
      where: { pro_id: profile.id },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('day_of_week')), 'day_of_week']],
      raw: true
    });

    const days = availabilities.map(a => a.day_of_week.toLowerCase());
    res.json(days);
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
};

exports.addAvailability = async (req, res) => {
  const { day_of_week, start_time, end_time } = req.body;
  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    const existing = await Availability.findOne({ where: { pro_id: profile.id, day_of_week, start_time } });
    if (existing) {
      await existing.update({ end_time });
      return res.json(existing);
    }
    const availability = await Availability.create({ pro_id: profile.id, day_of_week, start_time, end_time });
    res.status(201).json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur' });
  }
};

exports.deleteAvailability = async (req, res) => {
  const { day_of_week } = req.params;
  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    await Availability.destroy({ where: { pro_id: profile.id, day_of_week } });
    res.json({ message: 'Disponibilité supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
};

exports.getAvailabilities = async (req, res) => {
  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    const availabilities = await Availability.findAll({ where: { pro_id: profile.id } });
    res.json(availabilities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur' });
  }
};
