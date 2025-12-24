import client from './client';

export interface Notification {
  notification_id: string;
  appointment_id?: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  notify_at: string;
  sent: boolean;
  read: boolean;
  created_at: string;
}

export const notificationsApi = {
  getAll: async (unreadOnly?: boolean): Promise<Notification[]> => {
    const response = await client.get('/notifications', {
      params: { unread_only: unreadOnly },
    });
    return response.data;
  },

  getUpcoming: async (): Promise<Notification[]> => {
    const response = await client.get('/notifications/upcoming');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await client.put(`/notifications/${notificationId}`, { read: true });
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await client.post('/notifications/mark-all-read');
  },

  delete: async (notificationId: string): Promise<void> => {
    await client.delete(`/notifications/${notificationId}`);
  },
};
