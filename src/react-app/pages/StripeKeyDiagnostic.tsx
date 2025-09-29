import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2, Key } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';
import SystemLogin from '@/react-app/components/SystemLogin';

export default function StripeKeyDiagnostic() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [keyStatus, setKeyStatus] = useState<any>(null);

  useEffect(() => {
    const authenticated = sessionStorage.getItem('systemLoginAuthenticated') === 'true';
    setIsAuthenticated(authenticated);
    if (authenticated) {
      fetchKeyStatus();
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchKeyStatus();
  };

  if (!isAuthenticated) {
    return <SystemLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const fetchKeyStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stripe-key-status');
      const data = await response.json();
      setKeyStatus(data);
    } catch (error) {
      console.error('Error fetching key status:', error);
      setKeyStatus({ success: false, error: 'Failed to fetch status' });
    } finally {
      setLoading(false);
    }
  };

  const emergencyClean = async () => {
    setCleaning(true);
    try {
      const response = await fetch('/api/admin/emergency-stripe-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Emergency cleanup completed! Check the results below.');
        await fetchKeyStatus(); // Refresh status after cleaning
      } else {
        alert(`Cleanup failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Emergency clean error:', error);
      alert('Emergency cleanup failed');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Stripe Key Emergency Diagnostic
            </h1>
            <p className="text-xl text-gray-600">
              Deep dive into Stripe key configuration issues
            </p>
          </div>

          {/* Emergency Actions */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
              <Trash2 className="w-6 h-6 mr-2" />
              Emergency Actions
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-800">Nuclear Option: Clean All Stripe Keys</h3>
                  <p className="text-red-700 text-sm">
                    Removes ALL Stripe keys from KV storage, forces use of environment variables only
                  </p>
                </div>
                <button
                  onClick={emergencyClean}
                  disabled={cleaning}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {cleaning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Emergency Clean
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-800">Refresh Status</h3>
                  <p className="text-red-700 text-sm">
                    Check current key configuration without making changes
                  </p>
                </div>
                <button
                  onClick={fetchKeyStatus}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Current Status */}
          {keyStatus && (
            <div className="space-y-6">
              {keyStatus.success ? (
                <>
                  {/* Analysis Summary */}
                  <div className={`rounded-2xl p-6 border ${
                    keyStatus.status.analysis.issues.length === 0 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center space-x-3 mb-4">
                      {keyStatus.status.analysis.issues.length === 0 ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <h2 className="text-xl font-semibold text-gray-900">
                        Configuration Analysis
                      </h2>
                    </div>
                    
                    {keyStatus.status.analysis.issues.length > 0 ? (
                      <div>
                        <h3 className="font-semibold text-red-800 mb-2">🚨 Critical Issues Found:</h3>
                        <ul className="space-y-1">
                          {keyStatus.status.analysis.issues.map((issue: string, index: number) => (
                            <li key={index} className="text-red-700 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-green-700 font-medium">
                        ✅ All Stripe keys are properly configured!
                      </p>
                    )}
                  </div>

                  {/* Environment Variables */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Key className="w-5 h-5 mr-2" />
                      Environment Variables (Primary Source)
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Secret Key */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Secret Key</h4>
                        {keyStatus.status.environment.secret ? (
                          <div className="space-y-1 text-sm">
                            <p><strong>Value:</strong> {keyStatus.status.environment.secret.value}</p>
                            <p><strong>Prefix:</strong> {keyStatus.status.environment.secret.prefix}</p>
                            <p><strong>Mode:</strong> {
                              keyStatus.status.environment.secret.isTest ? '🧪 Test' :
                              keyStatus.status.environment.secret.isLive ? '💳 Live' : '❌ Invalid'
                            }</p>
                            <p><strong>Length:</strong> {keyStatus.status.environment.secret.length} chars</p>
                          </div>
                        ) : (
                          <p className="text-red-600 font-medium">❌ NOT SET</p>
                        )}
                      </div>

                      {/* Publishable Key */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Publishable Key</h4>
                        {keyStatus.status.environment.publishable ? (
                          <div className="space-y-1 text-sm">
                            <p><strong>Value:</strong> {keyStatus.status.environment.publishable.value}</p>
                            <p><strong>Prefix:</strong> {keyStatus.status.environment.publishable.prefix}</p>
                            <p><strong>Mode:</strong> {
                              keyStatus.status.environment.publishable.isTest ? '🧪 Test' :
                              keyStatus.status.environment.publishable.isLive ? '💳 Live' : '❌ Invalid'
                            }</p>
                            <p><strong>Length:</strong> {keyStatus.status.environment.publishable.length} chars</p>
                          </div>
                        ) : (
                          <p className="text-red-600 font-medium">❌ NOT SET</p>
                        )}
                      </div>
                    </div>

                    {/* Mode Compatibility */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Key Mode Compatibility</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Both are Test:</strong> {keyStatus.status.analysis.bothAreTest ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Both are Live:</strong> {keyStatus.status.analysis.bothAreLive ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Mode Mismatch:</strong> {keyStatus.status.analysis.keyMismatch ? '🚨 YES - THIS BREAKS PAYMENTS' : '✅ No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* KV Storage Status */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">KV Storage (Secondary Source)</h3>
                    
                    {keyStatus.status.kv.foundKeys.length > 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Keys Found in KV Storage:</h4>
                        <ul className="space-y-1">
                          {keyStatus.status.kv.foundKeys.map((key: string, index: number) => (
                            <li key={index} className="text-yellow-700 text-sm font-mono">{key}</li>
                          ))}
                        </ul>
                        <p className="text-yellow-700 text-sm mt-2">
                          These keys might conflict with environment variables. Consider cleaning them.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-700 font-medium">✅ No keys found in KV storage (clean)</p>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                    
                    {keyStatus.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2 mb-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span className="text-gray-700">{rec}</span>
                      </div>
                    ))}

                    {keyStatus.status.analysis.keyMismatch && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">🚨 URGENT: Key Mismatch Fix</h4>
                        <ol className="text-red-700 text-sm space-y-1">
                          <li>1. Use "Emergency Clean" to remove all KV storage keys</li>
                          <li>2. Go to your Stripe dashboard</li>
                          <li>3. Copy BOTH keys from the SAME mode (both test OR both live)</li>
                          <li>4. Update your environment variables with matching keys</li>
                          <li>5. Test payments again</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 font-medium">Error: {keyStatus.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
