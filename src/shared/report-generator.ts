import OpenAI from 'openai';
import type { AssessmentResultType } from './types';

export interface ReportSection {
  title: string;
  content: string;
  subsections?: Array<{
    title: string;
    content: string;
  }>;
}

export interface GeneratedReport {
  title: string;
  country: string;
  city: string | undefined; // ← critical: must NOT be null or {}
  executiveSummary: string;
  sections: ReportSection[];
  generatedAt: string;
  assessmentId?: number;
}

export interface ResearchPiece {
  topic: string;
  content: string;
  generatedAt: string;
}

export class ReportGenerator {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  // Stage 1: Generate individual research pieces
  async generateResearchPiece(assessment: AssessmentResultType, researchTopic: string): Promise<ResearchPiece> {
    const location = assessment.preferred_city ? `${assessment.preferred_city}, ${assessment.preferred_country}` : assessment.preferred_country;
    
    console.log(`=== GENERATING RESEARCH PIECE: ${researchTopic} ===`);
    
    let prompt = '';
    switch (researchTopic) {
      case 'visa_requirements':
        prompt = `Research visa requirements for US citizens moving to ${location}. Include specific visa types available, eligibility criteria, application processes, required documents, and processing times. Focus on practical details for a ${assessment.user_age}-year-old ${assessment.user_job}. Provide 400-600 words of specific, actionable information.`;
        break;
      case 'immigration_costs':
        prompt = `Research immigration costs and fees for US citizens moving to ${location}. Include application fees, legal costs, document preparation expenses, and timeline-based costs. Focus on budget planning for a ${assessment.user_age}-year-old ${assessment.user_job}. Provide 300-500 words with specific amounts and cost breakdowns.`;
        break;
      case 'housing_costs':
        prompt = `Research housing costs and rental market in ${location} for US expats. Include rental prices by neighborhood, property purchase options, utilities costs, and deposit requirements. Focus on options suitable for a ${assessment.user_job} with monthly budget of $${assessment.monthly_budget || 2000}. Provide 400-600 words with specific price ranges.`;
        break;
      case 'daily_living_costs':
        prompt = `Research daily living costs in ${location} including food, transportation, entertainment, and shopping. Compare with US prices and provide specific examples. Focus on lifestyle costs for a ${assessment.user_age}-year-old ${assessment.user_job}. Provide 300-500 words with specific price examples.`;
        break;
      case 'healthcare_system':
        prompt = `Research the healthcare system in ${location} for US expats. Include public vs private options, insurance requirements, quality of care, and English-speaking medical facilities. Focus on healthcare needs for a ${assessment.user_age}-year-old. Provide 400-600 words with specific details about access and costs.`;
        break;
      case 'tax_obligations':
        prompt = `Research tax obligations for US citizens living in ${location}. Include US tax requirements for expats, local tax system, tax treaties, and planning strategies. Focus on tax implications for a ${assessment.user_job}. Provide 400-600 words with specific tax rates and requirements.`;
        break;
      case 'cultural_adaptation':
        prompt = `Research cultural adaptation and integration for Americans in ${location}. Include language requirements, social customs, business culture, and integration challenges. Focus on cultural fit for a ${assessment.user_age}-year-old ${assessment.user_job}. Provide 300-500 words with practical integration tips.`;
        break;
      case 'legal_requirements':
        prompt = `Research legal requirements and procedures for US citizens establishing residency in ${location}. Include residency registration, legal documentation, and compliance requirements. Focus on legal steps for a ${assessment.user_job}. Provide 300-500 words with specific legal procedures.`;
        break;
      case 'emergency_services':
        prompt = `Research emergency services and support systems in ${location} for US expats. Include emergency numbers, US embassy services, medical emergency procedures, and crisis support. Provide 250-400 words with specific contact information and procedures.`;
        break;
      case 'professional_services':
        prompt = `Research professional services available to US expats in ${location}. Include immigration lawyers, tax advisors, real estate agents, and other essential services. Focus on English-speaking professionals. Provide 300-500 words with specific service providers and contact information.`;
        break;
      default:
        throw new Error(`Unknown research topic: ${researchTopic}`);
    }

    const content = await this.makeOptimizedAPICall(prompt, 800);
    
    return {
      topic: researchTopic,
      content: content.trim(),
      generatedAt: new Date().toISOString()
    };
  }

