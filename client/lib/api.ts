import {
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  CreateReelRequest,
  CreateReelResponse,
  GetReelsResponse,
  CreateFeedbackRequest,
  CreateFeedbackResponse,
  ReelWithFeedback,
  Reel,
} from "@shared/api";

const API_BASE = "/api";

class ApiService {
  async register(
    username: string,
    name: string,
    password: string,
    type: "creator" | "coach",
  ): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        name,
        password,
        type,
      } as RegisterRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Registration failed: ${response.statusText}`,
      );
    }

    const data: AuthResponse = await response.json();
    return data.user;
  }

  async login(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password } as LoginRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Login failed: ${response.statusText}`,
      );
    }

    const data: AuthResponse = await response.json();
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

  async updateProfile(
    id: string,
    updates: UpdateProfileRequest,
  ): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/user/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Update profile failed: ${response.statusText}`,
      );
    }

    const data: UpdateProfileResponse = await response.json();
    return data.user;
  }

  async createReel(
    url: string,
    creatorId: string,
    creatorName: string,
  ): Promise<Reel> {
    const response = await fetch(`${API_BASE}/reels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        creatorId,
        creatorName,
      } as CreateReelRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Create reel failed: ${response.statusText}${errorData.details ? ` - ${errorData.details}` : ""}`,
      );
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

  async createFeedback(
    reelId: string,
    coachId: string,
    coachName: string,
    content: string,
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reelId,
        coachId,
        coachName,
        content,
      } as CreateFeedbackRequest),
    });

    if (!response.ok) {
      throw new Error(`Create feedback failed: ${response.statusText}`);
    }
  }
}

export const api = new ApiService();
