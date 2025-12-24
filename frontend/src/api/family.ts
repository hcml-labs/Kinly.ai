import client from './client';

export interface Family {
  family_id: string;
  name: string;
  created_by: string;
  created_at: string;
  members: FamilyMember[];
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_name?: string;
  user_email?: string;
}

export const familyApi = {
  create: async (name: string) => {
    const response = await client.post('/family', { name });
    return response.data;
  },

  getAll: async (): Promise<Family[]> => {
    const response = await client.get('/family');
    return response.data;
  },

  getById: async (familyId: string): Promise<Family> => {
    const response = await client.get(`/family/${familyId}`);
    return response.data;
  },

  inviteMember: async (familyId: string, email: string, role: string) => {
    const response = await client.post(`/family/${familyId}/invite`, { email, role });
    return response.data;
  },

  removeMember: async (familyId: string, memberId: string) => {
    const response = await client.delete(`/family/${familyId}/members/${memberId}`);
    return response.data;
  },
};