  // Stage 2: Combine research pieces into sections
  async combineResearchIntoSection(assessment: AssessmentResultType, sectionType: string, researchPieces: ResearchPiece[]): Promise<ReportSection> {
    const location = assessment.preferred_city ? `${assessment.preferred_city}, ${assessment.preferred_country}` : assessment.preferred_country;
    
    console.log(`=== COMBINING RESEARCH INTO SECTION: ${sectionType} ===`);
    
    // Filter relevant research pieces for this section
    let relevantResearch: ResearchPiece[] = [];
    let sectionTitle = '';
    let prompt = '';

    switch (sectionType) {
      case 'immigration':
        relevantResearch = researchPieces.filter(r => 
          ['visa_requirements', 'immigration_costs', 'legal_requirements'].includes(r.topic)
        );
        sectionTitle = 'Immigration Requirements & Visa Options';
        prompt = `Create a comprehensive immigration section for ${location} using the following research data. Combine and organize this information into a cohesive 800-1000 word section that covers visa options, costs, and legal requirements for a ${assessment.user_age}-year-old ${assessment.user_job}.

Research Data:
${relevantResearch.map(r => `\n--- ${r.topic.toUpperCase()} ---\n${r.content}`).join('\n')}

Create a well-structured section with clear subsections and actionable guidance.`;
        break;
        
      case 'cost_of_living':
        relevantResearch = researchPieces.filter(r => 
          ['housing_costs', 'daily_living_costs'].includes(r.topic)
        );
        sectionTitle = 'Comprehensive Cost of Living Analysis';
        prompt = `Create a comprehensive cost of living section for ${location} using the following research data. Combine and organize this information into a cohesive 800-1000 word section covering housing and daily expenses for a ${assessment.user_job} with budget of $${assessment.monthly_budget || 2000}/month.

Research Data:
${relevantResearch.map(r => `\n--- ${r.topic.toUpperCase()} ---\n${r.content}`).join('\n')}

Include specific price ranges and budget recommendations.`;
        break;
        
      case 'healthcare':
        relevantResearch = researchPieces.filter(r => 
          ['healthcare_system'].includes(r.topic)
        );
        sectionTitle = 'Healthcare System & Medical Services';
        prompt = `Create a comprehensive healthcare section for ${location} using the following research data. Expand and organize this information into a detailed 800-1000 word section covering healthcare access, costs, and quality for a ${assessment.user_age}-year-old American.

Research Data:
${relevantResearch.map(r => `\n--- ${r.topic.toUpperCase()} ---\n${r.content}`).join('\n')}

Include specific information about insurance options and medical facilities.`;
        break;
        
      case 'tax_planning':
        relevantResearch = researchPieces.filter(r => 
          ['tax_obligations'].includes(r.topic)
        );
        sectionTitle = 'Tax Implications & Financial Planning';
        prompt = `Create a comprehensive tax planning section for ${location} using the following research data. Expand and organize this information into a detailed 800-1000 word section covering US and local tax obligations for a ${assessment.user_job}.

Research Data:
${relevantResearch.map(r => `\n--- ${r.topic.toUpperCase()} ---\n${r.content}`).join('\n')}

Include specific tax rates, planning strategies, and professional recommendations.`;
        break;
        
      case 'housing_market':
        relevantResearch = researchPieces.filter(r => 
          ['housing_costs'].includes(r.topic)
        );
        sectionTitle = 'Housing Market & Neighborhood Guide';
        prompt = `Create a comprehensive housing market section for ${location} using the following research data. Expand this into a detailed 800-1000 word section covering neighborhoods, rental processes, and property options for a ${assessment.user_job}.

Research Data:
${relevantResearch.map(r => `\n--- ${r.topic.toUpperCase()} ---\n${r.content}`).join('\n')}

Include specific neighborhood recommendations and practical moving advice.`;
        break;
        
      case 'cultural_integration':
        relevantResearch = researchPieces.filter(r => 
          ['cultural_adaptation'].includes(r.topic)
        );
        sectionTitle = 'Cultural Integration & Language Resources';
        prompt = `Create a comprehensive cultural integration section for ${location} using the following research data. Expand this into a detailed 800-1000 word section covering cultural adaptation for a ${assessment.user_age}-year-old American ${assessment.user_job}.

Research Data:
${relevantResearch.map(r => `\n--- ${r.topic.toUpperCase()} ---\n${r.content}`).join('\n')}

Include language learning resources and social integration strategies.`;
        break;
        
      case 'relocation_timeline':
        // This section uses multiple research pieces to create a timeline
        relevantResearch = researchPieces.filter(r => 
          ['visa_requirements', 'legal_requirements', 'housing_costs'].includes(r.topic)
        );
        sectionTitle = 'Step-by-Step Relocation Timeline';
        prompt = `Create a comprehensive relocation timeline for ${location} using the following research data. Create a detailed 18-month timeline with specific milestones for a ${assessment.user_age}-year-old ${assessment.user_job}.

Research Data:
${relevantResearch.map(r => `\n--- ${r.topic.toUpperCase()} ---\n${r.content}`).join('\n')}

Organize as a month-by-month timeline with specific deadlines and actions.`;
        break;
        
      case 'emergency_contacts':
        relevantResearch = researchPieces.filter(r => 
          ['emergency_services', 'professional_services'].includes(r.topic)
        );
        sectionTitle = 'Emergency Contacts & Support Resources';
        prompt = `Create a comprehensive emergency contacts section for ${location} using the following research data. Organize this into a detailed 800+ word resource guide for American expats.

Research Data:
${relevantResearch.map(r => `\n--- ${r.topic.toUpperCase()} ---\n${r.content}`).join('\n')}

Include specific contact information and categorized resource lists.`;
        break;
        
      default:
        throw new Error(`Unknown section type: ${sectionType}`);
    }

    const content = await this.makeOptimizedAPICall(prompt, 1200);
    
    return {
      title: sectionTitle,
      content: content.trim()
    };
  }

