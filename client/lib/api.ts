import { 
  User, 
  LoginRequest, 
  LoginResponse, 
  CreateReelRequest, 
  CreateReelResponse, 
  GetReelsResponse,
  CreateFeedbackRequest, 
  CreateFeedbackResponse,
  ReelWithFeedback,
  Reel
} from '@shared/api';

const API_BASE = '/api';

class ApiService {
  async login(name: string, type: 'creator' | 'coach'): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, type } as LoginRequest),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data: LoginResponse = await response.json();
    return data.user;
  }

  async getUserById(id: string): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/user/${id}`);

    if (!response.ok) {
      throw new Error(`Get user failed: ${response.statusText}`);
    }

    const data: { user: User } = await response.json();
    return data.user;
  }

  async createReel(url: string, creatorId: string, creatorName: string): Promise<Reel> {
    const response = await fetch(`${API_BASE}/reels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, creatorId, creatorName } as CreateReelRequest),
    });

    if (!response.ok) {
      throw new Error(`Create reel failed: ${response.statusText}`);
    }

    const data: CreateReelResponse = await response.json();
    return data.reel;
  }

  async getReelsByCreator(creatorId: string): Promise<ReelWithFeedback[]> {
    const response = await fetch(`${API_BASE}/reels/creator/${creatorId}`);

    if (!response.ok) {
      throw new Error(`Get reels failed: ${response.statusText}`);
    }

    const data: GetReelsResponse = await response.json();
    return data.reels;
  }

  async getReelsWithoutFeedback(): Promise<Reel[]> {
    const response = await fetch(`${API_BASE}/reels/pending`);

    if (!response.ok) {
      throw new Error(`Get pending reels failed: ${response.statusText}`);
    }

    const data: { reels: Reel[] } = await response.json();
    return data.reels;
  }

  async getReelsWithFeedback(): Promise<ReelWithFeedback[]> {
    const response = await fetch(`${API_BASE}/reels/reviewed`);

    if (!response.ok) {
      throw new Error(`Get reviewed reels failed: ${response.statusText}`);
    }

    const data: GetReelsResponse = await response.json();
    return data.reels;
  }

  async createFeedback(reelId: string, coachId: string, coachName: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reelId, coachId, coachName, content } as CreateFeedbackRequest),
    });

    if (!response.ok) {
      throw new Error(`Create feedback failed: ${response.statusText}`);
    }
  }
}

export const api = new ApiService();
