import { DesignConfig, SavedTrip, UserProfile, QuizQuestion, LeaderboardEntry } from '../types';

const BASE_URL = '/api';

class ApiService {
  private getHeaders(telegramId?: number, userId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (telegramId) headers['x-telegram-id'] = String(telegramId);
    if (userId) headers['x-user-id'] = userId;
    return headers;
  }

  async authenticateTelegram(initData: string, userPayload?: any) {
    const res = await fetch(`${BASE_URL}/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, userPayload })
    });
    if (!res.ok) throw new Error('Authentication failed');
    return res.json();
  }

  async getUserProfile(telegramId?: number, userId?: string): Promise<{ user: UserProfile; stats: any }> {
    const res = await fetch(`${BASE_URL}/user/profile`, {
      headers: this.getHeaders(telegramId, userId)
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  }

  async updateUserProfile(data: Partial<UserProfile>, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: this.getHeaders(telegramId, userId),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async getDesigns(all = false, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/designs?all=${all}`, {
      headers: this.getHeaders(telegramId, userId)
    });
    return res.json();
  }

  async getDesign(id: string) {
    const res = await fetch(`${BASE_URL}/designs/${id}`);
    return res.json();
  }

  async saveDesign(design: Partial<DesignConfig>, telegramId?: number, userId?: string) {
    const payload = {
      map_type: design.mapType || 'bangladesh',
      title: design.title || 'My Map',
      subtitle: design.subtitle || '',
      user_name: design.userName,
      photo_url: design.userPhoto,
      selected_ids: design.selectedIds,
      theme_name: design.themeId,
      colors: design.customColors,
      font_family: design.fontFamily,
      border_width: design.borderWidth,
      text_position: design.textPosition,
      thumbnail: design.thumbnail
    };

    const res = await fetch(`${BASE_URL}/designs`, {
      method: 'POST',
      headers: this.getHeaders(telegramId, userId),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async deleteDesign(id: string, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/designs/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(telegramId, userId)
    });
    return res.json();
  }

  async exportDesign(id: string, format: 'png' | 'jpg' | 'pdf') {
    const res = await fetch(`${BASE_URL}/designs/${id}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format })
    });
    return res.json();
  }

  async getTrips(telegramId?: number, userId?: string): Promise<{ trips: SavedTrip[] }> {
    const res = await fetch(`${BASE_URL}/trips`, {
      headers: this.getHeaders(telegramId, userId)
    });
    return res.json();
  }

  async saveTrip(trip: Partial<SavedTrip>, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: this.getHeaders(telegramId, userId),
      body: JSON.stringify(trip)
    });
    return res.json();
  }

  async deleteTrip(id: string, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/trips/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(telegramId, userId)
    });
    return res.json();
  }

  async getQuizQuestions(category = 'all'): Promise<{ questions: QuizQuestion[] }> {
    const res = await fetch(`${BASE_URL}/quiz?category=${category}`);
    return res.json();
  }

  async submitQuiz(score: number, totalQuestions: number, category: string, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: this.getHeaders(telegramId, userId),
      body: JSON.stringify({ score, total_questions: totalQuestions, category })
    });
    return res.json();
  }

  async getQuizLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const res = await fetch(`${BASE_URL}/quiz/leaderboard`);
    return res.json();
  }

  async submitPuzzle(score: number, timeSeconds: number, attempts: number, difficulty: string, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/puzzle/submit`, {
      method: 'POST',
      headers: this.getHeaders(telegramId, userId),
      body: JSON.stringify({ score, time_seconds: timeSeconds, attempts, difficulty })
    });
    return res.json();
  }

  async getAdminStats(telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: this.getHeaders(telegramId, userId)
    });
    return res.json();
  }

  async getAdminUsers(telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: this.getHeaders(telegramId, userId)
    });
    return res.json();
  }

  async toggleBlockUser(targetId: string, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/admin/users/${targetId}/toggle-block`, {
      method: 'POST',
      headers: this.getHeaders(telegramId, userId)
    });
    return res.json();
  }

  async createQuizQuestion(question: any, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/admin/questions`, {
      method: 'POST',
      headers: this.getHeaders(telegramId, userId),
      body: JSON.stringify(question)
    });
    return res.json();
  }

  async getAnnouncements() {
    const res = await fetch(`${BASE_URL}/admin/announcements`);
    return res.json();
  }

  async createAnnouncement(title: string, content: string, telegramId?: number, userId?: string) {
    const res = await fetch(`${BASE_URL}/admin/announcements`, {
      method: 'POST',
      headers: this.getHeaders(telegramId, userId),
      body: JSON.stringify({ title, content })
    });
    return res.json();
  }
}

export const api = new ApiService();
