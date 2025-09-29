import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, ArrowLeft, Home, DollarSign, Users, Briefcase, 
  GraduationCap, Car, Clock, 
  Thermometer, Sun, Star, AlertCircle, CheckCircle, Heart
} from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

interface CityInfo {
  name: string;
  country: string;
  image: string;
  description: string;
  population: string;
  timeZone: string;
  currency: string;
  language: string[];
  climate: {
    type: string;
    avgTemp: string;
    rainyMonths: string[];
    bestTime: string;
  };
  costOfLiving: {
    rent1Bed: string;
    rent3Bed: string;
    utilities: string;
    groceries: string;
    dining: string;
    transport: string;
    comparison: string;
  };
  housing: {
    neighborhoods: Array<{
      name: string;
      type: string;
      description: string;
      priceRange: string;
    }>;
    rentingTips: string[];
  };
  
  transportation: {
    public: string[];
    walkability: number;
    biking: string;
    driving: string;
    airport: string;
  };
  lifestyle: {
    expatCommunity: string;
    englishFriendly: number;
    nightlife: string;
    culture: string[];
    outdoorActivities: string[];
  };
  workOpportunities: {
    industries: string[];
    averageSalary: string;
    workCulture: string;
    networking: string[];
  };
  education: {
    internationalSchools: string[];
    universities: string[];
    qualityRating: number;
  };
  safetyTips: string[];
  
  practicalTips: string[];
}

