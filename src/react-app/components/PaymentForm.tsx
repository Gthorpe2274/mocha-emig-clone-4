import { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  assessmentId: number;
  onPaymentSuccess: (tokenOrJobId: string, isJob?: boolean) => void;
  onPaymentError: (error: string) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

export default function PaymentForm({ assessmentId, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success' | 'error'>('details');
  const [errorMessage, setErrorMessage] = useState('');
  const [stripeMode, setStripeMode] = useState<'test' | 'live' | null>(null);

  // Create payment intent when component mounts
  useEffect(() => {
    createPaymentIntent();
  }, [assessmentId]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('PaymentForm state changed:', { paymentStep, errorMessage, clientSecret, stripeMode });
  }, [paymentStep, errorMessage, clientSecret, stripeMode]);

  const createPaymentIntent = async () => {
    try {
      console.log('=== CREATING PAYMENT INTENT ===');
      console.log('Assessment ID:', assessmentId);
      console.log('Customer Email:', customerEmail);
      
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assessmentId,
          customerEmail: customerEmail || undefined
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      let data;
      try {
        data = await response.json();
        console.log('Payment intent response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        const text = await response.text();
        console.error('Response text:', text);
        setErrorMessage('Server returned invalid response. Please try again.');
        setPaymentStep('error');
        return;
      }
      
      if (!response.ok) {
        console.error('Payment intent API error:', data);
        if (data.reportExists) {
          setErrorMessage('You have already purchased this report. Check your email for download instructions.');
          setPaymentStep('error');
        } else if (data.needsConfig) {
          setErrorMessage('Payment system configuration required. Please contact support to configure Stripe settings.');
          setPaymentStep('error');
        } else if (data.stripeError) {
          setErrorMessage(`Stripe error (${data.stripeMode || 'unknown'} mode): ${data.error || 'Configuration problem'}`);
          setPaymentStep('error');
        } else {
          setErrorMessage(data.error || `Server error (${response.status}). Please try again.`);
          setPaymentStep('error');
        }
        return;
      }

      if (!data.clientSecret) {
        console.error('No client secret in response:', data);
        setErrorMessage('Payment initialization failed. Missing client secret.');
        setPaymentStep('error');
        return;
      }

      setClientSecret(data.clientSecret);
      setStripeMode(data.stripeMode || 'test');
      console.log(`Payment intent created successfully in ${data.stripeMode || 'unknown'} mode`);
      console.log('=== PAYMENT INTENT CREATION COMPLETE ===');
    } catch (error) {
      console.error('Network error creating payment intent:', error);
      setErrorMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your connection and try again.`);
      setPaymentStep('error');
      // Don't hide the payment form completely on network errors
      return;
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      setErrorMessage('Payment system not ready. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage('Card information not found. Please refresh and try again.');
      return;
    }

    if (!cardComplete) {
      setErrorMessage('Please complete your card information');
      return;
    }

    setIsLoading(true);

    try {
      // Confirm payment with Stripe - keep CardElement mounted
      console.log('Confirming payment with client secret:', clientSecret);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: customerEmail || undefined,
          },
        }
      });

      if (error) {
        console.error('Stripe error:', error);
        throw new Error(error.message || 'Payment failed');
      }

      console.log('Payment intent result:', paymentIntent);
      
      // Only change step after successful Stripe confirmation
      setPaymentStep('processing');

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Call our backend to confirm payment and generate report
        console.log('Calling backend to confirm payment:', paymentIntent.id);
        const response = await fetch(`/api/payments/confirm/${paymentIntent.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        console.log('Backend confirmation result:', result);

        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate report');
        }

        if (result.success) {
          if (result.immediate && result.downloadToken) {
            // Report already exists - immediate download
            setPaymentStep('success');
            onPaymentSuccess(result.downloadToken);
          } else if (result.jobId) {
            // Report generation queued - pass job ID for polling
            setPaymentStep('success');
            onPaymentSuccess(result.jobId, true);
          } else {
            throw new Error('Payment successful but no download token or job ID received');
          }
        } else {
          throw new Error('Payment successful but result indicates failure');
        }
      } else {
        throw new Error(`Payment was not completed successfully. Status: ${paymentIntent?.status || 'unknown'}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      setErrorMessage(errorMsg);
      setPaymentStep('error');
      onPaymentError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    if (event.error) {
      setErrorMessage(event.error.message);
    } else {
      setErrorMessage('');
    }
  };

  if (paymentStep === 'success') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 Payment Successful!</h3>
        <p className="text-lg text-gray-700 mb-4 font-medium">Your comprehensive emigration report is being generated!</p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <p className="text-green-800 font-semibold mb-3">📄 Your Report Includes:</p>
          <div className="text-sm text-green-700 space-y-1">
            <p>✅ Current immigration requirements for workers and retirees</p>
            <p>✅ Detailed cost analysis and budgeting guide</p>
            <p>✅ Step-by-step relocation timeline</p>
            <p>✅ Professional contacts and emergency resources</p>
            <p>✅ Healthcare system and insurance guidance</p>
            <p>✅ Tax implications and financial planning</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📱 <strong>Next Steps:</strong> You can download your PDF report immediately. 
            {customerEmail && (
              <>
                <br />📧 A backup download link has been sent to your email address.
              </>
            )}
            <br />⏰ Download links remain active for 7 days.
          </p>
        </div>
      </div>
    );
  }

  if (paymentStep === 'error') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h3>
        <p className="text-red-600 mb-4">{errorMessage}</p>
        <button
          onClick={() => {
            console.log('Closing payment modal');
            setPaymentStep('details');
            setErrorMessage('');
            createPaymentIntent();
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg relative">
        {/* Processing overlay - only show when processing */}
        {paymentStep === 'processing' && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Payment</h3>
              <p className="text-gray-600">Please wait while we generate your comprehensive report...</p>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  🔄 Creating your personalized emigration report with current legal requirements, 
                  specific costs, and step-by-step guidance...
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure Payment</h3>
          <p className="text-gray-600">Complete your purchase to download the full report</p>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={paymentStep === 'processing'}
            />
            <p className="text-lg text-gray-500 mt-1">For receipt and download backup</p>
          </div>

          {/* Card Element */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <CardElement 
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            {errorMessage && (
              <p className="text-red-600 text-lg mt-2">{errorMessage}</p>
            )}
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Comprehensive Emigration Report</span>
              <div className="text-right">
                <div className="text-sm text-gray-500 line-through">Reg. $69.95</div>
                <div className="font-semibold text-green-600">$49.99</div>
                <div className="text-xs text-red-600 font-medium">Limited Time</div>
              </div>
            </div>
            <div className="flex justify-between items-center text-lg text-gray-500">
              <span>• Current legal requirements</span>
            </div>
            <div className="flex justify-between items-center text-lg text-gray-500">
              <span>• Detailed cost analysis</span>
            </div>
            <div className="flex justify-between items-center text-lg text-gray-500">
              <span>• Step-by-step timeline</span>
            </div>
            <div className="flex justify-between items-center text-lg text-gray-500">
              <span>• Professional contacts</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <div className="text-right">
                <div className="text-sm text-gray-500 line-through font-normal">$69.95</div>
                <div className="text-green-600">$49.99 USD</div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || !cardComplete || isLoading || !clientSecret || paymentStep === 'processing'}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Confirming Payment...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Lock className="w-5 h-5 mr-2" />
                Pay $49.99 - Secure Payment
              </div>
            )}
          </button>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-lg text-gray-500">
              🔒 Your payment is secured with 256-bit SSL encryption
            </p>
          </div>
        </form>
      </div>

      {/* Stripe Mode Notice */}
      <div className={`mt-6 border rounded-lg p-4 ${
        stripeMode === 'test' 
          ? 'bg-yellow-50 border-yellow-200' 
          : stripeMode === 'live'
          ? 'bg-green-50 border-green-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        {stripeMode === 'test' ? (
          <div>
            <p className="text-sm text-yellow-800 font-medium mb-2">
              🧪 <strong>Test Mode Active</strong>
            </p>
            <p className="text-lg text-yellow-700">
              Use test card: <strong>4242 4242 4242 4242</strong> with any future date and CVC.
              No real charges will be made.
            </p>
          </div>
        ) : stripeMode === 'live' ? (
          <div>
            <p className="text-lg text-green-800 font-medium mb-2">
              💳 <strong>Live Payment Mode</strong>
            </p>
            <p className="text-lg text-green-700">
              Real payments are enabled. Your card will be charged $49.99.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg text-blue-800 font-medium mb-2">
              ⚙️ <strong>Checking Payment Configuration...</strong>
            </p>
            <p className="text-lg text-blue-700">
              Validating Stripe settings. Please wait...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
