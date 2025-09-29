import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, CheckCircle, AlertCircle, Eye, EyeOff, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';
import SystemLogin from '@/react-app/components/SystemLogin';

export default function AdminConfig() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    // Check if user is authenticated
    const authenticated = sessionStorage.getItem('systemLoginAuthenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // If not authenticated, show login component
  if (!isAuthenticated) {
    return <SystemLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const validateStripeKey = (key: string) => {
    // Check if it's a valid Stripe secret key format
    if (key.startsWith('rk_')) {
      setStatus({
        type: 'error',
        message: 'You entered a Restricted API Key. Please use a Secret Key instead (starts with sk_test_ or sk_live_).'
      });
      return false;
    }
    if (key.startsWith('pk_')) {
      setStatus({
        type: 'error',
        message: 'You entered a Publishable Key. Please use a Secret Key instead (starts with sk_test_ or sk_live_).'
      });
      return false;
    }
    return key.startsWith('sk_test_') || key.startsWith('sk_live_');
  };

  const testStripeKey = async () => {
    if (!secretKey) {
      setTestResult({
        success: false,
        error: "Please enter a Stripe key first"
      });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      // First test the key format locally
      if (!validateStripeKey(secretKey)) {
        setTestResult({
          success: false,
          error: "Invalid key format. Must start with sk_test_ or sk_live_"
        });
        setTestLoading(false);
        return;
      }

      // Call the test endpoint
      const response = await fetch('/api/test/stripe-key', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      setTestResult(result);

    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to test key. The test endpoint may not be available yet.",
        suggestion: "Try updating the key directly - it will be validated during the update process."
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStripeKey(secretKey)) {
      // Error message is set in validateStripeKey function
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/admin/update-stripe-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey })
      });

      const result = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Stripe secret key updated successfully! Payment processing should now work.'
        });
        setSecretKey('');
        
        // Redirect back to home after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to update Stripe secret key'
        });
      }
    } catch (error) {
      console.error('Error updating Stripe key:', error);
      setStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Run Time Configuration
            </h2>
            <p className="text-xl text-gray-600">
              Configure API keys and payment settings for the system
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">How to get your Stripe Secret Key:</h3>
            <ol className="space-y-2 text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-lg rounded-full flex items-center justify-center font-medium">1</span>
                <span>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">your Stripe Dashboard API Keys page</a></span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-lg rounded-full flex items-center justify-center font-medium">2</span>
                <span>Find the <strong>"Secret key"</strong> section - NOT "Publishable key" or "Restricted key"</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-lg rounded-full flex items-center justify-center font-medium">3</span>
                <span>Click "Reveal test key" or "Reveal live key"</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-lg rounded-full flex items-center justify-center font-medium">4</span>
                <span>Copy the key that starts with <code className="bg-blue-100 px-2 py-1 rounded">sk_test_</code> or <code className="bg-blue-100 px-2 py-1 rounded">sk_live_</code></span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-lg rounded-full flex items-center justify-center font-medium">5</span>
                <span>Paste it in the form below</span>
              </li>
            </ol>
          </div>

          {/* Test vs Live Mode Warning */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">🧪 Test Mode vs Live Mode</h3>
            <div className="space-y-3 text-blue-800">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 font-bold">🧪</span>
                <div>
                  <strong>Test Mode (Recommended for Setup):</strong> Use <code className="bg-blue-100 px-2 py-1 rounded">sk_test_...</code> keys
                  <br />
                  <span className="text-lg">Use test card 4242 4242 4242 4242 - no real charges are made.</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-600 font-bold">💳</span>
                <div>
                  <strong>Live Mode (Production):</strong> Use <code className="bg-blue-100 px-2 py-1 rounded">sk_live_...</code> keys
                  <br />
                  <span className="text-lg">Real payments are processed - only use when ready for customers.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Type Warning */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Important: Key Type Requirements</h3>
            <div className="space-y-3 text-red-800">
              <div className="flex items-start space-x-3">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <strong>Secret Key (Required):</strong> Starts with <code className="bg-red-100 px-2 py-1 rounded">sk_test_</code> or <code className="bg-red-100 px-2 py-1 rounded">sk_live_</code>
                  <br />
                  <span className="text-lg">This is what you need for payment processing.</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-600 font-bold">✗</span>
                <div>
                  <strong>Restricted Key (Won't Work):</strong> Starts with <code className="bg-red-100 px-2 py-1 rounded">rk_</code>
                  <br />
                  <span className="text-lg">These have limited permissions and cannot create payments.</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-600 font-bold">✗</span>
                <div>
                  <strong>Publishable Key (Won't Work):</strong> Starts with <code className="bg-red-100 px-2 py-1 rounded">pk_</code>
                  <br />
                  <span className="text-lg">These are for frontend use only, not backend payments.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Update Form */}
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Stripe Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="sk_test_... or sk_live_..."
                    required
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-lg text-gray-500 mt-2">
                  Your key will be securely stored and encrypted. It should start with sk_test_ or sk_live_
                </p>
              </div>

              {/* Test Key Button */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={testStripeKey}
                  disabled={testLoading || !secretKey}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Testing Key...
                    </div>
                  ) : (
                    'Test Stripe Key'
                  )}
                </button>
                <span className="text-sm text-gray-500 self-center">
                  Test your key before saving
                </span>
              </div>

              {/* Test Results */}
              {testResult && (
                <div className={`rounded-lg p-4 ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'Stripe Key Valid!' : 'Stripe Key Test Failed'}
                    </span>
                  </div>
                  
                  {testResult.success && (
                    <div className="text-sm space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong>Mode:</strong> {testResult.keyDetails?.mode === 'test' ? '🧪 Test Mode' : '💳 Live Mode'}
                        </div>
                        <div>
                          <strong>Account ID:</strong> {testResult.stripeAccount?.id}
                        </div>
                        <div>
                          <strong>Country:</strong> {testResult.stripeAccount?.country}
                        </div>
                        <div>
                          <strong>Charges Enabled:</strong> {testResult.stripeAccount?.charges_enabled ? '✅' : '❌'}
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-green-100 rounded text-green-800">
                        ✅ All API tests passed: Balance, Customers, Account
                      </div>
                    </div>
                  )}

                  {!testResult.success && (
                    <div className="text-sm space-y-2">
                      <div className="text-red-700">
                        <strong>Error:</strong> {testResult.error}
                      </div>
                      {testResult.suggestion && (
                        <div className="text-red-600">
                          <strong>Suggestion:</strong> {testResult.suggestion}
                        </div>
                      )}
                      {testResult.troubleshooting && (
                        <div className="mt-3">
                          <strong>Possible Causes:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {testResult.troubleshooting.possibleCauses?.map((cause: string, index: number) => (
                              <li key={index} className="text-red-600">{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {status.type && (
                <div className={`rounded-lg p-4 ${
                  status.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {status.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`font-medium ${
                      status.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {status.message}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !secretKey}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Secret Key'
                )}
              </button>
            </form>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-lg text-yellow-800">
                <p className="font-medium mb-1">Security Notice:</p>
                <p>
                  Your Stripe secret key will be stored securely in your app's environment. 
                  Never share this key publicly or commit it to version control. 
                  Use test keys (sk_test_) for development and live keys (sk_live_) only for production.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Tools */}
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h3>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/test-reports"
                className="inline-flex items-center bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                Test Report Generation
              </Link>
              <Link 
                to="/stripe-diagnostic"
                className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Stripe Key Emergency Diagnostic
              </Link>
            </div>
          </div>

          {/* Current Key Status */}
          <div className="text-center mt-8">
            <p className="text-lg text-gray-500">
              Need help? Visit the <a href="https://stripe.com/docs/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Stripe documentation</a> for more information about API keys.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
