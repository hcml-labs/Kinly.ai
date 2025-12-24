import client from './client';

export interface ParsedAppointment {
  title?: string;
  description?: string;
  category?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  recurrence_rule?: string;
  child_name?: string;
  confidence_score: number;
}

export interface AIParseResponse {
  parse_id: string;
  source_type: string;
  parsed_appointments: ParsedAppointment[];
  raw_input?: string;
  overall_confidence: number;
  suggestions: string[];
}

export interface WeeklySummary {
  family_id: string;
  week_start: string;
  week_end: string;
  total_appointments: number;
  appointments_by_category: Record<string, number>;
  appointments_by_child: Record<string, number>;
  busiest_day: string;
  busiest_day_count: number;
  conflicts_detected: number;
  suggestions: string[];
}

export const aiApi = {
  parseEmail: async (familyId: string, subject: string, body: string, sender?: string): Promise<AIParseResponse> => {
    const response = await client.post('/ai/parse-email', {
      family_id: familyId,
      email_subject: subject,
      email_body: body,
      sender,
    });
    return response.data;
  },

  parseText: async (familyId: string, text: string): Promise<AIParseResponse> => {
    const response = await client.post('/ai/parse-text', {
      family_id: familyId,
      source_type: 'text',
      raw_input: text,
    });
    return response.data;
  },

  parseImage: async (familyId: string, file: File): Promise<AIParseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(`/ai/parse-image?family_id=${familyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  parseVoice: async (familyId: string, file: File): Promise<AIParseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(`/ai/parse-voice?family_id=${familyId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getWeeklySummary: async (familyId: string): Promise<WeeklySummary> => {
    const response = await client.get(`/ai/weekly-summary/${familyId}`);
    return response.data;
  },
};