  // New chunked generation method - generates one section at a time
  async generateSingleSection(assessment: AssessmentResultType, sectionType: string): Promise<ReportSection> {
    const location = assessment.preferred_city ? `${assessment.preferred_city}, ${assessment.preferred_country}` : assessment.preferred_country;
    
    console.log(`=== GENERATING SINGLE SECTION: ${sectionType} ===`);
    
    switch (sectionType) {
      case 'immigration':
        return await this.generateImmigrationSection(assessment, location);
      case 'cost_of_living':
        return await this.generateCostOfLivingSection(assessment, location);
      case 'healthcare':
        return await this.generateHealthcareSection(assessment, location);
      case 'tax_planning':
        return await this.generateTaxPlanningSection(assessment, location);
      case 'housing_market':
        return await this.generateHousingMarketSection(assessment, location);
      case 'cultural_integration':
        return await this.generateCulturalIntegrationSection(assessment, location);
      case 'relocation_timeline':
        return await this.generateRelocationTimelineSection(assessment, location);
      case 'emergency_contacts':
        return await this.generateEmergencyContactsSection(assessment, location);
      default:
        throw new Error(`Unknown section type: ${sectionType}`);
    }
  }

  // Generate executive summary after all sections are complete
  async generateExecutiveSummaryFromSections(assessment: AssessmentResultType, sections: ReportSection[]): Promise<string> {
    console.log('=== GENERATING EXECUTIVE SUMMARY ===');
    return await this.generateOptimizedExecutiveSummary(assessment, sections);
  }

  // Assemble complete report from individual sections
  async assembleCompleteReport(assessment: AssessmentResultType, sections: ReportSection[], executiveSummary: string): Promise<GeneratedReport> {
    const country = assessment.preferred_country;
    const city = assessment.preferred_city;
    const location = city ? `${city}, ${country}` : country;
    
    console.log('=== ASSEMBLING COMPLETE REPORT ===');
    console.log(`Final report: ${sections.length} sections with ${executiveSummary.length} character summary`);

    // Helper function to normalize city values
    function normalizeCity(city: unknown): string | undefined {
      if (typeof city === 'string' && city.trim().length > 0) {
        return city.trim();
      }
      return undefined;
    }

    return {
      title: `Comprehensive Emigration Report: ${location}`,
      country,
      city: normalizeCity(city),
      executiveSummary,
      sections,
      generatedAt: new Date().toISOString(),
      assessmentId: assessment.id
    };
  }