// City data would normally come from an API, but for demo purposes, we'll use static data
const getCityData = (country: string, city: string): CityInfo | null => {
  const cityDatabase: Record<string, Record<string, CityInfo>> = {
    'Portugal': {
      'Lisbon': {
        name: 'Lisbon',
        country: 'Portugal',
        image: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/portugal-lisbon.jpg',
        description: 'Portugal\'s vibrant capital city, known for its historic charm, colorful architecture, and welcoming expat community.',
        population: '2.8 million (metro area)',
        timeZone: 'Western European Time (UTC+0)',
        currency: 'Euro (EUR)',
        language: ['Portuguese', 'English widely spoken in business'],
        climate: {
          type: 'Mediterranean',
          avgTemp: '17°C (63°F)',
          rainyMonths: ['November', 'December', 'January', 'February'],
          bestTime: 'April to October'
        },
        costOfLiving: {
          rent1Bed: '€700-€1,200/month',
          rent3Bed: '€1,200-€2,500/month', 
          utilities: '€80-€120/month',
          groceries: '€200-€300/month',
          dining: '€8-€25 per meal',
          transport: '€40/month (public transport)',
          comparison: '40-50% less than major US cities'
        },
        housing: {
          neighborhoods: [
            {
              name: 'Príncipe Real',
              type: 'Trendy Central',
              description: 'Hip area with boutiques, galleries, and rooftop bars',
              priceRange: '€1,000-€1,800/month (1BR)'
            },
            {
              name: 'Campo de Ourique',
              type: 'Local Favorite',
              description: 'Authentic Portuguese neighborhood with markets and cafes',
              priceRange: '€800-€1,300/month (1BR)'
            },
            {
              name: 'Cascais',
              type: 'Coastal Suburb',
              description: 'Beach town 30 minutes from city center, popular with expats',
              priceRange: '€900-€1,600/month (1BR)'
            }
          ],
          rentingTips: [
            'Most leases require 2-3 months deposit',
            'Furnished apartments are common',
            'Use Portuguese real estate websites like Idealista.pt',
            'Consider hiring a local agent for paperwork assistance'
          ]
        },
        
        transportation: {
          public: ['Metro (4 lines)', 'Buses', 'Trams', 'Funiculars'],
          walkability: 4,
          biking: 'Growing bike lane network, bike sharing available',
          driving: 'Challenging due to hills and narrow streets, limited parking',
          airport: 'Lisbon Airport (LIS) - 7km from city center'
        },
        lifestyle: {
          expatCommunity: 'Large and active expat community, especially in Cascais and Príncipe Real',
          englishFriendly: 4,
          nightlife: 'Vibrant nightlife in Bairro Alto and Cais do Sodré',
          culture: ['Fado music', 'Historic trams', 'Tile art (azulejos)', 'Port wine tastings'],
          outdoorActivities: ['Beach day trips', 'Sintra hiking', 'Surfing in nearby beaches', 'River cruises']
        },
        workOpportunities: {
          industries: ['Technology', 'Tourism', 'Finance', 'Startups', 'Remote work'],
          averageSalary: '€20,000-€40,000/year (varies by industry)',
          workCulture: 'Relationship-focused, long lunch breaks, work-life balance valued',
          networking: ['Lisbon Digital Nomads', 'Portugal Startups', 'Expat Facebook groups']
        },
        education: {
          internationalSchools: ['Carlucci American International School', 'St. Julian\'s School', 'International Preparatory School'],
          universities: ['University of Lisbon', 'NOVA University', 'Catholic University of Portugal'],
          qualityRating: 4
        },
        safetyTips: [
          'Very safe city overall, low violent crime',
          'Watch for pickpockets in tourist areas',
          'Be cautious on steep cobblestone streets when wet',
          'Ocean currents can be strong at nearby beaches'
        ],
        
        practicalTips: [
          'Learn basic Portuguese phrases - locals appreciate the effort',
          'Get a Portuguese bank account early for easier transactions',
          'Metro card (Navegante) works for all public transport',
          'Many restaurants close between lunch and dinner (3-7 PM)',
          'Tipping 10% is customary but not mandatory'
        ]
      },
      'Porto': {
        name: 'Porto',
        country: 'Portugal',
        image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=600&fit=crop',
        description: 'Portugal\'s second-largest city, famous for port wine, stunning architecture, and more affordable living costs than Lisbon.',
        population: '1.7 million (metro area)',
        timeZone: 'Western European Time (UTC+0)',
        currency: 'Euro (EUR)',
        language: ['Portuguese', 'English in tourist areas'],
        climate: {
          type: 'Mediterranean with Atlantic influence',
          avgTemp: '15°C (59°F)',
          rainyMonths: ['November', 'December', 'January', 'February', 'March'],
          bestTime: 'May to September'
        },
        costOfLiving: {
          rent1Bed: '€500-€900/month',
          rent3Bed: '€800-€1,500/month',
          utilities: '€70-€100/month',
          groceries: '€180-€250/month',
          dining: '€6-€20 per meal',
          transport: '€30/month (public transport)',
          comparison: '50-60% less than major US cities'
        },
        housing: {
          neighborhoods: [
            {
              name: 'Cedofeita',
              type: 'Trendy Arts District',
              description: 'Hip area with galleries, vintage shops, and young professionals',
              priceRange: '€600-€1,000/month (1BR)'
            },
            {
              name: 'Foz do Douro',
              type: 'Upscale Coastal',
              description: 'Affluent area near the ocean with beaches and high-end restaurants',
              priceRange: '€800-€1,400/month (1BR)'
            },
            {
              name: 'Ribeira',
              type: 'Historic Center',
              description: 'UNESCO World Heritage area, very touristy but authentic',
              priceRange: '€500-€800/month (1BR)'
            }
          ],
          rentingTips: [
            'Rental market less competitive than Lisbon',
            'Many historic buildings lack elevators',
            'Negotiate prices, especially for longer leases',
            'Check for moisture issues in older buildings'
          ]
        },
        
        transportation: {
          public: ['Metro (6 lines)', 'Buses', 'Historic trams'],
          walkability: 5,
          biking: 'Good bike infrastructure, especially along the river',
          driving: 'Narrow streets in historic center, parking challenging',
          airport: 'Francisco Sá Carneiro Airport (OPO) - 11km from city center'
        },
        lifestyle: {
          expatCommunity: 'Growing expat community, more authentic Portuguese experience',
          englishFriendly: 3,
          nightlife: 'Lively nightlife in Rua Miguel Bombarda and Plano B',
          culture: ['Port wine cellars', 'Azulejo tiles', 'Traditional markets', 'River Douro cruises'],
          outdoorActivities: ['Beach access', 'River activities', 'Nearby hiking in Douro Valley', 'Surfing']
        },
        workOpportunities: {
          industries: ['Technology', 'Engineering', 'Wine industry', 'Manufacturing', 'Remote work'],
          averageSalary: '€18,000-€35,000/year',
          workCulture: 'Traditional but evolving, strong work-life balance',
          networking: ['Porto.io tech community', 'Digital Nomads Porto', 'Local business associations']
        },
        education: {
          internationalSchools: ['Oporto British School', 'Colégio Luso Internacional do Porto'],
          universities: ['University of Porto', 'Católica Porto Business School'],
          qualityRating: 4
        },
        safetyTips: [
          'Very safe city with low crime rates',
          'Be cautious walking on wet cobblestones',
          'Some areas near the river can be poorly lit at night',
          'Tourist areas may have occasional pickpocketing'
        ],
        
        practicalTips: [
          'Learn Portuguese - less English than Lisbon',
          'Visit during São João festival in June for authentic culture',
          'Port wine tours are a great way to meet people',
          'Public transport card works across metro, bus, and tram',
          'Lunch is typically late (1-2 PM) and dinner after 8 PM'
        ]
      }
    },
    'Spain': {
      'Barcelona': {
        name: 'Barcelona',
        country: 'Spain',
        image: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/spain-barcelona.jpg',
        description: 'Cosmopolitan Mediterranean city known for Gaudí architecture, beaches, and vibrant culture.',
        population: '5.5 million (metro area)',
        timeZone: 'Central European Time (UTC+1)',
        currency: 'Euro (EUR)',
        language: ['Spanish', 'Catalan', 'English in international areas'],
        climate: {
          type: 'Mediterranean',
          avgTemp: '18°C (64°F)',
          rainyMonths: ['September', 'October', 'November'],
          bestTime: 'April to June, September to November'
        },
        costOfLiving: {
          rent1Bed: '€800-€1,500/month',
          rent3Bed: '€1,400-€2,800/month',
          utilities: '€100-€150/month',
          groceries: '€250-€350/month',
          dining: '€10-€30 per meal',
          transport: '€40/month (public transport)',
          comparison: '30-40% less than major US cities'
        },
        housing: {
          neighborhoods: [
            {
              name: 'Eixample',
              type: 'Modern Central',
              description: 'Grid layout with modernist architecture, great for professionals',
              priceRange: '€1,000-€1,800/month (1BR)'
            },
            {
              name: 'Gràcia',
              type: 'Bohemian Village',
              description: 'Artsy neighborhood with small squares and local feel',
              priceRange: '€800-€1,400/month (1BR)'
            },
            {
              name: 'Barceloneta',
              type: 'Beachfront',
              description: 'Beach access but touristy and can be noisy',
              priceRange: '€900-€1,600/month (1BR)'
            }
          ],
          rentingTips: [
            'Competitive rental market, act quickly',
            'Many apartments lack air conditioning',
            'Deposits can be 2-3 months rent',
            'Use local websites like Idealista.com'
          ]
        },
        
        transportation: {
          public: ['Metro (8 lines)', 'Buses', 'Trams', 'Funicular'],
          walkability: 5,
          biking: 'Excellent bike lane network, Bicing bike share',
          driving: 'Challenging parking, good for day trips outside city',
          airport: 'Barcelona-El Prat Airport (BCN) - 12km from city center'
        },
        lifestyle: {
          expatCommunity: 'Large international community, especially in Eixample and Gràcia',
          englishFriendly: 4,
          nightlife: 'World-famous nightlife, clubs open until 6 AM',
          culture: ['Gaudí architecture', 'Tapas culture', 'Beach lifestyle', 'Art museums'],
          outdoorActivities: ['Beach volleyball', 'Hiking in nearby mountains', 'Sailing', 'Cycling']
        },
        workOpportunities: {
          industries: ['Technology', 'Tourism', 'Design', 'Startups', 'Fashion'],
          averageSalary: '€25,000-€45,000/year',
          workCulture: 'Relaxed pace, long lunch breaks, late dinner meetings',
          networking: ['Barcelona Tech City', 'Expat networking events', 'Startup Grind Barcelona']
        },
        education: {
          internationalSchools: ['American School of Barcelona', 'Benjamin Franklin International School', 'Hamelin-Laie International School'],
          universities: ['University of Barcelona', 'Pompeu Fabra University', 'ESADE'],
          qualityRating: 4
        },
        safetyTips: [
          'Generally safe but watch for pickpockets in tourist areas',
          'Las Ramblas and metro can have petty crime',
          'Avoid displaying expensive items',
          'Some neighborhoods are better avoided at night'
        ],
        
        practicalTips: [
          'Learn Spanish and some Catalan basics',
          'Lunch is 2-4 PM, dinner after 9 PM',
          'Many shops close during siesta (2-5 PM)',
          'August is very hot and many locals go on vacation',
          'Tap water is safe to drink'
        ]
      }
    },
    'Mexico': {
      'Mexico City': {
        name: 'Mexico City',
        country: 'Mexico',
        image: 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=1200&h=600&fit=crop',
        description: 'Vibrant megacity offering rich culture, excellent food scene, and affordable living in the heart of Mexico.',
        population: '21.8 million (metro area)',
        timeZone: 'Central Standard Time (UTC-6)',
        currency: 'Mexican Peso (MXN)',
        language: ['Spanish', 'English in expat areas'],
        climate: {
          type: 'Subtropical highland',
          avgTemp: '18°C (64°F)',
          rainyMonths: ['June', 'July', 'August', 'September'],
          bestTime: 'October to April'
        },
        costOfLiving: {
          rent1Bed: '$8,000-$15,000 MXN/month ($400-$750)',
          rent3Bed: '$15,000-$30,000 MXN/month ($750-$1,500)',
          utilities: '$1,500-$2,500 MXN/month ($75-$125)',
          groceries: '$3,000-$5,000 MXN/month ($150-$250)',
          dining: '$100-$400 MXN per meal ($5-$20)',
          transport: '$600 MXN/month ($30)',
          comparison: '70-80% less than major US cities'
        },
        housing: {
          neighborhoods: [
            {
              name: 'Roma Norte',
              type: 'Trendy Expat Hub',
              description: 'Hip area with cafes, galleries, and international crowd',
              priceRange: '$12,000-$20,000 MXN/month (1BR)'
            },
            {
              name: 'Condesa',
              type: 'Green & Central',
              description: 'Tree-lined streets, parks, and upscale dining',
              priceRange: '$10,000-$18,000 MXN/month (1BR)'
            },
            {
              name: 'Polanco',
              type: 'Upscale Business',
              description: 'Luxury shopping, business district, high-end living',
              priceRange: '$15,000-$30,000 MXN/month (1BR)'
            }
          ],
          rentingTips: [
            'Many apartments come furnished',
            'Deposits typically 1-2 months rent',
            'Check water pressure and internet speed',
            'Use Mexican rental sites like Vivanuncios'
          ]
        },
        
        transportation: {
          public: ['Metro (12 lines)', 'Metrobús', 'Buses', 'Ecobici bike share'],
          walkability: 3,
          biking: 'Growing bike infrastructure, especially in Roma/Condesa',
          driving: 'Heavy traffic, air quality restrictions',
          airport: 'Mexico City International Airport (MEX) - 13km from city center'
        },
        lifestyle: {
          expatCommunity: 'Large digital nomad and expat community in Roma/Condesa',
          englishFriendly: 3,
          nightlife: 'Incredible nightlife, mezcal bars, rooftop terraces',
          culture: ['World-class museums', 'Street food scene', 'Mariachi music', 'Day of the Dead celebrations'],
          outdoorActivities: ['Weekend trips to pyramids', 'Hiking in nearby mountains', 'Xochimilco boat rides']
        },
        workOpportunities: {
          industries: ['Technology', 'Finance', 'Manufacturing', 'Remote work', 'Startups'],
          averageSalary: '$300,000-$600,000 MXN/year ($15,000-$30,000)',
          workCulture: 'Relationship-focused, long hours common, family important',
          networking: ['Mexico City startup scene', 'Digital nomad meetups', 'Expat Facebook groups']
        },
        education: {
          internationalSchools: ['American School Foundation', 'Eton School', 'Greengates School'],
          universities: ['UNAM', 'Tecnológico de Monterrey', 'Universidad Iberoamericana'],
          qualityRating: 3
        },
        safetyTips: [
          'Be aware of your surroundings, especially at night',
          'Use official taxis or Uber/Didi',
          'Avoid displaying expensive items',
          'Some areas should be avoided (research neighborhoods)',
          'Air quality can be poor, consider masks on bad days'
        ],
        
        practicalTips: [
          'Learn Spanish - essential for daily life',
          'Altitude adjustment may take a few days',
          'Tip 10-15% at restaurants',
          'Carry cash - many places don\'t accept cards',
          'Traffic is intense, plan extra travel time'
        ]
      }
    }
  };

  return cityDatabase[country]?.[city] || null;
};

