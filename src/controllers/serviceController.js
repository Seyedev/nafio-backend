const { Service, Booking, ProProfile } = require('../models');
const { Op } = require('sequelize');
const { DOMAINES_SERVICES } = require('../constants/domainesServices');

exports.createService = async (req, res) => {
  const {
    name, price, duree_minutes, description, sous_categorie,
    type_reservation, capacite_max, capacites_periodes
  } = req.body;

  if (description && description.length > 5000) {
    return res.status(400).json({ message: 'La description ne doit pas dépasser 5000 caractères' });
  }

  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profil pro non trouvé' });

    // Validation de la sous-catégorie par rapport au domaine du pro
    const domaine = profile.domaine_activite;
    const allowedSubCats = DOMAINES_SERVICES[domaine] || [];
    if (!allowedSubCats.includes(sous_categorie)) {
      return res.status(400).json({ message: `La catégorie "${sous_categorie}" ne correspond pas à votre domaine d'activité (${domaine}).` });
    }

    const service = await Service.create({
      pro_id: profile.id,
      name,
      sous_categorie,
      price,
      duree_minutes: duree_minutes || 30,
      description,
      type_reservation: type_reservation || 'exclusif',
      capacite_max,
      capacites_periodes
    });
    res.status(201).json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du service' });
  }
};

exports.updateService = async (req, res) => {
  const { id } = req.params;
  const {
    name, price, duree_minutes, description, sous_categorie,
    type_reservation, capacite_max, capacites_periodes
  } = req.body;

  if (description && description.length > 5000) {
    return res.status(400).json({ message: 'La description ne doit pas dépasser 5000 caractères' });
  }

  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    const service = await Service.findByPk(id);

    if (!service) return res.status(404).json({ message: 'Service non trouvé' });
    if (service.pro_id !== profile.id) return res.status(403).json({ message: 'Non autorisé' });

    // Validation de la sous-catégorie si fournie
    if (sous_categorie) {
      const domaine = profile.domaine_activite;
      const allowedSubCats = DOMAINES_SERVICES[domaine] || [];
      if (!allowedSubCats.includes(sous_categorie)) {
        return res.status(400).json({ message: `La catégorie "${sous_categorie}" ne correspond pas à votre domaine d'activité (${domaine}).` });
      }
    }

    await service.update({
      name,
      price,
      duree_minutes: duree_minutes || service.duree_minutes,
      description,
      sous_categorie: sous_categorie || service.sous_categorie,
      type_reservation: type_reservation || service.type_reservation,
      capacite_max: capacite_max !== undefined ? capacite_max : service.capacite_max,
      capacites_periodes: capacites_periodes || service.capacites_periodes
    });

    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

exports.deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    const service = await Service.findByPk(id);

    if (!service) return res.status(404).json({ message: 'Service non trouvé' });
    if (service.pro_id !== profile.id) return res.status(403).json({ message: 'Non autorisé' });

    const futureBookings = await Booking.count({
      where: {
        service_id: id,
        status: { [Op.in]: ['pending', 'accepted'] },
        date: { [Op.gte]: new Date().toISOString().split('T')[0] }
      }
    });

    if (futureBookings > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer, des réservations sont en cours sur ce service' });
    }

    await service.destroy();
    res.json({ message: 'Service supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

exports.getProServices = async (req, res) => {
  const { pro_id } = req.query;
  try {
    const services = await Service.findAll({ where: { pro_id } });
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
};

exports.getMyServices = async (req, res) => {
  try {
    const profile = await ProProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profil non trouvé' });
    const services = await Service.findAll({ where: { pro_id: profile.id } });
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
};
