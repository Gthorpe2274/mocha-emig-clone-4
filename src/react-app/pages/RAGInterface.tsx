import React, { useState } from 'react';
import { Search, BookOpen, MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

interface RAGResult {
  content: string;
  source: string;
  relevance_score: number;
  metadata?: {
    country?: string;
    category?: string;
    last_updated?: string;
    source_type?: string;
  };
}

interface RAGResponse {
  success: boolean;
  results?: RAGResult[];
  query?: string;
  total_results?: number;
  processing_time_ms?: number;
  answer?: string;
  sources?: RAGResult[];
  confidence?: 'high' | 'medium' | 'low';
  error?: string;
  fallback?: boolean;
}

const RAGInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [results, setResults] = useState<RAGResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'context' | 'answer'>('answer');

  const countries = [
    'Portugal', 'Spain', 'Mexico', 'Costa Rica', 'Panama', 'Ecuador',
    'Germany', 'France', 'Italy', 'Canada', 'Australia', 'Japan'
  ];

  const categories = [
    { value: 'general', label: 'General Information' },
    { value: 'visa_requirements', label: 'Visa Requirements' },
    { value: 'cost_of_living', label: 'Cost of Living' },
    { value: 'healthcare', label: 'Healthcare System' },
    { value: 'housing', label: 'Housing & Real Estate' },
    { value: 'immigration_process', label: 'Immigration Process' }
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResults(null);

    try {
      const endpoint = searchType === 'context' ? '/api/rag/query' : '/api/rag/enhanced-answer';
      
      const requestBody: any = {
        query: query.trim(),
        category: category !== 'general' ? category : undefined
      };

      if (country) {
        requestBody.country = country;
      }

      if (searchType === 'context') {
        requestBody.max_results = 6;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      setResults(data);

    } catch (error) {
      console.error('RAG search error:', error);
      setResults({
        success: false,
        error: 'Failed to search. Please try again.',
        fallback: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score > 0.8) return 'bg-green-500';
    if (score > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4 mr-2" />
            RAG-Enhanced Information System
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Emigration Research
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get precise, verified answers to your emigration questions using our advanced 
            RAGatouille-powered knowledge base with real-time document retrieval.
          </p>
        </div>

        {/* Search Interface */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="space-y-4">
            {/* Search Type Toggle */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Search Mode:</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSearchType('answer')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchType === 'answer'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Enhanced Answer
                </button>
                <button
                  onClick={() => setSearchType('context')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchType === 'context'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Context Retrieval
                </button>
              </div>
            </div>

            {/* Query Input */}
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask any detailed question about emigration, visa requirements, costs, healthcare, housing, or immigration processes..."
                className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <Search className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country (optional)
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Country</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Searching...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2" />
                  {searchType === 'answer' ? 'Get Enhanced Answer' : 'Retrieve Context'}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Error State */}
            {!results.success && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-800">Search Failed</span>
                </div>
                <p className="text-red-700">{results.error}</p>
                {results.fallback && (
                  <p className="text-sm text-red-600 mt-2">
                    The RAGatouille service may not be configured or available. 
                    Please check the system configuration.
                  </p>
                )}
              </div>
            )}

            {/* Enhanced Answer Results */}
            {results.success && results.answer && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Enhanced Answer</h2>
                  {results.confidence && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(results.confidence)}`}>
                      {results.confidence.toUpperCase()} Confidence
                    </span>
                  )}
                </div>
                
                <div className="prose prose-gray max-w-none mb-6">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {results.answer}
                  </div>
                </div>

                {results.sources && results.sources.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Sources ({results.sources.length})
                    </h3>
                    <div className="grid gap-3">
                      {results.sources.map((source, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              {source.source}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${getRelevanceColor(source.relevance_score)}`}></div>
                              <span className="text-sm text-gray-500">
                                {Math.round(source.relevance_score * 100)}% relevant
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {source.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Context Retrieval Results */}
            {results.success && results.results && searchType === 'context' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Retrieved Context ({results.total_results || results.results?.length || 0} results)
                  </h2>
                  <span className="text-sm text-gray-500">
                    {results.processing_time_ms}ms
                  </span>
                </div>
                
                <div className="grid gap-4">
                  {results.results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getRelevanceColor(result.relevance_score)}`}></div>
                          <span className="font-medium text-gray-900">
                            {result.source}
                          </span>
                          {result.metadata?.country && (
                            <div className="flex items-center text-sm text-blue-600">
                              <MapPin className="w-4 h-4 mr-1" />
                              {result.metadata.country}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {Math.round(result.relevance_score * 100)}% match
                        </span>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {result.content}
                      </p>
                      
                      {result.metadata && (
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {result.metadata.category && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {result.metadata.category.replace('_', ' ')}
                            </span>
                          )}
                          {result.metadata.source_type && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {result.metadata.source_type}
                            </span>
                          )}
                          {result.metadata.last_updated && (
                            <span>Updated: {result.metadata.last_updated}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {results.success && ((results.results && results.results.length > 0) || results.answer) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800">
                    Search completed successfully using RAGatouille-powered retrieval
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Tips */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How to Use the RAG Interface</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Enhanced Answer Mode</h4>
              <p className="text-gray-600 text-sm mb-3">
                Get comprehensive, AI-generated answers based on verified sources. 
                Perfect for complex questions requiring detailed explanations.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Combines RAG retrieval with OpenAI generation</li>
                <li>• Provides confidence scoring</li>
                <li>• Shows source attribution</li>
                <li>• Best for specific questions</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Context Retrieval Mode</h4>
              <p className="text-gray-600 text-sm mb-3">
                View raw document excerpts ranked by relevance. 
                Useful for research and verification of information sources.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Direct access to source documents</li>
                <li>• Relevance scoring for each result</li>
                <li>• Metadata and source information</li>
                <li>• Best for research and fact-checking</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Pro Tip:</strong> Be specific in your queries for best results. 
              Include the country name and specific aspects you're interested in 
              (e.g., "D7 visa income requirements for Portugal software engineers").
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RAGInterface;
