import client from './client';

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await client.post('/auth/register', { name, email, password });
    return response.data;
  },

  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await client.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
};
