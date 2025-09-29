import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

interface StripeConfig {
  success: boolean;
  configuration?: {
    secretKey: {
      source: string;
      prefix: string;
      isTestMode: boolean;
      isLiveMode: boolean;
      length: number;
    };
    publishableKey: {
      prefix: string;
      isTestMode: boolean;
      isLiveMode: boolean;
      length: number;
    };
    keyMismatch: {
      secretIsTest: boolean;
      publishableIsTest: boolean;
      mismatchDetected: boolean;
      severity: string;
    };
    stripeConnectionTest?: {
      success: boolean;
      accountLiveMode?: boolean;
      error?: string;
    };
    diagnosis?: {
      issue: string;
      explanation?: string;
      impact?: string;
      solution?: string;
      status?: string;
    };
  };
  error?: string;
}

interface PaymentFlowTest {
  success: boolean;
  message?: string;
  details?: {
    keyMode: string;
    keySource: string;
    testPaymentIntentId: string;
    steps: string[];
  };
  error?: string;
}

export default function PaymentDebug() {
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [paymentFlowTest, setPaymentFlowTest] = useState<PaymentFlowTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchStripeConfig();
  }, []);

  const fetchStripeConfig = async () => {
    try {
      const response = await fetch('/api/debug/stripe-config');
      const data = await response.json();
      setStripeConfig(data);
    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      setStripeConfig({ success: false, error: 'Failed to fetch configuration' });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentFlow = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/test/payment-flow', { method: 'POST' });
      const data = await response.json();
      setPaymentFlowTest(data);
    } catch (error) {
      console.error('Error testing payment flow:', error);
      setPaymentFlowTest({ success: false, error: 'Failed to test payment flow' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading payment diagnostics...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment System Diagnostics</h1>
          <p className="text-gray-600 mb-8">Diagnose and resolve payment integration issues</p>

          {/* Stripe Configuration Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              {stripeConfig?.configuration?.keyMismatch?.mismatchDetected ? (
                <XCircle className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              <h2 className="text-xl font-semibold text-gray-900">Stripe Configuration</h2>
            </div>

            {stripeConfig?.success && stripeConfig.configuration ? (
              <div className="space-y-4">
                {/* Key Mismatch Alert */}
                {stripeConfig.configuration.keyMismatch.mismatchDetected && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-800">Critical Issue Detected</h3>
                        <p className="text-red-700 mb-2">{stripeConfig.configuration.diagnosis?.explanation}</p>
                        <p className="text-red-700 mb-2"><strong>Impact:</strong> {stripeConfig.configuration.diagnosis?.impact}</p>
                        <p className="text-red-700"><strong>Solution:</strong> {stripeConfig.configuration.diagnosis?.solution}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuration Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Secret Key</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Source:</strong> {stripeConfig.configuration.secretKey.source}</p>
                      <p><strong>Prefix:</strong> {stripeConfig.configuration.secretKey.prefix}</p>
                      <p><strong>Mode:</strong> {stripeConfig.configuration.secretKey.isTestMode ? 'Test' : 'Live'}</p>
                      <p><strong>Length:</strong> {stripeConfig.configuration.secretKey.length} chars</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Publishable Key</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Prefix:</strong> {stripeConfig.configuration.publishableKey.prefix}</p>
                      <p><strong>Mode:</strong> {stripeConfig.configuration.publishableKey.isTestMode ? 'Test' : 'Live'}</p>
                      <p><strong>Length:</strong> {stripeConfig.configuration.publishableKey.length} chars</p>
                    </div>
                  </div>
                </div>

                {/* Stripe Connection Test */}
                {stripeConfig.configuration.stripeConnectionTest && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Stripe Connection Test</h3>
                    {stripeConfig.configuration.stripeConnectionTest.success ? (
                      <div className="flex items-center space-x-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span>Successfully connected to Stripe</span>
                        <span className="text-sm">
                          (Account mode: {stripeConfig.configuration.stripeConnectionTest.accountLiveMode ? 'Live' : 'Test'})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-700">
                        <XCircle className="w-4 h-4" />
                        <span>Failed to connect: {stripeConfig.configuration.stripeConnectionTest.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                Failed to load Stripe configuration: {stripeConfig?.error}
              </div>
            )}
          </div>

          {/* Payment Flow Test */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Payment Flow Test</h2>
              <button
                onClick={testPaymentFlow}
                disabled={testing}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Run Test</span>
                  </>
                )}
              </button>
            </div>

            {paymentFlowTest ? (
              <div className="space-y-4">
                {paymentFlowTest.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-700 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">{paymentFlowTest.message}</span>
                    </div>
                    {paymentFlowTest.details && (
                      <div className="text-sm text-green-700">
                        <p><strong>Mode:</strong> {paymentFlowTest.details.keyMode}</p>
                        <p><strong>Test Payment Intent:</strong> {paymentFlowTest.details.testPaymentIntentId}</p>
                        <div className="mt-2">
                          <strong>Steps completed:</strong>
                          <ul className="mt-1 space-y-1">
                            {paymentFlowTest.details.steps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-700 mb-2">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">Payment Flow Test Failed</span>
                    </div>
                    <p className="text-red-700 mb-2">{paymentFlowTest.error}</p>
                    {(paymentFlowTest as any).details && (
                      <div className="text-sm text-red-700">
                        <p><strong>Error:</strong> {(paymentFlowTest as any).details.errorMessage}</p>
                        <p><strong>Diagnosis:</strong> {(paymentFlowTest as any).details.diagnosis}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Click "Run Test" to validate the payment flow end-to-end</p>
            )}
          </div>

          {/* Troubleshooting Guide */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Troubleshooting Guide</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Common Issues</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-red-400 pl-4">
                    <h4 className="font-medium text-red-800">Key Mismatch</h4>
                    <p className="text-red-700 text-sm">
                      Secret key and publishable key are from different Stripe accounts or modes.
                      This causes "No such payment_intent" errors.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-yellow-400 pl-4">
                    <h4 className="font-medium text-yellow-800">Test vs Live Mode</h4>
                    <p className="text-yellow-700 text-sm">
                      Ensure both keys are from the same mode (both test or both live).
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-400 pl-4">
                    <h4 className="font-medium text-blue-800">Environment Variables</h4>
                    <p className="text-blue-700 text-sm">
                      Check that your environment variables match your intended Stripe account.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Fixes</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Verify both keys are from the same Stripe dashboard</li>
                  <li>• Ensure you're using the correct environment (test/live)</li>
                  <li>• Check that secret keys haven't been rotated</li>
                  <li>• Clear browser cache and try again</li>
                  <li>• Contact admin to verify Stripe account configuration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