  // ULTRA-EFFICIENT METHOD: Single API call for entire report
  async generateUltraEfficientReport(assessment: AssessmentResultType): Promise<GeneratedReport> {
    const country = assessment.preferred_country;
    const city = assessment.preferred_city;
    const location = city ? `${city}, ${country}` : country;
    
    console.log('=== ULTRA-EFFICIENT REPORT GENERATION (1 API CALL) ===');
    console.log(`Generating complete report in single API call for ${location}`);
    
    try {
      // Single comprehensive API call for entire report
      const completeContent = await this.generateCompleteReportInOneCall(assessment);
      
      // Parse the single response into structured sections
      const sections = this.parseCompleteReport(completeContent);
      const executiveSummary = this.extractExecutiveSummary(completeContent);
      
      console.log('=== ULTRA-EFFICIENT GENERATION COMPLETE (1 API CALL) ===');
      console.log(`Generated ${sections.length} sections with ${executiveSummary.length} character summary`);

      return {
        title: `Comprehensive Emigration Report: ${location}`,
        country,
        city: city || undefined,
        executiveSummary,
        sections,
        generatedAt: new Date().toISOString(),
        assessmentId: assessment.id
      };
    } catch (error) {
      console.warn('Ultra-efficient method failed, falling back to 2-call method:', error);
      return await this.generateTwoCallReport(assessment);
    }
  }

  // FALLBACK METHOD: 2 API calls maximum
  private async generateTwoCallReport(assessment: AssessmentResultType): Promise<GeneratedReport> {
    const country = assessment.preferred_country;
    const city = assessment.preferred_city;
    const location = city ? `${city}, ${country}` : country;
    
    console.log('=== FALLBACK: 2-CALL REPORT GENERATION ===');
    
    // Call 1: Generate all sections in one go
    const allSectionsContent = await this.generateAllSectionsInOneCall(assessment);
    const sections = this.parseAllSections(allSectionsContent);
    
    // Call 2: Generate executive summary
    const executiveSummary = await this.generateOptimizedExecutiveSummary(assessment, sections);
    
    console.log('=== 2-CALL GENERATION COMPLETE ===');
    console.log(`Generated ${sections.length} sections with ${executiveSummary.length} character summary`);

    return {
      title: `Comprehensive Emigration Report: ${location}`,
      country,
      city: city || undefined,
      executiveSummary,
      sections,
      generatedAt: new Date().toISOString(),
      assessmentId: assessment.id
    };
  }

  // Legacy method for backwards compatibility - now uses ultra-efficient approach
  async generateComprehensiveReport(assessment: AssessmentResultType): Promise<GeneratedReport> {
    console.log('=== USING ULTRA-EFFICIENT APPROACH TO MINIMIZE API CALLS ===');
    return await this.generateUltraEfficientReport(assessment);
  }

  

  

  

  private async generateOptimizedExecutiveSummary(assessment: AssessmentResultType, sections: ReportSection[]): Promise<string> {
    const summaryPrompt = `Create a comprehensive executive summary for a US citizen's emigration report to ${assessment.preferred_country}${assessment.preferred_city ? ` (specifically ${assessment.preferred_city})` : ''}. 

Assessment details:
- Age: ${assessment.user_age}
- Occupation: ${assessment.user_job}
- Location preference: ${assessment.location_preference}
- Overall compatibility score: ${assessment.overall_score}/100
- Match level: ${assessment.match_level}

Key priority factors (1-5 scale):
- Immigration policies: ${assessment.immigration_policies_importance}
- Healthcare: ${assessment.healthcare_importance}
- Safety: ${assessment.safety_importance}
- Internet connectivity: ${assessment.internet_importance}
- Emigration process: ${assessment.emigration_process_importance}
- Ease of immigration: ${assessment.ease_of_immigration_importance}
- Local acceptance: ${assessment.local_acceptance_importance}
- Climate: ${3}

Available sections: ${sections.map(s => s.title).join(', ')}

Write a 300-400 word executive summary that:
1. Analyzes their specific compatibility with this destination
2. Highlights the strongest advantages for their situation
3. Identifies key challenges they should prepare for
4. Provides a realistic assessment of their emigration prospects
5. References specific aspects of their age, profession, and priorities

Be specific to this country and avoid generic advice. Focus on actionable insights.`;

    return await this.makeOptimizedAPICall(summaryPrompt, 600);
  }

