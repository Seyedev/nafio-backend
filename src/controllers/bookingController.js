const { Booking, Notification, User, Service, Availability, ProProfile } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const dayMapping = {
  0: 'dimanche',
  1: 'lundi',
  2: 'mardi',
  3: 'mercredi',
  4: 'jeudi',
  5: 'vendredi',
  6: 'samedi'
};

exports.getAvailableSlots = async (req, res) => {
  const { pro_id, date, service_id } = req.query;
  if (!pro_id || !date || !service_id) {
    return res.status(400).json({ message: 'Paramètres manquants' });
  }

  try {
    const service = await Service.findByPk(service_id);
    if (!service) return res.status(404).json({ message: 'Service non trouvé' });

    const proUser = await User.findByPk(pro_id, {
      include: [{ model: ProProfile, as: 'proProfile' }]
    });
    if (!proUser || !proUser.proProfile) return res.status(404).json({ message: 'Professionnelle non trouvée' });

    // 1. Récupérer TOUTES les plages de disponibilité pour ce jour
    const dayOfWeekName = dayMapping[new Date(`${date}T00:00:00Z`).getUTCDay()];
    const availabilities = await Availability.findAll({
      where: {
        pro_id: proUser.proProfile.id,
        day_of_week: dayOfWeekName
      }
    });

    if (availabilities.length === 0) {
      return res.json({ date, ferme: true, type: service.type_reservation === 'capacite_periode' ? 'periode' : 'horaire', periods: {}, slots: [] });
    }

    // MODE : CAPACITE PERIODE
    if (service.type_reservation === 'capacite_periode') {
      const periods = service.capacites_periodes || {};
      const results = {};

      for (const [key, config] of Object.entries(periods)) {
        if (!config.capacite || config.capacite <= 0) continue;

        const count = await Booking.count({
          where: {
            service_id,
            date,
            periode: key,
            status: { [Op.in]: ['pending', 'accepted'] }
          }
        });

        if (count < config.capacite) {
          results[key] = {
            restant: config.capacite - count,
            debut: config.debut,
            fin: config.fin
          };
        }
      }
      return res.json({ date, ferme: false, type: 'periode', periods: results });
    }

    // MODES : EXCLUSIF ET CAPACITE HORAIRE
    const existingBookings = await Booking.findAll({
      where: {
        pro_id,
        date,
        status: { [Op.in]: ['pending', 'accepted'] }
      }
    });

    const slots = [];
    const step = 15; // 15 minutes granularity

    availabilities.forEach(avail => {
      const [startH, startM] = avail.start_time.split(':').map(Number);
      const [endH, endM] = avail.end_time.split(':').map(Number);

      let current = new Date(`${date}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00Z`);
      const limit = new Date(`${date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00Z`);

      while (current < limit) {
        const slotStart = new Date(current);
        const slotEnd = new Date(slotStart.getTime() + service.duree_minutes * 60000);

        // Exclure si le service dépasse la fin de la plage de travail
        if (slotEnd > limit) {
          current.setMinutes(current.getMinutes() + step);
          continue;
        }

        let isAvailable = false;
        let placesRestantes = 1;

        if (service.type_reservation === 'exclusif') {
          // LOGIQUE EXCLUSIF : Aucun chevauchement sur TOUTE la durée
          const isOverlap = existingBookings.some(b => {
            if (!b.start_time || !b.end_time) return false;
            const bStart = new Date(b.start_time);
            const bEnd = new Date(b.end_time);
            // Formule de chevauchement : (Debut1 < Fin2) ET (Fin1 > Debut2)
            return (slotStart < bEnd && slotEnd > bStart);
          });
          isAvailable = !isOverlap;
        } else if (service.type_reservation === 'capacite_horaire') {
          // LOGIQUE CAPACITE HORAIRE : Uniquement sur le créneau de départ précis
          const count = existingBookings.filter(b => {
            if (!b.start_time) return false;
            const bStart = new Date(b.start_time);
            return bStart.getTime() === slotStart.getTime();
          }).length;

          const max = service.capacite_max || 1;
          isAvailable = count < max;
          placesRestantes = max - count;
        }

        if (isAvailable) {
          slots.push({
            time: DateFormat(slotStart),
            placesRestantes
          });
        }

        current.setMinutes(current.getMinutes() + step);
      }
    });

    res.json({ date, ferme: false, type: 'horaire', slots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des créneaux' });
  }
};

function DateFormat(date) {
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

exports.createBooking = async (req, res) => {
  const { pro_id, service_id, date, start_time_str, periode } = req.body;
  if (!pro_id || !service_id || !date) {
    return res.status(400).json({ message: 'Paramètres manquants' });
  }

  const t = await sequelize.transaction();
  try {
    const service = await Service.findByPk(service_id);
    if (!service) throw new Error('Service non trouvé');

    const proUser = await User.findByPk(pro_id, {
      include: [{ model: ProProfile, as: 'proProfile' }]
    });

    // Vérifier disponibilité du jour
    const dayOfWeekName = dayMapping[new Date(`${date}T00:00:00Z`).getUTCDay()];
    const isAvailableDay = await Availability.findOne({
      where: { pro_id: proUser.proProfile.id, day_of_week: dayOfWeekName }
    });

    if (!isAvailableDay) {
      throw new Error("Le professionnel n'est pas disponible ce jour-là.");
    }

    let bookingData = {
      client_id: req.user.id,
      pro_id,
      service_id,
      date,
      status: 'pending'
    };

    if (service.type_reservation === 'capacite_periode') {
      if (!periode) throw new Error('Période manquante');

      const config = (service.capacites_periodes || {})[periode];
      if (!config || !config.capacite) throw new Error('Période invalide ou désactivée');

      const count = await Booking.count({
        where: {
          service_id,
          date,
          periode,
          status: { [Op.in]: ['pending', 'accepted'] }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (count >= config.capacite) {
        throw new Error('Cette période est complète pour cette date');
      }

      bookingData.periode = periode;
      if (config.debut) bookingData.start_time = new Date(`${date}T${config.debut}:00Z`);
      if (config.fin) bookingData.end_time = new Date(`${date}T${config.fin}:00Z`);

    } else {
      if (!start_time_str) throw new Error('Heure de début manquante');

      const start_time = new Date(`${date}T${start_time_str}:00Z`);
      const end_time = new Date(start_time.getTime() + service.duree_minutes * 60000);

      if (service.type_reservation === 'exclusif') {
        const overlap = await Booking.findOne({
          where: {
            pro_id,
            date,
            status: { [Op.in]: ['pending', 'accepted'] },
            [Op.or]: [
              {
                start_time: { [Op.lt]: end_time },
                end_time: { [Op.gt]: start_time }
              }
            ]
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (overlap) throw new Error("Ce créneau n'est plus disponible.");
      } else {
        // capacite_horaire
        const count = await Booking.count({
          where: {
            pro_id,
            date,
            start_time,
            status: { [Op.in]: ['pending', 'accepted'] }
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        if (count >= (service.capacite_max || 1)) throw new Error("Ce créneau est complet.");
      }

      bookingData.start_time = start_time;
      bookingData.end_time = end_time;
    }

    const booking = await Booking.create(bookingData, { transaction: t });

    await Notification.create({
      user_id: pro_id,
      message: `Nouvelle demande de ${req.user.name}`,
      related_booking_id: booking.id
    }, { transaction: t });

    await t.commit();
    res.status(201).json(booking);
  } catch (error) {
    if (t) await t.rollback();
    res.status(409).json({ message: error.message || 'Erreur lors de la réservation' });
  }
};

exports.getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { client_id: req.user.id },
      include: [
        {
          model: User,
          as: 'pro',
          attributes: ['name', 'phone', 'photo_profil'],
          include: [{ model: ProProfile, as: 'proProfile', attributes: ['zone'] }]
        },
        { model: Service, as: 'service', attributes: ['name', 'type_reservation'] }
      ],
      order: [['date', 'DESC'], ['start_time', 'ASC']]
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur récup' });
  }
};

exports.getProBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { pro_id: req.user.id },
      include: [
        { model: User, as: 'client', attributes: ['name', 'phone', 'photo_profil'] },
        { model: Service, as: 'service', attributes: ['name', 'type_reservation'] }
      ],
      order: [['date', 'DESC'], ['start_time', 'ASC']]
    });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur récup' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking || booking.pro_id !== req.user.id) return res.status(403).send();

    booking.status = req.body.status;
    await booking.save();

    await Notification.create({
      user_id: booking.client_id,
      message: `Réservation ${req.body.status === 'accepted' ? 'acceptée' : 'refusée'}`,
      related_booking_id: booking.id
    });

    res.json(booking);
  } catch (error) {
    res.status(500).send();
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (booking && booking.client_id === req.user.id && booking.status === 'pending') {
      await booking.destroy();
      return res.json({ success: true });
    }
    res.status(400).send();
  } catch (error) {
    res.status(500).send();
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Service, as: 'service' }]
    });

    if (!booking) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    if (booking.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cette réservation ne peut plus être annulée' });
    }

    const now = new Date();
    // Utiliser la date du jour si start_time est absent (rare mais sécu)
    const bookingDate = booking.start_time ? new Date(booking.start_time) : new Date(booking.date);
    if (bookingDate < now) {
      return res.status(400).json({ message: 'Impossible d\'annuler un rendez-vous déjà passé' });
    }

    booking.status = 'cancelled';
    await booking.save();

    await Notification.create({
      user_id: booking.pro_id,
      message: `Réservation annulée par le client : ${booking.service?.name || 'Service'} le ${booking.date}`,
      related_booking_id: booking.id
    });

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'annulation' });
  }
};
