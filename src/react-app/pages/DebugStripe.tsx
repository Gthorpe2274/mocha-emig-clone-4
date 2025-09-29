import { useEffect } from "react";
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

// Top-level diagnostic logger
console.log("🚀 StripeDebugPage module loaded");

export default function DebugStripe() {
  useEffect(() => {
    console.log("✅ StripeDebugPage component mounted");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Stripe Debug Page</h1>
            <p className="text-xl text-gray-600">Debug and test Stripe payment functionality</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 shadow-lg">
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-green-800 mb-4">🎉 Page Loaded Successfully!</h2>
                <p className="text-green-700 mb-4">
                  If you can see this text, the routing and React rendering are working correctly.
                </p>
                <div className="text-sm text-green-600">
                  <p>✅ React component rendered</p>
                  <p>✅ Navigation component loaded</p>
                  <p>✅ Styling applied</p>
                  <p>✅ Route /debug/stripe is functional</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">Debug Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Route:</strong> /debug/stripe
                  </div>
                  <div>
                    <strong>Component:</strong> DebugStripe.tsx
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {new Date().toLocaleString()}
                  </div>
                  <div>
                    <strong>Status:</strong> <span className="text-green-600 font-semibold">Active</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-purple-800 mb-3">Stripe Configuration Test</h3>
                <p className="text-purple-700 mb-4">
                  This page can be used to test Stripe payment functionality and debug payment-related issues.
                </p>
                <div className="space-y-2 text-sm text-purple-600">
                  <p>• Check Stripe API keys</p>
                  <p>• Test payment flows</p>
                  <p>• Debug payment errors</p>
                  <p>• Verify webhook endpoints</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-lg text-gray-600">
                  Console logs are available in your browser's developer tools (F12).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
