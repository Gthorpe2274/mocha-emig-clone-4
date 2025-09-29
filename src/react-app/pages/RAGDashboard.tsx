import React, { useState, useEffect } from 'react';
import { Activity, Database, Clock, AlertTriangle, CheckCircle, TrendingUp, Server, Zap } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

interface RAGHealthStatus {
  status: 'healthy' | 'unhealthy' | 'not_configured';
  details: string;
  service_url?: string;
  timestamp: string;
}

interface RAGMetrics {
  total_queries: number;
  successful_queries: number;
  failed_queries: number;
  average_response_time: number;
  enhancement_rate: number;
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
  };
}

const RAGDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<RAGHealthStatus | null>(null);
  const [metrics, setMetrics] = useState<RAGMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    checkHealth();
    loadMetrics();
    
    // Set up periodic health checks
    const interval = setInterval(() => {
      checkHealth();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/rag/health');
      const data = await response.json();
      setHealthStatus(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to check RAG health:', error);
      setHealthStatus({
        status: 'unhealthy',
        details: 'Failed to connect to health check endpoint',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    // Mock metrics for now - in production, these would come from analytics
    setMetrics({
      total_queries: 1247,
      successful_queries: 1098,
      failed_queries: 149,
      average_response_time: 1450,
      enhancement_rate: 0.88,
      confidence_distribution: {
        high: 67,
        medium: 23,
        low: 10
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      case 'not_configured': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'unhealthy': return <AlertTriangle className="w-5 h-5" />;
      case 'not_configured': return <Server className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const successRate = metrics ? ((metrics.successful_queries / metrics.total_queries) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Database className="w-4 h-4 mr-2" />
            RAGatouille System Dashboard
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            RAG System Monitoring
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Monitor the health and performance of the RAGatouille-powered 
            retrieval-augmented generation system for enhanced emigration research.
          </p>
        </div>

        {/* Status Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Health Status */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">System Health</h3>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 w-6 h-6 rounded"></div>
              ) : (
                <div className={`p-2 rounded-lg border ${healthStatus ? getStatusColor(healthStatus.status) : 'text-gray-600 bg-gray-50'}`}>
                  {healthStatus ? getStatusIcon(healthStatus.status) : <Activity className="w-5 h-5" />}
                </div>
              )}
            </div>
            
            {healthStatus ? (
              <div className="space-y-3">
                <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
                  {healthStatus.status.toUpperCase()}
                </div>
                <p className="text-sm text-gray-600">
                  {healthStatus.details}
                </p>
                {healthStatus.service_url && (
                  <p className="text-xs text-gray-500 truncate">
                    Service: {healthStatus.service_url}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Last checked: {formatTimestamp(healthStatus.timestamp)}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Checking health...</p>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Performance</h3>
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            
            {metrics ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-bold text-green-600">{successRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Response</span>
                  <span className="font-bold text-blue-600">{metrics.average_response_time}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Enhancement Rate</span>
                  <span className="font-bold text-purple-600">{Math.round(metrics.enhancement_rate * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Queries</span>
                  <span className="font-bold text-gray-800">{metrics.total_queries.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading metrics...</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            
            <div className="space-y-3">
              <button
                onClick={checkHealth}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Checking...' : 'Refresh Health'}
              </button>
              
              <a
                href="/rag"
                className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium text-center hover:bg-purple-700 transition-colors"
              >
                Test RAG Interface
              </a>
              
              <a
                href="/admin/config"
                className="block w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium text-center hover:bg-gray-700 transition-colors"
              >
                System Configuration
              </a>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        {metrics && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Query Statistics */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Query Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <span className="font-medium text-green-800">Successful Queries</span>
                  </div>
                  <span className="font-bold text-green-700">
                    {metrics.successful_queries.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    <span className="font-medium text-red-800">Failed Queries</span>
                  </div>
                  <span className="font-bold text-red-700">
                    {metrics.failed_queries.toLocaleString()}
                  </span>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-blue-800">Success Rate</span>
                    <span className="font-bold text-blue-700">{successRate}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${successRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence Distribution */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Answer Confidence</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-green-800">High Confidence</span>
                    <span className="font-bold text-green-700">{metrics.confidence_distribution.high}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.confidence_distribution.high}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-yellow-800">Medium Confidence</span>
                    <span className="font-bold text-yellow-700">{metrics.confidence_distribution.medium}%</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.confidence_distribution.medium}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-red-800">Low Confidence</span>
                    <span className="font-bold text-red-700">{metrics.confidence_distribution.low}%</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.confidence_distribution.low}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">System Information</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">RAGatouille Integration</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• ColBERT-based retrieval for high accuracy</li>
                <li>• Real-time document indexing and search</li>
                <li>• Semantic similarity scoring</li>
                <li>• Multi-category knowledge organization</li>
                <li>• Source attribution and metadata tracking</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Architecture</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Cloudflare Worker orchestration layer</li>
                <li>• External Python RAGatouille microservice</li>
                <li>• OpenAI GPT-4 for answer generation</li>
                <li>• KV caching for performance optimization</li>
                <li>• Fallback mechanisms for reliability</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Last Updated:</strong> {lastUpdated.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RAGDashboard;
