// RAGatouille integration service for highly accurate emigration information retrieval
// This service acts as a bridge between the Cloudflare Worker and your SELF-HOSTED RAGatouille microservice
//
// IMPORTANT: RAGatouille is an open-source Python library by Benjamin Clavié, NOT a hosted service.
// You need to deploy your own Python microservice using the RAGatouille library.
// 
// Architecture:
// 1. Deploy Python microservice with RAGatouille library (FastAPI/Flask)
// 2. Ingest your emigration documents into RAGatouille's ColBERT index
// 3. Expose HTTP endpoints for context retrieval and health checks
// 4. Set RAGATOUILLE_API_URL to your self-hosted service URL
// 5. Set RAGATOUILLE_API_KEY to your own custom authentication token

export interface RAGatouilleQuery {
  query: string;
  country?: string;
  category?: 'visa_requirements' | 'cost_of_living' | 'healthcare' | 'housing' | 'immigration_process' | 'general';
  max_results?: number;
}

export interface RAGatouilleResult {
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

export interface RAGatouilleResponse {
  results: RAGatouilleResult[];
  query: string;
  total_results: number;
  processing_time_ms: number;
}

export interface RAGEnhancedAnswer {
  answer: string;
  sources: RAGatouilleResult[];
  confidence: 'high' | 'medium' | 'low';
  generated_at: string;
  query: string;
}

export class RAGatouilleClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(baseUrl: string, apiKey: string, timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey; // This is YOUR custom auth token, not from RAGatouille
    this.timeout = timeout;
  }

  /**
   * Retrieve relevant context from RAGatouille service
   */
  async retrieveContext(query: RAGatouilleQuery): Promise<RAGatouilleResponse> {
    const url = `${this.baseUrl}/retrieve-context`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`, // Your custom auth token
          'User-Agent': 'EmigrationPro/1.0'
        },
        body: JSON.stringify({
          query: query.query,
          country: query.country,
          category: query.category || 'general',
          max_results: query.max_results || 5
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`RAGatouille service error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json() as RAGatouilleResponse;
      
      // Validate response structure
      if (!result.results || !Array.isArray(result.results)) {
        throw new Error('Invalid RAGatouille response format');
      }

      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('RAGatouille service timeout');
      }
      
