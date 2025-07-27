import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserType } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, User, Users } from 'lucide-react';

export default function Login() {
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<UserType>('creator');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isLoading) {
      try {
        setIsLoading(true);
        await login(name.trim(), userType);
        navigate(userType === 'creator' ? '/creator' : '/coach');
      } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-8">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Pearson's Marketing Program
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="max-w-md mx-auto px-4 pt-20">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-4">
                <Label>I am a...</Label>
                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as UserType)}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="creator" id="creator" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <Label htmlFor="creator" className="font-medium cursor-pointer">Content Creator</Label>
                          <p className="text-sm text-gray-600">Submit reels and receive feedback</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="coach" id="coach" />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <Label htmlFor="coach" className="font-medium cursor-pointer">Coach</Label>
                          <p className="text-sm text-gray-600">Review reels and provide feedback</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              >
                Continue to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
