import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Reel, ReelWithFeedback } from '@shared/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Instagram, MessageSquare, Users, CheckCircle, LogOut, ExternalLink, Send, Settings } from 'lucide-react';
import { format } from 'date-fns';

export default function CoachDashboard() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [pendingReels, setPendingReels] = useState<Reel[]>([]);
  const [reviewedReels, setReviewedReels] = useState<ReelWithFeedback[]>([]);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingReviewed, setLoadingReviewed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user || user.type !== 'coach') {
      navigate('/login');
      return;
    }
    loadReels();
  }, [user, navigate, isLoading]);

  const loadReels = async () => {
    try {
      setLoadingPending(true);
      setLoadingReviewed(true);
      
      const [pending, reviewed] = await Promise.all([
        api.getReelsWithoutFeedback(),
        api.getReelsWithFeedback()
      ]);
      
      setPendingReels(pending);
      setReviewedReels(reviewed);
    } catch (error) {
      console.error('Error loading reels:', error);
    } finally {
      setLoadingPending(false);
      setLoadingReviewed(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReel || !feedback.trim() || !user || isSubmittingFeedback) return;

    try {
      setIsSubmittingFeedback(true);
      await api.createFeedback(selectedReel.id, user.id, user.name, feedback.trim());
      setFeedback('');
      setSelectedReel(null);
      setIsFeedbackDialogOpen(false);
      await loadReels();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openFeedbackDialog = (reel: Reel) => {
    setSelectedReel(reel);
    setFeedback('');
    setIsFeedbackDialogOpen(true);
  };

  const getReelId = (url: string) => {
    const match = url.match(/reel\/([A-Za-z0-9_-]+)/);
    return match ? match[1].substring(0, 8) + '...' : 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Pearson's Marketing Program
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Coach {user.name}</span>
              <Link to="/profile">
                <Button variant="outline" className="border-gray-200">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="border-gray-200">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Coach Dashboard</h2>
          <p className="text-gray-600">Review Instagram reels and provide feedback to content creators</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Instagram className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingReels.length}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{reviewedReels.length}</p>
                  <p className="text-sm text-gray-600">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set([...pendingReels, ...reviewedReels].map(r => r.creator_id)).size}
                  </p>
                  <p className="text-sm text-gray-600">Creators</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Reviews */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Pending Reviews</h3>
          {loadingPending ? (
            <Card className="border-0 bg-white/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading pending reviews...</p>
              </CardContent>
            </Card>
          ) : pendingReels.length === 0 ? (
            <Card className="border-0 bg-white/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h4>
                <p className="text-gray-600">No reels pending review at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingReels.map((reel) => (
                <Card key={reel.id} className="border-0 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Instagram className="h-5 w-5 text-purple-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">Reel {getReelId(reel.url)}</h4>
                          <Badge variant="secondary" className="ml-2">Pending</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Creator:</strong> {reel.creator_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Submitted {format(new Date(reel.submitted_at), 'MMM d, yyyy at h:mm a')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-purple-200 text-purple-600 hover:bg-purple-50"
                        >
                          <a href={reel.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Reel
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openFeedbackDialog(reel)}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Feedback
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Reviews</h3>
          {loadingReviewed ? (
            <Card className="border-0 bg-white/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading recent reviews...</p>
              </CardContent>
            </Card>
          ) : reviewedReels.length === 0 ? (
            <Card className="border-0 bg-white/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h4>
                <p className="text-gray-600">Start reviewing reels to see your feedback history here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reviewedReels.slice(0, 5).map((reel) => (
                <Card key={reel.id} className="border-0 bg-white/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Instagram className="h-5 w-5 text-green-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">Reel {getReelId(reel.url)}</h4>
                          <Badge variant="default" className="ml-2">Reviewed</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Creator:</strong> {reel.creator_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Reviewed {format(new Date(reel.feedback!.submitted_at), 'MMM d, yyyy at h:mm a')}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700 line-clamp-3">{reel.feedback!.content}</p>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <a href={reel.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Reel
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
            <DialogDescription>
              Provide comprehensive feedback for {selectedReel?.creator_name}'s Instagram reel
            </DialogDescription>
          </DialogHeader>
          
          {selectedReel && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Reel:</strong> {getReelId(selectedReel.url)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Creator:</strong> {selectedReel.creator_name}
              </p>
              <Button
                variant="link"
                size="sm"
                asChild
                className="p-0 h-auto text-purple-600"
              >
                <a href={selectedReel.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View reel before providing feedback
                </a>
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide detailed feedback on the reel's content, engagement potential, visual appeal, messaging, and suggestions for improvement..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFeedbackDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmittingFeedback}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
