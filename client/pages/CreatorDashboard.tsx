import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { storage, Reel } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Instagram, Clock, CheckCircle, LogOut, ExternalLink, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function CreatorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [newReelUrl, setNewReelUrl] = useState('');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  useEffect(() => {
    if (!user || user.type !== 'creator') {
      navigate('/login');
      return;
    }
    loadReels();
  }, [user, navigate]);

  const loadReels = () => {
    if (user) {
      const userReels = storage.getReelsByCreator(user.id);
      setReels(userReels);
    }
  };

  const handleSubmitReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReelUrl.trim() && user) {
      storage.saveReel({
        url: newReelUrl.trim(),
        creatorId: user.id,
        creatorName: user.name
      });
      setNewReelUrl('');
      setIsSubmitDialogOpen(false);
      loadReels();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getReelId = (url: string) => {
    // Extract reel ID from Instagram URL for display
    const match = url.match(/reel\/([A-Za-z0-9_-]+)/);
    return match ? match[1].substring(0, 8) + '...' : 'Unknown';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Pearson's Marketing Program
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Creator Dashboard</h2>
          <p className="text-gray-600">Manage your Instagram reel submissions and view feedback from coaches</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Instagram className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{reels.length}</p>
                  <p className="text-sm text-gray-600">Total Reels</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{reels.filter(r => !r.feedback).length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{reels.filter(r => r.feedback).length}</p>
                  <p className="text-sm text-gray-600">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Reel Button */}
        <div className="mb-8">
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Submit New Reel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Instagram Reel</DialogTitle>
                <DialogDescription>
                  Paste your Instagram reel URL below to submit it for coach review
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitReel} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reel-url">Instagram Reel URL</Label>
                  <Input
                    id="reel-url"
                    type="url"
                    placeholder="https://www.instagram.com/reel/..."
                    value={newReelUrl}
                    onChange={(e) => setNewReelUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Reel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reels List */}
        <div className="space-y-4">
          {reels.length === 0 ? (
            <Card className="border-0 bg-white/50 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Instagram className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reels submitted yet</h3>
                <p className="text-gray-600 mb-4">Submit your first Instagram reel to get started with professional feedback</p>
                <Button 
                  onClick={() => setIsSubmitDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Reel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reels.map((reel) => (
                <Card key={reel.id} className="border-0 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Instagram className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-semibold text-gray-900">Reel {getReelId(reel.url)}</h3>
                          <Badge variant={reel.feedback ? "default" : "secondary"} className="ml-2">
                            {reel.feedback ? "Reviewed" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Submitted {format(new Date(reel.submittedAt), 'MMM d, yyyy at h:mm a')}
                        </p>
                        
                        {reel.feedback && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="h-4 w-4 text-purple-600 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                Feedback from {reel.feedback.coachName}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {format(new Date(reel.feedback.submittedAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reel.feedback.content}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
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
    </div>
  );
}
