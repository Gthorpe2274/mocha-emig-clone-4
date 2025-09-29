import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, AlertCircle } from 'lucide-react';

export default function SystemLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate a brief loading delay for security appearance
      await new Promise(resolve => setTimeout(resolve, 500));

      if (password === 'thisisatest123') {
        // Store login status in sessionStorage
        sessionStorage.setItem('systemLoginAuthenticated', 'true');
        
        // Force a small delay to ensure sessionStorage is set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to test reports page
        navigate('/test-reports', { replace: true });
      } else {
        setError('Invalid password. Access denied.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">System Status</h2>
          <p className="text-blue-200">Restricted Access Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter system password"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-red-200 font-medium">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Authenticating...
              </div>
            ) : (
              'Access System Status'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-300 hover:text-blue-200 transition-colors text-sm"
          >
            ← Return to Home
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-blue-400">
          <p>Authorized personnel only</p>
          <p className="mt-1">This area contains system diagnostics and testing tools</p>
        </div>
      </div>
    </div>
  );
}
