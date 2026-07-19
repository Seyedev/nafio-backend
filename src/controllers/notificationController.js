const { Notification } = require('../models');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await Notification.findByPk(id);
    if (!notification || notification.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    notification.is_read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur' });
  }
};

exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await Notification.findByPk(id);
    if (!notification || notification.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    await notification.destroy();
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur' });
  }
};
