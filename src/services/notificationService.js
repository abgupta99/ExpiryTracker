import * as Notifications from 'expo-notifications';
import { getExpiringItems } from '../database/queries';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export const scheduleReminders = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    getExpiringItems(7, items => {
      items.forEach(item => {
        const trigger = new Date(Date.parse(item.expiryDate) - (item.reminderDays || 3) * 86400000);
        Notifications.scheduleNotificationAsync({
          content: { title: `${item.name} expiring soon!`, body: `Expires on ${item.expiryDate}` },
          trigger: { date: trigger },
        }).catch(e => console.error('scheduleNotification error', e));
      });
    });
  } catch (e) {
    console.error('scheduleReminders error', e);
  }
};

export default { scheduleReminders };
