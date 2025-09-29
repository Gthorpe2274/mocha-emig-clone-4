import { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  checks?: Record<string, {
    status: 'pass' | 'fail';
    message: string;
    details?: any;
  }>;
  timestamp: string;
  message?: string;
}

export default function WorkerDiagnostics() {
  const [healthStatus, setHealthStatus] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const performHealthCheck = async (detailed = false) => {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = detailed ? '/api/health/detailed' : '/api/health';
      console.log(`Checking health at: ${endpoint}`);
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      console.log('Health check response:', data);
      setHealthStatus(data);
      
      if (!response.ok && response.status !== 503) {
        setError(`Health check returned ${response.status}: ${data.message || 'Unknown error'}`);
      }
    } catch (fetchError) {
      console.error('Health check failed:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      
      if (errorMessage.includes('Failed to fetch')) {
        setError('502 Error: Worker is not responding. This indicates the Cloudflare Worker has crashed or is not deployed properly.');
      } else {
        setError(`Health check failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testSimplePing = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Testing simple ping...');
      const response = await fetch('/ping');
      const data = await response.json();
      
      console.log('Ping response:', data);
      setHealthStatus({
        status: 'healthy',
        message: `Ping successful: ${data.pong ? 'PONG' : 'No response'}`,
        timestamp: data.timestamp || new Date().toISOString()
      });
    } catch (pingError) {
      console.error('Ping failed:', pingError);
      const errorMessage = pingError instanceof Error ? pingError.message : 'Unknown error';
      
      if (errorMessage.includes('Failed to fetch')) {
        setError('502 Error: Worker is completely unresponsive. Check deployment status.');
        setHealthStatus({
          status: 'unhealthy',
          message: 'Worker ping failed - indicates complete worker failure',
          timestamp: new Date().toISOString()
        });
      } else {
        setError(`Ping failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🔧 Worker Diagnostics
            </h2>
            <p className="text-xl text-gray-600">
              Diagnose and troubleshoot 502 errors and worker issues
            </p>
          </div>

          {/* Diagnostic Controls */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Simple Ping</h3>
                <p className="text-sm text-gray-600 mb-4">Test basic worker responsiveness</p>
                <button
                  onClick={testSimplePing}
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Ping Worker'}
                </button>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Basic Health</h3>
                <p className="text-sm text-gray-600 mb-4">Quick health check</p>
                <button
                  onClick={() => performHealthCheck(false)}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Health Check'}
                </button>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Full Diagnosis</h3>
                <p className="text-sm text-gray-600 mb-4">Comprehensive system check</p>
                <button
                  onClick={() => performHealthCheck(true)}
                  disabled={loading}
                  className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Diagnosing...' : 'Full Diagnosis'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-800 font-medium">Diagnostic Error</span>
              </div>
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {/* Health Status Display */}
          {healthStatus && (
            <div className={`rounded-lg p-6 mb-8 border ${
              healthStatus.status === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-4">
                {healthStatus.status === 'healthy' ? (
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                )}
                <h3 className={`text-xl font-bold ${
                  healthStatus.status === 'healthy' ? 'text-green-800' : 'text-red-800'
                }`}>
                  Worker Status: {healthStatus.status.toUpperCase()}
                </h3>
              </div>

              <div className={`text-sm mb-4 ${
                healthStatus.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
              </div>

              {healthStatus.message && (
                <div className={`p-4 rounded border mb-4 ${
                  healthStatus.status === 'healthy' 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-red-100 border-red-300 text-red-800'
                }`}>
                  {healthStatus.message}
                </div>
              )}

              {/* Detailed Checks */}
              {healthStatus.checks && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Detailed Checks:</h4>
                  {Object.entries(healthStatus.checks).map(([checkName, check]) => (
                    <div key={checkName} className={`p-3 rounded border ${
                      check.status === 'pass'
                        ? 'bg-green-100 border-green-300'
                        : 'bg-red-100 border-red-300'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">
                          {checkName.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-sm font-bold ${
                          check.status === 'pass' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {check.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
                        </span>
                      </div>
                      <div className={`text-sm ${
                        check.status === 'pass' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {check.message}
                      </div>
                      {check.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">
                            Show details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 502 Error Troubleshooting Guide */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🚨 502 Error Troubleshooting Guide</h3>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                <div>
                  <strong>Worker Crash:</strong> The most common cause. Check if the ping test above fails completely.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                <div>
                  <strong>Code Errors:</strong> JavaScript errors in the worker code cause crashes. Check browser console for clues.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                <div>
                  <strong>Timeout Issues:</strong> Long-running operations (like AI report generation) can cause timeouts.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                <div>
                  <strong>Environment Issues:</strong> Missing or invalid API keys can cause startup failures.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">5</div>
                <div>
                  <strong>Memory Limits:</strong> Large operations can exceed Cloudflare Worker memory limits.
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white/60 rounded-lg">
              <p className="font-semibold text-gray-800 mb-2">🔧 Quick Fix Steps:</p>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>Run the "Simple Ping" test above to confirm worker responsiveness</li>
                <li>Run "Full Diagnosis" to identify specific component failures</li>
                <li>Check browser developer console for JavaScript errors</li>
                <li>Verify all API keys are properly configured</li>
                <li>If all else fails, try redeploying the worker</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
