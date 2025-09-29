import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, ExternalLink, Users, Video, CreditCard } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AssessmentResultType } from '@/shared/types';
import PaymentForm from '@/react-app/components/PaymentForm';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

interface YoutubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  description: string;
  url: string;
}

export default function RelocationHub() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState<AssessmentResultType | null>(null);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  
  // Initialize Stripe
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`/api/assessments/${id}`);
        if (response.ok) {
          const data = await response.json();
          setAssessment(data);
          
          // Generate relevant videos based on the country
          const countryVideos = generateVideosForCountry(data.preferred_country, data.preferred_city);
          setVideos(countryVideos);
        }
      } catch (error) {
        console.error('Error fetching assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAssessment();
    }
  }, [id]);

  // Mock video generation - in a real app, this would use YouTube API
  const generateVideosForCountry = (country: string, city?: string): YoutubeVideo[] => {
    const baseVideos = [
      {
        id: '1',
        title: `Living in ${country} as an American - My Experience`,
        channel: 'Expat Adventures',
        thumbnail: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=400&h=225&fit=crop',
        description: `Personal story of relocating from the US to ${country}. Covers visa process, culture shock, and daily life.`,
        url: `https://youtube.com/search?q=american+living+in+${country.toLowerCase().replace(' ', '+')}`
      },
      {
        id: '2',
        title: `Cost of Living in ${country} vs USA - Complete Breakdown`,
        channel: 'International Living',
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop',
        description: `Detailed comparison of housing, food, transportation, and healthcare costs between ${country} and the United States.`,
        url: `https://youtube.com/search?q=cost+of+living+${country.toLowerCase().replace(' ', '+')}`
      },
      {
        id: '3',
        title: `${country} Immigration Process - Step by Step Guide`,
        channel: 'Visa Guide Pro',
        thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=225&fit=crop',
        description: `Complete walkthrough of visa requirements, documentation, and immigration process for US citizens moving to ${country}.`,
        url: `https://youtube.com/search?q=${country.toLowerCase().replace(' ', '+')}+visa+immigration+guide`
      },
      {
        id: '4',
        title: `Healthcare System in ${country} - Expat Guide`,
        channel: 'Healthy Abroad',
        thumbnail: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/healthcare-expat-guide.jpg',
        description: `Everything you need to know about healthcare, insurance, and medical services in ${country} for American expats.`,
        url: `https://youtube.com/search?q=${country.toLowerCase().replace(' ', '+')}+healthcare+expat`
      },
      {
        id: '5',
        title: `Cultural Differences: What Americans Should Know About ${country}`,
        channel: 'Culture Connect',
        thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=225&fit=crop',
        description: `Important cultural insights, social norms, and etiquette tips for Americans adapting to life in ${country}.`,
        url: `https://youtube.com/search?q=${country.toLowerCase().replace(' ', '+')}+culture+american+expat`
      }
    ];

    if (city) {
      baseVideos.push({
        id: '6',
        title: `Living in ${city}, ${country} - Neighborhood Guide`,
        channel: 'City Explorer',
        thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=225&fit=crop',
        description: `Detailed guide to the best neighborhoods, amenities, and lifestyle in ${city} for international residents.`,
        url: `https://youtube.com/search?q=living+in+${city?.toLowerCase().replace(' ', '+')}+${country.toLowerCase().replace(' ', '+')}`
      });
    }

    return baseVideos;
  };

  const handlePaymentSuccess = (tokenOrJobId: string, isJob = false) => {
    console.log('🎉 Payment success! Received:', tokenOrJobId, 'isJob:', isJob);
    setShowPayment(false);
    
    // Redirect to results page to show download
    window.location.href = `/results/${id}`;
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment error:', error);
    alert(`Payment failed: ${error}`);
    setShowPayment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your relocation hub...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-700">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hub Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-lg font-medium mb-4">
              <Users className="w-4 h-4 mr-2" />
              Your Temporary Relocation Hub
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {assessment.preferred_country} Relocation Hub
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Real experiences and relocation insights from US citizens living in {assessment.preferred_country}
              {assessment.preferred_city && ` - ${assessment.preferred_city}`}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-lg text-green-800">
                <strong>Note:</strong> This relocation hub provides peer insights and general tips. 
                For detailed legal requirements, specific costs, and professional step-by-step guidance, 
                consider upgrading to the comprehensive relocation report.
              </p>
            </div>

            {/* Purchase Report Button */}
            <div className="text-center mt-8">
              <div className="mb-3">
                <div className="text-lg text-gray-500 line-through">Regularly $69.95</div>
                <div className="text-sm text-red-600 font-semibold">Limited Time Offer</div>
              </div>
              <button 
                onClick={() => {
                  console.log('Header purchase button clicked - opening Stripe payment modal');
                  setShowPayment(true);
                }}
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Get Professional Report - $49.99
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Professional guidance worth thousands in avoided mistakes
              </p>
            </div>
          </div>

          {/* Professional Services */}
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <ExternalLink className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Professional Relocation Services</h3>
            </div>
            <p className="text-gray-600 mb-8">
              Connect with verified professional service providers to handle the complex aspects of your relocation to {assessment.preferred_country}.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Immigration Law Services */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Fragomen Worldwide</h4>
                      <div className="flex items-center space-x-1">
                        <div className="flex text-yellow-400">
                          {'★'.repeat(5)}
                        </div>
                        <span className="text-sm text-gray-500">4.8 (534)</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Verified Partner</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-blue-600 mb-2">Emigration Law & Legal Services</p>
                <p className="text-sm text-gray-600 mb-3">
                  Global emigration law firm with offices in 60+ countries. Specializes in corporate and individual visa services.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <p><strong>Specializes in:</strong> Corporate Visas, Investment Visas, Family Reunification, Citizenship Applications</p>
                  <p className="mt-1">📞 +1-212-698-5400</p>
                </div>
                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>24/7 Support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Document Review</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Application Tracking</span>
                  </div>
                </div>
                <a 
                  href="https://www.fragomen.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  Get Free Quote & Connect
                </a>
              </div>

              {/* Banking & Finance */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Wise (formerly TransferWise)</h4>
                      <div className="flex items-center space-x-1">
                        <div className="flex text-yellow-400">
                          {'★'.repeat(5)}
                        </div>
                        <span className="text-sm text-gray-500">4.8 (4628)</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Verified Partner</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-purple-600 mb-2">Banking & Financial Services</p>
                <p className="text-sm text-gray-600 mb-3">
                  Multi-currency accounts and international money transfers for expats. Low fees - typically 0.5-2% of transfer.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <p><strong>Specializes in:</strong> Multi-currency Accounts, International Transfers, Debit Cards, Business Accounts</p>
                  <p className="mt-1">🌐 help@wise.com</p>
                </div>
                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Real Exchange Rates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Mobile App</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Fast Transfers</span>
                  </div>
                </div>
                <a 
                  href="https://wise.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors text-center"
                >
                  Get Free Quote & Connect
                </a>
              </div>

              {/* Health Insurance */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Cigna Global Health Insurance</h4>
                      <div className="flex items-center space-x-1">
                        <div className="flex text-yellow-400">
                          {'★'.repeat(4)}★
                        </div>
                        <span className="text-sm text-gray-500">4.7 (341)</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Verified Partner</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-red-600 mb-2">Healthcare & Insurance</p>
                <p className="text-sm text-gray-600 mb-3">
                  Comprehensive international health insurance for expats and global citizens. From $100/month - varies by coverage.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <p><strong>Specializes in:</strong> Global Coverage, Pre-existing Conditions, Maternity Care, Emergency Evacuation</p>
                  <p className="mt-1">📞 +44-175-788-400</p>
                </div>
                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>24/7 Support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Direct Billing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Telemedicine</span>
                  </div>
                </div>
                <a 
                  href="https://www.cignaglobal.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors text-center"
                >
                  Get Free Quote & Connect
                </a>
              </div>

              {/* International Moving */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Allied Van Lines International</h4>
                      <div className="flex items-center space-x-1">
                        <div className="flex text-yellow-400">
                          {'★'.repeat(4)}☆
                        </div>
                        <span className="text-sm text-gray-500">4.6 (234)</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Verified Partner</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-green-600 mb-2">International Moving & Logistics</p>
                <p className="text-sm text-gray-600 mb-3">
                  Full-service international moving company with 90+ years of experience. Free quote - typically $5,000-$15,000.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <p><strong>Specializes in:</strong> Door-to-door Service, Pet Relocation, Vehicle Shipping, Storage Solutions</p>
                  <p className="mt-1">📞 +1-800-689-8684</p>
                </div>
                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Full Packing Service</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Insurance Coverage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Tracking System</span>
                  </div>
                </div>
                <a 
                  href="https://www.allied.com/international-moving-company/international-moving" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors text-center"
                >
                  Get Free Quote & Connect
                </a>
              </div>

              {/* Tax Services */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Greenback Expat Tax Services</h4>
                      <div className="flex items-center space-x-1">
                        <div className="flex text-yellow-400">
                          {'★'.repeat(5)}
                        </div>
                        <span className="text-sm text-gray-500">4.9 (189)</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Verified Partner</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-orange-600 mb-2">Tax Preparation & Planning</p>
                <p className="text-sm text-gray-600 mb-3">
                  Specialized US tax preparation for expats. Handles FBAR, FATCA, and foreign tax credits. From $390/year.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <p><strong>Specializes in:</strong> Expat Tax Returns, FBAR Filing, FATCA Compliance, Tax Planning</p>
                  <p className="mt-1">📞 +1-888-514-9292</p>
                </div>
                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>100% Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>CPA Review</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Audit Protection</span>
                  </div>
                </div>
                <a 
                  href="https://www.greenbacktaxservices.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors text-center"
                >
                  Get Free Quote & Connect
                </a>
              </div>

              {/* Education Services */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">International Schools Services</h4>
                      <div className="flex items-center space-x-1">
                        <div className="flex text-yellow-400">
                          {'★'.repeat(4)}★
                        </div>
                        <span className="text-sm text-gray-500">4.7 (156)</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Verified Partner</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-indigo-600 mb-2">Education & School Placement</p>
                <p className="text-sm text-gray-600 mb-3">
                  Find international schools and education options in {assessment.preferred_country}. American curriculum available.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  <p><strong>Specializes in:</strong> International Schools, American Curriculum, IB Programs, University Prep</p>
                  <p className="mt-1">📞 +1-609-452-0990</p>
                </div>
                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>School Search</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Application Support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Transcript Transfer</span>
                  </div>
                </div>
                <a 
                  href="https://www.iss.edu/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors text-center"
                >
                  Get Free Quote & Connect
                </a>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-3">✅ Verified Professional Partners</h4>
              <p className="text-blue-700 text-sm mb-4">
                These service providers have been verified for their expertise in international relocation. 
                While we don't endorse specific companies, these represent established firms with track records serving American expats.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <strong>Benefits of Professional Services:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Expert guidance through complex processes</li>
                    <li>• Time savings on research and paperwork</li>
                    <li>• Reduced risk of costly mistakes</li>
                    <li>• Access to specialized knowledge</li>
                  </ul>
                </div>
                <div>
                  <strong>Before Engaging Services:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Compare multiple providers</li>
                    <li>• Verify current licensing and credentials</li>
                    <li>• Read recent client reviews</li>
                    <li>• Get detailed cost estimates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Community Insights */}
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Video className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Relocation Video Resources</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Watch real stories and personal experiences from Americans who have made the move to {assessment.preferred_country}. 
              These relocation-shared videos provide personal perspectives and general tips to complement professional guidance.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <h4 className="font-semibold text-green-800 mb-2">⚠️ Important: Relocation Content Limitations</h4>
              <p className="text-lg text-green-700 mb-3">
                While these videos often claim to tell you "all you need to know" about visas, healthcare, or immigration, 
                they provide general overviews that may not apply to your specific situation. Real relocation requires:
              </p>
              <ul className="text-lg text-green-700 space-y-1">
                <li>• <strong>Current legal requirements</strong> - Immigration laws change frequently</li>
                <li>• <strong>Personal circumstances</strong> - Your age, profession, and assets affect eligibility</li>
                <li>• <strong>Specific documentation</strong> - Exact forms, translations, and certifications needed</li>
                <li>• <strong>Location-specific details</strong> - Local regulations vary by city/region</li>
                <li>• <strong>Professional verification</strong> - Expert review of your unique situation</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div key={video.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {video.title}
                    </h4>
                    <p className="text-lg text-blue-600 mb-3">{video.channel}</p>
                    <p className="text-lg text-gray-600 mb-4 line-clamp-3">
                      {video.description}
                    </p>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-lg"
                    >
                      Watch on YouTube
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Resources */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Expat Communities */}
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Online Relocation Networks</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Facebook Groups</h4>
                    <p className="text-lg text-gray-600">Join active expat relocation groups for daily tips and support</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Reddit Relocation Groups</h4>
                    <p className="text-lg text-gray-600">r/{assessment.preferred_country.toLowerCase().replace(' ', '')} and expat-focused subreddits</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Discord Servers</h4>
                    <p className="text-lg text-gray-600">Real-time chat with current residents and newcomers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Start Tips</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-lg text-gray-700">Start with a tourist visa to explore first</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-lg text-gray-700">Connect with local expat groups before moving</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-lg text-gray-700">Research tax implications with a professional</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-lg text-gray-700">Learn basic local language phrases</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-lg text-gray-700">Open a local bank account as soon as possible</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Comparison */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Why Relocation Insights Aren't Enough for Real Relocation
            </h3>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Free Content Limitations */}
              <div className="bg-red-50 border border-red-200 p-8 rounded-2xl">
                <h4 className="text-xl font-bold text-red-800 mb-6">Relocation Hub Limitations</h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-semibold text-red-700 mb-2">🎥 YouTube "Complete Guides"</h5>
                    <p className="text-lg text-red-600 mb-3">
                      Videos claiming "All you need to know about visas" or "Quick way to get residency" may provide outdated, 
                      general information that may not apply to your specific situation.
                    </p>
                    <ul className="text-lg text-red-600 space-y-1">
                      <li>• Often 1-2 years behind current immigration law</li>
                      <li>• Generic advice not tailored to your profession/age</li>
                      <li>• Missing critical documentation requirements</li>
                      <li>• No accountability for accuracy</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-red-700 mb-2">🏥 Healthcare "Overviews"</h5>
                    <p className="text-lg text-red-600 mb-3">
                      General healthcare videos miss crucial location-specific details you need for real planning.
                    </p>
                    <ul className="text-lg text-red-600 space-y-1">
                      <li>• No specific hospital locations or quality ratings</li>
                      <li>• Missing insurance provider networks</li>
                      <li>• No coverage for your existing conditions</li>
                      <li>• Unclear about emergency procedures</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-red-700 mb-2">💰 "Cost of Living" Generalizations</h5>
                    <p className="text-lg text-red-600 mb-3">
                      Relocation estimates vary wildly and don't account for your lifestyle or location preferences.
                    </p>
                    <ul className="text-lg text-red-600 space-y-1">
                      <li>• No specific neighborhood breakdowns</li>
                      <li>• Missing import costs for your belongings</li>
                      <li>• Outdated pricing information</li>
                      <li>• No budget planning for transition period</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Professional Report Benefits */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 p-8 rounded-2xl">
                <h4 className="text-xl font-bold text-green-800 mb-6">Professional Report Advantages</h4>
                
                <div className="space-y-6">
                  <div>
                    <h5 className="font-semibold text-green-700 mb-2">📋 Current Legal Requirements</h5>
                    <p className="text-lg text-green-600 mb-3">
                      Up-to-date immigration pathways specific to your age, profession, and financial situation.
                    </p>
                    <ul className="text-lg text-green-600 space-y-1">
                      <li>• Current visa eligibility for your specific profession</li>
                      <li>• Exact documentation with translation requirements</li>
                      <li>• Permanent residency pathways and timelines</li>
                      <li>• Legal contacts for complex situations</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-green-700 mb-2">🏥 Specific Healthcare Intelligence</h5>
                    <p className="text-lg text-green-600 mb-3">
                      Detailed healthcare mapping for your chosen city with specific facility recommendations.
                    </p>
                    <ul className="text-lg text-green-600 space-y-1">
                      <li>• Nearest quality hospitals to your preferred neighborhoods</li>
                      <li>• Insurance providers with English-speaking support</li>
                      <li>• Emergency contact procedures and locations</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-green-700 mb-2">💰 Precise Financial Planning</h5>
                    <p className="text-lg text-green-600 mb-3">
                      Detailed budgets based on your preferred city and lifestyle requirements.
                    </p>
                    <ul className="text-lg text-green-600 space-y-1">
                      <li>• Neighborhood-specific housing costs</li>
                      <li>• Import duties for your belongings</li>
                      <li>• Tax optimization strategies</li>
                      <li>• 6-month transition budget planning</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-green-700 mb-2">🎯 Your Situation Analysis</h5>
                    <p className="text-lg text-green-600 mb-3">
                      Professional assessment based on your assessment responses and personal circumstances.
                    </p>
                    <ul className="text-lg text-green-600 space-y-1">
                      <li>• Job market analysis for your profession</li>
                      <li>• Age-specific immigration advantages</li>
                      <li>• Timeline optimization for your situation</li>
                      <li>• Risk assessment and mitigation strategies</li>
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    console.log('Relocation Hub purchase button clicked - opening Stripe payment modal');
                    setShowPayment(true);
                  }}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  Get Professional Report - $49.99
                </button>
                <p className="text-lg text-center text-gray-500 mt-2">
                  Professional guidance worth thousands in avoided mistakes
                </p>
              </div>
            </div>
          </div>

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                <button
                  onClick={() => {
                    console.log('Closing payment modal');
                    setShowPayment(false);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
                >
                  ✕
                </button>
                <div className="p-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 font-medium">
                      🔒 Secure Stripe Payment Processing
                    </p>
                    <p className="text-xs text-blue-700">
                      Your payment information is encrypted and processed securely by Stripe.
                    </p>
                  </div>
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      assessmentId={Number(id)}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </Elements>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
