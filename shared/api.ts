// Existing demo response
export interface DemoResponse {
  message: string;
}

// User types
export interface User {
  id: string;
  username: string;
  name: string;
  type: 'creator' | 'coach';
  created_at: string;
}

export interface RegisterRequest {
  username: string;
  name: string;
  password: string;
  type: 'creator' | 'coach';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

// Reel types
export interface Reel {
  id: string;
  url: string;
  creator_id: string;
  creator_name: string;
  submitted_at: string;
}

export interface Feedback {
  id: string;
  reel_id: string;
  coach_id: string;
  coach_name: string;
  content: string;
  submitted_at: string;
}

export interface ReelWithFeedback extends Reel {
  feedback?: Feedback;
}

export interface CreateReelRequest {
  url: string;
  creatorId: string;
  creatorName: string;
}

export interface CreateReelResponse {
  reel: Reel;
}

export interface GetReelsResponse {
  reels: ReelWithFeedback[];
}

// Feedback types
export interface CreateFeedbackRequest {
  reelId: string;
  coachId: string;
  coachName: string;
  content: string;
}

export interface CreateFeedbackResponse {
  feedback: Feedback;
}

export interface GetFeedbackResponse {
  feedback: Feedback | null;
}

// Error response
export interface ErrorResponse {
  error: string;
}
