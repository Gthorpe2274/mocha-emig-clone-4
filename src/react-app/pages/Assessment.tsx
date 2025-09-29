import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, ChevronDown, Compass, Users, CheckCircle, Clock } from 'lucide-react';
import { CountryData } from '@/shared/types';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

interface AssessmentData {
  user_age: number;
  user_job: string;
  monthly_budget: number;
  preferred_country: string;
  preferred_city: string;
  location_preference: 'beachside' | 'rural' | 'city';
  climate_preference: 'tropical' | 'seasonal' | 'dry' | 'mediterranean' | 'temperate' | 'northern' | '';
  immigration_policies_importance: number;
  healthcare_importance: number;
  safety_importance: number;
  internet_importance: number;
  emigration_process_importance: number;
  ease_of_immigration_importance: number;
  local_acceptance_importance: number;
}

const factors = [
  { key: 'immigration_policies_importance', label: 'Immigration Policies', icon: '📋', description: 'How important are favorable immigration laws and visa options?' },
  { key: 'healthcare_importance', label: 'Healthcare Quality', icon: '🏥', description: 'How important is access to quality healthcare and insurance?' },
  { key: 'safety_importance', label: 'Safety & Security', icon: '🛡️', description: 'How important is personal safety and low crime rates?' },
  { key: 'internet_importance', label: 'High-Speed Internet', icon: '🌐', description: 'How important is reliable, fast internet connectivity?' },
  { key: 'emigration_process_importance', label: 'USA Emigration Process', icon: '✈️', description: 'How important is a smooth process for leaving the US?' },
  { key: 'ease_of_immigration_importance', label: 'Ease of Immigration', icon: '📝', description: 'How important is a straightforward immigration process?' },
  { key: 'local_acceptance_importance', label: 'Local Acceptance', icon: '🤝', description: 'How important is acceptance by local communities?' },
];

