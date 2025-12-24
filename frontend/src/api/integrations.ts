import client from './client';

export interface Integration {
  integration_id: string;
  integration_type: string;
  is_active: boolean;
  sync_enabled: boolean;
  last_synced_at?: string;
  created_at: string;
}

export const integrationsApi = {
  getAll: async (): Promise<Integration[]> => {
    const response = await client.get('/integrations');
    return response.data;
  },

  getGoogleCalendarAuthUrl: async (): Promise<{ auth_url: string }> => {
    const response = await client.get('/integrations/google-calendar/auth');
    return response.data;
  },

  syncGoogleCalendar: async (familyId: string): Promise<{ imported: number; exported: number }> => {
    const response = await client.post('/integrations/google-calendar/sync', null, {
      params: { family_id: familyId },
    });
    return response.data;
  },

  disconnectGoogleCalendar: async (): Promise<void> => {
    await client.delete('/integrations/google-calendar');
  },
};
