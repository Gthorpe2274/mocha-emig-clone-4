// Health check utility for diagnosing 502 errors
export class HealthChecker {
  static async performHealthCheck(env: any): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: Record<string, { status: 'pass' | 'fail'; message: string; details?: any }>;
    timestamp: string;
  }> {
    const checks: Record<string, { status: 'pass' | 'fail'; message: string; details?: any }> = {};
    let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

    // Check 1: Database connectivity
    try {
      const dbTest = await env.DB.prepare('SELECT 1 as test').first();
      checks.database = {
        status: dbTest ? 'pass' : 'fail',
        message: dbTest ? 'Database connection successful' : 'Database connection failed'
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      overallStatus = 'unhealthy';
    }

    // Check 2: KV Storage connectivity
    try {
      const testKey = `health-check-${Date.now()}`;
      await env.REPORTS_KV.put(testKey, 'test', { expirationTtl: 60 });
      const testValue = await env.REPORTS_KV.get(testKey);
      await env.REPORTS_KV.delete(testKey);
      
      checks.kv_storage = {
        status: testValue === 'test' ? 'pass' : 'fail',
        message: testValue === 'test' ? 'KV storage working correctly' : 'KV storage test failed'
      };
    } catch (error) {
      checks.kv_storage = {
        status: 'fail',
        message: `KV storage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      overallStatus = 'unhealthy';
    }

    // Check 3: Environment variables
    const requiredEnvVars = ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'];
    const missingEnvVars = requiredEnvVars.filter(varName => !env[varName]);
    
    checks.environment_variables = {
      status: missingEnvVars.length === 0 ? 'pass' : 'fail',
      message: missingEnvVars.length === 0 ? 
        'All required environment variables present' : 
        `Missing environment variables: ${missingEnvVars.join(', ')}`,
      details: {
        required: requiredEnvVars,
        missing: missingEnvVars,
        present: requiredEnvVars.filter(varName => env[varName])
      }
    };

    if (missingEnvVars.length > 0) {
      overallStatus = 'unhealthy';
    }

    // Check 4: Memory and basic functionality
    try {
      // Test JSON parsing/stringifying (common source of errors)
      const testData = { test: true, timestamp: new Date().toISOString() };
      const serialized = JSON.stringify(testData);
      const deserialized = JSON.parse(serialized);
      
      checks.basic_functionality = {
        status: deserialized.test === true ? 'pass' : 'fail',
        message: deserialized.test === true ? 'Basic JSON operations working' : 'JSON operations failed'
      };
    } catch (error) {
      checks.basic_functionality = {
        status: 'fail',
        message: `Basic functionality test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      };
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  static async quickHealthCheck(): Promise<{ status: string; message: string }> {
    try {
      // Very basic health check that should always work
      const timestamp = new Date().toISOString();
      return {
        status: 'healthy',
        message: `Worker is responsive at ${timestamp}`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Worker health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
