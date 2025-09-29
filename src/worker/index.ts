import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { AssessmentSchema } from "@/shared/types";
import Stripe from 'stripe';
import { ReportGenerator } from '@/shared/report-generator';
import { PDFGenerator } from '@/shared/pdf-generator';
import { z } from 'zod';
import { debugPaymentStatus } from './debug-payments';
import { JobQueue } from './job-queue';
import { RetentionCleanupService, runScheduledCleanup } from './retention-cleanup';
import { EmailService } from './email-service';
import { StripeKeyCleaner } from './stripe-key-cleaner';
import { HealthChecker } from './health-check';
import { RAGatouilleClient, RAGEnhancedReportGenerator, RAGUtils, RAGatouilleQuery } from '@/shared/ragatouille-service';

// Ensure compatibility with Mocha's internal PDF generator
export interface GeneratedReport {
  title: string;
  country: string;
  city: string | undefined; // ← critical: must NOT be null or {}
  generatedAt: string;
  enhancementLevel?: number;
  overallConfidence?: string;
  totalSources?: number;
  executiveSummary: string;
  sections: {
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }[];
  metadata?: Record<string, unknown>;
  assessmentId?: number;
}

// Helper function to normalize city values
function normalizeCity(city: unknown): string | undefined {
  if (typeof city === 'string' && city.trim().length > 0) {
    return city.trim();
  }
  return undefined;
}

// Send email using the EmailService
async function sendManualReportEmail(email: string, data: {
  country: string;
  city?: string;
  downloadToken: string;
  customerName: string;
  expiresAt: string;
  assessmentId?: number;
}, env: Env) {
  try {
    if (!env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, email will not be sent');
      return { success: false, error: 'Email service not configured' };
    }

    const emailService = new EmailService(env.RESEND_API_KEY);
    const result = await emailService.sendReportEmail(email, data);
    
    if (result.success) {
      console.log(`✅ Report email sent successfully to ${email}, Message ID: ${result.messageId}`);
    } else {
      console.error(`❌ Failed to send report email to ${email}: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    };
  }
}

const app = new Hono<{ Bindings: Env }>();

const PaymentIntentSchema = z.object({
  assessmentId: z.number(),
  customerEmail: z.string().email().optional()
});

const UpdateStripeKeySchema = z.object({
  secretKey: z.string().regex(/^sk_(test_|live_)/, "Invalid Stripe secret key format")
});

const RAGQuerySchema = z.object({
  query: z.string().min(10, "Query must be at least 10 characters"),
  country: z.string().optional(),
  category: z.enum(['visa_requirements', 'cost_of_living', 'healthcare', 'housing', 'immigration_process', 'general']).optional(),
  max_results: z.number().min(1).max(10).optional()
});

const EnhancedAnswerSchema = z.object({
  query: z.string().min(10, "Query must be at least 10 characters"),
  country: z.string().optional(),
  category: z.enum(['visa_requirements', 'cost_of_living', 'healthcare', 'housing', 'immigration_process', 'general']).optional()
});

// Budget compatibility data for major cities
const cityBudgetData: { [key: string]: { [key: string]: { oneBedroomMin: number; oneBedroomMax: number; twoBedroomMin: number; twoBedroomMax: number; currency: string } } } = {
  'Portugal': {
    'Lisbon': { oneBedroomMin: 700, oneBedroomMax: 1200, twoBedroomMin: 1000, twoBedroomMax: 1800, currency: 'EUR' },
    'Porto': { oneBedroomMin: 500, oneBedroomMax: 900, twoBedroomMin: 700, twoBedroomMax: 1300, currency: 'EUR' },
    'default': { oneBedroomMin: 600, oneBedroomMax: 1000, twoBedroomMin: 800, twoBedroomMax: 1400, currency: 'EUR' }
  },
  'Spain': {
    'Barcelona': { oneBedroomMin: 800, oneBedroomMax: 1500, twoBedroomMin: 1200, twoBedroomMax: 2200, currency: 'EUR' },
    'Madrid': { oneBedroomMin: 750, oneBedroomMax: 1400, twoBedroomMin: 1100, twoBedroomMax: 2000, currency: 'EUR' },
    'default': { oneBedroomMin: 600, oneBedroomMax: 1200, twoBedroomMin: 900, twoBedroomMax: 1600, currency: 'EUR' }
  },
  'Mexico': {
    'Mexico City': { oneBedroomMin: 400, oneBedroomMax: 750, twoBedroomMin: 600, twoBedroomMax: 1200, currency: 'USD' },
    'default': { oneBedroomMin: 300, oneBedroomMax: 600, twoBedroomMin: 450, twoBedroomMax: 900, currency: 'USD' }
  },
  'Costa Rica': {
    'San José': { oneBedroomMin: 500, oneBedroomMax: 900, twoBedroomMin: 700, twoBedroomMax: 1300, currency: 'USD' },
    'default': { oneBedroomMin: 400, oneBedroomMax: 700, twoBedroomMin: 600, twoBedroomMax: 1000, currency: 'USD' }
  },
  'default': {
    'default': { oneBedroomMin: 800, oneBedroomMax: 1500, twoBedroomMin: 1200, twoBedroomMax: 2200, currency: 'USD' }
  }
};

// Function to analyze budget compatibility
function analyzeBudgetCompatibility(monthlyBudget: number, country: string, city?: string): string {
  const countryData = cityBudgetData[country] || cityBudgetData.default;
  const cityData = (city && countryData[city]) ? countryData[city] : countryData.default;
  
  // Convert budget to local currency if needed (simplified conversion for demo)
  let localBudget = monthlyBudget;
  if (cityData.currency === 'EUR') {
    localBudget = monthlyBudget * 0.92; // Approximate USD to EUR conversion
  }
  
  const cityName = city || country;
  const currencySymbol = cityData.currency === 'EUR' ? '€' : '$';
  
  // Check compatibility for 1-bedroom
  let budgetStatus = '';
  if (localBudget >= cityData.oneBedroomMax) {
    budgetStatus = `excellent - Your budget of $${monthlyBudget}/month (${currencySymbol}${Math.round(localBudget)}) comfortably covers premium 1-2 bedroom rentals in ${cityName}. Range: ${currencySymbol}${cityData.oneBedroomMin}-${cityData.oneBedroomMax}/month (1BR), ${currencySymbol}${cityData.twoBedroomMin}-${cityData.twoBedroomMax}/month (2BR).`;
  } else if (localBudget >= cityData.oneBedroomMin && localBudget < cityData.oneBedroomMax) {
    budgetStatus = `good - Your budget of $${monthlyBudget}/month (${currencySymbol}${Math.round(localBudget)}) covers most 1-bedroom apartments in ${cityName}. Range: ${currencySymbol}${cityData.oneBedroomMin}-${cityData.oneBedroomMax}/month (1BR). For 2-bedroom: ${currencySymbol}${cityData.twoBedroomMin}-${cityData.twoBedroomMax}/month.`;
  } else if (localBudget >= cityData.oneBedroomMin * 0.8) {
    budgetStatus = `tight - Your budget of $${monthlyBudget}/month (${currencySymbol}${Math.round(localBudget)}) may be challenging for ${cityName}. Consider smaller apartments or neighboring areas. Typical range: ${currencySymbol}${cityData.oneBedroomMin}-${cityData.oneBedroomMax}/month (1BR).`;
  } else {
    budgetStatus = `insufficient - Your budget of $${monthlyBudget}/month (${currencySymbol}${Math.round(localBudget)}) is below typical rental costs in ${cityName}. Consider increasing budget or exploring more affordable areas. Typical range: ${currencySymbol}${cityData.oneBedroomMin}-${cityData.oneBedroomMax}/month (1BR).`;
  }
  
  return budgetStatus;
}

// Assessment scoring algorithm - Enhanced to allow 90%+ scores
function calculateScore(assessment: any): { score: number; matchLevel: string; budgetCompatibility: string } | { error: boolean; message: string; details: string; climateConflict: any } {
  // Country scoring data (simplified for MVP)
  const countryScores: { [key: string]: any } = {
    'Portugal': {
      immigration_policies: 4,
      healthcare: 4,
      safety: 4,
      internet: 4,
      emigration_process: 4,
      ease_of_immigration: 4,
      local_acceptance: 4,
      climate_type: 'mediterranean',
    },
    'Spain': {
      immigration_policies: 4,
      healthcare: 4,
      safety: 4,
      internet: 3,
      emigration_process: 4,
      ease_of_immigration: 4,
      local_acceptance: 4,
      climate_type: 'mediterranean',
    },
    'Mexico': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 2,
      internet: 3,
      emigration_process: 4,
      ease_of_immigration: 4,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Costa Rica': {
      immigration_policies: 4,
      healthcare: 3,
      safety: 3,
      internet: 3,
      emigration_process: 4,
      ease_of_immigration: 4,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Panama': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 3,
      internet: 3,
      emigration_process: 4,
      ease_of_immigration: 4,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Ecuador': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 2,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Colombia': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 2,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Brazil': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 2,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Argentina': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 3,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'temperate',
    },
    'Chile': {
      immigration_policies: 3,
      healthcare: 4,
      safety: 4,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'mediterranean',
    },
    'Uruguay': {
      immigration_policies: 4,
      healthcare: 3,
      safety: 4,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 4,
      local_acceptance: 4,
      climate_type: 'temperate',
    },
    'Thailand': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 3,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'tropical',
    },
    'Malaysia': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 3,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'tropical',
    },
    'Philippines': {
      immigration_policies: 3,
      healthcare: 2,
      safety: 2,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Vietnam': {
      immigration_policies: 2,
      healthcare: 2,
      safety: 3,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 2,
      local_acceptance: 3,
      climate_type: 'tropical',
    },
    'Japan': {
      immigration_policies: 2,
      healthcare: 5,
      safety: 5,
      internet: 5,
      emigration_process: 2,
      ease_of_immigration: 2,
      local_acceptance: 2,
      climate_type: 'seasonal',
    },
    'South Korea': {
      immigration_policies: 2,
      healthcare: 4,
      safety: 4,
      internet: 5,
      emigration_process: 2,
      ease_of_immigration: 2,
      local_acceptance: 2,
      climate_type: 'seasonal',
    },
    'Singapore': {
      immigration_policies: 3,
      healthcare: 5,
      safety: 5,
      internet: 5,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'tropical',
    },
    'Australia': {
      immigration_policies: 3,
      healthcare: 4,
      safety: 4,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'temperate',
    },
    'New Zealand': {
      immigration_policies: 4,
      healthcare: 4,
      safety: 5,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'temperate',
    },
    'Canada': {
      immigration_policies: 4,
      healthcare: 5,
      safety: 5,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'northern',
    },
    'United Kingdom': {
      immigration_policies: 3,
      healthcare: 4,
      safety: 4,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'seasonal',
    },
    'Ireland': {
      immigration_policies: 4,
      healthcare: 4,
      safety: 4,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 4,
      local_acceptance: 4,
      climate_type: 'seasonal',
    },
    'Germany': {
      immigration_policies: 4,
      healthcare: 5,
      safety: 4,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'seasonal',
    },
    'France': {
      immigration_policies: 3,
      healthcare: 4,
      safety: 4,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'temperate',
    },
    'Italy': {
      immigration_policies: 3,
      healthcare: 4,
      safety: 3,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'mediterranean',
    },
    'Netherlands': {
      immigration_policies: 4,
      healthcare: 4,
      safety: 4,
      internet: 5,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'temperate',
    },
    'Denmark': {
      immigration_policies: 4,
      healthcare: 5,
      safety: 5,
      internet: 5,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'seasonal',
    },
    'Sweden': {
      immigration_policies: 4,
      healthcare: 5,
      safety: 5,
      internet: 5,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'northern',
    },
    'Norway': {
      immigration_policies: 4,
      healthcare: 5,
      safety: 5,
      internet: 5,
      emigration_process: 3,
      ease_of_immigration: 2,
      local_acceptance: 3,
      climate_type: 'northern',
    },
    'Finland': {
      immigration_policies: 4,
      healthcare: 5,
      safety: 5,
      internet: 5,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'northern',
    },
    'Switzerland': {
      immigration_policies: 2,
      healthcare: 5,
      safety: 5,
      internet: 5,
      emigration_process: 2,
      ease_of_immigration: 2,
      local_acceptance: 3,
      climate_type: 'seasonal',
    },
    'Austria': {
      immigration_policies: 3,
      healthcare: 4,
      safety: 4,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'seasonal',
    },
    'Belgium': {
      immigration_policies: 4,
      healthcare: 4,
      safety: 4,
      internet: 4,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'temperate',
    },
    'Ghana': {
      immigration_policies: 3,
      healthcare: 2,
      safety: 2,
      internet: 2,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Liberia': {
      immigration_policies: 4,
      healthcare: 2,
      safety: 2,
      internet: 2,
      emigration_process: 3,
      ease_of_immigration: 4,
      local_acceptance: 4,
      climate_type: 'tropical',
    },
    'Nigeria': {
      immigration_policies: 3,
      healthcare: 2,
      safety: 2,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'tropical',
    },
    'Morocco': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 3,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'dry',
    },
    // Default fallback for other countries
    'default': {
      immigration_policies: 3,
      healthcare: 3,
      safety: 3,
      internet: 3,
      emigration_process: 3,
      ease_of_immigration: 3,
      local_acceptance: 3,
      climate_type: 'temperate',
    }
  };

  const countryData = countryScores[assessment.preferred_country] || countryScores.default;
  
  const factors = [
    'immigration_policies',
    'healthcare',
    'safety',
    'internet',
    'emigration_process',
    'ease_of_immigration',
    'local_acceptance'
  ];

  // Check for complete climate mismatches first - return error instead of score
  let climateMatchType = 'mismatch';
  
  if (assessment.climate_preference === countryData.climate_type) {
    climateMatchType = 'perfect';
  } else {
    // Define climate compatibility rules
    const climateCompatibility: { [key: string]: string[] } = {
      'tropical': ['temperate'],
      'seasonal': ['temperate', 'northern'],
      'dry': ['mediterranean'],
      'mediterranean': ['temperate', 'dry'],
      'temperate': ['seasonal', 'mediterranean', 'tropical'],
      'northern': ['seasonal'] // Northern is ONLY compatible with seasonal
    };
    
    const compatibleClimates = climateCompatibility[assessment.climate_preference] || [];
    if (compatibleClimates.includes(countryData.climate_type)) {
      climateMatchType = 'partial';
    } else {
      climateMatchType = 'complete_mismatch';
    }
  }
  
  // Return error for complete climate mismatches instead of trying to score them
  if (climateMatchType === 'complete_mismatch') {
    console.log(`🚫 COMPLETE CLIMATE MISMATCH DETECTED: ${assessment.climate_preference} vs ${countryData.climate_type}`);
    return { 
      error: true,
      message: "Climate and country selected are incompatible. Please reconsider your climate preference or choose a different destination.",
      details: `You selected "${assessment.climate_preference}" climate but ${assessment.preferred_country} has a "${countryData.climate_type}" climate. These are fundamentally incompatible.`,
      climateConflict: {
        userPreference: assessment.climate_preference,
        countryClimate: countryData.climate_type,
        country: assessment.preferred_country
      }
    };
  }

  // Enhanced scoring algorithm that gives more weight to user preferences (only for compatible climates)
  let weightedScore = 0;
  let totalImportanceWeight = 0;
  let perfectMatchBonus = 0;
  let highImportanceFactors = 0;

  factors.forEach(factor => {
    const importance = assessment[`${factor}_importance`];
    const countryScore = countryData[factor];
    
    // Apply exponential weighting to importance ratings (1.5x multiplier for higher importance)
    const importanceWeight = Math.pow(importance, 1.5);
    
    // Base score calculation with enhanced weighting
    const factorScore = (countryScore / 4) * importanceWeight; // Normalize country scores to 0-1 scale
    
    weightedScore += factorScore;
    totalImportanceWeight += importanceWeight;
    
    // Bonus system for high-importance factors that match well
    if (importance >= 4) {
      highImportanceFactors++;
      if (countryScore >= 4) {
        perfectMatchBonus += 0.15; // 15% bonus for each high-importance factor that scores 4+
      }
    }
    
    // Extra bonus for perfect matches (5/5) on any factor
    if (countryScore === 5 && importance >= 3) {
      perfectMatchBonus += 0.1; // 10% bonus for perfect country scores on important factors
    }
  });

  // Add climate scoring (only for compatible climates - we already filtered out incompatible ones)
  let climateScore = 0;
  
  if (climateMatchType === 'perfect') {
    climateScore = 5; // Perfect match
  } else if (climateMatchType === 'partial') {
    climateScore = 3; // Partial match gets decent points
  }
  
  // Climate weight (moderate since we filtered out incompatible climates)
  const climateImportanceWeight = 8;
  const climateContribution = (climateScore / 5) * climateImportanceWeight;
  weightedScore += climateContribution;
  totalImportanceWeight += climateImportanceWeight;

  // Calculate base score (0-100)
  const baseScore = (weightedScore / totalImportanceWeight) * 100;
  
  // Apply bonus multiplier for countries that excel in user's priorities
  const bonusMultiplier = 1 + perfectMatchBonus;
  
  // Additional preference alignment bonus (up to 20% for well-aligned preferences)
  let alignmentBonus = 0;
  if (highImportanceFactors >= 4) {
    // Strong preference alignment - user has clear priorities
    alignmentBonus = Math.min(10, highImportanceFactors * 2);
  }
  
  // Calculate final score with all bonuses (no climate penalty needed since we filtered out mismatches)
  let finalScore = (baseScore * bonusMultiplier) + alignmentBonus;
  
  console.log(`📊 SCORE BEFORE RURAL CHECK: ${finalScore}, location: ${assessment.location_preference}`);
  
  // Apply comprehensive rural location penalties across all relevant factors
  let totalRuralPenalty = 0;
  const ruralPenalties: { [key: string]: number } = {};
  
  console.log(`🏞️ CHECKING RURAL PENALTIES for location: ${assessment.location_preference}`);
  console.log(`🏞️ Current finalScore before rural penalties: ${finalScore}`);
  
  if (assessment.location_preference === 'rural') {
    // Internet infrastructure penalty (most severe)
    if (assessment.internet_importance >= 3) {
      const internetPenalty = Math.min(15, assessment.internet_importance * 3);
      totalRuralPenalty += internetPenalty;
      ruralPenalties.internet = internetPenalty;
    }
    
    // Healthcare accessibility penalty (major hospitals and specialists limited)
    if (assessment.healthcare_importance >= 3) {
      const healthcarePenalty = Math.min(12, assessment.healthcare_importance * 2.5);
      totalRuralPenalty += healthcarePenalty;
      ruralPenalties.healthcare = healthcarePenalty;
    }
    
    // Immigration services penalty (limited access to government offices, legal services)
    if (assessment.immigration_policies_importance >= 3) {
      const immigrationPenalty = Math.min(10, assessment.immigration_policies_importance * 2);
      totalRuralPenalty += immigrationPenalty;
      ruralPenalties.immigration_policies = immigrationPenalty;
    }
    
    // Emigration process penalty (limited support services, legal assistance)
    if (assessment.emigration_process_importance >= 3) {
      const emigrationPenalty = Math.min(10, assessment.emigration_process_importance * 2);
      totalRuralPenalty += emigrationPenalty;
      ruralPenalties.emigration_process = emigrationPenalty;
    }
    
    // Ease of immigration penalty (fewer professional services, language support)
    if (assessment.ease_of_immigration_importance >= 3) {
      const easeImmigrationPenalty = Math.min(9, assessment.ease_of_immigration_importance * 2);
      totalRuralPenalty += easeImmigrationPenalty;
      ruralPenalties.ease_of_immigration = easeImmigrationPenalty;
    }
    
    // Safety penalty (slower emergency response times, limited police presence)
    if (assessment.safety_importance >= 4) {
      const safetyPenalty = Math.min(8, assessment.safety_importance * 1.5);
      totalRuralPenalty += safetyPenalty;
      ruralPenalties.safety = safetyPenalty;
    }
    
    // Apply total penalty with a maximum cap to prevent unreasonably low scores
    const maxTotalRuralPenalty = 45;
    totalRuralPenalty = Math.min(totalRuralPenalty, maxTotalRuralPenalty);
    
    console.log(`🏕️ APPLYING RURAL PENALTY: ${totalRuralPenalty} points from score ${finalScore}`);
    finalScore -= totalRuralPenalty;
    console.log(`🏕️ SCORE AFTER RURAL PENALTY: ${finalScore}`);
    
    console.log(`🏕️ COMPREHENSIVE RURAL PENALTIES APPLIED:`, {
      totalPenalty: totalRuralPenalty,
      maxPossible: maxTotalRuralPenalty,
      individualPenalties: ruralPenalties,
      reasoning: 'Rural areas have limited infrastructure, services, and professional support'
    });
  }
  
  // Ensure minimum score of 5 but don't cap at 100 if rural penalties brought it below
  // This allows rural penalties to properly reduce high scores
  const scoreBeforeRounding = finalScore;
  console.log(`⚡ SCORE BEFORE ROUNDING: ${scoreBeforeRounding}`);
  
  // Apply rounding first, then apply minimum floor, but don't apply maximum ceiling if rural penalties were applied
  finalScore = Math.round(finalScore);
  finalScore = Math.max(5, finalScore); // Apply minimum floor
  
  // Only apply maximum ceiling of 100 if no rural penalties were applied
  if (assessment.location_preference !== 'rural' || totalRuralPenalty === 0) {
    finalScore = Math.min(100, finalScore);
  }
  
  console.log(`⚡ SCORE AFTER ROUNDING AND FLOORING: ${finalScore}`);
  
  // Determine match level with updated thresholds
  let matchLevel = 'poor';
  if (finalScore >= 95) matchLevel = 'perfect';
  else if (finalScore >= 85) matchLevel = 'very_good';
  else if (finalScore >= 70) matchLevel = 'good';
  
  console.log(`🎯 FINAL SCORE CALCULATION SUMMARY:`, {
    country: assessment.preferred_country,
    locationPreference: assessment.location_preference,
    scoreBeforeRounding,
    scoreAfterRounding: finalScore,
    totalRuralPenalty: assessment.location_preference === 'rural' ? totalRuralPenalty : 'N/A',
    ruralPenaltiesApplied: Object.keys(ruralPenalties).length,
    matchLevel
  });

  console.log(`🌡️ CLIMATE SCORING DEBUG for ${assessment.preferred_country}:`, {
    userClimatePreference: assessment.climate_preference,
    countryClimateType: countryData.climate_type,
    climateMatchType,
    climateScore,
    climateWeight: climateImportanceWeight,
    climateContribution,
    isClimateMatch: assessment.climate_preference === countryData.climate_type
  });
  
  console.log(`📊 FULL SCORE CALCULATION for ${assessment.preferred_country}:`, {
    baseScore: Math.round(baseScore),
    bonusMultiplier: Math.round(bonusMultiplier * 100) / 100,
    alignmentBonus,
    perfectMatchBonus: Math.round(perfectMatchBonus * 100) / 100,
    highImportanceFactors,
    totalRuralPenalty: totalRuralPenalty,
    ruralPenaltyBreakdown: ruralPenalties,
    locationPreference: assessment.location_preference,
    finalScore,
    matchLevel,
    totalWeightedScore: Math.round(weightedScore),
    totalImportanceWeight,
    rawPercentage: Math.round((weightedScore / totalImportanceWeight) * 100)
  });

  // Analyze budget compatibility
  const budgetCompatibility = analyzeBudgetCompatibility(
    assessment.monthly_budget || 2000,
    assessment.preferred_country,
    assessment.preferred_city
  );

  return { score: finalScore, matchLevel, budgetCompatibility };
}

// Create assessment
app.post("/api/assessments", zValidator("json", AssessmentSchema), async (c) => {
  try {
    const assessment = c.req.valid("json");
    const scoreResult = calculateScore(assessment);
    
    // Check if there was a climate compatibility error
    if ('error' in scoreResult) {
      return c.json({
        error: scoreResult.message,
        details: scoreResult.details,
        climateConflict: scoreResult.climateConflict,
        requiresReselection: true
      }, 400);
    }
    
    const { score, matchLevel, budgetCompatibility } = scoreResult;

    const result = await c.env.DB.prepare(`
      INSERT INTO assessments (
        user_age, user_job, monthly_budget, preferred_country, preferred_city, location_preference,
        climate_preference, immigration_policies_importance, healthcare_importance, safety_importance,
        internet_importance, emigration_process_importance, ease_of_immigration_importance,
        local_acceptance_importance, overall_score, match_level, budget_compatibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assessment.user_age,
      assessment.user_job,
      assessment.monthly_budget || 2000,
      assessment.preferred_country,
      assessment.preferred_city || null,
      assessment.location_preference,
      assessment.climate_preference,
      assessment.immigration_policies_importance,
      assessment.healthcare_importance,
      assessment.safety_importance,
      assessment.internet_importance,
      assessment.emigration_process_importance,
      assessment.ease_of_immigration_importance,
      assessment.local_acceptance_importance,
      score,
      matchLevel,
      budgetCompatibility
    ).run();

    return c.json({ id: result.meta.last_row_id, score, matchLevel });
  } catch (error) {
    console.error("Error creating assessment:", error);
    return c.json({ error: "Failed to create assessment" }, 500);
  }
});

// Get assessment result
app.get("/api/assessments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await c.env.DB.prepare(
      "SELECT * FROM assessments WHERE id = ?"
    ).bind(id).first();

    if (!result) {
      return c.json({ error: "Assessment not found" }, 404);
    }

    // Check if assessment is still within retention period
    const retentionService = new RetentionCleanupService(c.env.DB, c.env.REPORTS_KV);
    const isRetained = await retentionService.isAssessmentRetained(Number(id));
    
    if (!isRetained) {
      return c.json({ 
        error: "Assessment data has expired", 
        message: "This assessment data is no longer available due to our two-year retention policy.",
        retentionExpired: true 
      }, 410); // 410 Gone - resource no longer available
    }

    return c.json(result);
  } catch (error) {
    console.error("Error fetching assessment:", error);
    return c.json({ error: "Failed to fetch assessment" }, 500);
  }
});

