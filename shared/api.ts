// Existing demo response
export interface DemoResponse {
  message: string;
}

// User types
export interface User {
  id: string;
  name: string;
  type: 'creator' | 'coach';
  created_at: string;
}

export interface LoginRequest {
  name: string;
  type: 'creator' | 'coach';
}

export interface LoginResponse {
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
