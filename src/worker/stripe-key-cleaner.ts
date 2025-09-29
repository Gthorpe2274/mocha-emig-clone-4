// Utility to completely clean and reset all Stripe key storage
export class StripeKeyCleaner {
  private kv: KVNamespace;

  constructor(_db: D1Database, kv: KVNamespace) {
    // _db parameter kept for interface compatibility but not used in current implementation
    this.kv = kv;
  }

  async cleanAllStripeKeys(): Promise<{
    removedFromKV: string[];
    foundInEnvironment: {
      secret: string;
      publishable: string;
    };
    warnings: string[];
  }> {
    console.log('=== CLEANING ALL STRIPE KEYS ===');
    
    const results = {
      removedFromKV: [] as string[],
      foundInEnvironment: {
        secret: 'NOT_SET',
        publishable: 'NOT_SET'
      },
      warnings: [] as string[]
    };

    // 1. Remove all possible Stripe keys from KV storage
    const possibleKVKeys = [
      'stripe_secret_key',
      'stripe_publishable_key', 
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'stripe_test_key',
      'stripe_live_key',
      'test_stripe_key',
      'live_stripe_key'
    ];

    for (const kvKey of possibleKVKeys) {
      try {
        const existingValue = await this.kv.get(kvKey);
        if (existingValue) {
          await this.kv.delete(kvKey);
          results.removedFromKV.push(`${kvKey}: ${existingValue.substring(0, 12)}...`);
          console.log(`Removed from KV: ${kvKey}`);
        }
      } catch (error) {
        console.warn(`Error checking/removing KV key ${kvKey}:`, error);
      }
    }

    return results;
  }

  async getCurrentKeyStatus(env: any): Promise<{
    environment: {
      secret: {
        value: string;
        prefix: string;
        isTest: boolean;
        isLive: boolean;
        length: number;
      } | null;
      publishable: {
        value: string;
        prefix: string;
        isTest: boolean;
        isLive: boolean;
        length: number;
      } | null;
    };
    kv: {
      foundKeys: string[];
      cleanedKeys: string[];
    };
    analysis: {
      hasValidSecret: boolean;
      hasValidPublishable: boolean;
      keyMismatch: boolean;
      bothAreTest: boolean;
      bothAreLive: boolean;
      issues: string[];
    };
  }> {
    console.log('=== ANALYZING CURRENT KEY STATUS ===');
    
    // Check environment variables
    const secretKey = env.STRIPE_SECRET_KEY;
    const publishableKey = env.STRIPE_PUBLISHABLE_KEY;
    
    const result: any = {
      environment: {
        secret: null,
        publishable: null
      },
      kv: {
        foundKeys: [],
        cleanedKeys: []
      },
      analysis: {
        hasValidSecret: false,
        hasValidPublishable: false,
        keyMismatch: false,
        bothAreTest: false,
        bothAreLive: false,
        issues: []
      }
    };

    // Analyze secret key
    if (secretKey) {
      result.environment.secret = {
        value: secretKey.substring(0, 12) + '...',
        prefix: secretKey.substring(0, 8),
        isTest: secretKey.startsWith('sk_test_'),
        isLive: secretKey.startsWith('sk_live_'),
        length: secretKey.length
      };
      result.analysis.hasValidSecret = secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_');
    }

    // Analyze publishable key
    if (publishableKey) {
      result.environment.publishable = {
        value: publishableKey.substring(0, 12) + '...',
        prefix: publishableKey.substring(0, 8),
        isTest: publishableKey.startsWith('pk_test_'),
        isLive: publishableKey.startsWith('pk_live_'),
        length: publishableKey.length
      };
      result.analysis.hasValidPublishable = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_');
    }

    // Check for mismatches
    if (result.environment.secret && result.environment.publishable) {
      const secretIsTest = result.environment.secret.isTest;
      const publishableIsTest = result.environment.publishable.isTest;
      
      result.analysis.keyMismatch = secretIsTest !== publishableIsTest;
      result.analysis.bothAreTest = secretIsTest && publishableIsTest;
      result.analysis.bothAreLive = !secretIsTest && !publishableIsTest && 
                                   result.environment.secret.isLive && result.environment.publishable.isLive;
    }

    // Identify issues
    if (!result.analysis.hasValidSecret) {
      result.analysis.issues.push('Invalid or missing secret key');
    }
    if (!result.analysis.hasValidPublishable) {
      result.analysis.issues.push('Invalid or missing publishable key');
    }
    if (result.analysis.keyMismatch) {
      result.analysis.issues.push('SECRET KEY AND PUBLISHABLE KEY MODE MISMATCH - This causes payment failures');
    }

    // Check KV storage for any remaining keys
    const kvKeysToCheck = [
      'stripe_secret_key',
      'stripe_publishable_key',
      'STRIPE_SECRET_KEY', 
      'STRIPE_PUBLISHABLE_KEY'
    ];

    for (const kvKey of kvKeysToCheck) {
      try {
        const kvValue = await this.kv.get(kvKey);
        if (kvValue) {
          result.kv.foundKeys.push(`${kvKey}: ${kvValue.substring(0, 12)}...`);
        }
      } catch (error) {
        console.warn(`Error checking KV key ${kvKey}:`, error);
      }
    }

    return result;
  }
}