// Create payment intent for report purchase
app.post("/api/payments/create-intent", zValidator("json", PaymentIntentSchema), async (c) => {
  try {
    console.log('=== PAYMENT INTENT CREATION START ===');
    const { assessmentId, customerEmail } = c.req.valid("json");
    console.log('Assessment ID:', assessmentId, 'Customer Email:', customerEmail);
    
    // Verify assessment exists
    const assessment = await c.env.DB.prepare(
      "SELECT * FROM assessments WHERE id = ?"
    ).bind(assessmentId).first();

    if (!assessment) {
      console.error('Assessment not found:', assessmentId);
      return c.json({ error: "Assessment not found" }, 404);
    }
    console.log('Assessment found:', assessment.preferred_country);

    // Check if report already exists and is paid
    const existingReport = await c.env.DB.prepare(`
      SELECT r.*, p.status 
      FROM reports r 
      LEFT JOIN payments p ON r.payment_id = p.id 
      WHERE r.assessment_id = ? AND p.status = 'succeeded'
    `).bind(assessmentId).first();

    if (existingReport) {
      console.log('Report already exists for assessment:', assessmentId);
      return c.json({ 
        error: "Report already purchased",
        reportExists: true 
      }, 400);
    }

    // CRITICAL FIX: Always prioritize environment variables over KV storage to prevent test key confusion
    let stripeKey = c.env.STRIPE_SECRET_KEY;
    let keySource = 'environment';
    
    console.log('=== STRIPE KEY SELECTION DEBUG ===');
    console.log('Environment STRIPE_SECRET_KEY exists:', !!c.env.STRIPE_SECRET_KEY);
    console.log('Environment key prefix:', c.env.STRIPE_SECRET_KEY ? c.env.STRIPE_SECRET_KEY.substring(0, 12) : 'NONE');
    
    // ONLY use KV storage if environment variable is not set
    if (!c.env.STRIPE_SECRET_KEY && c.env.REPORTS_KV) {
      try {
        const kvKey = await c.env.REPORTS_KV.get('stripe_secret_key');
        if (kvKey) {
          stripeKey = kvKey;
          keySource = 'kv_storage';
          console.log('WARNING: Using KV storage key because environment variable not set');
          console.log('KV key prefix:', kvKey.substring(0, 12));
        }
      } catch (kvError) {
        console.warn('Failed to get key from KV storage:', kvError);
      }
    } else if (c.env.STRIPE_SECRET_KEY) {
      console.log('✅ Using environment variable (preferred method)');
    }
    
    console.log('Final key source:', keySource);
    console.log('Final key prefix:', stripeKey ? stripeKey.substring(0, 12) : 'NONE');
    console.log('=====================================');
    
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not configured in environment or KV storage");
      return c.json({ 
        error: "Payment system not configured. Please configure your Stripe secret key.",
        needsConfig: true 
      }, 500);
    }

    console.log('=== STRIPE KEY DEBUG (CREATION) ===');
    console.log('Key source:', keySource);
    console.log('Full key:', stripeKey);
    console.log('Key prefix (first 12 chars):', stripeKey.substring(0, 12));
    console.log('Key length:', stripeKey.length);
    console.log('Starts with sk_test_:', stripeKey.startsWith('sk_test_'));
    console.log('Starts with sk_live_:', stripeKey.startsWith('sk_live_'));
    console.log('=======================================');

    // Validate Stripe key format and detect test vs live mode
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      console.error("Invalid Stripe key format:", stripeKey.substring(0, 10));
      return c.json({ 
        error: "Invalid Stripe secret key format. Must start with sk_test_ or sk_live_",
        needsConfig: true 
      }, 500);
    }

    const isTestMode = stripeKey.startsWith('sk_test_');
    console.log(`Stripe mode: ${isTestMode ? 'TEST' : 'LIVE'} mode detected for creation`);

    const stripe = new Stripe(stripeKey);

    // Test Stripe connection first
    console.log('Testing Stripe connection...');
    try {
      const customerTest = await stripe.customers.list({ limit: 1 });
      console.log('✅ Stripe connection test successful, customer count:', customerTest.data.length);
    } catch (connectionError: any) {
      console.error('❌ Stripe connection test failed:', connectionError);
      return c.json({ 
        error: `Stripe configuration error: ${connectionError.message}`,
        details: `Check your Stripe ${isTestMode ? 'test' : 'live'} key is valid and has the correct permissions`,
        stripeMode: isTestMode ? 'test' : 'live',
        needsConfig: true,
        stripeErrorCode: connectionError.code,
        stripeErrorType: connectionError.type
      }, 400);
    }

    console.log('Creating payment intent...');
    let paymentIntent;
    try {
      const paymentIntentData = {
        amount: 4999, // $49.99 in cents
        currency: 'usd',
        receipt_email: customerEmail,
        metadata: {
          assessmentId: assessmentId.toString(),
          product: 'emigration_report',
          stripeMode: isTestMode ? 'test' : 'live',
          keySource: keySource,
          createdAt: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };
      
      console.log('Payment intent creation data:', JSON.stringify(paymentIntentData, null, 2));
      
      paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
      
      console.log(`✅ Payment intent created successfully in ${isTestMode ? 'TEST' : 'LIVE'} mode:`, {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        client_secret_prefix: paymentIntent.client_secret?.substring(0, 20) + '...'
      });
    } catch (stripeError: any) {
      console.error('❌ Stripe payment intent creation error:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        decline_code: stripeError.decline_code,
        payment_intent: stripeError.payment_intent,
        charge: stripeError.charge
      });
      return c.json({ 
        error: `Payment system error: ${stripeError.message}`,
        details: `Error in ${isTestMode ? 'test' : 'live'} mode - check your Stripe account configuration`,
        stripeMode: isTestMode ? 'test' : 'live',
        stripeError: true,
        stripeErrorCode: stripeError.code,
        stripeErrorType: stripeError.type
      }, 400);
    }

    // Store payment intent in database
    console.log('Storing payment intent in database...');
    try {
      const dbResult = await c.env.DB.prepare(`
        INSERT INTO payments (assessment_id, stripe_payment_intent_id, amount, currency, status, customer_email)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        assessmentId,
        paymentIntent.id,
        4999,
        'usd',
        'pending',
        customerEmail || null
      ).run();
      
      console.log('✅ Payment stored in database, row ID:', dbResult.meta?.last_row_id);
    } catch (dbError) {
      console.error('❌ Database storage error:', dbError);
      // Don't fail the request for database errors, PI is already created
    }

    console.log('=== PAYMENT INTENT CREATION COMPLETE ===');
    return c.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stripeMode: isTestMode ? 'test' : 'live',
      testMode: isTestMode,
      keySource: keySource,
      debug: {
        keyUsed: stripeKey.substring(0, 12) + '...',
        mode: isTestMode ? 'test' : 'live',
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error("❌ CRITICAL ERROR in payment intent creation:", error);
    return c.json({ 
      error: error instanceof Error ? error.message : "Failed to create payment intent",
      details: error instanceof Error ? error.stack : "Unknown error",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Handle payment confirmation and queue report generation
app.post("/api/payments/confirm/:paymentIntentId", async (c) => {
  try {
    const paymentIntentId = c.req.param("paymentIntentId");
    console.log(`=== PAYMENT CONFIRMATION START for ${paymentIntentId} ===`);
    
    // First, check our database to see what key mode was used for creation
    console.log('Checking payment record in database...');
    const paymentRecord = await c.env.DB.prepare(`
      SELECT * FROM payments WHERE stripe_payment_intent_id = ?
    `).bind(paymentIntentId).first();
    
    if (!paymentRecord) {
      console.error('❌ Payment record not found in database for PI:', paymentIntentId);
      return c.json({ 
        error: `Payment record not found in database: ${paymentIntentId}`,
        details: "This payment intent was not found in our local database, which suggests it may not have been created properly.",
        troubleshooting: "Check if the payment intent was actually created successfully."
      }, 404);
    }
    
    console.log('✅ Payment record found in database:', {
      id: paymentRecord.id,
      assessment_id: paymentRecord.assessment_id,
      status: paymentRecord.status,
      created_at: paymentRecord.created_at
    });
    
    // CRITICAL FIX: Use EXACT same logic as payment intent creation - environment first
    let stripeKey = c.env.STRIPE_SECRET_KEY;
    let keySource = 'environment';
    
    console.log('=== PAYMENT CONFIRMATION KEY SELECTION ===');
    console.log('Environment STRIPE_SECRET_KEY exists:', !!c.env.STRIPE_SECRET_KEY);
    console.log('Environment key prefix:', c.env.STRIPE_SECRET_KEY ? c.env.STRIPE_SECRET_KEY.substring(0, 12) : 'NONE');
    
    // ONLY use KV storage if environment variable is not set (matching creation logic exactly)
    if (!c.env.STRIPE_SECRET_KEY && c.env.REPORTS_KV) {
      try {
        const kvKey = await c.env.REPORTS_KV.get('stripe_secret_key');
        if (kvKey) {
          stripeKey = kvKey;
          keySource = 'kv_storage';
          console.log('WARNING: Using KV storage key for confirmation because environment variable not set');
          console.log('KV key prefix:', kvKey.substring(0, 12));
        }
      } catch (kvError) {
        console.warn('Failed to get key from KV storage for confirmation:', kvError);
      }
    } else if (c.env.STRIPE_SECRET_KEY) {
      console.log('✅ Using environment variable for confirmation (preferred method)');
    }
    
    console.log('Confirmation key source:', keySource);
    console.log('Confirmation key prefix:', stripeKey ? stripeKey.substring(0, 12) : 'NONE');
    console.log('============================================');
    
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return c.json({ error: "Payment system not configured" }, 500);
    }

    // Add detailed debugging for confirmation - EXACTLY matching creation logic
    console.log('=== CONFIRMATION STRIPE KEY DEBUG ===');
    console.log('Key source:', keySource);
    console.log('Full key used for confirmation:', stripeKey);
    console.log('Key prefix (first 12 chars):', stripeKey.substring(0, 12));
    console.log('Key length:', stripeKey.length);
    console.log('Starts with sk_test_:', stripeKey.startsWith('sk_test_'));
    console.log('Starts with sk_live_:', stripeKey.startsWith('sk_live_'));
    console.log('Is test mode for confirmation:', stripeKey.startsWith('sk_test_'));
    console.log('Payment Intent ID to retrieve:', paymentIntentId);
    console.log('=========================================');

    // Check if we're using test mode vs live mode consistently
    const isTestMode = stripeKey.startsWith('sk_test_');
    const isLiveMode = stripeKey.startsWith('sk_live_');
    
    if (!isTestMode && !isLiveMode) {
      console.error('❌ Invalid Stripe key format for confirmation');
      return c.json({ 
        error: "Invalid Stripe key format for confirmation",
        details: "Stripe key must start with sk_test_ or sk_live_"
      }, 500);
    }
    
    console.log(`Using ${isTestMode ? 'TEST' : 'LIVE'} mode for confirmation`);
    
    const stripe = new Stripe(stripeKey);
    
    // Test Stripe connection before attempting retrieval
    console.log('Testing Stripe connection for confirmation...');
    try {
      await stripe.customers.list({ limit: 1 });
      console.log('✅ Stripe connection test for confirmation successful');
    } catch (connectionError: any) {
      console.error('❌ Stripe connection test failed for confirmation:', connectionError);
      return c.json({ 
        error: `Stripe connection failed: ${connectionError.message}`,
        details: `Check your Stripe ${isTestMode ? 'test' : 'live'} key configuration`,
        stripeMode: isTestMode ? 'test' : 'live'
      }, 400);
    }
    
    console.log('Retrieving payment intent from Stripe...');
    
    // Add try-catch around the payment intent retrieval with detailed error logging
    let paymentIntent;
    try {
      console.log(`Attempting to retrieve PI ${paymentIntentId} with key ${stripeKey.substring(0, 12)}...`);
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log(`✅ Payment intent retrieved successfully:`, {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        created: new Date(paymentIntent.created * 1000).toISOString()
      });
    } catch (stripeRetrievalError: any) {
      console.error(`❌ STRIPE RETRIEVAL ERROR for PI ${paymentIntentId}:`, {
        errorType: stripeRetrievalError.type,
        errorCode: stripeRetrievalError.code,
        errorMessage: stripeRetrievalError.message,
        errorDeclineCode: stripeRetrievalError.decline_code,
        keyUsed: stripeKey.substring(0, 12) + '...',
        keySource: keySource,
        isTestMode: stripeKey.startsWith('sk_test_'),
        paymentIntentId: paymentIntentId
      });
      
      // Check if this is the specific "No such payment_intent" error
      if (stripeRetrievalError.code === 'resource_missing') {
        // Additional debugging: let's see if there's a mismatch in test vs live
        const hasTestKey = stripeKey.startsWith('sk_test_');
        const hasLiveKey = stripeKey.startsWith('sk_live_');
        const isTestPI = paymentIntentId.startsWith('pi_test_') || paymentIntentId.includes('test');
        
        console.log('🔍 KEY MISMATCH ANALYSIS:', {
          hasTestKey,
          hasLiveKey,
          paymentIntentId,
          isTestPI,
          potentialMismatch: (hasTestKey && !isTestPI) || (hasLiveKey && isTestPI)
        });
        
        return c.json({ 
          error: `Payment intent not found: ${paymentIntentId}`,
          details: `This could indicate a Stripe key mismatch. Payment intent was created with one key but being retrieved with another.`,
          stripeError: stripeRetrievalError.message,
          keyMode: stripeKey.startsWith('sk_test_') ? 'test' : 'live',
          keySource: keySource,
          troubleshooting: "Check if the same Stripe key (test/live) is being used for both creation and confirmation.",
          paymentIntentId: paymentIntentId,
          debugInfo: {
            keyPrefix: stripeKey.substring(0, 12),
            isTestMode,
            paymentIntentPrefix: paymentIntentId.substring(0, 10)
          }
        }, 404);
      }
      
      // Re-throw other Stripe errors
      throw stripeRetrievalError;
    }
    console.log(`Payment intent status: ${paymentIntent.status}`);

    if (paymentIntent.status !== 'succeeded') {
      console.error(`❌ Payment intent status not succeeded: ${paymentIntent.status}`);
      console.log('Payment intent details for troubleshooting:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        lastPaymentError: paymentIntent.last_payment_error,
        cancellationReason: paymentIntent.cancellation_reason
      });
      return c.json({ 
        error: `Payment not completed. Status: ${paymentIntent.status}`,
        paymentIntentId: paymentIntent.id,
        details: paymentIntent.last_payment_error ? paymentIntent.last_payment_error.message : 'No additional error details'
      }, 400);
    }

    // Update payment status
    console.log('Updating payment status in database...');
    const updateResult = await c.env.DB.prepare(`
      UPDATE payments 
      SET status = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP
      WHERE stripe_payment_intent_id = ?
    `).bind(
      paymentIntent.status,
      paymentIntent.payment_method_types[0] || null,
      paymentIntentId
    ).run();

    if (updateResult.meta?.changes === 0) {
      console.error("Payment record not found in database");
      return c.json({ error: "Payment record not found" }, 404);
    }

    // Get payment data
    const paymentData = await c.env.DB.prepare(`
      SELECT * FROM payments WHERE stripe_payment_intent_id = ?
    `).bind(paymentIntentId).first();

    if (!paymentData) {
      console.error("Payment not found in database");
      return c.json({ error: "Payment not found" }, 404);
    }

    const assessmentId = Number(paymentData.assessment_id);

    // Check if report already exists
    console.log('Checking for existing report...');
    const existingReport = await c.env.DB.prepare(
      "SELECT * FROM reports WHERE assessment_id = ?"
    ).bind(assessmentId).first();

    if (existingReport) {
      console.log(`Found existing report with ID: ${existingReport.id}`);
      // Generate new download token
      const downloadToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await c.env.DB.prepare(`
        UPDATE reports 
        SET download_token = ?, download_expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(downloadToken, expiresAt.toISOString(), existingReport.id).run();

      return c.json({ 
        success: true, 
        downloadToken,
        reportId: existingReport.id,
        immediate: true
      });
    }

    // Initialize job queue and enqueue report generation
    console.log('=== QUEUEING REPORT GENERATION (ASYNC) ===');
    if (!c.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return c.json({ error: "Report generation not configured" }, 500);
    }

    const jobQueue = new JobQueue(c.env.DB, c.env.REPORTS_KV, c.env.OPENAI_API_KEY, c.env.RESEND_API_KEY);
    
    const jobId = await jobQueue.enqueueReportGeneration(
      assessmentId,
      Number(paymentData.id),
      paymentData.customer_email ? String(paymentData.customer_email) : undefined
    );

    console.log(`Payment confirmed, report generation queued with job ID: ${jobId}`);

    return c.json({ 
      success: true, 
      jobId,
      message: "Payment confirmed! Your report is being generated and will be ready in 2-5 minutes.",
      immediate: false
    });

  } catch (error) {
    console.error("=== PAYMENT CONFIRMATION ERROR ===");
    console.error("Error confirming payment:", error);
    return c.json({ 
      error: "Failed to process payment confirmation",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Download report with token
app.get("/api/reports/download/:token", async (c) => {
  try {
    const token = c.req.param("token");
    
    const report = await c.env.DB.prepare(`
      SELECT * FROM reports 
      WHERE download_token = ? AND download_expires_at > datetime('now')
    `).bind(token).first();

    if (!report) {
      return c.json({ error: "Invalid or expired download token" }, 404);
    }

    // Retrieve PDF from KV storage
    const pdfUrl = (report as any).pdf_url;
    if (!pdfUrl) {
      return c.json({ error: "PDF URL not available" }, 404);
    }
    
    const pdfBuffer = await c.env.REPORTS_KV.get(pdfUrl, 'arrayBuffer');
    
    if (!pdfBuffer) {
      return c.json({ error: "PDF file not found" }, 404);
    }

    // Get assessment data for filename
    const assessment = await c.env.DB.prepare(
      "SELECT preferred_country, preferred_city FROM assessments WHERE id = ?"
    ).bind(report.assessment_id).first();

    const countryName = String(assessment?.preferred_country || 'Unknown');
    const cityName = assessment?.preferred_city ? String(assessment.preferred_city) : null;
    const filename = `Emigration_Report_${countryName.replace(/\s+/g, '_')}${cityName ? `_${cityName.replace(/\s+/g, '_')}` : ''}.pdf`;

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return c.json({ error: "Failed to download report" }, 500);
  }
});

// Check job status for report generation
app.get("/api/jobs/:jobId/status", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    
    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: "Job system not configured" }, 500);
    }

    const jobQueue = new JobQueue(c.env.DB, c.env.REPORTS_KV, c.env.OPENAI_API_KEY, c.env.RESEND_API_KEY);
    const job = await jobQueue.getJobStatus(jobId);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    // If job is completed, get the download token
    let downloadToken = null;
    if (job.status === 'completed') {
      const report = await c.env.DB.prepare(`
        SELECT download_token FROM reports 
        WHERE assessment_id = ? AND download_expires_at > datetime('now')
        ORDER BY created_at DESC LIMIT 1
      `).bind(job.assessmentId).first();
      
      downloadToken = report?.download_token || null;
    }

    return c.json({
      jobId: job.id,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      errorMessage: job.errorMessage,
      downloadToken
    });
  } catch (error) {
    console.error("Error checking job status:", error);
    return c.json({ error: "Failed to check job status" }, 500);
  }
});

