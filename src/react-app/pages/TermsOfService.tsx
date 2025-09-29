import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Terms of Service</h1>
        
        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 shadow-lg">
          <div className="prose max-w-none text-gray-700">
            <p className="text-lg mb-6">
              <strong>Effective Date:</strong> August 2025
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing and using Emigration Pro (the "Service"), you accept and agree to be bound by the terms and 
              provisions of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="mb-6">
              Emigration Pro provides emigration assessment tools and generates personalized reports containing general 
              guidance about international relocation. Our reports include information about immigration requirements, 
              cost analysis, and relocation guidance for various countries.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payment and Refund Policy</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-yellow-800 mb-3">No Refunds Policy</h3>
              <p className="text-yellow-700 mb-4">
                <strong>All sales are final.</strong> Due to the digital nature of our reports and the immediate access 
                provided upon purchase, we do not offer refunds for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-yellow-700 mb-4 space-y-1">
                <li>Change of mind or emigration plans</li>
                <li>Dissatisfaction with report content</li>
                <li>Duplicate purchases</li>
                <li>Technical issues on your end</li>
              </ul>
              
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">Credit for Non-Delivery</h4>
              <p className="text-yellow-700">
                If you do not receive your report within 24 hours of payment due to technical failure on our part, 
                you may be eligible for a service credit equal to your purchase amount. This credit can be applied 
                toward future purchases. To request a service credit, contact us at info@emigrationpro.com with 
                your payment confirmation.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Service Limitations and Disclaimers</h2>
            <p className="mb-4">
              Our reports provide general guidance and should not be considered as:
            </p>
            <ul className="list-disc list-inside mb-6 space-y-1">
              <li>Legal advice or immigration consulting</li>
              <li>Guarantee of immigration approval or success</li>
              <li>Substitute for professional legal counsel</li>
              <li>Current or complete information (laws change frequently)</li>
            </ul>
            <p className="mb-6">
              <strong>Always consult official government sources and qualified immigration professionals</strong> 
              before making any relocation decisions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="mb-6">
              All content, reports, assessments, and materials provided through Emigration Pro are the intellectual 
              property of Clear Products, LLC. You may use the reports for personal purposes but may not redistribute, 
              resell, or commercially exploit the content.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Responsibilities</h2>
            <p className="mb-4">You agree to:</p>
            <ul className="list-disc list-inside mb-6 space-y-1">
              <li>Provide accurate information in assessments</li>
              <li>Use the service for lawful purposes only</li>
              <li>Not attempt to circumvent payment systems</li>
              <li>Not share or distribute purchased reports</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="mb-6">
              Emigration Pro and Clear Products, LLC shall not be liable for any direct, indirect, incidental, 
              special, or consequential damages resulting from your use of the service, including but not limited 
              to immigration delays, denials, financial losses, or relocation difficulties.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications to Terms</h2>
            <p className="mb-6">
              We reserve the right to modify these terms at any time. Changes will be posted on this page with 
              an updated effective date. Continued use of the service constitutes acceptance of modified terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
            <p className="mb-6">
              For questions about these Terms of Service, contact us at:
              <br />
              <strong>Email:</strong> info@emigrationpro.com
              <br />
              <strong>Company:</strong> Clear Products, LLC
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Important Reminder</h3>
              <p className="text-blue-700">
                Immigration laws and requirements change frequently. Our reports provide general guidance based on 
                available information at the time of generation. Always verify current requirements with official 
                government sources and consult qualified immigration professionals for your specific situation.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