export default function Assessment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [assessment, setAssessment] = useState<AssessmentData>({
    user_age: 30,
    user_job: '',
    monthly_budget: 2000,
    preferred_country: '',
    preferred_city: '',
    location_preference: 'city',
    climate_preference: '',
    immigration_policies_importance: 0,
    healthcare_importance: 0,
    safety_importance: 0,
    internet_importance: 0,
    emigration_process_importance: 0,
    ease_of_immigration_importance: 0,
    local_acceptance_importance: 0,
  });

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [ageInputValue, setAgeInputValue] = useState('30');
  const [budgetInputValue, setBudgetInputValue] = useState('2000');

  useEffect(() => {
    if (assessment.preferred_country) {
      const cities = CountryData.cities[assessment.preferred_country as keyof typeof CountryData.cities] || [];
      setAvailableCities(cities);
      // Reset city selection when country changes
      setAssessment(prev => ({ ...prev, preferred_city: '' }));
    }
  }, [assessment.preferred_country]);

  const updateAssessment = (field: keyof AssessmentData, value: any) => {
    setAssessment(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!assessment.user_job.trim()) {
        setError('Please enter your occupation');
        return;
      }
      if (assessment.user_age < 18 || assessment.user_age > 100) {
        setError('Please enter a valid age between 18 and 100');
        return;
      }
      if (assessment.monthly_budget < 100 || assessment.monthly_budget > 50000) {
        setError('Please enter a valid monthly budget between $100 and $50,000');
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!assessment.preferred_country) {
        setError('Please select your preferred country');
        return;
      }
      if (!assessment.climate_preference) {
        setError('Please select your preferred climate type');
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
    setError('');
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const submitAssessment = async () => {
    // Validate all factors are rated
    const unratedFactors = factors.filter(factor => 
      assessment[factor.key as keyof AssessmentData] === 0
    );
    
    if (unratedFactors.length > 0) {
      setError('Please rate all factors before submitting your assessment');
      return;
    }
    
    setLoading(true);
    setError('');
    
    console.log('🚀 STARTING ASSESSMENT SUBMISSION');
    console.log('Assessment data:', assessment);
    console.log('Current URL:', window.location.href);
    
    try {
      console.log('📡 Making API request to /api/assessments...');
      
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment)
      });
      
      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      const result = await response.json();
      console.log('📋 Response body:', result);
      
      if (response.ok) {
        console.log('✅ Assessment created successfully!');
        const assessmentId = result.id;
        
        if (!assessmentId) {
          console.error('❌ Assessment ID is missing from response!');
          setError('Assessment was created but ID is missing. Please contact support.');
          return;
        }
        
        console.log(`🎯 Assessment ID: ${assessmentId} (type: ${typeof assessmentId})`);
        console.log(`🧭 Preparing to navigate to: /results/${assessmentId}`);
        
        // Add a small delay to ensure database transaction is complete
        setTimeout(() => {
          console.log(`🚀 Navigating to results page...`);
          try {
            navigate(`/results/${assessmentId}`);
            console.log(`✅ Navigation initiated successfully`);
          } catch (navError) {
            console.error('❌ Navigation error:', navError);
            setError(`Navigation failed. Please go to: /results/${assessmentId}`);
          }
        }, 100);
        
      } else {
        console.error('❌ API request failed');
        // Check if this is a climate compatibility error
        if (result.requiresReselection && result.climateConflict) {
          console.log('🌡️ Climate compatibility error:', result);
          setError(`Climate incompatibility detected: You selected "${result.climateConflict.userPreference}" climate preference, but ${result.climateConflict.country} has a "${result.climateConflict.countryClimate}" climate. Please choose a different country or adjust your climate preference.`);
          // Reset to step 2 so they can change their selections
          setCurrentStep(2);
        } else {
          console.error('💥 Assessment submission error:', result);
          setError(result.error || 'Failed to submit assessment');
        }
      }
    } catch (error) {
      console.error('💥 CRITICAL ERROR during assessment submission:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setError('Network error. Please check your connection and try again. If the problem persists, try refreshing the page.');
    } finally {
      setLoading(false);
      console.log('🏁 Assessment submission process completed');
    }
  };

  const renderStarRating = (fieldKey: string, currentValue: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            type="button"
            onClick={() => updateAssessment(fieldKey as keyof AssessmentData, rating)}
            className={`w-8 h-8 rounded-full transition-colors ${
              rating <= currentValue 
                ? 'bg-yellow-400 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <Star 
              className={`w-5 h-5 mx-auto ${
                rating <= currentValue ? 'fill-current' : ''
              }`} 
            />
          </button>
        ))}
        <span className="ml-2 text-lg font-medium text-gray-600">
          {currentValue > 0 ? `${currentValue}/5` : 'Not rated'}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="relative bg-gradient-to-br from-blue-50/80 via-white/60 to-purple-50/80 backdrop-blur-lg p-10 rounded-3xl border border-white/30 shadow-xl mb-8 overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/30 to-blue-200/30 rounded-full translate-y-6 -translate-x-6"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
                  <Compass className="w-4 h-4 mr-2" />
                  Free Personalized Assessment
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
                  Find Your Perfect
                  <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent block pb-2">
                    New Home Country
                  </span>
                </h1>
                
                <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed font-medium">
                  Answer a few questions about your priorities and preferences to get personalized 
                  recommendations for your ideal emigration destination.
                </p>
                
                {/* Enhanced Step Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  <div className="flex flex-col items-center space-y-3 p-4 bg-white/50 rounded-2xl border border-white/20 hover:bg-white/70 transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-blue-600 block">Step 1</span>
                      <span className="text-gray-700 font-medium">Personal Info</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-3 p-4 bg-white/50 rounded-2xl border border-white/20 hover:bg-white/70 transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-purple-600 block">Step 2</span>
                      <span className="text-gray-700 font-medium">Preferences</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-3 p-4 bg-white/50 rounded-2xl border border-white/20 hover:bg-white/70 transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-green-600 block">Step 3</span>
                      <span className="text-gray-700 font-medium">Priorities</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center justify-center space-x-4 text-base text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Free to use</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">5 minutes</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Expert analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-lg text-gray-500 mb-2">
              <span>Step {currentStep} of 3</span>
              <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Back to Home Link */}
          <div className="mb-6">
            <Link 
              to="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    What is your age?
                  </label>
                  <input
                    type="text"
                    value={ageInputValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numeric input and limit to 3 digits
                      if (/^\d{0,3}$/.test(value)) {
                        setAgeInputValue(value);
                        // Only update the assessment if there's a valid number
                        if (value && parseInt(value)) {
                          updateAssessment('user_age', parseInt(value));
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure age is within valid range when user leaves the field
                      const numValue = parseInt(e.target.value) || 18;
                      if (numValue < 18) {
                        setAgeInputValue('18');
                        updateAssessment('user_age', 18);
                      } else if (numValue > 100) {
                        setAgeInputValue('100');
                        updateAssessment('user_age', 100);
                      } else {
                        setAgeInputValue(numValue.toString());
                        updateAssessment('user_age', numValue);
                      }
                    }}
                    placeholder="Enter your age"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-lg text-gray-500 mt-1">Age affects visa eligibility and immigration pathways</p>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    What is your occupation?
                  </label>
                  <input
                    type="text"
                    value={assessment.user_job}
                    onChange={(e) => updateAssessment('user_job', e.target.value)}
                    placeholder="e.g., Software Engineer, Teacher, Retired, Student"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-lg text-gray-500 mt-1">Your profession affects skilled visa eligibility</p>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    What is your monthly housing budget? (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                    <input
                      type="text"
                      value={budgetInputValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numeric input and limit to 5 digits
                        if (/^\d{0,5}$/.test(value)) {
                          setBudgetInputValue(value);
                          // Only update the assessment if there's a valid number
                          if (value && parseInt(value)) {
                            updateAssessment('monthly_budget', parseInt(value));
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure budget is within valid range when user leaves the field
                        const numValue = parseInt(e.target.value) || 500;
                        if (numValue < 100) {
                          setBudgetInputValue('100');
                          updateAssessment('monthly_budget', 100);
                        } else if (numValue > 50000) {
                          setBudgetInputValue('50000');
                          updateAssessment('monthly_budget', 50000);
                        } else {
                          setBudgetInputValue(numValue.toString());
                          updateAssessment('monthly_budget', numValue);
                        }
                      }}
                      placeholder="2000"
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-lg text-gray-500 mt-1">We'll compare this to rental costs in your chosen destination</p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Destination Preferences */}
          {currentStep === 2 && (
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Destination Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Preferred Country
                  </label>
                  <div className="relative">
                    <select
                      value={assessment.preferred_country}
                      onChange={(e) => updateAssessment('preferred_country', e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select a country...</option>
                      {[...CountryData.countries].sort().map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {availableCities.length > 0 && (
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Preferred City (Optional)
                    </label>
                    <div className="relative">
                      <select
                        value={assessment.preferred_city}
                        onChange={(e) => updateAssessment('preferred_city', e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Any city in {assessment.preferred_country}</option>
                        {availableCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Preferred Climate Type
                  </label>
                  <div className="relative">
                    <select
                      value={assessment.climate_preference}
                      onChange={(e) => updateAssessment('climate_preference', e.target.value as AssessmentData['climate_preference'])}
                      className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select a climate type...</option>
                      <option value="tropical">Tropical (Hot & Humid Year-Round)</option>
                      <option value="seasonal">Seasonal (4 Distinct Seasons)</option>
                      <option value="dry">Dry/Arid (Desert-like)</option>
                      <option value="mediterranean">Mediterranean (Hot, Dry Summers; Mild, Wet Winters)</option>
                      <option value="temperate">Temperate (Mild Temperatures, Moderate Rainfall)</option>
                      <option value="northern">Northern (Cold Winters, Mild Summers)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Location Preference
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'city', label: 'City', icon: '🏙️' },
                      { value: 'beachside', label: 'Beachside', icon: '🏖️' },
                      { value: 'rural', label: 'Rural', icon: '🌲' }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateAssessment('location_preference', option.value)}
                        className={`p-4 rounded-lg border-2 transition-colors text-center ${
                          assessment.location_preference === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-medium">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Priority Factors */}
          {currentStep === 3 && (
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Priority Factors</h2>
              <p className="text-gray-600 mb-8">
                Rate how important each factor is for you by selecting the number of stars in the list below.
              </p>
              
              <div className="space-y-8">
                {factors.map(factor => (
                  <div key={factor.key} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{factor.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{factor.label}</h3>
                        <p className="text-lg text-gray-600 mb-4">{factor.description}</p>
                        {renderStarRating(factor.key, assessment[factor.key as keyof AssessmentData] as number)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={submitAssessment}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Analyzing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Get My Results
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