// Get detailed job progress for chunked processing
app.get("/api/jobs/:jobId/progress", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    
    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: "Job system not configured" }, 500);
    }

    const jobQueue = new JobQueue(c.env.DB, c.env.REPORTS_KV, c.env.OPENAI_API_KEY, c.env.RESEND_API_KEY);
    const progress = await jobQueue.getJobProgress(jobId);

    if (!progress) {
      return c.json({ error: "Job not found" }, 404);
    }

    // If job is completed, get the download token
    let downloadToken = null;
    if (progress.status === 'completed') {
      // Get the actual job data to find assessment ID
      const jobData = await jobQueue.getJobStatus(jobId);
      if (jobData) {
        const report = await c.env.DB.prepare(`
          SELECT download_token FROM reports 
          WHERE assessment_id = ? AND download_expires_at > datetime('now')
          ORDER BY created_at DESC LIMIT 1
        `).bind(jobData.assessmentId).first();
        
        downloadToken = report?.download_token || null;
      }
    }

    return c.json({
      ...progress,
      downloadToken
    });
  } catch (error) {
    console.error("Error checking job progress:", error);
    return c.json({ error: "Failed to check job progress" }, 500);
  }
});

// Process pending jobs (can be called by cron or manual trigger)
app.post("/api/jobs/process", async (c) => {
  try {
    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: "Job system not configured" }, 500);
    }

    const jobQueue = new JobQueue(c.env.DB, c.env.REPORTS_KV, c.env.OPENAI_API_KEY, c.env.RESEND_API_KEY);
    
    // First restore any missing KV jobs
    const restoreResults = await jobQueue.restoreMissingKVJobs();
    console.log(`Restored ${restoreResults.restored} missing KV jobs`);
    
    // Then process pending jobs
    await jobQueue.processPendingJobs();

    return c.json({ 
      message: "Pending jobs processed",
      restored: restoreResults.restored,
      errors: restoreResults.errors
    });
  } catch (error) {
    console.error("Error processing pending jobs:", error);
    return c.json({ error: "Failed to process pending jobs" }, 500);
  }
});

