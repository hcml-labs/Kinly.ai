import client from './client';

export interface Child {
  child_id: string;
  family_id: string;
  name: string;
  date_of_birth?: string;
  school?: string;
  grade?: string;
  activities?: string;
  medical_notes?: string;
  avatar_url?: string;
  created_at: string;
}

export interface CreateChildData {
  family_id: string;
  name: string;
  date_of_birth?: string;
  school?: string;
  grade?: string;
  activities?: string;
  medical_notes?: string;
}

export const childrenApi = {
  getAll: async (familyId: string): Promise<Child[]> => {
    const response = await client.get('/children', { params: { family_id: familyId } });
    return response.data;
  },

  getById: async (childId: string): Promise<Child> => {
    const response = await client.get(`/children/${childId}`);
    return response.data;
  },

  create: async (data: CreateChildData): Promise<Child> => {
    const response = await client.post('/children', data);
    return response.data;
  },

  update: async (childId: string, data: Partial<CreateChildData>): Promise<Child> => {
    const response = await client.put(`/children/${childId}`, data);
    return response.data;
  },

  delete: async (childId: string): Promise<void> => {
    await client.delete(`/children/${childId}`);
  },
};
