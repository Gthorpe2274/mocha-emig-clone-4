import { Link, useLocation } from 'react-router-dom';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

export default function SampleReport() {
  const location = useLocation();
  const returnTo = location.state?.returnTo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {returnTo && (
          <div className="mb-6">
            <Link 
              to={returnTo}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Your Assessment Results
            </Link>
          </div>
        )}
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">Sample Report Section: Immigration Requirements & Visa Options</h1>
        <p className="text-xl text-gray-700 mb-8 text-center">
          This is an excerpt from a comprehensive Emigration Pro report, tailored to a 32-year-old Software Engineer considering relocation to Lisbon, Portugal.
        </p>

        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 shadow-lg">
          <div className="prose max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">For: 32-year-old Software Engineer → Lisbon, Portugal</h2>
            
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Visa Options & Eligibility</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">D7 Passive Income Visa (Retirement/Remote Work Visa)</h3>
            <p className="text-lg font-semibold text-blue-600 mb-4">Best Option for Remote Software Engineers</p>

            <p className="text-gray-700 mb-4">
              The D7 visa is Portugal's most accessible long-term residence permit for Americans who can demonstrate stable passive income or remote work capabilities. As a software engineer, this visa is particularly attractive if you:
            </p>

            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Have remote work arrangements with US clients/employers</li>
              <li>Generate consistent income of €7,200+ annually (€600/month minimum)</li>
              <li>Can demonstrate 12+ months of savings (€9,120 for Lisbon residents)</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-2">Required Documentation:</h4>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Proof of accommodation in Portugal (rental agreement or property deed)</li>
              <li>Criminal background check from FBI (apostilled)</li>
              <li>Income verification: 12 months of bank statements, employment contracts, or client agreements</li>
              <li>Portuguese tax number (NIF) - obtainable online or at Portuguese consulates</li>
              <li>Health insurance valid in Portugal (minimum €30,000 coverage)</li>
            </ul>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800"><strong>Processing Time:</strong> 60-90 days</p>
              <p className="text-blue-800"><strong>Cost:</strong> €83 application fee + €72 residence card fee</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Tech Visa (Startup/Tech Company Sponsor)</h3>
            <p className="text-lg font-semibold text-green-600 mb-4">Ideal for In-Person Employment</p>

            <p className="text-gray-700 mb-4">
              Portugal's Tech Visa program fast-tracks residence permits for skilled tech professionals. Lisbon has over 200 certified tech companies that can sponsor this visa, including:
            </p>

            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Outsystems (low-code platform)</li>
              <li>Farfetch (e-commerce)</li>
              <li>Talkdesk (cloud contact center)</li>
              <li>Remote (HR platform)</li>
              <li>Seedrs (investment platform)</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-2">Eligibility Requirements:</h4>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Bachelor's degree in computer science or related field (or 3+ years equivalent experience)</li>
              <li>Job offer from certified Portuguese tech company</li>
              <li>Salary minimum: €1,760/month (often much higher in Lisbon market)</li>
            </ul>

            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-green-800"><strong>Processing Time:</strong> 30-60 days</p>
              <p className="text-green-800"><strong>Cost:</strong> €83 application fee</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">D2 Entrepreneur/Investment Visa</h3>
            <p className="text-lg font-semibold text-purple-600 mb-4">For Software Engineers Starting Businesses</p>

            <p className="text-gray-700 mb-4">If you plan to launch a tech startup or freelance business in Portugal:</p>

            <h4 className="text-lg font-semibold text-gray-800 mb-2">Investment Requirements:</h4>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Minimum €5,000 investment in Portuguese business</li>
              <li>Business plan demonstrating job creation potential</li>
              <li>Proof of business registration in Portugal</li>
            </ul>

            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <p className="text-purple-800"><strong>Processing Time:</strong> 90-120 days</p>
              <p className="text-purple-800"><strong>Cost:</strong> €83 application fee + legal/business setup costs (€2,000-5,000)</p>
            </div>

            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Permanent Residency Pathways</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5-Year Pathway (Standard Route)</h3>
            <p className="text-gray-700 mb-4">
              After 5 years of continuous legal residence on any visa type, you can apply for permanent residence:
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-2">Requirements:</h4>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Basic Portuguese language proficiency (A2 level)</li>
              <li>Clean criminal record in Portugal and US</li>
              <li>Proof of accommodation and financial stability</li>
              <li>Integration course completion (available online)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6-Year Portuguese Citizenship</h3>
            <p className="text-gray-700 mb-4">Portugal offers one of Europe's fastest citizenship pathways:</p>

            <h4 className="text-lg font-semibold text-gray-800 mb-2">Advantages for Age 32:</h4>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Young enough to easily meet language requirements</li>
              <li>34+ years of professional career ahead with EU passport benefits</li>
              <li>No requirement to renounce US citizenship (dual citizenship allowed)</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-2">Requirements:</h4>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>5 years permanent residence + 1 year citizenship application process</li>
              <li>B2 Portuguese proficiency (conversational level)</li>
              <li>Clean criminal record</li>
              <li>Basic knowledge of Portuguese history and culture</li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">Age-Specific Advantages</h4>
              <p className="text-yellow-700 mb-2"><strong>At 32 years old, you have significant advantages:</strong></p>
              <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                <li><strong>Peak Earning Years:</strong> Portuguese tech salaries range €25,000-€55,000 annually, with senior positions reaching €70,000+</li>
                <li><strong>Language Learning:</strong> Neuroplasticity advantages for Portuguese acquisition</li>
                <li><strong>Career Growth:</strong> 30+ years to build Portuguese/EU professional network</li>
                <li><strong>EU Mobility:</strong> Future access to work in Germany, Netherlands, Switzerland with higher tech salaries</li>
              </ol>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-semibold text-red-800 mb-3">⚠️ This is Only a Sample Section</h3>
              <p className="text-red-700 mb-3">
                The complete Emigration Pro report includes 8+ additional sections covering:
              </p>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                <li>Complete cost of living analysis with neighborhood-specific pricing</li>
                <li>Healthcare system details and insurance requirements</li>
                <li>Tax implications and financial planning strategies</li>
                <li>Housing market analysis and rental guidance</li>
                <li>Cultural integration resources and language learning</li>
                <li>Step-by-step 12-month relocation timeline</li>
                <li>Professional contacts directory (lawyers, accountants, services)</li>
                <li>Emergency resources and expat community connections</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready for Your Personalized Report?</h2>
          <p className="text-xl text-gray-700 mb-8">
            Our full reports are custom-generated to your specific age, profession, and preferences, providing all the detailed guidance you need for your unique situation.
          </p>
          <Link
            to="/assessment"
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Your Assessment Now
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
