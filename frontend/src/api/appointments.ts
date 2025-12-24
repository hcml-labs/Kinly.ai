import client from './client';

export type AppointmentCategory = 'school' | 'health' | 'activity' | 'personal';
export type AppointmentStatus = 'active' | 'cancelled' | 'completed';

export interface Appointment {
  appointment_id: string;
  family_id: string;
  child_id?: string;
  title: string;
  description?: string;
  category: AppointmentCategory;
  start_time: string;
  end_time: string;
  location?: string;
  recurrence_rule?: string;
  color?: string;
  created_by: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
  child_name?: string;
}

export interface AppointmentNote {
  note_id: string;
  appointment_id: string;
  note_text: string;
  created_by: string;
  created_at: string;
}

export interface AppointmentDocument {
  document_id: string;
  appointment_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  notes: AppointmentNote[];
  documents: AppointmentDocument[];
}

export interface CreateAppointmentData {
  family_id: string;
  child_id?: string;
  title: string;
  description?: string;
  category: AppointmentCategory;
  start_time: string;
  end_time: string;
  location?: string;
  recurrence_rule?: string;
  color?: string;
}

export interface ConflictCheckResponse {
  has_conflict: boolean;
  conflicts: Appointment[];
  message: string;
}

export const appointmentsApi = {
  getAll: async (
    familyId: string,
    params?: {
      child_id?: string;
      category?: string;
      start_date?: string;
      end_date?: string;
      status?: string;
    }
  ): Promise<Appointment[]> => {
    const response = await client.get('/appointments', {
      params: { family_id: familyId, ...params },
    });
    return response.data;
  },

  getById: async (appointmentId: string): Promise<AppointmentWithDetails> => {
    const response = await client.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  create: async (data: CreateAppointmentData): Promise<Appointment> => {
    const response = await client.post('/appointments', data);
    return response.data;
  },

  update: async (appointmentId: string, data: Partial<CreateAppointmentData>): Promise<Appointment> => {
    const response = await client.put(`/appointments/${appointmentId}`, data);
    return response.data;
  },

  delete: async (appointmentId: string): Promise<void> => {
    await client.delete(`/appointments/${appointmentId}`);
  },

  addNote: async (appointmentId: string, noteText: string): Promise<AppointmentNote> => {
    const response = await client.post(`/appointments/${appointmentId}/notes`, { note_text: noteText });
    return response.data;
  },

  uploadDocument: async (appointmentId: string, file: File): Promise<AppointmentDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(`/appointments/${appointmentId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  checkConflicts: async (
    familyId: string,
    startTime: string,
    endTime: string,
    childId?: string,
    excludeAppointmentId?: string
  ): Promise<ConflictCheckResponse> => {
    const response = await client.post('/appointments/check-conflicts', null, {
      params: { 
        family_id: familyId, 
        start_time: startTime, 
        end_time: endTime, 
        child_id: childId,
        exclude_appointment_id: excludeAppointmentId
      },
    });
    return response.data;
  },
};
