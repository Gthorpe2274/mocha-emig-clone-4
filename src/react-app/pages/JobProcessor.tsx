import { useState } from 'react';
import { Play, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';
import SystemLogin from '@/react-app/components/SystemLogin';

export default function JobProcessor() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('systemLoginAuthenticated') === 'true';
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <SystemLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const processPendingJobs = async () => {
    setProcessing(true);
    setResult(null);
    setError('');
    
    try {
      console.log('Triggering manual job processing...');
      const response = await fetch('/api/jobs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('Job processing result:', data);
    } catch (error) {
      console.error('Error processing jobs:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  };

  const checkPendingJobs = async () => {
    try {
      const response = await fetch('/api/debug/pending-jobs');
      const data = await response.json();
      console.log('Pending jobs check:', data);
      setResult({ ...result, pendingJobs: data });
    } catch (error) {
      console.error('Error checking pending jobs:', error);
    }
  };

  const restoreKVJobs = async () => {
    setProcessing(true);
    setResult(null);
    setError('');
    
    try {
      console.log('Restoring missing KV jobs...');
      const response = await fetch('/api/admin/restore-kv-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('KV job restoration result:', data);
    } catch (error) {
      console.error('Error restoring KV jobs:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessing(false);
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
              Job Queue Processor
            </h2>
            <p className="text-xl text-gray-600">
              Manually trigger report generation job processing
            </p>
          </div>

          {/* Controls */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Process Jobs */}
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Process Pending Jobs</h3>
                <p className="text-gray-600">
                  Manually trigger processing of all pending report generation jobs
                </p>
              </div>

              <button
                onClick={processPendingJobs}
                disabled={processing}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing Jobs...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Play className="w-5 h-5 mr-2" />
                    Process All Pending Jobs
                  </div>
                )}
              </button>
            </div>

            {/* Restore KV Jobs */}
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Restore Missing Jobs</h3>
                <p className="text-gray-600">
                  Fix jobs that are missing from KV storage but exist in database
                </p>
              </div>

              <button
                onClick={restoreKVJobs}
                disabled={processing}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
              >
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Restore KV Jobs
                </div>
              </button>
            </div>

            {/* Check Status */}
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Check Job Status</h3>
                <p className="text-gray-600">
                  View current status of pending jobs in the queue
                </p>
              </div>

              <button
                onClick={checkPendingJobs}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Check Pending Jobs
                </div>
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-2xl font-bold text-gray-900">Processing Results</h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-800 font-medium">Processing Error</span>
              </div>
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🔧 Job Processing Guide</h3>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                <div>
                  <strong>Development Environment:</strong> In development, scheduled cron jobs don't run automatically. Use this tool to manually trigger job processing when testing report generation.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                <div>
                  <strong>Job Queue System:</strong> Reports are generated asynchronously in the background. Jobs are queued when payments are confirmed and processed by this system.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                <div>
                  <strong>Multi-Stage Processing:</strong> Each job goes through multiple stages (research → sections → summary → PDF) to ensure reliability and quality.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</div>
                <div>
                  <strong>Troubleshooting:</strong> If jobs remain stuck in "pending" status, use the "Process Pending Jobs" button to manually trigger processing.
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