export default function CityDetails() {
  const { country, city } = useParams();
  const [cityData, setCityData] = useState<CityInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (country && city) {
      const decodedCountry = decodeURIComponent(country);
      const decodedCity = decodeURIComponent(city);
      const data = getCityData(decodedCountry, decodedCity);
      setCityData(data);
      setLoading(false);
    }
  }, [country, city]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading city information...</p>
        </div>
      </div>
    );
  }

  if (!cityData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">City Information Not Available</h2>
          <p className="text-gray-600 mb-6">We don't have detailed information for this city yet.</p>
          <Link to="/best-countries" className="text-blue-600 hover:text-blue-700">
            ← Back to Best Countries
          </Link>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <img 
          src={cityData.image} 
          alt={`${cityData.name} cityscape`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <Link 
              to="/best-countries"
              className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Best Countries
            </Link>
            <h1 className="text-5xl font-bold text-white mb-4">{cityData.name}</h1>
            <p className="text-xl text-white/90 max-w-2xl">{cityData.description}</p>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Population</h3>
              </div>
              <p className="text-lg text-gray-700">{cityData.population}</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-gray-900">Time Zone</h3>
              </div>
              <p className="text-lg text-gray-700">{cityData.timeZone}</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <DollarSign className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Currency</h3>
              </div>
              <p className="text-lg text-gray-700">{cityData.currency}</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <Thermometer className="w-6 h-6 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Climate</h3>
              </div>
              <p className="text-lg text-gray-700">{cityData.climate.type}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Cost of Living */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <DollarSign className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Cost of Living</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Housing</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">1 Bedroom Rent</span>
                      <span className="font-medium">{cityData.costOfLiving.rent1Bed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">3 Bedroom Rent</span>
                      <span className="font-medium">{cityData.costOfLiving.rent3Bed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilities</span>
                      <span className="font-medium">{cityData.costOfLiving.utilities}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Daily Expenses</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Groceries</span>
                      <span className="font-medium">{cityData.costOfLiving.groceries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dining Out</span>
                      <span className="font-medium">{cityData.costOfLiving.dining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Public Transport</span>
                      <span className="font-medium">{cityData.costOfLiving.transport}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  💰 Cost Comparison: {cityData.costOfLiving.comparison}
                </p>
              </div>
            </div>

            {/* Housing & Neighborhoods */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <Home className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Housing & Neighborhoods</h2>
              </div>
              
              <div className="grid gap-6 mb-6">
                {cityData.housing.neighborhoods.map((neighborhood, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{neighborhood.name}</h3>
                        <span className="text-blue-600 text-sm font-medium">{neighborhood.type}</span>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {neighborhood.priceRange}
                      </span>
                    </div>
                    <p className="text-gray-700">{neighborhood.description}</p>
                  </div>
                ))}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Renting Tips</h3>
                <ul className="space-y-2">
                  {cityData.housing.rentingTips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Transportation */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <Car className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Transportation</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Public Transport</h3>
                  <ul className="space-y-2 mb-4">
                    {cityData.transportation.public.map((transport, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{transport}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-gray-600">Walkability:</span>
                    {renderStars(cityData.transportation.walkability)}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Other Options</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-900">Biking:</span>
                      <p className="text-gray-700 text-sm">{cityData.transportation.biking}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Driving:</span>
                      <p className="text-gray-700 text-sm">{cityData.transportation.driving}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Airport:</span>
                      <p className="text-gray-700 text-sm">{cityData.transportation.airport}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifestyle & Culture */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <Heart className="w-8 h-8 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">Lifestyle & Culture</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Expat Community</h3>
                  <p className="text-gray-700 mb-4">{cityData.lifestyle.expatCommunity}</p>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-gray-600">English Friendliness:</span>
                    {renderStars(cityData.lifestyle.englishFriendly)}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-3">Nightlife</h3>
                  <p className="text-gray-700">{cityData.lifestyle.nightlife}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Cultural Highlights</h3>
                  <ul className="space-y-2 mb-4">
                    {cityData.lifestyle.culture.map((item, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <h3 className="font-semibold text-gray-900 mb-3">Outdoor Activities</h3>
                  <ul className="space-y-2">
                    {cityData.lifestyle.outdoorActivities.map((activity, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Sun className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-700">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Work Opportunities */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <Briefcase className="w-8 h-8 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Work Opportunities</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Key Industries</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cityData.workOpportunities.industries.map((industry, index) => (
                      <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        {industry}
                      </span>
                    ))}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">Average Salary</h3>
                  <p className="text-lg font-medium text-gray-700 mb-4">{cityData.workOpportunities.averageSalary}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Work Culture</h3>
                  <p className="text-gray-700 mb-4">{cityData.workOpportunities.workCulture}</p>
                  
                  <h3 className="font-semibold text-gray-900 mb-3">Networking</h3>
                  <ul className="space-y-2">
                    {cityData.workOpportunities.networking.map((network, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700">{network}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Climate Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <Thermometer className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-bold text-gray-900">Climate</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium">{cityData.climate.type}</p>
                </div>
                <div>
                  <span className="text-gray-600">Average Temperature:</span>
                  <p className="font-medium">{cityData.climate.avgTemp}</p>
                </div>
                <div>
                  <span className="text-gray-600">Rainy Months:</span>
                  <p className="font-medium">{cityData.climate.rainyMonths.join(', ')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Best Time to Visit:</span>
                  <p className="font-medium">{cityData.climate.bestTime}</p>
                </div>
              </div>
            </div>

            

            {/* Education */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Education</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-gray-600">Quality Rating:</span>
                  {renderStars(cityData.education.qualityRating)}
                </div>
                
                {cityData.education.internationalSchools.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-2">International Schools:</span>
                    <ul className="space-y-1">
                      {cityData.education.internationalSchools.slice(0, 3).map((school, index) => (
                        <li key={index} className="text-sm text-gray-700">• {school}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            

            {/* Safety Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-bold text-gray-900">Safety Tips</h3>
              </div>
              
              <ul className="space-y-2">
                {cityData.safetyTips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practical Tips */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Practical Tips</h3>
              </div>
              
              <ul className="space-y-2">
                {cityData.practicalTips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">Ready to Move to {cityData.name}?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Get a personalized assessment to see how well this city matches your emigration goals.
              </p>
              <Link 
                to="/assessment"
                className="inline-flex items-center bg-white text-blue-600 px-4 py-2 rounded-full font-medium hover:bg-blue-50 transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Get Assessment
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