  private async makeOptimizedAPICall(prompt: string, maxTokens: number): Promise<string> {
    try {
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: 'gpt-4o-mini', // Using mini model for better performance and lower costs
          messages: [
            {
              role: 'system',
              content: 'You are an expert international migration consultant with deep knowledge of emigration processes, visa requirements, and country-specific considerations for US citizens. Provide detailed, accurate, and current guidance.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_completion_tokens: maxTokens
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OpenAI API timeout after 120 seconds')), 120000);
        })
      ]) as any;

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      
      // Handle rate limits gracefully
      if (error instanceof Error && error.message.includes('Rate limit')) {
        throw new Error('OpenAI rate limit reached. Please wait a few minutes and try again. Free accounts have 3 requests per minute limit.');
      }
      
      // Handle timeout errors
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('OpenAI API request timed out. Please try again.');
      }
      
      throw error;
    }
  }

  

  

  

  // Individual section generation methods
  private async generateImmigrationSection(assessment: AssessmentResultType, location: string): Promise<ReportSection> {
    const prompt = `Create a comprehensive immigration section for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

SECTION: Immigration Requirements & Visa Options

Content should include:
- All available visa types for US citizens
- Eligibility requirements and application processes
- Documentation needed and processing times
- Interview requirements and tips
- Costs and fees involved
- Professional recommendations and contacts

REQUIREMENTS:
- 800-1000 words minimum
- Include specific numbers, processing times, and contact information
- Focus on practical, actionable information
- Age-appropriate guidance for ${assessment.user_age}-year-old
- Profession-specific considerations for ${assessment.user_job}
- Immigration policies importance: ${assessment.immigration_policies_importance}/5`;

    const content = await this.makeOptimizedAPICall(prompt, 1200);
    return {
      title: 'Immigration Requirements & Visa Options',
      content: content.trim()
    };
  }

  private async generateCostOfLivingSection(assessment: AssessmentResultType, location: string): Promise<ReportSection> {
    const prompt = `Create a comprehensive cost of living analysis for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

SECTION: Comprehensive Cost of Living Analysis

Content should include:
- Housing costs by neighborhood and type
- Daily expenses (food, transportation, utilities)
- Healthcare costs and insurance
- Entertainment and lifestyle expenses
- Comparison with major US cities
- Budget recommendations

REQUIREMENTS:
- 800-1000 words minimum
- Include specific prices in local currency and USD
- Focus on ${assessment.location_preference} living preferences
- Monthly budget context: $${assessment.monthly_budget || 2000}
- Age and profession-specific considerations`;

    const content = await this.makeOptimizedAPICall(prompt, 1200);
    return {
      title: 'Comprehensive Cost of Living Analysis',
      content: content.trim()
    };
  }

  private async generateHealthcareSection(assessment: AssessmentResultType, location: string): Promise<ReportSection> {
    const prompt = `Create a comprehensive healthcare section for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

SECTION: Healthcare System & Medical Services

Content should include:
- Healthcare system overview (public vs private)
- Insurance requirements and options
- Medical facilities and English-speaking doctors
- Prescription medication availability
- Emergency services and procedures
- Age-specific health considerations

REQUIREMENTS:
- 800-1000 words minimum
- Include specific contact information and addresses
- Healthcare importance: ${assessment.healthcare_importance}/5
- Age-appropriate medical guidance for ${assessment.user_age}-year-old`;

    const content = await this.makeOptimizedAPICall(prompt, 1200);
    return {
      title: 'Healthcare System & Medical Services',
      content: content.trim()
    };
  }

  private async generateTaxPlanningSection(assessment: AssessmentResultType, location: string): Promise<ReportSection> {
    const prompt = `Create a comprehensive tax planning section for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

SECTION: Tax Implications & Financial Planning

Content should include:
- US tax obligations for expats
- Local tax system and rates
- Tax treaty benefits
- Professional tax planning strategies
- Required filings and deadlines
- Recommended tax professionals

REQUIREMENTS:
- 800-1000 words minimum
- Include specific tax rates and deadlines
- Professional tax guidance
- Age and profession-specific considerations`;

    const content = await this.makeOptimizedAPICall(prompt, 1200);
    return {
      title: 'Tax Implications & Financial Planning',
      content: content.trim()
    };
  }

  private async generateHousingMarketSection(assessment: AssessmentResultType, location: string): Promise<ReportSection> {
    const prompt = `Create a comprehensive housing market guide for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

SECTION: Housing Market & Neighborhood Guide

Content should include:
- Rental market overview and processes
- Best neighborhoods for expats
- Property purchase options for foreigners
- Utilities setup and costs
- Transportation options
- Safety and amenities by area

REQUIREMENTS:
- 800-1000 words minimum
- Include specific neighborhood names and rental prices
- Focus on ${assessment.location_preference} living preferences
- Practical moving and setup guidance`;

    const content = await this.makeOptimizedAPICall(prompt, 1200);
    return {
      title: 'Housing Market & Neighborhood Guide',
      content: content.trim()
    };
  }

  private async generateCulturalIntegrationSection(assessment: AssessmentResultType, location: string): Promise<ReportSection> {
    const prompt = `Create a comprehensive cultural integration guide for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

SECTION: Cultural Integration & Language Resources

Content should include:
- Cultural differences and social norms
- Language requirements and learning resources
- Social integration opportunities
- Professional networking advice
- Daily life adaptation tips
- Legal and social considerations

REQUIREMENTS:
- 800-1000 words minimum
- Include specific language schools and networking groups
- Local acceptance importance: ${assessment.local_acceptance_importance}/5
- Profession-specific networking guidance`;

    const content = await this.makeOptimizedAPICall(prompt, 1200);
    return {
      title: 'Cultural Integration & Language Resources',
      content: content.trim()
    };
  }

  private async generateRelocationTimelineSection(assessment: AssessmentResultType, location: string): Promise<ReportSection> {
    const prompt = `Create a detailed relocation timeline for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

SECTION: Step-by-Step Relocation Timeline

Content should include:
- 18-month timeline from planning to settlement
- Specific deadlines and milestones
- Document preparation phases
- Visa application timeline
- Housing and job search schedules
- Final settlement steps

REQUIREMENTS:
- 1000+ words with specific timeframes
- Include exact months and deadlines
- Age and profession-specific timeline adjustments
- Emigration process importance: ${assessment.emigration_process_importance}/5`;

    const content = await this.makeOptimizedAPICall(prompt, 1500);
    return {
      title: 'Step-by-Step Relocation Timeline',
      content: content.trim()
    };
  }

  private async generateEmergencyContactsSection(assessment: AssessmentResultType, location: string): Promise<ReportSection> {
    const prompt = `Create a comprehensive emergency contacts and resources guide for a ${assessment.user_age}-year-old ${assessment.user_job} in ${location}.

SECTION: Emergency Contacts & Support Resources

Content should include:
- Emergency services numbers and procedures
- US Embassy/Consulate contact information
- English-speaking professionals (lawyers, doctors, accountants)
- Community support groups for Americans
- Important government offices
- 24/7 helplines and services

REQUIREMENTS:
- 800+ words with actual contact information
- Include phone numbers, addresses, and websites
- Location-specific emergency procedures
- Professional service provider contacts`;

    const content = await this.makeOptimizedAPICall(prompt, 1200);
    return {
      title: 'Emergency Contacts & Support Resources',
      content: content.trim()
    };
  }

  // NEW ULTRA-EFFICIENT METHODS - Minimize API calls for OpenAI rate limits

  private async generateCompleteReportInOneCall(assessment: AssessmentResultType): Promise<string> {
    const location = assessment.preferred_city ? `${assessment.preferred_city}, ${assessment.preferred_country}` : assessment.preferred_country;
    
    const prompt = `Create a comprehensive emigration report for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

STRICT FORMAT - Use exactly these section headers and include an executive summary:

=== EXECUTIVE SUMMARY ===
[300-400 word comprehensive overview analyzing compatibility, advantages, challenges, and emigration prospects for this specific person]

=== IMMIGRATION REQUIREMENTS & VISA OPTIONS ===
[800-1000 words covering visa types, eligibility, application processes, documentation, processing times, costs, and professional contacts]

=== COMPREHENSIVE COST OF LIVING ANALYSIS ===
[800-1000 words covering housing costs by neighborhood, daily expenses, healthcare costs, entertainment, comparison with US prices, and budget recommendations]

=== HEALTHCARE SYSTEM & MEDICAL SERVICES ===
[800-1000 words covering public vs private options, insurance requirements, medical facilities, English-speaking doctors, prescription availability, emergency services, and age-specific considerations]

=== TAX IMPLICATIONS & FINANCIAL PLANNING ===
[800-1000 words covering US tax obligations for expats, local tax system, tax treaty benefits, professional tax planning strategies, filing requirements, and deadlines]

=== HOUSING MARKET & NEIGHBORHOOD GUIDE ===
[800-1000 words covering rental market, best neighborhoods for expats, property purchase options, utilities setup, transportation, and safety by area]

=== CULTURAL INTEGRATION & LANGUAGE RESOURCES ===
[800-1000 words covering cultural differences, language requirements, social integration opportunities, professional networking, daily life adaptation, and legal considerations]

=== STEP-BY-STEP RELOCATION TIMELINE ===
[1000+ words with detailed 18-month timeline from planning to settlement, specific deadlines, document preparation phases, visa application timeline, housing search, and settlement steps]

=== EMERGENCY CONTACTS & SUPPORT RESOURCES ===
[800+ words with emergency services numbers, US Embassy contact info, English-speaking professionals, community support groups, government offices, and 24/7 helplines]

REQUIREMENTS:
- Total target: 8000-9000 words
- Include specific numbers, prices, contact information, addresses, phone numbers
- Focus on practical, actionable information for ${assessment.location_preference} living preferences
- Age-appropriate guidance for ${assessment.user_age}-year-old
- Profession-specific considerations for ${assessment.user_job}
- Monthly budget context: $${assessment.monthly_budget || 2000}

Priority factors (1-5 scale):
- Immigration policies: ${assessment.immigration_policies_importance}/5
- Healthcare: ${assessment.healthcare_importance}/5
- Safety: ${assessment.safety_importance}/5
- Internet connectivity: ${assessment.internet_importance}/5
- Emigration process: ${assessment.emigration_process_importance}/5
- Ease of immigration: ${assessment.ease_of_immigration_importance}/5
- Local acceptance: ${assessment.local_acceptance_importance}/5

Be specific to ${assessment.preferred_country} and avoid generic advice. Focus on actionable insights.`;

    return await this.makeOptimizedAPICall(prompt, 4000);
  }

  private async generateAllSectionsInOneCall(assessment: AssessmentResultType): Promise<string> {
    const location = assessment.preferred_city ? `${assessment.preferred_city}, ${assessment.preferred_country}` : assessment.preferred_country;
    
    const prompt = `Create comprehensive emigration sections for a ${assessment.user_age}-year-old ${assessment.user_job} moving to ${location}.

STRICT FORMAT - Use exactly these section headers:

=== IMMIGRATION REQUIREMENTS & VISA OPTIONS ===
[800-1000 words covering all visa types for US citizens, eligibility, application processes, documentation, processing times, costs, and professional contacts]

=== COMPREHENSIVE COST OF LIVING ANALYSIS ===
[800-1000 words covering housing costs by neighborhood, daily expenses, healthcare costs, entertainment, comparison with US prices, and budget recommendations for $${assessment.monthly_budget || 2000}/month budget]

=== HEALTHCARE SYSTEM & MEDICAL SERVICES ===
[800-1000 words covering public vs private options, insurance requirements, medical facilities, English-speaking doctors, prescription availability, emergency services]

=== TAX IMPLICATIONS & FINANCIAL PLANNING ===
[800-1000 words covering US tax obligations for expats, local tax system, tax treaty benefits, professional tax planning strategies, filing requirements]

=== HOUSING MARKET & NEIGHBORHOOD GUIDE ===
[800-1000 words covering rental market, best neighborhoods for expats, property purchase options, utilities setup, transportation, safety by area]

=== CULTURAL INTEGRATION & LANGUAGE RESOURCES ===
[800-1000 words covering cultural differences, language requirements, social integration opportunities, professional networking, daily life adaptation]

=== STEP-BY-STEP RELOCATION TIMELINE ===
[1000+ words with detailed 18-month timeline from planning to settlement, specific deadlines, document preparation phases, visa application timeline]

=== EMERGENCY CONTACTS & SUPPORT RESOURCES ===
[800+ words with emergency services numbers, US Embassy contact info, English-speaking professionals, community support groups, government offices]

REQUIREMENTS:
- Include specific numbers, prices, contact information
- Focus on ${assessment.location_preference} living preferences
- Age-appropriate for ${assessment.user_age}-year-old
- Profession-specific for ${assessment.user_job}
- Country-specific advice for ${assessment.preferred_country}`;

    return await this.makeOptimizedAPICall(prompt, 3500);
  }

  private parseCompleteReport(content: string): ReportSection[] {
    const sections: ReportSection[] = [];
    
    const sectionMatches = [
      { regex: /=== IMMIGRATION REQUIREMENTS & VISA OPTIONS ===(.*?)(?==== |$)/s, title: 'Immigration Requirements & Visa Options' },
      { regex: /=== COMPREHENSIVE COST OF LIVING ANALYSIS ===(.*?)(?==== |$)/s, title: 'Comprehensive Cost of Living Analysis' },
      { regex: /=== HEALTHCARE SYSTEM & MEDICAL SERVICES ===(.*?)(?==== |$)/s, title: 'Healthcare System & Medical Services' },
      { regex: /=== TAX IMPLICATIONS & FINANCIAL PLANNING ===(.*?)(?==== |$)/s, title: 'Tax Implications & Financial Planning' },
      { regex: /=== HOUSING MARKET & NEIGHBORHOOD GUIDE ===(.*?)(?==== |$)/s, title: 'Housing Market & Neighborhood Guide' },
      { regex: /=== CULTURAL INTEGRATION & LANGUAGE RESOURCES ===(.*?)(?==== |$)/s, title: 'Cultural Integration & Language Resources' },
      { regex: /=== STEP-BY-STEP RELOCATION TIMELINE ===(.*?)(?==== |$)/s, title: 'Step-by-Step Relocation Timeline' },
      { regex: /=== EMERGENCY CONTACTS & SUPPORT RESOURCES ===(.*?)(?==== |$)/s, title: 'Emergency Contacts & Support Resources' }
    ];
    
    for (const { regex, title } of sectionMatches) {
      const match = content.match(regex);
      if (match) {
        sections.push({
          title,
          content: match[1].trim()
        });
      }
    }
    
    return sections;
  }

  private parseAllSections(content: string): ReportSection[] {
    return this.parseCompleteReport(content); // Same parsing logic
  }

  private extractExecutiveSummary(content: string): string {
    const summaryMatch = content.match(/=== EXECUTIVE SUMMARY ===(.*?)(?==== |$)/s);
    if (summaryMatch) {
      return summaryMatch[1].trim();
    }
    
    // Fallback: Generate a basic summary if not found
    return `This comprehensive emigration report provides detailed analysis and practical guidance for US citizens considering relocation. The report covers immigration requirements, cost of living analysis, healthcare systems, tax implications, housing markets, cultural integration, relocation timelines, and emergency resources.`;
  }

  // Legacy methods for backwards compatibility
}
