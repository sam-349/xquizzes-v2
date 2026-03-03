const Notification = require('../models/Notification');

// GET /api/notifications - Get notifications for the current user
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    const query = { user: req.userId };
    if (unreadOnly === 'true') query.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit)),
      Notification.countDocuments({ user: req.userId, read: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// PUT /api/notifications/:id/read - Mark a single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to update notification.' });
  }
};

// PUT /api/notifications/read-all - Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.userId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Failed to update notifications.' });
  }
};