// Admin endpoint to restore missing KV jobs
app.post("/api/admin/restore-kv-jobs", async (c) => {
  try {
    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: "Job system not configured" }, 500);
    }

    const jobQueue = new JobQueue(c.env.DB, c.env.REPORTS_KV, c.env.OPENAI_API_KEY, c.env.RESEND_API_KEY);
    const results = await jobQueue.restoreMissingKVJobs();

    return c.json({
      success: true,
      message: `Restored ${results.restored} missing KV jobs`,
      restored: results.restored,
      errors: results.errors
    });
  } catch (error) {
    console.error("Error restoring KV jobs:", error);
    return c.json({ 
      error: "Failed to restore KV jobs",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Process a specific job (admin endpoint)
app.post("/api/jobs/:jobId/process", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    
    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: "Job system not configured" }, 500);
    }

    const jobQueue = new JobQueue(c.env.DB, c.env.REPORTS_KV, c.env.OPENAI_API_KEY);
    const success = await jobQueue.processJob(jobId);

    return c.json({ 
      success, 
      message: success ? "Job processed successfully" : "Job processing failed" 
    });
  } catch (error) {
    console.error("Error processing specific job:", error);
    return c.json({ error: "Failed to process job" }, 500);
  }
});

// Check report status
app.get("/api/reports/status/:assessmentId", async (c) => {
  try {
    const assessmentId = c.req.param("assessmentId");
    
    const reportStatus = await c.env.DB.prepare(`
      SELECT r.id, r.download_token, r.download_expires_at, p.status as payment_status
      FROM reports r
      LEFT JOIN payments p ON r.payment_id = p.id
      WHERE r.assessment_id = ?
      ORDER BY r.created_at DESC
      LIMIT 1
    `).bind(assessmentId).first();

    if (!reportStatus) {
      return c.json({ exists: false });
    }

    const now = new Date();
    const expiresAt = new Date(reportStatus.download_expires_at as string);
    const isExpired = now > expiresAt;

    return c.json({
      exists: true,
      isPaid: reportStatus.payment_status === 'succeeded',
      downloadToken: !isExpired ? reportStatus.download_token : null,
      expiresAt: reportStatus.download_expires_at,
      isExpired
    });
  } catch (error) {
    console.error("Error checking report status:", error);
    return c.json({ error: "Failed to check report status" }, 500);
  }
});

// Debug endpoint to check payment status
app.get("/api/debug/payments", async (c) => {
  try {
    await debugPaymentStatus(c.env.DB);
    return c.json({ message: "Debug info logged to console" });
  } catch (error) {
    console.error("Debug error:", error);
    return c.json({ error: "Debug failed" }, 500);
  }
});

