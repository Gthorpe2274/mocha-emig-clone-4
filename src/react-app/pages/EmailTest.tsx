import { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';
import SystemLogin from '@/react-app/components/SystemLogin';

export default function EmailTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);

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

  const sendTestEmail = async () => {
    if (!email) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: `Test email sent successfully to ${email}!`,
          messageId: data.messageId
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send test email'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Service Test</h1>
            <p className="text-lg text-gray-600">
              Test the email delivery system to ensure your customers receive their reports
            </p>
          </div>

          {/* Navigation */}
          <div className="mb-6">
            <Link 
              to="/admin/config" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Panel
            </Link>
          </div>

          {/* Test Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Test Email</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={sendTestEmail}
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Test Email
                  </>
                )}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`mt-6 p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? 'Success!' : 'Error'}
                    </p>
                    <p className={`text-sm ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message}
                    </p>
                    {result.messageId && (
                      <p className="text-xs text-green-600 mt-1">
                        Message ID: {result.messageId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              📧 Email Service Setup
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>
                <strong>Service Provider:</strong> Resend (resend.com)
              </p>
              <p>
                <strong>Configuration:</strong> RESEND_API_KEY environment variable
              </p>
              <p>
                <strong>From Address:</strong> noreply@emigrationpro.com
              </p>
              <p className="text-sm">
                <strong>Note:</strong> Make sure your Resend account is verified and the domain is configured for sending emails.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ✨ Email Features
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Beautiful HTML emails</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Direct download links</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Fallback text version</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Email tracking tags</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Responsive design</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Professional branding</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