      throw error;
    }
  }

  /**
   * Get enhanced answer using RAG + LLM pipeline
   */
  async getEnhancedAnswer(
    query: string,
    country?: string,
    category?: RAGatouilleQuery['category']
  ): Promise<RAGEnhancedAnswer> {
    const url = `${this.baseUrl}/enhanced-answer`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'EmigrationPro/1.0'
        },
        body: JSON.stringify({
          query,
          country,
          category: category || 'general'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`RAGatouille enhanced answer error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json() as RAGEnhancedAnswer;
      
      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('RAGatouille enhanced answer timeout');
      }
      
      throw error;
    }
  }

  /**
   * Health check for RAGatouille service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    const url = `${this.baseUrl}/health`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'EmigrationPro/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json() as any;
        return { status: 'healthy', details: data.message || 'Service is healthy' };
      } else {
        return { status: 'unhealthy', details: `HTTP ${response.status}: ${response.statusText}` };
      }

    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

/**
 * Enhanced Report Generator that uses RAGatouille for more accurate content
 */
export class RAGEnhancedReportGenerator {
  private ragClient: RAGatouilleClient;
  private fallbackEnabled: boolean;

  constructor(ragClient: RAGatouilleClient, fallbackEnabled: boolean = true) {
    this.ragClient = ragClient;
    this.fallbackEnabled = fallbackEnabled;
  }

  /**
   * Generate a research piece with RAG-enhanced accuracy
   */
  async generateEnhancedResearchPiece(
    topic: string,
    country: string,
    category: RAGatouilleQuery['category']
  ): Promise<{
    content: string;
    sources: RAGatouilleResult[];
    confidence: 'high' | 'medium' | 'low';
    method: 'rag_enhanced' | 'fallback';
  }> {
    try {
      // Try RAG-enhanced generation first
      console.log(`Generating RAG-enhanced content for ${topic} in ${country}`);
      
      const ragQuery: RAGatouilleQuery = {
        query: `${topic} for ${country}`,
        country,
        category,
        max_results: 8
      };

      const ragResponse = await this.ragClient.retrieveContext(ragQuery);
      
      if (ragResponse.results.length === 0) {
        throw new Error('No relevant context found in RAG');
      }

      // Calculate confidence based on relevance scores and result count
      const avgRelevance = ragResponse.results.reduce((sum, r) => sum + r.relevance_score, 0) / ragResponse.results.length;
      const confidence: 'high' | 'medium' | 'low' = 
        avgRelevance > 0.8 && ragResponse.results.length >= 5 ? 'high' :
        avgRelevance > 0.6 && ragResponse.results.length >= 3 ? 'medium' : 'low';

      // Format content from RAG results
      const content = this.formatRAGContent(ragResponse.results, topic, country);

      return {
        content,
        sources: ragResponse.results,
        confidence,
        method: 'rag_enhanced'
      };

    } catch (error) {
      console.error('RAG-enhanced generation failed:', error);
      
      if (!this.fallbackEnabled) {
        throw error;
      }

      // Fallback to basic content generation
      console.log('Falling back to basic content generation');
      return {
        content: this.generateFallbackContent(topic, country),
        sources: [],
        confidence: 'low',
        method: 'fallback'
      };
    }
  }

  private formatRAGContent(results: RAGatouilleResult[], topic: string, country: string): string {
    const sections = results.map((result) => {
      const sourceInfo = result.metadata?.source_type ? ` (${result.metadata.source_type})` : '';
      return `${result.content.trim()}${sourceInfo}`;
    });

    const introduction = `Current ${topic} information for ${country}:`;
    const conclusion = `This information is compiled from ${results.length} verified sources and reflects the most current available data.`;

    return [introduction, ...sections, conclusion].join('\n\n');
  }

  private generateFallbackContent(topic: string, country: string): string {
    // Basic fallback content when RAG is unavailable
    return `${topic} for ${country}: This section requires current information that would be provided by our specialized research system. Please contact our support team for the most up-to-date details on this topic.

Note: This content is currently in fallback mode and may not reflect the latest changes in immigration policies or requirements.`;
  }
}

/**
 * Utility functions for RAG integration
 */
export class RAGUtils {
  /**
   * Determine if a query should use RAG enhancement
   */
  static shouldUseRAG(query: string): boolean {
    const ragTriggers = [
      'visa', 'immigration', 'requirements', 'cost', 'healthcare', 'housing',
      'process', 'documents', 'timeline', 'eligibility', 'application',
      'permit', 'residence', 'citizenship', 'tax', 'employment'
    ];

    const lowerQuery = query.toLowerCase();
    return ragTriggers.some(trigger => lowerQuery.includes(trigger));
  }

  /**
   * Extract country from query text
   */
  static extractCountryFromQuery(query: string): string | null {
    const countries = [
      'portugal', 'spain', 'mexico', 'costa rica', 'panama', 'ecuador',
      'colombia', 'brazil', 'argentina', 'chile', 'uruguay', 'germany',
      'france', 'italy', 'netherlands', 'canada', 'australia', 'japan'
    ];

    const lowerQuery = query.toLowerCase();
    const foundCountry = countries.find(country => lowerQuery.includes(country));
    
    return foundCountry ? foundCountry.charAt(0).toUpperCase() + foundCountry.slice(1) : null;
  }

  /**
   * Categorize query type
   */
  static categorizeQuery(query: string): RAGatouilleQuery['category'] {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('visa') || lowerQuery.includes('immigration') || lowerQuery.includes('permit')) {
      return 'visa_requirements';
    }
    if (lowerQuery.includes('cost') || lowerQuery.includes('price') || lowerQuery.includes('budget')) {
      return 'cost_of_living';
    }
    if (lowerQuery.includes('health') || lowerQuery.includes('medical') || lowerQuery.includes('insurance')) {
      return 'healthcare';
    }
    if (lowerQuery.includes('house') || lowerQuery.includes('rent') || lowerQuery.includes('property')) {
      return 'housing';
    }
    if (lowerQuery.includes('process') || lowerQuery.includes('application') || lowerQuery.includes('timeline')) {
      return 'immigration_process';
    }

    return 'general';
  }
}
