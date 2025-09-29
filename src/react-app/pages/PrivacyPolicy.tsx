import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Privacy Policy</h1>
        
        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 shadow-lg">
          <div className="prose max-w-none text-gray-700">
            <p className="text-lg mb-6">
              <strong>Effective Date:</strong> August 2025
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside mb-6 space-y-1">
              <li><strong>Assessment Data:</strong> Age, occupation, preferred destination, location preferences, and priority ratings</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store credit card details)</li>
              <li><strong>Contact Information:</strong> Email address for report delivery</li>
              <li><strong>Usage Data:</strong> How you interact with our website and services</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information to:</p>
            <ul className="list-disc list-inside mb-6 space-y-1">
              <li>Generate personalized emigration reports</li>
              <li>Process payments and deliver purchased reports</li>
              <li>Improve our assessment algorithms and report quality</li>
              <li>Provide customer support</li>
              <li>Send important service updates (not marketing)</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-green-800 mb-3">We Do Not Share or Sell Your Information</h3>
              <p className="text-green-700 mb-4">
                <strong>Your privacy is our priority.</strong> We do not share, sell, rent, or trade your personal 
                information with third parties for their commercial purposes. Your assessment data and personal 
                information remain confidential and are used solely to provide our services to you.
              </p>
              <p className="text-green-700">
                The only exception is our payment processor (Stripe), which handles payment information securely 
                according to industry standards and their own privacy policy.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="mb-4">We may share your information only in the following limited circumstances:</p>
            <ul className="list-disc list-inside mb-6 space-y-1">
              <li><strong>Service Providers:</strong> Stripe for payment processing (they have their own privacy policy)</li>
              <li><strong>Legal Requirements:</strong> If required by law, court order, or governmental request</li>
              <li><strong>Business Transfer:</strong> In the event of a merger or sale of our business (with notice to you)</li>
              <li><strong>Your Consent:</strong> When you explicitly authorize us to share specific information</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="mb-6">
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. Our systems use encryption, 
              secure data storage, and regular security updates.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="mb-6">
              We retain your assessment data and generated reports for the purpose of providing ongoing access 
              to your purchased reports. If you wish to have your data deleted, you may contact us at 
              info@emigrationpro.com with your request.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
            <p className="mb-6">
              Our website may use cookies to enhance user experience and analyze website traffic. We do not use 
              third-party advertising cookies or tracking for marketing purposes. You can control cookie settings 
              through your browser preferences.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Services</h2>
            <p className="mb-4">Our website integrates with the following third-party services:</p>
            <ul className="list-disc list-inside mb-6 space-y-1">
              <li><strong>Stripe:</strong> For secure payment processing (subject to Stripe's privacy policy)</li>
              <li><strong>Cloudflare:</strong> For website hosting and security (subject to Cloudflare's privacy policy)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside mb-6 space-y-1">
              <li>Access the personal information we have about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Opt out of non-essential communications</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="mb-6">
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect 
              personal information from children under 18. If you are under 18, please do not use our services 
              or provide any information to us.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="mb-6">
              Your information may be processed and stored in the United States or other countries where our 
              service providers operate. By using our services, you consent to the transfer of your information 
              to these locations.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Privacy Policy</h2>
            <p className="mb-6">
              We may update this privacy policy from time to time. We will notify you of any changes by posting 
              the new privacy policy on this page with an updated effective date. We encourage you to review 
              this privacy policy periodically.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="mb-6">
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
              <br />
              <strong>Email:</strong> info@emigrationpro.com
              <br />
              <strong>Company:</strong> Clear Products, LLC
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Your Trust Matters</h3>
              <p className="text-blue-700">
                We are committed to protecting your privacy and maintaining the confidentiality of your personal 
                information. We will never sell or share your data with third parties for marketing purposes. 
                Your trust is essential to our business, and we take that responsibility seriously.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