// Debug endpoint to check pending jobs
app.get("/api/debug/pending-jobs", async (c) => {
  try {
    console.log('=== CHECKING PENDING JOBS STATUS ===');
    
    // Get pending jobs from database
    const pendingJobs = await c.env.DB.prepare(`
      SELECT job_id, assessment_id, payment_id, customer_email, status, attempts, max_attempts, created_at, updated_at, error_message
      FROM report_jobs 
      WHERE status = 'pending' AND attempts < max_attempts
      ORDER BY created_at ASC
    `).all();

    // Get processing jobs
    const processingJobs = await c.env.DB.prepare(`
      SELECT job_id, assessment_id, payment_id, customer_email, status, attempts, max_attempts, created_at, updated_at, error_message
      FROM report_jobs 
      WHERE status = 'processing'
      ORDER BY created_at ASC
    `).all();

    // Get failed jobs
    const failedJobs = await c.env.DB.prepare(`
      SELECT job_id, assessment_id, payment_id, customer_email, status, attempts, max_attempts, created_at, updated_at, error_message
      FROM report_jobs 
      WHERE status = 'failed'
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    // Get completed jobs (recent)
    const completedJobs = await c.env.DB.prepare(`
      SELECT job_id, assessment_id, payment_id, customer_email, status, attempts, max_attempts, created_at, updated_at
      FROM report_jobs 
      WHERE status = 'completed'
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    console.log(`Found ${pendingJobs.results.length} pending, ${processingJobs.results.length} processing, ${failedJobs.results.length} failed jobs`);

    return c.json({
      success: true,
      summary: {
        pending: pendingJobs.results.length,
        processing: processingJobs.results.length,
        failed: failedJobs.results.length,
        recentCompleted: completedJobs.results.length
      },
      jobs: {
        pending: pendingJobs.results,
        processing: processingJobs.results,
        failed: failedJobs.results,
        recentCompleted: completedJobs.results
      },
      openaiConfigured: !!c.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error checking pending jobs:", error);
    return c.json({ 
      error: "Failed to check pending jobs",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Manual report generation for stuck payments
app.post("/api/admin/generate-report/:assessmentId", async (c) => {
  try {
    const assessmentId = parseInt(c.req.param("assessmentId"));
    console.log(`=== MANUAL REPORT GENERATION for assessment ${assessmentId} ===`);
    
    // Get assessment data
    const assessment = await c.env.DB.prepare(
      "SELECT * FROM assessments WHERE id = ?"
    ).bind(assessmentId).first();
    
    if (!assessment) {
      return c.json({ error: "Assessment not found" }, 404);
    }
    
    // Check if successful payment exists
    const payment = await c.env.DB.prepare(`
      SELECT * FROM payments 
      WHERE assessment_id = ? AND status = 'succeeded'
      ORDER BY created_at DESC LIMIT 1
    `).bind(assessmentId).first();
    
    if (!payment) {
      return c.json({ error: "No successful payment found for this assessment" }, 400);
    }
    
    // Check if report already exists
    const existingReport = await c.env.DB.prepare(
      "SELECT * FROM reports WHERE assessment_id = ?"
    ).bind(assessmentId).first();
    
    if (existingReport) {
      // Update download token
      const downloadToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await c.env.DB.prepare(`
        UPDATE reports 
        SET download_token = ?, download_expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(downloadToken, expiresAt.toISOString(), existingReport.id).run();
      
      return c.json({ 
        success: true, 
        message: "Report already exists, updated download token",
        downloadToken,
        reportId: existingReport.id 
      });
    }
    
    // Generate new report using ultra-efficient method (1-2 API calls)
    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }
    
    // Convert assessment to proper type for report generation
    const assessmentForReport = {
      id: (assessment as any).id,
      user_age: Number((assessment as any).user_age),
      user_job: String((assessment as any).user_job),
      preferred_country: String((assessment as any).preferred_country),
      preferred_city: (assessment as any).preferred_city || null,
      monthly_budget: Number((assessment as any).monthly_budget) || 2000,
      location_preference: String((assessment as any).location_preference) || 'city',
      climate_preference: String((assessment as any).climate_preference) || 'temperate',
      immigration_policies_importance: Number((assessment as any).immigration_policies_importance),
      healthcare_importance: Number((assessment as any).healthcare_importance),
      safety_importance: Number((assessment as any).safety_importance),
      internet_importance: Number((assessment as any).internet_importance),
      emigration_process_importance: Number((assessment as any).emigration_process_importance),
      ease_of_immigration_importance: Number((assessment as any).ease_of_immigration_importance),
      local_acceptance_importance: Number((assessment as any).local_acceptance_importance),
      overall_score: Number((assessment as any).overall_score) || 70,
      match_level: (String((assessment as any).match_level) || 'good') as 'poor' | 'good' | 'very_good' | 'perfect',
      budget_compatibility: String((assessment as any).budget_compatibility) || 'good',
      created_at: String((assessment as any).created_at || new Date().toISOString()),
      updated_at: String((assessment as any).updated_at || new Date().toISOString())
    };
    
    console.log('Using ultra-efficient report generation (1-2 API calls) for manual generation...');
    const reportGenerator = new ReportGenerator(c.env.OPENAI_API_KEY);
    const report = await reportGenerator.generateUltraEfficientReport(assessmentForReport);
    
    // Generate PDF
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateReportPDF(report, assessmentId);
    
    // Store report
    const downloadToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const reportResult = await c.env.DB.prepare(`
      INSERT INTO reports (assessment_id, payment_id, report_content, download_token, download_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      assessmentId,
      String(payment.id),
      JSON.stringify(report),
      downloadToken,
      expiresAt.toISOString()
    ).run();
    
    const reportId = reportResult.meta.last_row_id;
    const pdfKey = `report-${reportId}`;
    
    await c.env.REPORTS_KV.put(pdfKey, pdfBuffer, {
      expirationTtl: 7 * 24 * 60 * 60
    });
    
    await c.env.DB.prepare(`
      UPDATE reports SET pdf_url = ? WHERE id = ?
    `).bind(pdfKey, reportId).run();
    
    // Send email if provided
    if (payment.customer_email) {
      try {
        await sendManualReportEmail(String(payment.customer_email), {
          country: String(assessment.preferred_country),
          city: assessment.preferred_city ? String(assessment.preferred_city) : undefined,
          downloadToken,
          customerName: String(assessment.user_job),
          expiresAt: expiresAt.toDateString(),
          assessmentId: assessmentId
        }, c.env);
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }
    }

    console.log(`Manual report generation complete for assessment ${assessmentId}`);
    
    return c.json({ 
      success: true, 
      downloadToken,
      reportId: reportId,
      message: "Report generated successfully" 
    });
  } catch (error) {
    console.error("Manual report generation error:", error);
    return c.json({ 
      error: "Failed to generate report",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Test endpoint to generate comprehensive PDF report using async job queue
app.post("/api/test/generate-comprehensive-pdf", async (c) => {
  try {
    console.log('=== INITIATING ASYNC COMPREHENSIVE TEST PDF GENERATION ===');
    
    if (!c.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured for test generation');
      return c.json({ 
        error: "OpenAI API key not configured. Please configure your OpenAI API key to enable report generation.",
        needsConfig: true 
      }, 500);
    }
    
    // Get test user parameters from request body
    const requestBody = await c.req.json().catch(() => ({}));
    const testUser = requestBody.testUser || {};
    
    // Create test assessment in database for job processing
    const sampleAssessment = {
      user_age: testUser.age || 35,
      user_job: testUser.job || "Software Engineer",
      preferred_country: testUser.country || "Portugal",
      preferred_city: testUser.city || "Lisbon",
      location_preference: "city",
      monthly_budget: testUser.monthlyBudget || 3500,
      immigration_policies_importance: 4,
      healthcare_importance: 5,
      safety_importance: 4,
      internet_importance: 5,
      emigration_process_importance: 3,
      ease_of_immigration_importance: 4,
      local_acceptance_importance: 4,
      climate_preference: "mediterranean",
      overall_score: 82,
      match_level: "very_good" as 'poor' | 'good' | 'very_good' | 'perfect',
      budget_compatibility: "excellent - test assessment"
    };

    // Insert test assessment for job processing
    const assessmentResult = await c.env.DB.prepare(`
      INSERT INTO assessments (
        user_age, user_job, monthly_budget, preferred_country, preferred_city, location_preference,
        climate_preference, immigration_policies_importance, healthcare_importance, safety_importance,
        internet_importance, emigration_process_importance, ease_of_immigration_importance,
        local_acceptance_importance, overall_score, match_level, budget_compatibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sampleAssessment.user_age,
      sampleAssessment.user_job,
      sampleAssessment.monthly_budget,
      sampleAssessment.preferred_country,
      sampleAssessment.preferred_city,
      sampleAssessment.location_preference,
      sampleAssessment.climate_preference,
      sampleAssessment.immigration_policies_importance,
      sampleAssessment.healthcare_importance,
      sampleAssessment.safety_importance,
      sampleAssessment.internet_importance,
      sampleAssessment.emigration_process_importance,
      sampleAssessment.ease_of_immigration_importance,
      sampleAssessment.local_acceptance_importance,
      sampleAssessment.overall_score,
      sampleAssessment.match_level,
      "excellent - test assessment"
    ).run();

    const assessmentId = Number(assessmentResult.meta.last_row_id);

    // Create test payment record
    const paymentResult = await c.env.DB.prepare(`
      INSERT INTO payments (assessment_id, stripe_payment_intent_id, amount, currency, status, customer_email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      assessmentId,
      `pi_test_${Date.now()}_comprehensive`,
      4999,
      'usd',
      'succeeded',
      'test@example.com'
    ).run();

    const paymentId = Number(paymentResult.meta.last_row_id);

    // Initialize job queue and enqueue report generation
    console.log('=== QUEUEING COMPREHENSIVE REPORT GENERATION (ASYNC) ===');
    
    const jobQueue = new JobQueue(c.env.DB, c.env.REPORTS_KV, c.env.OPENAI_API_KEY, c.env.RESEND_API_KEY);
    
    const jobId = await jobQueue.enqueueReportGeneration(
      assessmentId,
      paymentId,
      'test@example.com'
    );

    console.log(`Test comprehensive report generation queued with job ID: ${jobId}`);

    // IMMEDIATE PROCESSING: Start processing the job right away for testing
    console.log('=== TRIGGERING IMMEDIATE JOB PROCESSING FOR TEST ===');
    
    // Process the job immediately in the same request context
    try {
      console.log(`Starting immediate processing of job ${jobId}...`);
      
      // Add a small delay to ensure the job is properly saved first
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = await jobQueue.processJob(jobId);
      console.log(`✅ Test job ${jobId} processing completed: ${success ? 'SUCCESS' : 'PARTIAL/CONTINUING'}`);
      
      if (success) {
        console.log(`🎉 Report generation completed successfully for job ${jobId}`);
      } else {
        console.log(`⏳ Job ${jobId} partially completed, will continue in background processing`);
      }
    } catch (processError) {
      console.error(`❌ Failed to process test job ${jobId}:`, processError);
      console.error('Job processing error details:', {
        message: processError instanceof Error ? processError.message : 'Unknown error',
        stack: processError instanceof Error ? processError.stack : undefined
      });
    }

    return c.json({ 
      success: true, 
      jobId,
      assessmentId: assessmentId,
      message: "Comprehensive test report is being generated and will be ready in 2-5 minutes.",
      immediate: false,
      instructions: "The system will poll for completion and automatically download when ready."
    });

  } catch (error) {
    console.error("Critical error starting comprehensive test generation:", error);
    
    return c.json({ 
      error: "Failed to start comprehensive test report generation",
      details: error instanceof Error ? error.message : "Unknown error",
      suggestion: "Check system configuration and try again"
    }, 500);
  }
});

// Keep original lightweight endpoint for fallback
app.post("/api/test/generate-sample-pdf", async (c) => {
  try {
    console.log('=== GENERATING LIGHTWEIGHT SAMPLE PDF (FALLBACK) ===');
    
    // Create simple sample assessment data
    const sampleAssessment = {
      id: 999999,
      user_age: 35,
      user_job: "Software Engineer",
      preferred_country: "Portugal",
      preferred_city: "Lisbon",
      location_preference: "city",
      immigration_policies_importance: 4,
      healthcare_importance: 5,
      safety_importance: 4,
      internet_importance: 5,
      emigration_process_importance: 3,
      ease_of_immigration_importance: 4,
      local_acceptance_importance: 4,
      climate_importance: 3,
      overall_score: 82,
      match_level: "very_good",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Using static content for quick PDF generation...');
    
    // Static content for reliability
    const executiveSummary = `Executive Summary: Portugal presents an excellent opportunity for a ${sampleAssessment.user_age}-year-old ${sampleAssessment.user_job} seeking relocation from the United States. With a compatibility score of ${sampleAssessment.overall_score}/100, Portugal offers strong healthcare systems, favorable immigration policies for US citizens, and excellent internet infrastructure crucial for tech professionals.`;

    // Create a streamlined mock report
    const mockReport = {
      title: `Sample Emigration Report: ${sampleAssessment.preferred_city}, ${sampleAssessment.preferred_country}`,
      country: sampleAssessment.preferred_country,
      city: sampleAssessment.preferred_city,
      generatedAt: new Date().toISOString(),
      executiveSummary: executiveSummary,
      sections: [
        {
          title: "Immigration Requirements & Visa Options",
          content: `Portugal offers several visa pathways for US citizens, with the D7 visa being ideal for software engineers. Requirements include proof of accommodation, health insurance, and sufficient funds.`
        },
        {
          title: "Cost of Living Analysis",
          content: `Lisbon offers significant cost savings compared to major US tech hubs. Housing costs range from €700-€2,500/month depending on location and size.`
        },
        {
          title: "Healthcare System Overview",
          content: `Portugal's healthcare system provides both public (SNS) and private options for residents, with excellent quality and affordability compared to US standards.`
        }
      ]
    };

    console.log('Converting to PDF...');
    
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateReportPDF(mockReport, 999999);
    
    console.log(`Sample PDF generated: ${pdfBuffer.byteLength} bytes`);
    
    // Return PDF directly for download
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Sample_Emigration_Report_Portugal_Lisbon.pdf"',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error in sample PDF generation:", error);
    return c.json({ 
      error: "Failed to generate sample PDF",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Admin endpoint for retention cleanup stats
app.get("/api/admin/retention-stats", async (c) => {
  try {
    const retentionService = new RetentionCleanupService(c.env.DB, c.env.REPORTS_KV);
    const stats = await retentionService.getCleanupStats();
    
    return c.json({
      success: true,
      stats,
      retentionPolicy: "2 years",
      cleanupFrequency: "daily"
    });
  } catch (error) {
    console.error("Error getting retention stats:", error);
    return c.json({ 
      error: "Failed to get retention stats",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Admin endpoint to trigger manual retention cleanup
app.post("/api/admin/cleanup-expired", async (c) => {
  try {
    const retentionService = new RetentionCleanupService(c.env.DB, c.env.REPORTS_KV);
    const results = await retentionService.cleanupExpiredData();
    
    return c.json({
      success: true,
      message: "Manual cleanup completed",
      results
    });
  } catch (error) {
    console.error("Error during manual cleanup:", error);
    return c.json({ 
      error: "Manual cleanup failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Enhanced debug endpoint to validate full Stripe configuration  
app.get("/api/debug/stripe-config", async (c) => {
  try {
    console.log('=== COMPREHENSIVE STRIPE CONFIGURATION DEBUG ===');
    
    // Get Stripe key using same logic as payment creation
    let stripeKey = c.env.STRIPE_SECRET_KEY;
    let keySource = 'environment';
    
    // Log environment variable directly
    console.log('Raw STRIPE_SECRET_KEY from env:', c.env.STRIPE_SECRET_KEY ? c.env.STRIPE_SECRET_KEY.substring(0, 12) + '...' : 'NOT SET');
    
    if (c.env.REPORTS_KV) {
      try {
        const kvKey = await c.env.REPORTS_KV.get('stripe_secret_key');
        console.log('KV stripe_secret_key:', kvKey ? kvKey.substring(0, 12) + '...' : 'NOT SET');
        if (kvKey) {
          stripeKey = kvKey;
          keySource = 'kv_storage';
        }
      } catch (kvError) {
        console.warn('Failed to get key from KV storage:', kvError);
      }
    }

    // Test both secret and publishable keys
    const publishableKey = c.env.STRIPE_PUBLISHABLE_KEY;
    console.log('STRIPE_PUBLISHABLE_KEY:', publishableKey ? publishableKey.substring(0, 12) + '...' : 'NOT SET');
    
    // Check for key mismatch (this is the root cause of payment failures)
    const keyMismatchDetected = stripeKey && publishableKey ? 
      (stripeKey.startsWith('sk_test_') !== publishableKey.startsWith('pk_test_')) : false;
    
    // If there's a mismatch, test Stripe connection with the secret key
    let stripeConnectionTest = null;
    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey);
        const balance = await stripe.balance.retrieve();
        stripeConnectionTest = {
          success: true,
          accountLiveMode: balance.livemode,
          accountId: 'Hidden for security'
        };
      } catch (stripeError: any) {
        stripeConnectionTest = {
          success: false,
          error: stripeError.message,
          code: stripeError.code
        };
      }
    }
    
    // Return comprehensive configuration info with mismatch analysis
    return c.json({
      success: true,
      configuration: {
        secretKey: {
          source: keySource,
          prefix: stripeKey ? stripeKey.substring(0, 12) + '...' : 'NOT SET',
          isTestMode: stripeKey ? stripeKey.startsWith('sk_test_') : false,
          isLiveMode: stripeKey ? stripeKey.startsWith('sk_live_') : false,
          length: stripeKey ? stripeKey.length : 0
        },
        publishableKey: {
          prefix: publishableKey ? publishableKey.substring(0, 12) + '...' : 'NOT SET',
          isTestMode: publishableKey ? publishableKey.startsWith('pk_test_') : false,
          isLiveMode: publishableKey ? publishableKey.startsWith('pk_live_') : false,
          length: publishableKey ? publishableKey.length : 0
        },
        keyMismatch: {
          secretIsTest: stripeKey ? stripeKey.startsWith('sk_test_') : false,
          publishableIsTest: publishableKey ? publishableKey.startsWith('pk_test_') : false,
          mismatchDetected: keyMismatchDetected,
          severity: keyMismatchDetected ? 'CRITICAL - This will cause payment failures' : 'OK'
        },
        stripeConnectionTest,
        diagnosis: keyMismatchDetected ? {
          issue: 'Key mismatch detected',
          explanation: 'Your secret key and publishable key are from different Stripe modes (test vs live) or different accounts',
          impact: 'Payment intents created on backend cannot be confirmed on frontend',
          solution: 'Ensure both keys are from the same Stripe account and same mode (test or live)'
        } : {
          issue: 'No key mismatch detected',
          status: 'Keys appear to be compatible'
        }
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return c.json({
      success: false,
      error: "Debug endpoint failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test endpoint for complete payment flow validation
app.post("/api/test/payment-flow", async (c) => {
  try {
    console.log('=== TESTING COMPLETE PAYMENT FLOW ===');
    
    // Get both keys using same logic as payment creation
    let stripeSecretKey = c.env.STRIPE_SECRET_KEY;
    let keySource = 'environment';
    
    if (c.env.REPORTS_KV) {
      try {
        const kvKey = await c.env.REPORTS_KV.get('stripe_secret_key');
        if (kvKey) {
          stripeSecretKey = kvKey;
          keySource = 'kv_storage';
        }
      } catch (kvError) {
        console.warn('Failed to get key from KV storage:', kvError);
      }
    }
    
    const stripePublishableKey = c.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!stripeSecretKey || !stripePublishableKey) {
      return c.json({
        success: false,
        error: "Missing Stripe keys",
        details: {
          secretKey: stripeSecretKey ? 'Present' : 'Missing',
          publishableKey: stripePublishableKey ? 'Present' : 'Missing'
        }
      });
    }
    
    // Check for key mismatch
    const secretIsTest = stripeSecretKey.startsWith('sk_test_');
    const publishableIsTest = stripePublishableKey.startsWith('pk_test_');
    const keyMismatch = secretIsTest !== publishableIsTest;
    
    if (keyMismatch) {
      return c.json({
        success: false,
        error: "Stripe key mismatch detected",
        details: {
          secretKeyMode: secretIsTest ? 'test' : 'live',
          publishableKeyMode: publishableIsTest ? 'test' : 'live',
          issue: "Your secret key and publishable key are from different modes",
          solution: "Ensure both keys are from the same Stripe account and same mode (test or live)"
        }
      });
    }
    
    // Test payment intent creation and retrieval flow
    const stripe = new Stripe(stripeSecretKey);
    
    // Step 1: Create a test payment intent
    console.log('Step 1: Creating test payment intent...');
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: 100, // $1.00 test amount
        currency: 'usd',
        metadata: {
          test: 'payment-flow-validation',
          timestamp: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      console.log('✅ Test payment intent created:', paymentIntent.id);
    } catch (createError: any) {
      return c.json({
        success: false,
        error: "Failed to create test payment intent",
        details: createError.message,
        step: 'creation'
      });
    }
    
    // Step 2: Retrieve the payment intent to verify it exists
    console.log('Step 2: Retrieving test payment intent...');
    try {
      await stripe.paymentIntents.retrieve(paymentIntent.id);
      console.log('✅ Test payment intent retrieved successfully');
      
      // Step 3: Cancel the test payment intent to clean up
      console.log('Step 3: Canceling test payment intent...');
      await stripe.paymentIntents.cancel(paymentIntent.id);
      console.log('✅ Test payment intent canceled successfully');
      
      return c.json({
        success: true,
        message: "Payment flow test completed successfully",
        details: {
          keyMode: secretIsTest ? 'test' : 'live',
          keySource,
          testPaymentIntentId: paymentIntent.id,
          steps: [
            "✅ Payment intent creation",
            "✅ Payment intent retrieval", 
            "✅ Payment intent cancellation"
          ]
        }
      });
      
    } catch (retrieveError: any) {
      // This is the exact error your users are experiencing
      console.error('❌ Failed to retrieve payment intent:', retrieveError);
      
      return c.json({
        success: false,
        error: "Payment intent retrieval failed - this indicates a key mismatch",
        details: {
          errorCode: retrieveError.code,
          errorMessage: retrieveError.message,
          paymentIntentId: paymentIntent.id,
          diagnosis: "The payment intent was created but cannot be retrieved with the same key",
          possibleCauses: [
            "Secret key was changed between creation and retrieval",
            "Multiple Stripe accounts configured",
            "Environment variable vs KV storage key mismatch"
          ]
        },
        step: 'retrieval'
      });
    }
    
  } catch (error) {
    console.error('Payment flow test error:', error);
    return c.json({
      success: false,
      error: "Payment flow test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Test endpoint to validate Stripe key
app.get("/api/test/stripe-key", async (c) => {
  try {
    console.log('=== TESTING STRIPE KEY VALIDATION ===');
    
    // CRITICAL FIX: Use consistent key selection logic - environment first
    let stripeKey = c.env.STRIPE_SECRET_KEY;
    let keySource = 'environment';
    
    console.log('=== DEBUG KEY SELECTION ===');
    console.log('Environment STRIPE_SECRET_KEY exists:', !!c.env.STRIPE_SECRET_KEY);
    console.log('Environment key prefix:', c.env.STRIPE_SECRET_KEY ? c.env.STRIPE_SECRET_KEY.substring(0, 12) : 'NONE');
    
    // ONLY use KV storage if environment variable is not set
    if (!c.env.STRIPE_SECRET_KEY && c.env.REPORTS_KV) {
      try {
        const kvKey = await c.env.REPORTS_KV.get('stripe_secret_key');
        if (kvKey) {
          stripeKey = kvKey;
          keySource = 'kv_storage';
          console.log('WARNING: Using KV storage key because environment variable not set');
          console.log('KV key prefix:', kvKey.substring(0, 12));
        }
      } catch (kvError) {
        console.warn('Failed to get key from KV storage:', kvError);
      }
    } else if (c.env.STRIPE_SECRET_KEY) {
      console.log('✅ Using environment variable (preferred method)');
    }
    
    console.log('Debug key source:', keySource);
    console.log('Debug key prefix:', stripeKey ? stripeKey.substring(0, 12) : 'NONE');
    console.log('============================');
    
    if (!stripeKey) {
      return c.json({ 
        success: false,
        error: "No Stripe secret key configured",
        keySource: null,
        details: "Please configure a Stripe secret key first"
      });
    }
    
    console.log('=== STRIPE KEY TEST DETAILS ===');
    console.log('Key source:', keySource);
    console.log('Key prefix:', stripeKey.substring(0, 12));
    console.log('Key length:', stripeKey.length);
    console.log('Is test key:', stripeKey.startsWith('sk_test_'));
    console.log('Is live key:', stripeKey.startsWith('sk_live_'));
    console.log('================================');
    
    // Validate key format first
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      return c.json({
        success: false,
        error: "Invalid Stripe key format",
        keyFormat: stripeKey.substring(0, 10),
        keySource,
        details: "Key must start with sk_test_ or sk_live_"
      });
    }
    
    const isTestMode = stripeKey.startsWith('sk_test_');
    
    // Test the key with Stripe API
    const stripe = new Stripe(stripeKey);
    
    console.log(`Testing ${isTestMode ? 'TEST' : 'LIVE'} key with Stripe API...`);
    
    try {
      // Test 1: Retrieve balance (simple API call)
      const balance = await stripe.balance.retrieve();
      console.log('✅ Balance API call successful:', {
        available: balance.available?.length || 0,
        pending: balance.pending?.length || 0,
        livemode: balance.livemode
      });
      
      // Test 2: List customers (another simple call)
      const customers = await stripe.customers.list({ limit: 1 });
      console.log('✅ Customers API call successful, count:', customers.data.length);
      
      // Test 3: Check account details
      const account = await stripe.accounts.retrieve();
      console.log('✅ Account API call successful:', {
        id: account.id,
        country: account.country,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      });
      
      return c.json({
        success: true,
        message: "Stripe key is valid and working!",
        keyDetails: {
          keySource,
          mode: isTestMode ? 'test' : 'live',
          keyPrefix: stripeKey.substring(0, 12) + '...',
          keyLength: stripeKey.length
        },
        stripeAccount: {
          id: account.id,
          country: account.country,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          livemode: balance.livemode
        },
        apiTests: {
          balance: "✅ Success",
          customers: "✅ Success", 
          account: "✅ Success"
        }
      });
      
    } catch (stripeError: any) {
      console.error('❌ Stripe API error:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param
      });
      
      return c.json({
        success: false,
        error: "Stripe key validation failed",
        stripeError: {
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message,
          param: stripeError.param
        },
        keyDetails: {
          keySource,
          mode: isTestMode ? 'test' : 'live',
          keyPrefix: stripeKey.substring(0, 12) + '...',
          keyLength: stripeKey.length
        },
        troubleshooting: {
          possibleCauses: [
            "Key was revoked or disabled",
            "Account is not fully activated",
            "Key has restricted permissions",
            "Account has compliance issues"
          ],
          nextSteps: [
            "Check your Stripe dashboard for account status",
            "Verify the key hasn't been deleted or restricted",
            "Try generating a new secret key",
            "Contact Stripe support if account issues persist"
          ]
        }
      });
    }
    
  } catch (error) {
    console.error('Critical error in Stripe key test:', error);
    return c.json({
      success: false,
      error: "Key test failed with critical error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Helper function to format section titles
function formatSectionTitle(title: string): string {
  return title.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

// Enhanced report generation using RAG
app.post("/api/reports/generate-enhanced/:assessmentId", async (c) => {
  try {
    const assessmentId = parseInt(c.req.param("assessmentId"));
    console.log(`=== RAG-ENHANCED REPORT GENERATION for assessment ${assessmentId} ===`);
    
    // Get assessment data
    const assessment = await c.env.DB.prepare(
      "SELECT * FROM assessments WHERE id = ?"
    ).bind(assessmentId).first();
    
    if (!assessment) {
      return c.json({ error: "Assessment not found" }, 404);
    }
    
    // Check if successful payment exists
    const payment = await c.env.DB.prepare(`
      SELECT * FROM payments 
      WHERE assessment_id = ? AND status = 'succeeded'
      ORDER BY created_at DESC LIMIT 1
    `).bind(assessmentId).first();
    
    if (!payment) {
      return c.json({ error: "No successful payment found for this assessment" }, 400);
    }
    
    // Initialize RAG-enhanced report generation
    if (!c.env.RAGATOUILLE_API_URL || !c.env.RAGATOUILLE_API_KEY || !c.env.OPENAI_API_KEY) {
      console.warn('RAG enhancement not available, falling back to standard generation');
      return c.json({ 
        error: "RAG-enhanced report generation not fully configured",
        details: "Missing RAGatouille or OpenAI configuration",
        suggestion: "Use standard report generation instead"
      }, 503);
    }

    const ragClient = new RAGatouilleClient(c.env.RAGATOUILLE_API_URL, c.env.RAGATOUILLE_API_KEY);
    const ragReportGenerator = new RAGEnhancedReportGenerator(ragClient, true);

    // Define report sections to enhance with RAG
    const sections = [
      { topic: 'visa requirements and immigration process', category: 'visa_requirements' as const },
      { topic: 'cost of living analysis', category: 'cost_of_living' as const },
      { topic: 'healthcare system and medical services', category: 'healthcare' as const },
      { topic: 'housing market and rental procedures', category: 'housing' as const },
      { topic: 'immigration timeline and application process', category: 'immigration_process' as const }
    ];

    const country = String(assessment.preferred_country);
    const enhancedSections = [];
    let totalSources = 0;
    let ragSuccessCount = 0;

    for (const section of sections) {
      try {
        console.log(`Generating RAG-enhanced content for: ${section.topic}`);
        const result = await ragReportGenerator.generateEnhancedResearchPiece(
          section.topic,
          country,
          section.category
        );
        
        enhancedSections.push({
          title: section.topic,
          content: result.content,
          confidence: result.confidence,
          sources: result.sources,
          method: result.method
        });

        if (result.method === 'rag_enhanced') {
          ragSuccessCount++;
          totalSources += result.sources.length;
        }

      } catch (sectionError) {
        console.error(`Failed to generate RAG content for ${section.topic}:`, sectionError);
        enhancedSections.push({
          title: section.topic,
          content: `Unable to generate enhanced content for ${section.topic}. Please contact support for detailed information.`,
          confidence: 'low' as const,
          sources: [],
          method: 'fallback' as const
        });
      }
    }

    // Calculate overall report quality
    const ragEnhancementRatio = ragSuccessCount / sections.length;
    const overallConfidence = ragEnhancementRatio > 0.8 ? 'high' : 
                             ragEnhancementRatio > 0.5 ? 'medium' : 'low';

    // Create enhanced report structure
    const enhancedReport = {
      title: `RAG-Enhanced Emigration Report: ${assessment.preferred_city ? `${assessment.preferred_city}, ` : ''}${country}`,
      country,
      city: normalizeCity(assessment.preferred_city),
      generatedAt: new Date().toISOString(),
      enhancementLevel: ragEnhancementRatio,
      overallConfidence,
      totalSources,
      executiveSummary: `This comprehensive report has been enhanced using advanced retrieval-augmented generation (RAG) technology, incorporating ${totalSources} verified sources across ${ragSuccessCount} sections. The report provides current, accurate information about emigrating to ${country}.`,
      sections: enhancedSections.map(section => ({
        title: formatSectionTitle(section.title),
        content: section.content,
        metadata: {
          confidence: section.confidence,
          sources_count: section.sources.length,
          enhancement_method: section.method,
          rag_enhanced: section.method === 'rag_enhanced'
        }
      })),
      metadata: {
        generation_method: 'rag_enhanced',
        rag_success_rate: ragEnhancementRatio,
        total_rag_sources: totalSources,
        assessment_id: assessmentId,
        generated_at: new Date().toISOString()
      }
    };

    // Generate PDF using enhanced report
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateReportPDF(enhancedReport, assessmentId);
    
    // Store enhanced report
    const downloadToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const reportResult = await c.env.DB.prepare(`
      INSERT INTO reports (assessment_id, payment_id, report_content, download_token, download_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      assessmentId,
      String(payment.id),
      JSON.stringify(enhancedReport),
      downloadToken,
      expiresAt.toISOString()
    ).run();
    
    const reportId = reportResult.meta.last_row_id;
    const pdfKey = `enhanced-report-${reportId}`;
    
    await c.env.REPORTS_KV.put(pdfKey, pdfBuffer, {
      expirationTtl: 7 * 24 * 60 * 60
    });
    
    await c.env.DB.prepare(`
      UPDATE reports SET pdf_url = ? WHERE id = ?
    `).bind(pdfKey, reportId).run();
    
    console.log(`RAG-enhanced report generated: ${ragSuccessCount}/${sections.length} sections enhanced with ${totalSources} sources`);
    
    return c.json({ 
      success: true, 
      downloadToken,
      reportId,
      enhancement: {
        success_rate: ragEnhancementRatio,
        sections_enhanced: ragSuccessCount,
        total_sections: sections.length,
        sources_used: totalSources,
        confidence: overallConfidence
      },
      message: "RAG-enhanced report generated successfully with verified sources" 
    });

  } catch (error) {
    console.error("RAG-enhanced report generation error:", error);
    return c.json({ 
      error: "Failed to generate RAG-enhanced report",
      details: error instanceof Error ? error.message : "Unknown error",
      suggestion: "Try standard report generation instead"
    }, 500);
  }
});

// RAGatouille integration endpoints
app.post("/api/rag/query", zValidator("json", RAGQuerySchema), async (c) => {
  try {
    console.log('=== RAG CONTEXT RETRIEVAL REQUEST ===');
    
    if (!c.env.RAGATOUILLE_API_URL || !c.env.RAGATOUILLE_API_KEY) {
      console.error('RAGatouille service not configured');
      return c.json({ 
        error: "RAGatouille service not configured",
        details: "Please configure RAGATOUILLE_API_URL and RAGATOUILLE_API_KEY environment variables",
        fallback: true
      }, 503);
    }

    const { query, country, category, max_results } = c.req.valid("json");
    console.log('RAG query received:', { query, country, category, max_results });

    const ragClient = new RAGatouilleClient(c.env.RAGATOUILLE_API_URL, c.env.RAGATOUILLE_API_KEY);
    
    const ragQuery: RAGatouilleQuery = {
      query,
      country,
      category: category || RAGUtils.categorizeQuery(query),
      max_results: max_results || 5
    };

    // Add auto-detected country if not provided
    if (!ragQuery.country) {
      ragQuery.country = RAGUtils.extractCountryFromQuery(query) || undefined;
    }

    console.log('Processed RAG query:', ragQuery);

    const response = await ragClient.retrieveContext(ragQuery);
    
    console.log(`RAG retrieval successful: ${response.results.length} results in ${response.processing_time_ms}ms`);

    return c.json({
      success: true,
      ...response,
      metadata: {
        service: 'ragatouille',
        enhanced: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('RAG query error:', error);
    
    return c.json({ 
      success: false,
      error: "Failed to retrieve context from RAGatouille service",
      details: error instanceof Error ? error.message : "Unknown error",
      fallback: true,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

app.post("/api/rag/enhanced-answer", zValidator("json", EnhancedAnswerSchema), async (c) => {
  try {
    console.log('=== RAG ENHANCED ANSWER REQUEST ===');
    
    if (!c.env.RAGATOUILLE_API_URL || !c.env.RAGATOUILLE_API_KEY) {
      console.error('RAGatouille service not configured');
      return c.json({ 
        error: "RAGatouille service not configured",
        details: "Please configure RAGATOUILLE_API_URL and RAGATOUILLE_API_KEY environment variables",
        fallback: true
      }, 503);
    }

    const { query, country, category } = c.req.valid("json");
    console.log('Enhanced answer request:', { query, country, category });

    const ragClient = new RAGatouilleClient(c.env.RAGATOUILLE_API_URL, c.env.RAGATOUILLE_API_KEY);
    
    // Use the enhanced answer endpoint if available, otherwise orchestrate RAG + OpenAI
    try {
      const enhancedAnswer = await ragClient.getEnhancedAnswer(
        query, 
        country || RAGUtils.extractCountryFromQuery(query) || undefined,
        category || RAGUtils.categorizeQuery(query)
      );

      console.log(`Enhanced answer generated with ${enhancedAnswer.confidence} confidence`);

      return c.json({
        success: true,
        ...enhancedAnswer,
        metadata: {
          service: 'ragatouille',
          method: 'direct_enhanced',
          timestamp: new Date().toISOString()
        }
      });

    } catch (directError) {
      console.log('Direct enhanced answer failed, using orchestrated approach:', directError);
      
      // Fallback to orchestrated RAG + OpenAI
      if (!c.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key required for orchestrated approach');
      }

      const ragQuery: RAGatouilleQuery = {
        query,
        country: country || RAGUtils.extractCountryFromQuery(query) || undefined,
        category: category || RAGUtils.categorizeQuery(query),
        max_results: 5
      };

      const ragResponse = await ragClient.retrieveContext(ragQuery);
      
      if (ragResponse.results.length === 0) {
        throw new Error('No relevant context found for query');
      }

      // Create context-enriched prompt for OpenAI
      const context = ragResponse.results
        .map(r => `Source: ${r.source}\nContent: ${r.content}`)
        .join('\n\n');

      const prompt = `Based on the following verified information about emigration and immigration, please provide a comprehensive answer to the user's question.

Context:
${context}

User Question: ${query}

Instructions:
- Use ONLY the information provided in the context above
- If the context doesn't contain sufficient information, clearly state what information is missing
- Provide specific details and requirements when available
- Include relevant source information when helpful
- Be precise and factual

Answer:`;

      // Use existing OpenAI integration (simplified for RAG context)
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json() as any;
      const answer = openaiData.choices[0]?.message?.content || 'Unable to generate answer';

      // Calculate confidence based on RAG results
      const avgRelevance = ragResponse.results.reduce((sum, r) => sum + r.relevance_score, 0) / ragResponse.results.length;
      const confidence: 'high' | 'medium' | 'low' = 
        avgRelevance > 0.8 && ragResponse.results.length >= 4 ? 'high' :
        avgRelevance > 0.6 && ragResponse.results.length >= 2 ? 'medium' : 'low';

      console.log(`Orchestrated answer generated with ${confidence} confidence`);

      return c.json({
        success: true,
        answer,
        sources: ragResponse.results,
        confidence,
        generated_at: new Date().toISOString(),
        query,
        metadata: {
          service: 'orchestrated',
          method: 'rag_plus_openai',
          rag_results: ragResponse.results.length,
          avg_relevance: avgRelevance,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Enhanced answer error:', error);
    
    return c.json({ 
      success: false,
      error: "Failed to generate enhanced answer",
      details: error instanceof Error ? error.message : "Unknown error",
      fallback: true,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// RAGatouille health check endpoint
app.get("/api/rag/health", async (c) => {
  try {
    if (!c.env.RAGATOUILLE_API_URL || !c.env.RAGATOUILLE_API_KEY) {
      return c.json({
        status: 'not_configured',
        message: 'RAGatouille service not configured',
        timestamp: new Date().toISOString()
      });
    }

    const ragClient = new RAGatouilleClient(c.env.RAGATOUILLE_API_URL, c.env.RAGATOUILLE_API_KEY);
    const health = await ragClient.healthCheck();
    
    return c.json({
      ...health,
      service_url: c.env.RAGATOUILLE_API_URL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return c.json({
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

app.post("/api/rag/query", zValidator("json", RAGQuerySchema), async (c) => {
  try {
    console.log('=== RAG CONTEXT RETRIEVAL REQUEST ===');
    
    if (!c.env.RAGATOUILLE_API_URL || !c.env.RAGATOUILLE_API_KEY) {
      console.error('RAGatouille service not configured');
      return c.json({ 
        error: "RAGatouille service not configured",
        details: "Please configure RAGATOUILLE_API_URL and RAGATOUILLE_API_KEY environment variables",
        fallback: true
      }, 503);
    }

    const { query, country, category, max_results } = c.req.valid("json");
    console.log('RAG query received:', { query, country, category, max_results });

    const ragClient = new RAGatouilleClient(c.env.RAGATOUILLE_API_URL, c.env.RAGATOUILLE_API_KEY);
    
    const ragQuery: RAGatouilleQuery = {
      query,
      country,
      category: category || RAGUtils.categorizeQuery(query),
      max_results: max_results || 5
    };

    // Add auto-detected country if not provided
    if (!ragQuery.country) {
      ragQuery.country = RAGUtils.extractCountryFromQuery(query) || undefined;
    }

    console.log('Processed RAG query:', ragQuery);

    const response = await ragClient.retrieveContext(ragQuery);
    
    console.log(`RAG retrieval successful: ${response.results.length} results in ${response.processing_time_ms}ms`);

    return c.json({
      success: true,
      ...response,
      metadata: {
        service: 'ragatouille',
        enhanced: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('RAG query error:', error);
    
    return c.json({ 
      success: false,
      error: "Failed to retrieve context from RAGatouille service",
      details: error instanceof Error ? error.message : "Unknown error",
      fallback: true,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

app.post("/api/rag/enhanced-answer", zValidator("json", EnhancedAnswerSchema), async (c) => {
  try {
    console.log('=== RAG ENHANCED ANSWER REQUEST ===');
    
    if (!c.env.RAGATOUILLE_API_URL || !c.env.RAGATOUILLE_API_KEY) {
      console.error('RAGatouille service not configured');
      return c.json({ 
        error: "RAGatouille service not configured",
        details: "Please configure RAGATOUILLE_API_URL and RAGATOUILLE_API_KEY environment variables",
        fallback: true
      }, 503);
    }

    const { query, country, category } = c.req.valid("json");
    console.log('Enhanced answer request:', { query, country, category });

    const ragClient = new RAGatouilleClient(c.env.RAGATOUILLE_API_URL, c.env.RAGATOUILLE_API_KEY);
    
    // Use the enhanced answer endpoint if available, otherwise orchestrate RAG + OpenAI
    try {
      const enhancedAnswer = await ragClient.getEnhancedAnswer(
        query, 
        country || RAGUtils.extractCountryFromQuery(query) || undefined,
        category || RAGUtils.categorizeQuery(query)
      );

      console.log(`Enhanced answer generated with ${enhancedAnswer.confidence} confidence`);

      return c.json({
        success: true,
        ...enhancedAnswer,
        metadata: {
          service: 'ragatouille',
          method: 'direct_enhanced',
          timestamp: new Date().toISOString()
        }
      });

    } catch (directError) {
      console.log('Direct enhanced answer failed, using orchestrated approach:', directError);
      
      // Fallback to orchestrated RAG + OpenAI
      if (!c.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key required for orchestrated approach');
      }

      const ragQuery: RAGatouilleQuery = {
        query,
        country: country || RAGUtils.extractCountryFromQuery(query) || undefined,
        category: category || RAGUtils.categorizeQuery(query),
        max_results: 5
      };

      const ragResponse = await ragClient.retrieveContext(ragQuery);
      
      if (ragResponse.results.length === 0) {
        throw new Error('No relevant context found for query');
      }

      // Create context-enriched prompt for OpenAI
      const context = ragResponse.results
        .map(r => `Source: ${r.source}\nContent: ${r.content}`)
        .join('\n\n');

      const prompt = `Based on the following verified information about emigration and immigration, please provide a comprehensive answer to the user's question.

Context:
${context}

User Question: ${query}

Instructions:
- Use ONLY the information provided in the context above
- If the context doesn't contain sufficient information, clearly state what information is missing
- Provide specific details and requirements when available
- Include relevant source information when helpful
- Be precise and factual

Answer:`;

      // Use existing OpenAI integration (simplified for RAG context)
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json() as any;
      const answer = openaiData.choices[0]?.message?.content || 'Unable to generate answer';

      // Calculate confidence based on RAG results
      const avgRelevance = ragResponse.results.reduce((sum, r) => sum + r.relevance_score, 0) / ragResponse.results.length;
      const confidence: 'high' | 'medium' | 'low' = 
        avgRelevance > 0.8 && ragResponse.results.length >= 4 ? 'high' :
        avgRelevance > 0.6 && ragResponse.results.length >= 2 ? 'medium' : 'low';

      console.log(`Orchestrated answer generated with ${confidence} confidence`);

      return c.json({
        success: true,
        answer,
        sources: ragResponse.results,
        confidence,
        generated_at: new Date().toISOString(),
        query,
        metadata: {
          service: 'orchestrated',
          method: 'rag_plus_openai',
          rag_results: ragResponse.results.length,
          avg_relevance: avgRelevance,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Enhanced answer error:', error);
    
    return c.json({ 
      success: false,
      error: "Failed to generate enhanced answer",
      details: error instanceof Error ? error.message : "Unknown error",
      fallback: true,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// RAGatouille health check endpoint
app.get("/api/rag/health", async (c) => {
  try {
    if (!c.env.RAGATOUILLE_API_URL || !c.env.RAGATOUILLE_API_KEY) {
      return c.json({
        status: 'not_configured',
        message: 'RAGatouille service not configured',
        timestamp: new Date().toISOString()
      });
    }

    const ragClient = new RAGatouilleClient(c.env.RAGATOUILLE_API_URL, c.env.RAGATOUILLE_API_KEY);
    const health = await ragClient.healthCheck();
    
    return c.json({
      ...health,
      service_url: c.env.RAGATOUILLE_API_URL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return c.json({
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Test endpoint to validate OpenAI API key
app.get("/api/test/openai-key", async (c) => {
  try {
    console.log('=== TESTING OPENAI API KEY ===');
    
    if (!c.env.OPENAI_API_KEY) {
      return c.json({ 
        success: false,
        error: "No OpenAI API key configured",
        details: "Please configure your OPENAI_API_KEY environment variable"
      });
    }
    
    console.log('OpenAI API key exists, testing connection...');
    console.log('Key prefix:', c.env.OPENAI_API_KEY.substring(0, 10) + '...');
    
    // Import and test OpenAI
    const { ReportGenerator } = await import('@/shared/report-generator');
    const reportGenerator = new ReportGenerator(c.env.OPENAI_API_KEY);
    
    // Test with a simple API call - create a minimal test assessment
    const testAssessment = {
      id: 999999,
      user_age: 35,
      user_job: "Software Engineer",
      preferred_country: "Portugal",
      preferred_city: "Lisbon",
      immigration_policies_importance: 4,
      healthcare_importance: 5,
      safety_importance: 4,
      internet_importance: 5,
      emigration_process_importance: 3,
      ease_of_immigration_importance: 4,
      local_acceptance_importance: 4
    };
    
    console.log('Attempting to generate a small research piece...');
    
    // Create a properly typed test assessment for report generation
    const typedTestAssessment = {
      id: testAssessment.id,
      user_age: testAssessment.user_age,
      user_job: testAssessment.user_job,
      preferred_country: testAssessment.preferred_country,
      preferred_city: testAssessment.preferred_city || null,
      monthly_budget: 3000,
      location_preference: 'city',
      climate_preference: 'mediterranean',
      immigration_policies_importance: testAssessment.immigration_policies_importance,
      healthcare_importance: testAssessment.healthcare_importance,
      safety_importance: testAssessment.safety_importance,
      internet_importance: testAssessment.internet_importance,
      emigration_process_importance: testAssessment.emigration_process_importance,
      ease_of_immigration_importance: testAssessment.ease_of_immigration_importance,
      local_acceptance_importance: testAssessment.local_acceptance_importance,
      overall_score: 82,
      match_level: 'very_good' as 'poor' | 'good' | 'very_good' | 'perfect',
      budget_compatibility: 'good',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const testResult = await reportGenerator.generateResearchPiece(typedTestAssessment, 'visa_requirements');
    
    console.log('✅ OpenAI API test successful!');
    console.log('Generated content length:', testResult.content.length);
    
    return c.json({
      success: true,
      message: "OpenAI API key is working correctly!",
      testResult: {
        topic: testResult.topic,
        contentLength: testResult.content.length,
        contentPreview: testResult.content.substring(0, 200) + '...',
        generatedAt: testResult.generatedAt
      },
      keyStatus: {
        keyPrefix: c.env.OPENAI_API_KEY.substring(0, 10) + '...',
        keyLength: c.env.OPENAI_API_KEY.length,
        configured: true
      }
    });
    
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error);
    
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let errorType = 'unknown';
    
    // Check for common OpenAI API errors
    if (errorMessage.includes('rate limit') || errorMessage.toLowerCase().includes('rate limit')) {
      errorType = 'rate_limit';
      errorMessage = 'OpenAI rate limit reached. Free accounts have strict limits (3 requests per minute).';
    } else if (errorMessage.includes('invalid api key') || errorMessage.includes('authentication')) {
      errorType = 'invalid_key';
      errorMessage = 'Invalid OpenAI API key. Please check your key is correct and active.';
    } else if (errorMessage.includes('insufficient_quota') || errorMessage.includes('quota')) {
      errorType = 'quota_exceeded';
      errorMessage = 'OpenAI quota exceeded. Please add billing information to your OpenAI account.';
    } else if (errorMessage.includes('timeout')) {
      errorType = 'timeout';
      errorMessage = 'OpenAI API request timed out. Please try again.';
    }
    
    return c.json({
      success: false,
      error: "OpenAI API test failed",
      errorType,
      details: errorMessage,
      keyStatus: {
        keyPrefix: c.env.OPENAI_API_KEY ? c.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT SET',
        keyLength: c.env.OPENAI_API_KEY ? c.env.OPENAI_API_KEY.length : 0,
        configured: !!c.env.OPENAI_API_KEY
      },
      troubleshooting: {
        'rate_limit': 'Wait a few minutes and try again. Consider upgrading to a paid OpenAI plan.',
        'invalid_key': 'Generate a new API key from https://platform.openai.com/api-keys',
        'quota_exceeded': 'Add billing information at https://platform.openai.com/account/billing',
        'timeout': 'Try again - this is usually a temporary issue.',
        'unknown': 'Check your OpenAI account status and API key permissions.'
      }[errorType]
    });
  }
});

// Test endpoint to send a test email
app.post("/api/test/send-email", async (c) => {
  try {
    const { email } = await c.req.json().catch(() => ({ email: null }));
    
    if (!email) {
      return c.json({ error: "Email address is required in request body" }, 400);
    }
    
    if (!c.env.RESEND_API_KEY) {
      return c.json({ 
        error: "Email service not configured. Please set RESEND_API_KEY.",
        setup: "Add your Resend API key to enable email delivery" 
      }, 500);
    }

    const emailService = new EmailService(c.env.RESEND_API_KEY);
    const result = await emailService.sendTestEmail(email);
    
    if (result.success) {
      return c.json({ 
        success: true, 
        message: `Test email sent successfully to ${email}`,
        messageId: result.messageId 
      });
    } else {
      return c.json({ 
        success: false, 
        error: `Failed to send test email: ${result.error}` 
      }, 500);
    }
  } catch (error) {
    console.error("Test email error:", error);
    return c.json({ 
      error: "Failed to send test email",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Admin endpoint to extend retention for specific assessment
app.post("/api/admin/extend-retention/:assessmentId", async (c) => {
  try {
    const assessmentId = parseInt(c.req.param("assessmentId"));
    const { additionalMonths = 12 } = await c.req.json().catch(() => ({}));
    
    const retentionService = new RetentionCleanupService(c.env.DB, c.env.REPORTS_KV);
    const extended = await retentionService.extendRetention(assessmentId, additionalMonths);
    
    if (extended) {
      return c.json({
        success: true,
        message: `Retention extended by ${additionalMonths} months for assessment ${assessmentId}`
      });
    } else {
      return c.json({
        success: false,
        message: "Assessment not found or retention not extended"
      }, 404);
    }
  } catch (error) {
    console.error("Error extending retention:", error);
    return c.json({ 
      error: "Failed to extend retention",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Test endpoint to preview report content (JSON format) - ultra-lightweight to prevent worker restarts
app.post("/api/test/preview-report", async (c) => {
  try {
    console.log('=== GENERATING ULTRA-LIGHTWEIGHT REPORT PREVIEW ===');

    // Use only static content to ensure zero worker restart issues
    console.log('Using static preview content only to prevent any worker issues...');
    
    // Minimal static content optimized for quick response
    const executiveSummary = `Executive Summary: Portugal presents an excellent opportunity for a 35-year-old Software Engineer seeking relocation from the United States. With a compatibility score of 82/100, Portugal offers strong healthcare systems, favorable immigration policies for US citizens, and excellent internet infrastructure crucial for remote work.

Key advantages include the D7 visa pathway specifically designed for remote workers and digital nomads, making it ideal for software engineers. Portugal's Non-Habitual Resident (NHR) tax program offers significant tax benefits for the first 10 years of residency. The cost of living in Lisbon is approximately 40-50% lower than major US tech hubs.

The immigration process typically takes 6-12 months from application to approval. Portugal's path to EU citizenship after 5 years of residency provides long-term mobility benefits. The strong expat community in Lisbon facilitates integration and networking opportunities.`;

    // Create minimal mock report structure optimized for speed and reliability
    const mockReport = {
      title: "Comprehensive Emigration Report: Lisbon, Portugal",
      country: "Portugal",
      city: "Lisbon",
      generatedAt: new Date().toISOString(),
      executiveSummary: executiveSummary,
      sections: [
        {
          title: "Immigration Requirements & Visa Options",
          contentLength: 1250,
          hasSubsections: true,
          subsectionCount: 4,
          preview: "This section provides comprehensive details on available visa types for US citizens, including the D7 visa for remote workers, Golden Visa investment options, and EU Blue Card for skilled professionals. The D7 visa is particularly attractive for software engineers as it allows remote work for US companies while residing in Portugal. Application requirements include proof of accommodation, health insurance, and sufficient funds (around €7,200 annually). Processing time is typically 60-90 days with consular interviews required in most cases."
        },
        {
          title: "Comprehensive Cost of Living Analysis",
          contentLength: 1100,
          hasSubsections: false,
          subsectionCount: 0,
          preview: "Detailed breakdown of living costs in Lisbon including housing prices by neighborhood, daily expenses, transportation, and comparison with US costs. One-bedroom apartments in central Lisbon range from €800-1,400/month, while utilities average €80-120/month. Groceries cost approximately 30-40% less than major US cities, with restaurant meals ranging from €8-15 for casual dining."
        },
        {
          title: "Healthcare System & Medical Services",
          contentLength: 950,
          hasSubsections: false,
          subsectionCount: 0,
          preview: "Portugal's healthcare system overview including SNS public healthcare, private insurance options, and English-speaking medical facilities in Lisbon. The SNS provides universal coverage to residents, with private insurance starting around €30-50/month for basic coverage. Major hospitals like Hospital da Luz and CUF have English-speaking staff and international-standard care."
        },
        {
          title: "Tax Implications & Financial Planning",
          contentLength: 1200,
          hasSubsections: false,
          subsectionCount: 0,
          preview: "Complete analysis of Portuguese tax obligations, NHR (Non-Habitual Resident) program benefits, US tax treaty provisions, and dual taxation avoidance strategies. The NHR program offers a flat 20% tax rate on Portuguese-sourced income and potential exemption on foreign income for 10 years. US citizens must still file annual returns but can use Foreign Earned Income Exclusion and Foreign Tax Credit to minimize double taxation."
        },
        {
          title: "Housing Market & Neighborhood Guide",
          contentLength: 2800,
          hasSubsections: true,
          subsectionCount: 6,
          preview: "Comprehensive guide to Lisbon's housing market for American tech professionals, including premium areas like Chiado and Principe Real, tech-friendly neighborhoods like Campolide and Avenidas Novas, and complete rental procedures. The rental market is competitive, requiring first month's rent plus 1-2 months deposit. Best areas for expats include Santos Design District, Estrela, and Campo de Ourique for their international communities and amenities."
        },
        {
          title: "Cultural Integration & Language Resources",
          contentLength: 900,
          hasSubsections: false,
          subsectionCount: 0,
          preview: "Portuguese cultural insights, language learning resources, professional networking opportunities, and social integration strategies. While Portuguese is the official language, English is widely spoken in business and tech sectors. Cultural adaptation focuses on understanding Portuguese work-life balance, social customs around dining and relationships, and integration into the strong international expat community in Lisbon."
        },
        {
          title: "Step-by-Step Relocation Timeline",
          contentLength: 1400,
          hasSubsections: false,
          subsectionCount: 0,
          preview: "Detailed 18-month relocation timeline from initial planning to full settlement, including visa application milestones, housing arrangements, and bureaucratic requirements. Month 1-3: Document preparation and visa application. Month 4-6: Consular processing and apartment hunting. Month 7-9: Arrival, NIF registration, and banking setup. Month 10-12: Full settlement and integration activities."
        },
        {
          title: "Emergency Contacts & Support Resources",
          contentLength: 800,
          hasSubsections: false,
          subsectionCount: 0,
          preview: "Essential contact information for US Embassy services, English-speaking professionals (lawyers, accountants, real estate agents), healthcare facilities, and expat support groups. US Embassy Lisbon: +351 21 727 3300. Emergency services: 112. Key English-speaking services include Borges & Associates (legal), Deloitte Portugal (tax), and Remax (real estate) with dedicated expat support teams."
        }
      ]
    };

    console.log('✅ Ultra-lightweight preview generated successfully - zero worker restart risk');
    
    // Return complete structured data with full preview content
    const responseData = {
      success: true,
      report: {
        title: mockReport.title,
        country: mockReport.country,
        city: mockReport.city,
        generatedAt: mockReport.generatedAt,
        executiveSummary: {
          title: "Executive Summary",
          length: mockReport.executiveSummary.length,
          preview: mockReport.executiveSummary // Return full executive summary for preview
        },
        sections: mockReport.sections.map(section => ({
          title: section.title,
          contentLength: section.contentLength,
          hasSubsections: section.hasSubsections,
          subsectionCount: section.subsectionCount,
          preview: section.preview // Return full preview text
        }))
      },
      stats: {
        totalSections: mockReport.sections.length,
        totalCharacters: mockReport.executiveSummary.length + mockReport.sections.reduce((acc, s) => acc + s.contentLength, 0),
        averageSectionLength: Math.round(mockReport.sections.reduce((acc, s) => acc + s.contentLength, 0) / mockReport.sections.length)
      },
      mode: "ultra_lightweight_static",
      note: "Ultra-lightweight static preview with full content visibility. For complete detailed report, use PDF generation."
    };
    
    console.log('Preview response prepared:', {
      success: responseData.success,
      reportTitle: responseData.report.title,
      sectionsCount: responseData.report.sections.length,
      executiveSummaryLength: responseData.report.executiveSummary.length,
      totalStats: responseData.stats
    });
    
    return c.json(responseData);
    
  } catch (error) {
    console.error("❌ Critical error in preview generation:", error);
    
    // Emergency ultra-minimal fallback that should NEVER cause worker restart
    const emergencyData = {
      success: true,
      emergency: true,
      report: {
        title: "Sample Emigration Report: Lisbon, Portugal",
        country: "Portugal", 
        city: "Lisbon",
        generatedAt: new Date().toISOString(),
        executiveSummary: {
          title: "Executive Summary",
          length: 400,
          preview: "Portugal presents excellent opportunities for US citizens seeking relocation, with favorable immigration policies and cost advantages. The D7 visa pathway offers an ideal route for remote workers and digital nomads."
        },
        sections: [
          { title: "Immigration Requirements & Visa Options", contentLength: 1200, hasSubsections: true, subsectionCount: 3, preview: "D7 visa options for remote workers, Golden Visa investment program, and EU Blue Card pathways for skilled professionals." },
          { title: "Cost of Living Analysis", contentLength: 1000, hasSubsections: false, subsectionCount: 0, preview: "Housing costs range from €800-2000/month depending on location and size. Daily expenses significantly lower than major US cities." },
          { title: "Healthcare System", contentLength: 900, hasSubsections: false, subsectionCount: 0, preview: "SNS public system provides universal coverage with private insurance options starting from €30-50/month for enhanced services." }
        ]
      },
      stats: { totalSections: 3, totalCharacters: 3500, averageSectionLength: 1033 },
      mode: "emergency_fallback",
      note: "Emergency fallback mode activated due to processing error. Basic preview content available."
    };
    
    console.log('Emergency fallback activated:', emergencyData);
    return c.json(emergencyData);
  }
});

// Emergency endpoint to completely clean all Stripe keys and force refresh
app.post("/api/admin/emergency-stripe-clean", async (c) => {
  try {
    console.log('=== EMERGENCY STRIPE KEY CLEAN INITIATED ===');
    
    const cleaner = new StripeKeyCleaner(c.env.DB, c.env.REPORTS_KV);
    
    // Clean all possible Stripe keys from KV storage
    const cleanResults = await cleaner.cleanAllStripeKeys();
    
    // Get current status after cleaning
    const currentStatus = await cleaner.getCurrentKeyStatus(c.env);
    
    console.log('Emergency clean completed:', {
      removedFromKV: cleanResults.removedFromKV,
      currentEnvironmentKeys: currentStatus.environment,
      issues: currentStatus.analysis.issues
    });
    
    return c.json({
      success: true,
      message: "Emergency Stripe key cleanup completed",
      cleanResults,
      currentStatus,
      nextSteps: [
        "All KV storage keys have been removed",
        "Only environment variables remain",
        "Check the currentStatus.analysis.issues for remaining problems",
        "Use /api/admin/update-stripe-key to set fresh keys if needed"
      ]
    });
  } catch (error) {
    console.error("Emergency clean error:", error);
    return c.json({ 
      error: "Emergency clean failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Endpoint to analyze current Stripe key status without making changes
app.get("/api/admin/stripe-key-status", async (c) => {
  try {
    const cleaner = new StripeKeyCleaner(c.env.DB, c.env.REPORTS_KV);
    const status = await cleaner.getCurrentKeyStatus(c.env);
    
    return c.json({
      success: true,
      status,
      recommendations: status.analysis.issues.length > 0 ? 
        ["Use /api/admin/emergency-stripe-clean to reset everything", "Then set fresh keys"] :
        ["Configuration looks good"]
    });
  } catch (error) {
    console.error("Status check error:", error);
    return c.json({ 
      error: "Status check failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Admin endpoint to update Stripe secret key
app.post("/api/admin/update-stripe-key", zValidator("json", UpdateStripeKeySchema), async (c) => {
  try {
    const { secretKey } = c.req.valid("json");
    
    console.log('=== ADMIN KEY UPDATE ===');
    console.log('Received key prefix:', secretKey.substring(0, 12));
    console.log('Key length:', secretKey.length);
    console.log('Is test key:', secretKey.startsWith('sk_test_'));
    console.log('Is live key:', secretKey.startsWith('sk_live_'));
    
    // Test the key by trying to create a Stripe instance
    const stripe = new Stripe(secretKey);
    
    // Try a simple API call to validate the key
    try {
      await stripe.customers.list({ limit: 1 });
      console.log('Stripe key validation successful');
    } catch (stripeError: any) {
      console.error('Stripe key validation error:', stripeError);
      return c.json({ 
        error: "Invalid Stripe secret key - failed authentication with Stripe",
        details: stripeError.message 
      }, 400);
    }

    // Store the key in KV storage so it can be used immediately
    try {
      if (c.env.REPORTS_KV) {
        await c.env.REPORTS_KV.put('stripe_secret_key', secretKey);
        console.log('Stripe key stored in KV storage successfully');
      } else {
        console.warn('KV storage not available, key stored in environment only');
      }
    } catch (kvError) {
      console.warn('Failed to store key in KV storage:', kvError);
    }

    return c.json({ 
      success: true, 
      message: "Stripe secret key validated and updated successfully",
      keyType: secretKey.startsWith('sk_test_') ? 'test' : 'live'
    });
  } catch (error) {
    console.error("Error updating Stripe key:", error);
    return c.json({ 
      error: "Failed to update Stripe secret key",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Health check endpoints for diagnosing 502 errors
app.get("/api/health", async (c) => {
  try {
    const quickCheck = await HealthChecker.quickHealthCheck();
    return c.json(quickCheck);
  } catch (error) {
    console.error("Health check error:", error);
    return c.json({ 
      status: 'unhealthy',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

app.get("/api/health/detailed", async (c) => {
  try {
    const detailedCheck = await HealthChecker.performHealthCheck(c.env);
    const statusCode = detailedCheck.status === 'healthy' ? 200 : 503;
    return c.json(detailedCheck, statusCode);
  } catch (error) {
    console.error("Detailed health check error:", error);
    return c.json({ 
      status: 'unhealthy',
      error: `Detailed health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Simple ping endpoint
app.get("/ping", (c) => {
  return c.json({ pong: true, timestamp: new Date().toISOString() });
});

// Handle scheduled events (cron jobs)
app.get('/favicon.ico', (c) => c.notFound());

// Catch-all route for client-side routing - serve React app for non-API routes
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  
  // Don't intercept API routes
  if (url.pathname.startsWith('/api/')) {
    return c.notFound();
  }
  
  // Serve the React app for all other routes (client-side routing)
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta property="og:title" content="Emigration Pro" />
    <meta property="og:description" content="Expert emigration guidance for US citizens seeking their perfect international destination" />
    <meta
      property="og:image"
      content="https://mocha-cdn.com/og.png"
      type="image/png"
    />
    <meta
      property="og:url"
      content="https://getmocha.com"
    />
    <meta property="og:type" content="website" />
    <meta property="og:author" content="Emigration Pro" />
    <meta property="og:site_name" content="Emigration Pro" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:site" content="@emigrationpro" />
    <meta property="twitter:title" content="Emigration Pro" />
    <meta property="twitter:description" content="Expert emigration guidance for US citizens seeking their perfect international destination" />
    <meta
      property="twitter:image"
      content="https://mocha-cdn.com/og.png"
      type="image/png"
    />
    <link
      rel="shortcut icon"
      href="https://mocha-cdn.com/favicon.ico"
      type="image/x-icon"
    />
    <link
      rel="apple-touch-icon"
      sizes="180x180"
      href="https://mocha-cdn.com/apple-touch-icon.png"
      type="image/png"
    />
    
    <!-- BLOCK ALL GOOGLE FONTS -->
    <meta http-equiv="Content-Security-Policy" content="font-src 'self' data:; style-src 'self' 'unsafe-inline';">
    
    <!-- COMPLETE GOOGLE FONTS BLOCKER -->
    <script>
      // Block Google Fonts at the network level
      if (typeof window !== 'undefined') {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string' && url.includes('fonts.googleapis.com')) {
            console.log('BLOCKED Google Fonts request:', url);
            return Promise.reject(new Error('Google Fonts blocked'));
          }
          return originalFetch.apply(this, args);
        };

        // Override XMLHttpRequest to block Google Fonts
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
          if (typeof url === 'string' && (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com') || url.includes('fonts.bunny.net'))) {
            console.log('BLOCKED XHR external font request:', url);
            throw new Error('External fonts blocked via XHR');
          }
          return originalXHROpen.call(this, method, url, ...rest);
        };

        // Block Google Fonts in stylesheets
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.tagName === 'LINK' && node.href && 
                  (node.href.includes('fonts.googleapis.com') || 
                   node.href.includes('fonts.gstatic.com') || 
                   node.href.includes('fonts.bunny.net'))) {
                console.log('REMOVING external font link:', node.href);
                node.remove();
              }
              if (node.tagName === 'STYLE' && node.textContent && 
                  (node.textContent.includes('fonts.googleapis.com') ||
                   node.textContent.includes('fonts.gstatic.com') ||
                   node.textContent.includes('fonts.bunny.net'))) {
                console.log('REMOVING external font style:', node.textContent.substring(0, 100));
                node.remove();
              }
            });
          });
        });
        
        // Start observing when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.head, { childList: true, subtree: true });
            observer.observe(document.body, { childList: true, subtree: true });
          });
        } else {
          observer.observe(document.head, { childList: true, subtree: true });
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }
    </script>
    
    <title>Emigration Pro</title>
    <style>
      /* EMERGENCY FONT OVERRIDE - Block all Google Fonts */
      @font-face {
        font-family: "ExternalFont";
        src: none !important;
      }
      html, body, *, *::before, *::after {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif !important;
      }
      *[style*="font-family"], .mocha-watermark, [class*="mocha"] {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif !important;
      }
      /* Block any external font CSS imports */
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/react-app/main.tsx"></script>
  </body>
</html>`);
});

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    try {
      // Wrap the main app.fetch with error handling
      return await app.fetch(request, env, ctx);
    } catch (error) {
      console.error('=== WORKER FETCH ERROR ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Request URL:', request.url);
      console.error('Request method:', request.method);
      
      // Return a proper error response instead of letting the worker crash
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'The worker encountered an unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('=== SCHEDULED EVENT TRIGGERED ===');
    console.log('Event cron:', event.cron);
    console.log('Event scheduledTime:', event.scheduledTime);
    
    try {
      // Run retention cleanup (daily at 2 AM UTC)
      if (event.cron === '0 2 * * *') {
        console.log('=== RUNNING RETENTION CLEANUP ===');
        ctx.waitUntil(runScheduledCleanup(env));
      }
      
      // Process pending report generation jobs (every 10 minutes)
      if (event.cron === '*/10 * * * *' || !event.cron) {
        console.log('=== PROCESSING PENDING JOBS ===');
        
        if (!env.OPENAI_API_KEY) {
          console.error('OPENAI_API_KEY not configured for scheduled job');
          return;
        }

        const jobQueue = new JobQueue(env.DB, env.REPORTS_KV, env.OPENAI_API_KEY, env.RESEND_API_KEY);
        ctx.waitUntil(jobQueue.processPendingJobs());
      }
      
      console.log('Scheduled events completed');
    } catch (error) {
      console.error('Scheduled event error:', error);
    }
  }
};
