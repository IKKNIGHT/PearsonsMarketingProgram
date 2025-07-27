export interface Reel {
  id: string;
  url: string;
  creatorId: string;
  creatorName: string;
  submittedAt: string;
  feedback?: ReelFeedback;
}

export interface ReelFeedback {
  id: string;
  reelId: string;
  coachId: string;
  coachName: string;
  content: string;
  submittedAt: string;
}

// Simple localStorage-based storage for MVP
export const storage = {
  getReels(): Reel[] {
    const saved = localStorage.getItem('reels');
    return saved ? JSON.parse(saved) : [];
  },

  saveReel(reel: Omit<Reel, 'id' | 'submittedAt'>): Reel {
    const reels = this.getReels();
    const newReel: Reel = {
      ...reel,
      id: Date.now().toString(),
      submittedAt: new Date().toISOString()
    };
    reels.push(newReel);
    localStorage.setItem('reels', JSON.stringify(reels));
    return newReel;
  },

  addFeedback(reelId: string, feedback: Omit<ReelFeedback, 'id' | 'reelId' | 'submittedAt'>): void {
    const reels = this.getReels();
    const reelIndex = reels.findIndex(r => r.id === reelId);
    
    if (reelIndex !== -1) {
      const newFeedback: ReelFeedback = {
        ...feedback,
        id: Date.now().toString(),
        reelId,
        submittedAt: new Date().toISOString()
      };
      
      reels[reelIndex].feedback = newFeedback;
      localStorage.setItem('reels', JSON.stringify(reels));
    }
  },

  getReelsByCreator(creatorId: string): Reel[] {
    return this.getReels().filter(reel => reel.creatorId === creatorId);
  },

  getReelsWithoutFeedback(): Reel[] {
    return this.getReels().filter(reel => !reel.feedback);
  }
};
