import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, FileText, CreditCard, CheckCircle, Download } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AssessmentResultType } from '@/shared/types';
import PaymentForm from '@/react-app/components/PaymentForm';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

export default function Results() {
  const { assessmentId } = useParams();
  const id = assessmentId; // Keep id for backward compatibility with existing code
  
  // Initialize Stripe
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  
  // Enhanced debugging for parameter extraction
  console.log('🔍 RESULTS PAGE PARAMETER DEBUG:');
  console.log('useParams() result:', useParams());
  console.log('assessmentId from params:', assessmentId);
  console.log('assessmentId type:', typeof assessmentId);
  console.log('Final id value:', id);
  console.log('Current URL:', window.location.href);
  console.log('URL pathname:', window.location.pathname);
  const [assessment, setAssessment] = useState<AssessmentResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [reportStatus, setReportStatus] = useState<{
    exists: boolean;
    isPaid: boolean;
    downloadToken: string | null;
    expiresAt: string;
    isExpired: boolean;
  } | null>(null);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🚀 RESULTS PAGE LOAD STARTED');
        console.log('Current URL:', window.location.href);
        console.log('Router param ID:', id);
        console.log('ID type:', typeof id);
        console.log('ID value:', JSON.stringify(id));
        console.log('URL search params:', new URLSearchParams(window.location.search).toString());
        console.log('Path segments:', window.location.pathname.split('/'));
        
        if (!id) {
          console.error('❌ No assessment ID provided in URL params');
          console.error('🔍 URL ANALYSIS FOR DEBUGGING:');
          console.error('Full URL:', window.location.href);
          console.error('Pathname:', window.location.pathname);
          console.error('Expected format: /results/{number}');
          console.error('URL segments:', window.location.pathname.split('/'));
          console.error('useParams() full object:', useParams());
          console.error('Route pattern should match: /results/:assessmentId');
          
          // Try to extract ID from pathname as fallback
          const pathSegments = window.location.pathname.split('/');
          const potentialId = pathSegments[pathSegments.indexOf('results') + 1];
          console.error('Potential ID from path parsing:', potentialId);
          
          if (potentialId && !isNaN(Number(potentialId))) {
            console.log('🔧 ATTEMPTING FALLBACK with parsed ID:', potentialId);
            // Use the parsed ID as fallback
            const fallbackId = potentialId;
            console.log('Using fallback ID:', fallbackId);
            
            // Update the assessment ID and continue
            try {
              const assessmentResponse = await fetch(`/api/assessments/${fallbackId}`);
              console.log('📥 Fallback Assessment API Response:', {
                status: assessmentResponse.status,
                ok: assessmentResponse.ok
              });
              
              if (assessmentResponse.ok) {
                const assessmentData = await assessmentResponse.json();
                console.log('✅ Fallback assessment data loaded successfully');
                setAssessment(assessmentData);
                setLoading(false);
                return;
              }
            } catch (fallbackError) {
              console.error('❌ Fallback attempt also failed:', fallbackError);
            }
          }
          
          setLoading(false);
          return;
        }
        
        console.log(`📊 Fetching assessment data for ID: ${id}`);
        
        // Fetch assessment with detailed error handling
        console.log(`🌐 Making request to: /api/assessments/${id}`);
        const assessmentResponse = await fetch(`/api/assessments/${id}`);
        
        console.log('📥 Assessment API Response:', {
          status: assessmentResponse.status,
          statusText: assessmentResponse.statusText,
          ok: assessmentResponse.ok,
          url: assessmentResponse.url,
          headers: Object.fromEntries(assessmentResponse.headers.entries())
        });
        
        if (assessmentResponse.ok) {
          const assessmentData = await assessmentResponse.json();
          console.log('✅ Assessment data loaded successfully:', {
            id: assessmentData.id,
            country: assessmentData.preferred_country,
            score: assessmentData.overall_score,
            hasAllRequiredFields: !!(assessmentData.id && assessmentData.preferred_country)
          });
          setAssessment(assessmentData);

          // Check report status
          console.log('🔍 Checking report status...');
          try {
            const reportResponse = await fetch(`/api/reports/status/${id}`);
            if (reportResponse.ok) {
              const reportData = await reportResponse.json();
              console.log('📋 Report status:', reportData);
              setReportStatus(reportData);
              if (reportData.exists && reportData.isPaid && reportData.downloadToken && !reportData.isExpired) {
                console.log('⬇️ Valid download token found');
                setDownloadToken(reportData.downloadToken);
              }
            } else {
              console.warn('⚠️ Report status check failed, but continuing...');
            }
          } catch (reportError) {
            console.warn('⚠️ Report status check error, but continuing:', reportError);
          }
        } else {
          console.error('❌ Assessment API request failed');
          
          // Try to get the error response body
          let errorDetails = 'No additional error details';
          try {
            const errorData = await assessmentResponse.json();
            errorDetails = JSON.stringify(errorData);
            console.error('📋 Error response body:', errorData);
          } catch (parseError) {
            console.error('❌ Could not parse error response');
          }
          
          console.error('💥 Assessment fetch failed:', {
            status: assessmentResponse.status,
            statusText: assessmentResponse.statusText,
            errorDetails: errorDetails,
            requestedId: id,
            fullUrl: `/api/assessments/${id}`
          });
          
          // Set assessment to null so we show the "Assessment Not Found" message
          setAssessment(null);
        }
      } catch (error) {
        console.error('💥 CRITICAL ERROR in Results page data fetch:', error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          requestedId: id,
          currentUrl: window.location.href
        });
        
        // Set assessment to null for network errors too
        setAssessment(null);
      } finally {
        console.log('🏁 Results page data fetch completed');
        setLoading(false);
      }
    };

    console.log('🔄 Results useEffect triggered with ID:', id);
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
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

  

  const getMatchLevelColor = (level: string) => {
    switch (level) {
      case 'perfect': return 'from-green-500 to-emerald-500';
      case 'very_good': return 'from-blue-500 to-indigo-500';
      case 'good': return 'from-yellow-500 to-orange-500';
      default: return 'from-red-500 to-pink-500';
    }
  };

  const getStarRating = (score: number) => {
    if (score <= 20) return 1;
    if (score <= 40) return 2;
    if (score <= 60) return 3;
    if (score <= 80) return 4;
    return 5;
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'This destination is an excellent match for your preferences and requirements.';
    if (score >= 71) return 'This destination aligns very well with most of your preferences.';
    if (score >= 51) return 'This destination meets many of your requirements with some considerations.';
    return 'This destination may have significant challenges for your specific needs.';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center justify-center space-x-1 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-8 h-8 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handlePaymentSuccess = (tokenOrJobId: string, isJob = false) => {
    console.log('🎉 Payment success! Received:', tokenOrJobId, 'isJob:', isJob);
    
    if (isJob) {
      // Start polling for job completion
      console.log('📋 Starting report generation job polling...');
      setShowPayment(false);
      pollJobStatus(tokenOrJobId);
    } else {
      // Immediate download token
      console.log('⬇️ Immediate download token received');
      setDownloadToken(tokenOrJobId);
      setShowPayment(false);
      setShowDownloadPopup(true);
      setReportStatus(prev => prev ? { ...prev, exists: true, isPaid: true, downloadToken: tokenOrJobId, isExpired: false } : null);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 30; // 5 minutes max (10 second intervals)
    let attempts = 0;
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`Polling job status (attempt ${attempts}/${maxAttempts}):`, jobId);
        
        const response = await fetch(`/api/jobs/${jobId}/status`);
        
        if (response.ok) {
          const jobStatus = await response.json();
          console.log('Job status:', jobStatus);
          
          if (jobStatus.status === 'completed' && jobStatus.downloadToken) {
            console.log('Report generation completed!');
            setDownloadToken(jobStatus.downloadToken);
            setShowDownloadPopup(true);
            setReportStatus(prev => prev ? { 
              ...prev, 
              exists: true, 
              isPaid: true, 
              downloadToken: jobStatus.downloadToken, 
              isExpired: false 
            } : null);
            return;
          } else if (jobStatus.status === 'failed') {
            console.error('Report generation failed:', jobStatus.errorMessage);
            alert(`Report generation failed: ${jobStatus.errorMessage || 'Unknown error'}. Please contact support.`);
            return;
          } else if (jobStatus.status === 'processing') {
            console.log('Report is being generated...');
          } else if (jobStatus.status === 'pending') {
            console.log('Report generation is queued...');
          }
          
          // Continue polling if not completed and under max attempts
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000); // Poll every 10 seconds
          } else {
            console.error('Job polling timed out');
            alert('Report generation is taking longer than expected. Please refresh the page in a few minutes or contact support.');
          }
        } else {
          console.error('Failed to check job status:', response.status);
          if (attempts < maxAttempts) {
            setTimeout(poll, 15000); // Retry with longer interval
          } else {
            alert('Unable to check report generation status. Please refresh the page or contact support.');
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 15000); // Retry with longer interval
        } else {
          alert('Network error while checking report status. Please refresh the page or contact support.');
        }
      }
    };
    
    // Show user that generation is in progress
    alert('Payment successful! Your report is being generated and will be ready in 2-5 minutes. This page will automatically update when it\'s ready.');
    
    // Start polling
    poll();
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment error:', error);
    alert(`Payment failed: ${error}`);
    setShowPayment(false);
  };

  const handleDownload = async () => {
    if (!downloadToken) return;
    
    // Close the popup when download starts
    setShowDownloadPopup(false);
    
    try {
      const response = await fetch(`/api/reports/download/${downloadToken}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Emigration_Report_${assessment?.preferred_country?.replace(/\s+/g, '_') || 'Unknown'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download report. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report. Please check your connection and try again.');
    }
  };

  const factors = [
    { key: 'immigration_policies_importance', label: 'Immigration Policies', icon: '📋' },
    { key: 'healthcare_importance', label: 'Healthcare Quality', icon: '🏥' },
    { key: 'safety_importance', label: 'Safety & Security', icon: '🛡️' },
    { key: 'internet_importance', label: 'High-Speed Internet', icon: '🌐' },
    { key: 'emigration_process_importance', label: 'USA Emigration Process', icon: '✈️' },
    { key: 'ease_of_immigration_importance', label: 'Ease of Immigration', icon: '📝' },
    { key: 'local_acceptance_importance', label: 'Local Acceptance', icon: '🤝' },
    { key: 'climate_importance', label: 'Climate', icon: '🌤️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Migration Assessment Results
            </h2>
            <p className="text-lg text-gray-600">
              Based on your preferences for {assessment.preferred_country}
              {assessment.preferred_city && ` - ${assessment.preferred_city}`}
            </p>
          </div>

          {/* Score Card */}
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-8">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getMatchLevelColor(assessment.match_level)} text-white text-4xl font-bold mb-6`}>
                {assessment.overall_score}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Your Match Rating
              </h3>
              {renderStars(getStarRating(assessment.overall_score))}
              <p className="text-lg text-gray-600 mb-4">
                {getScoreDescription(assessment.overall_score)}
              </p>
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <span className="font-medium">{getStarRating(assessment.overall_score)} stars • {assessment.overall_score}/100 Compatibility Score</span>
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

          {/* Download Popup Modal */}
          {showDownloadPopup && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full relative shadow-2xl">
                <button
                  onClick={() => setShowDownloadPopup(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
                >
                  ✕
                </button>
                <div className="p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">🎉 Your Report is Ready!</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                      <p className="text-green-800 font-medium mb-3">
                        ✅ Payment successful! Your comprehensive emigration report has been generated.
                      </p>
                      <p className="text-green-700 mb-4">
                        This professional-grade analysis includes current legal requirements, detailed cost breakdowns, 
                        and step-by-step guidance specifically for your situation.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white/70 rounded-lg p-3">
                          <p className="font-semibold text-green-800 mb-1">📄 What's Included:</p>
                          <p>✅ 40+ pages of detailed guidance</p>
                          <p>✅ Current immigration requirements</p>
                          <p>✅ Step-by-step relocation timeline</p>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <p className="font-semibold text-blue-800 mb-1">💼 Professional Analysis:</p>
                          <p>✅ Neighborhood-specific cost analysis</p>
                          <p>✅ Professional contacts & resources</p>
                          <p>✅ Healthcare & tax implications</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-4"
                    >
                      <Download className="w-6 h-6 mr-3" />
                      Download Your Full Report (PDF)
                    </button>
                    
                    <p className="text-sm text-gray-600">
                      📧 Your download link remains active for 7 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info - Remove in production */}
          {(reportStatus?.exists || downloadToken) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-lg text-blue-800">
                <strong>Debug Info:</strong> Report exists: {reportStatus?.exists ? 'Yes' : 'No'}, 
                Paid: {reportStatus?.isPaid ? 'Yes' : 'No'}, 
                Has Token: {downloadToken ? 'Yes' : 'No'},
                Expired: {reportStatus?.isExpired ? 'Yes' : 'No'}
              </p>
            </div>
          )}

          {/* Download Section (if report is purchased) */}
          {downloadToken && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-6 mb-8 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">✅ Report Ready!</h3>
                  <p className="text-gray-700">Your comprehensive emigration report has been generated successfully.</p>
                </div>
                <button
                  onClick={() => setShowDownloadPopup(true)}
                  className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Next Steps Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-8 shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Ready for Your Next Step?</h3>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 max-w-3xl mx-auto">
                <p className="text-xl text-gray-800 leading-relaxed mb-6">
                  If you're <strong className="text-blue-700">happy with your match score</strong> based on your assessment ratings below, 
                  get a <strong className="text-purple-700">comprehensive professional report</strong> that will guide you through your entire emigration process.
                </p>
                
                <div className="flex items-center justify-center space-x-4 flex-wrap">
                  <div className="flex items-center space-x-2 text-green-700 bg-green-50 px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Current Legal Requirements</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Detailed Cost Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-700 bg-purple-50 px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Step-by-Step Timeline</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-lg text-gray-700 mb-4">
                    📖 Want to see what's included? Check out a sample report section:
                  </p>
                  <Link 
                    to="/sample-report" 
                    state={{ returnTo: `/results/${id}` }}
                    className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    View Sample Report Section
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-8 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional Report Preview</h3>
                <p className="text-gray-700 mb-6">
                  This shows the professional report structure. The full report includes specific legal requirements, 
                  exact costs, tax implications, and step-by-step processes prepared by migration experts.
                </p>
                
                <div className="bg-white/60 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Full Report Table of Contents:</h4>
                  <ul className="space-y-2 text-lg text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Executive Summary & Suitability Analysis</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Immigration Requirements & Visa Options</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Cost of Living Analysis & Budget Planning</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Healthcare System & Insurance Options</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Tax Implications & Financial Planning</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Housing Market & Neighborhood Guide</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Cultural Integration & Language Resources</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Step-by-Step Relocation Timeline</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-800" />
                      <span>Emergency Contacts & Support Resources</span>
                    </li>
                  </ul>
                </div>

                {reportStatus?.exists && reportStatus?.isPaid ? (
                  downloadToken ? (
                    <button
                      onClick={() => setShowDownloadPopup(true)}
                      className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Your Report
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">Your download link has expired. Please contact support for assistance.</p>
                    </div>
                  )
                ) : (
                  <div>
                    <div className="mb-3 text-center">
                      <div className="text-sm text-gray-500 line-through">Regularly $69.95</div>
                      <div className="text-xs text-red-600 font-semibold">Limited Time Offer</div>
                    </div>
                    <button
                      onClick={() => {
                        console.log('Purchase button clicked - opening Stripe payment modal');
                        setShowPayment(true);
                      }}
                      className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer mb-4"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Buy Full Report - $49.99 → Stripe Payment
                    </button>
                    
                    <div className="mt-3">
                      <Link
                        to="/sample-report"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 underline px-4 py-2 rounded-full font-medium"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Sample Report Section
                      </Link>
                    </div>
                    
                    {/* Free Bonus Promotion */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 shadow-md">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                          <span className="text-white font-bold text-sm">🎁</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-yellow-800 text-lg mb-2">
                            🎉 FREE BONUS: Personalized Relocation Hub Access!
                          </h4>
                          <p className="text-yellow-700 font-medium mb-2">
                            When you purchase your report, you also get <strong>FREE two-year access</strong> to your personalized relocation hub featuring:
                          </p>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            <li>✅ <strong>Real-time video insights</strong> from Americans living in {assessment.preferred_country}</li>
                            <li>✅ <strong>Verified professional services</strong> (immigration lawyers, banks, movers)</li>
                            <li>✅ <strong>Community support</strong> connecting you with others planning similar moves</li>
                            <li>✅ <strong>Updated costs and resources</strong> that evolve with your needs</li>
                            <li>✅ <strong>Emergency contacts</strong> and local support networks</li>
                          </ul>
                          <p className="text-yellow-800 font-semibold text-sm mt-2">
                            🔗 Your personal hub link is included in your PDF report!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Relocation Hub Navigation - Moved below FREE BONUS */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🏠</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Your Temporary Relocation Hub</h3>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto mb-6">
                <p className="text-xl text-gray-800 leading-relaxed mb-4">
                  Access your <strong className="text-green-700">personalized relocation hub</strong> with resources, 
                  connections, and tools specifically curated for your emigration journey.
                </p>
                
                <div className="flex items-center justify-center space-x-4 flex-wrap mb-4">
                  <div className="flex items-center space-x-2 text-green-700 bg-green-50 px-3 py-2 rounded-full text-sm">
                    <span>🌟</span>
                    <span className="font-medium">Video Insights</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-700 bg-blue-50 px-3 py-2 rounded-full text-sm">
                    <span>🤝</span>
                    <span className="font-medium">Community Support</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-700 bg-purple-50 px-3 py-2 rounded-full text-sm">
                    <span>📞</span>
                    <span className="font-medium">Professional Contacts</span>
                  </div>
                </div>
              </div>
              
              <a 
                href={`/relocation-hub/${id}`}
                className="inline-flex items-center bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 no-underline"
                onClick={() => {
                  console.log('Relocation hub link clicked, navigating to:', `/relocation-hub/${id}`);
                  console.log('Current id value:', id);
                }}
              >
                <span className="mr-2">🏠</span>
                View Your Relocation Hub Page
              </a>
            </div>
          </div>

          {/* Budget Compatibility */}
          {assessment.budget_compatibility && (
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">💰</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Budget Compatibility Analysis</h3>
              </div>
              
              <div className={`rounded-lg p-6 border-2 ${
                assessment.budget_compatibility.startsWith('excellent') 
                  ? 'bg-green-50 border-green-200' 
                  : assessment.budget_compatibility.startsWith('good')
                  ? 'bg-blue-50 border-blue-200'
                  : assessment.budget_compatibility.startsWith('tight')
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    assessment.budget_compatibility.startsWith('excellent') 
                      ? 'bg-green-500 text-white' 
                      : assessment.budget_compatibility.startsWith('good')
                      ? 'bg-blue-500 text-white'
                      : assessment.budget_compatibility.startsWith('tight')
                      ? 'bg-yellow-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {assessment.budget_compatibility.startsWith('excellent') ? '✅' : 
                     assessment.budget_compatibility.startsWith('good') ? '👍' : 
                     assessment.budget_compatibility.startsWith('tight') ? '⚠️' : '❌'}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold text-lg mb-2 ${
                      assessment.budget_compatibility.startsWith('excellent') 
                        ? 'text-green-800' 
                        : assessment.budget_compatibility.startsWith('good')
                        ? 'text-blue-800'
                        : assessment.budget_compatibility.startsWith('tight')
                        ? 'text-yellow-800'
                        : 'text-red-800'
                    }`}>
                      Budget Status: {assessment.budget_compatibility.split(' - ')[0].toUpperCase()}
                    </h4>
                    <p className={`text-lg leading-relaxed ${
                      assessment.budget_compatibility.startsWith('excellent') 
                        ? 'text-green-700' 
                        : assessment.budget_compatibility.startsWith('good')
                        ? 'text-blue-700'
                        : assessment.budget_compatibility.startsWith('tight')
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    }`}>
                      {assessment.budget_compatibility.split(' - ')[1] || assessment.budget_compatibility}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>💡 Tip:</strong> Rental costs can vary significantly by neighborhood and amenities. 
                  Your comprehensive report includes detailed neighborhood-by-neighborhood cost breakdowns and money-saving strategies.
                </p>
              </div>
            </div>
          )}

          {/* Your Preferences */}
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Your Assessment Ratings</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <span className="text-lg font-medium text-gray-500">Age</span>
                  <div className="text-lg font-semibold text-gray-900">{assessment.user_age} years old</div>
                </div>
                <div>
                  <span className="text-lg font-medium text-gray-500">Occupation</span>
                  <div className="text-lg font-semibold text-gray-900">{assessment.user_job}</div>
                </div>
                <div>
                  <span className="text-lg font-medium text-gray-500">Monthly Housing Budget</span>
                  <div className="text-lg font-semibold text-gray-900">${assessment.monthly_budget?.toLocaleString() || 'Not specified'}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-lg font-medium text-gray-500">Destination</span>
                  <div className="text-lg font-semibold text-gray-900">
                    {assessment.preferred_country}
                    {assessment.preferred_city && ` - ${assessment.preferred_city}`}
                  </div>
                </div>
                <div>
                  <span className="text-lg font-medium text-gray-500">Location Preference</span>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {assessment.location_preference.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Priority Factors</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {factors.map(factor => (
                <div key={factor.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{factor.icon}</span>
                    <span className="font-medium text-gray-900">{factor.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Number(assessment[factor.key as keyof AssessmentResultType] || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-medium text-gray-600">
                      {assessment[factor.key as keyof AssessmentResultType]}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center space-y-4">
            <div className="text-lg text-gray-500">
              <Link to="/assessment" className="text-blue-600 hover:text-blue-700 underline">Take a new assessment</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
