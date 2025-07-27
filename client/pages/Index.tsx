import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Instagram, Star, Users, MessageSquare } from 'lucide-react';

export default function Index() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.type === 'creator' ? '/creator' : '/coach');
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pearson's Marketing Program
                </h1>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link to="/login">
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Instagram Reel Feedback Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect content creators with expert coaches for personalized feedback on Instagram reels. 
            Improve your content strategy with professional insights.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow border-0 bg-white/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Instagram className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Submission</h3>
            <p className="text-gray-600">
              Simply paste your Instagram reel URL and submit for professional review
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow border-0 bg-white/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Expert Coaches</h3>
            <p className="text-gray-600">
              Get feedback from experienced marketing professionals and content strategists
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow border-0 bg-white/50 backdrop-blur-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Detailed Feedback</h3>
            <p className="text-gray-600">
              Receive comprehensive feedback to improve your content performance
            </p>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h3>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="text-left">
              <h4 className="text-2xl font-semibold text-blue-600 mb-4">For Content Creators</h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold">Submit Your Reel</h5>
                    <p className="text-gray-600">Paste your Instagram reel URL into our simple form</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold">Wait for Review</h5>
                    <p className="text-gray-600">Our expert coaches will analyze your content</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold">Get Feedback</h5>
                    <p className="text-gray-600">Receive detailed insights to improve your content</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-left">
              <h4 className="text-2xl font-semibold text-purple-600 mb-4">For Coaches</h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold">Review Submissions</h5>
                    <p className="text-gray-600">Access your dashboard to see pending reel reviews</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold">Analyze Content</h5>
                    <p className="text-gray-600">Watch and evaluate each Instagram reel submission</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold">Provide Feedback</h5>
                    <p className="text-gray-600">Submit comprehensive feedback and recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
