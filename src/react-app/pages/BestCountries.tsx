import { Link } from 'react-router-dom';
import { MapPin, Star, Shield, Heart, Globe, TrendingUp, Users, CheckCircle } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';

interface Country {
  name: string;
  flag: string;
  rank: number;
  image: string;
  description: string;
  overallScore: number;
  highlights: string[];
  immigrationPaths: string[];
  costOfLiving: 'Low' | 'Moderate' | 'High';
  healthcareRating: number;
  safetyRating: number;
  language: string;
  climate: string;
  popularCities: string[];
  keyBenefits: string[];
}

const bestCountries: Country[] = [
  {
    name: 'Portugal',
    flag: '🇵🇹',
    rank: 1,
    image: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/portugal-lisbon.jpg',
    description: 'Portugal stands out as one of the best countries to emigrate to from USA, offering an exceptional blend of rich maritime history, vibrant culture, and modern amenities. This Atlantic nation, recognized as one of the easiest countries to get citizenship for Americans, was once the center of a global empire that shaped world exploration. Today, when US citizens are looking to emigrate from USA, Portugal\'s charming cobblestone streets, stunning azulejo tile work, and medieval castles create an enchanting backdrop for expatriate life.\n\nThe country\'s cultural attractions are world-renowned, making it ideal for those wanting to move out of the USA permanently. From the iconic Belém Tower in Lisbon to the fairy-tale Pena Palace in Sintra, Portuguese culture celebrates both tradition and innovation, evident in its thriving arts scene, world-class museums, and UNESCO World Heritage sites scattered throughout the country. The famous Port wine regions of the Douro Valley and stunning coastal cliffs of the Algarve make moving to Portugal from USA an attractive choice for both history enthusiasts and nature lovers.\n\nFor Americans seeking to retire abroad from USA, Portugal offers multiple pathways including the popular Golden Visa program and D7 visa for remote workers. The Portuguese people are known for their warmth and hospitality, making cultural integration remarkably smooth for US citizens moving to Portugal. With its excellent healthcare system, affordable cost of living, and gateway access to all of Europe, Portugal has become a top choice for those emigrating from the US or seeking a higher quality of life through international relocation.',
    overallScore: 94,
    highlights: ['Golden Visa Program', 'EU Citizenship Path', 'Low Crime Rate', 'Affordable Healthcare'],
    immigrationPaths: ['D7 Passive Income Visa', 'Golden Visa Investment', 'Tech Visa', 'EU Blue Card'],
    costOfLiving: 'Moderate',
    healthcareRating: 5,
    safetyRating: 5,
    language: 'Portuguese (English widely spoken)',
    climate: 'Mediterranean',
    popularCities: ['Lisbon', 'Porto', 'Lagos', 'Braga'],
    keyBenefits: ['EU passport in 6 years', '€280k minimum investment', 'No tax on foreign income (NHR)', 'High-quality healthcare']
  },
  {
    name: 'Spain',
    flag: '🇪🇸',
    rank: 2,
    image: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/spain-barcelona.jpg',
    description: 'Spain consistently ranks among the best countries to emigrate to from USA, boasting a remarkable cultural heritage that spans millennia. From the ancient Roman aqueducts of Segovia to the stunning Moorish architecture of the Alhambra in Granada, Spain\'s historical tapestry is woven with influences from Celtic, Roman, Visigothic, and Islamic civilizations. This rich cultural foundation has created a nation that celebrates life through vibrant festivals, passionate flamenco, and world-renowned cuisine, making it one of the easiest countries to get citizenship for Americans seeking European residency.\n\nThe country\'s cultural attractions are legendary - Barcelona\'s whimsical Gaudí architecture, Madrid\'s world-class Prado Museum, Seville\'s magnificent cathedral, and the prehistoric cave paintings of Altamira. Spanish culture emphasizes community, family, and enjoying life\'s pleasures, from leisurely afternoon siestas to late-night tapas tours. For US citizens moving to Spain, the country\'s diverse regions each offer unique experiences, whether it\'s surfing in the Basque Country, exploring medieval towns in Castile, or relaxing on Mediterranean beaches.\n\nFor Americans wanting to move out of the USA permanently, Spain provides excellent opportunities through its Golden Visa program and Non-Lucrative Visa options. The country has become increasingly popular for those retiring abroad from USA due to its excellent healthcare system, favorable climate, and relatively affordable cost of living. With over 300 days of sunshine annually and a laid-back Mediterranean lifestyle, moving to Spain from USA offers an attractive alternative for Americans seeking a more balanced work-life environment while emigrating from the US to maintain European cultural sophistication.',
    overallScore: 91,
    highlights: ['Golden Visa Available', 'Rich Cultural Heritage', 'Excellent Climate', 'EU Access'],
    immigrationPaths: ['Golden Visa', 'Non-Lucrative Visa', 'Self-Employment Visa', 'Student Visa to Residency'],
    costOfLiving: 'Moderate',
    healthcareRating: 5,
    safetyRating: 4,
    language: 'Spanish (English in tourist areas)',
    climate: 'Mediterranean/Continental',
    popularCities: ['Barcelona', 'Madrid', 'Valencia', 'Seville'],
    keyBenefits: ['€500k property investment', 'World-class healthcare', 'Rich cultural life', 'EU citizenship eligible']
  },
  {
    name: 'Mexico',
    flag: '🇲🇽',
    rank: 3,
    image: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/mexico-beach.jpg',
    description: 'Mexico has emerged as one of the most practical best countries to emigrate to from USA, offering an incredibly rich cultural heritage that blends ancient Mesoamerican civilizations with Spanish colonial influences. The country\'s history spans over 3,000 years, from the mighty Aztec and Maya empires to the vibrant modern nation it is today. For US citizens moving to Mexico, the archaeological wonders include the pyramids of Teotihuacán, the ancient city of Chichen Itza, and countless other UNESCO World Heritage sites that tell the story of sophisticated pre-Columbian civilizations.\n\nThe cultural attractions are endless - from the colorful murals of Diego Rivera and Frida Kahlo to the baroque colonial architecture of cities like Puebla and Guanajuato. Mexican culture is celebrated worldwide for its vibrant Day of the Dead festivals, traditional mariachi music, and extraordinary culinary traditions that UNESCO has recognized as an Intangible Cultural Heritage. For those wanting to move out of the USA permanently, the country\'s diverse landscapes range from stunning Caribbean beaches to snow-capped volcanoes, colonial mountain towns to bustling modern metropolises.\n\nFor Americans exploring emigrating from the US, Mexico\'s proximity makes it an ideal choice, with no jet lag and easy access back to the United States. The growing expat communities, particularly in places like San Miguel de Allende, Puerto Vallarta, and the Riviera Maya, provide excellent support networks for newcomers. Mexico has become especially attractive for those retiring abroad from USA due to its affordable cost of living, excellent healthcare facilities, and year-round pleasant climate. Moving to Mexico from USA is simplified by the country\'s Temporary and Permanent Resident visa programs, making it one of the easiest countries to get citizenship for Americans seeking a nearby international lifestyle through emigration from USA.',
    overallScore: 88,
    highlights: ['Close to USA', 'Low Cost of Living', 'Growing Expat Community', 'Easy Visa Process'],
    immigrationPaths: ['Temporary Resident Visa', 'Permanent Resident Visa', 'Retirement Visa', 'Investment Visa'],
    costOfLiving: 'Low',
    healthcareRating: 4,
    safetyRating: 3,
    language: 'Spanish (English in expat areas)',
    climate: 'Tropical/Desert',
    popularCities: ['Mexico City', 'Playa del Carmen', 'Puerto Vallarta', 'Mérida'],
    keyBenefits: ['$2,700/month income requirement', 'Affordable private healthcare', 'Rich cultural heritage', 'Easy border crossing to US']
  },
  {
    name: 'Costa Rica',
    flag: '🇨🇷',
    rank: 4,
    image: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/costa-rica-nature.jpg',
    description: 'Costa Rica stands as one of the most stable and welcoming best countries to emigrate to from USA, with a remarkable history as Central America\'s oldest democracy. This peaceful nation abolished its military in 1948, redirecting resources toward education and healthcare, creating one of the most progressive societies in Latin America. For US citizens moving to Costa Rica, the country\'s cultural identity is built around the concept of "Pura Vida" - a philosophy that emphasizes enjoying life\'s simple pleasures and maintaining a positive outlook.\n\nThe nation\'s cultural attractions center around its incredible biodiversity and eco-tourism initiatives, making it one of the easiest countries to get citizenship for Americans seeking tropical living. Costa Rica protects over 25% of its territory in national parks and reserves, making it a living laboratory for wildlife conservation. From the cloud forests of Monteverde to the pristine beaches of Manuel Antonio, the country offers unparalleled access to nature. Costa Rican culture blends indigenous Bribri and Cabécar traditions with Spanish colonial heritage, creating a unique identity expressed through traditional oxcart art, coffee culture, and sustainable tourism practices.\n\nFor Americans wanting to move out of the USA permanently, Costa Rica provides an excellent entry point into Latin American living with strong democratic institutions and respect for the rule of law. The country has become increasingly popular for those retiring abroad from USA, offering the Pensionado program for retirees and excellent healthcare through its universal system. Moving to Costa Rica from USA offers established expat communities in areas like Atenas, Escazú, and Tamarindo, providing the perfect balance of tropical paradise living while maintaining modern amenities and political stability through emigration from USA.',
    overallScore: 85,
    highlights: ['Political Stability', 'Natural Beauty', 'Good Healthcare', 'Expat-Friendly'],
    immigrationPaths: ['Pensionado Program', 'Rentista Program', 'Inversionista Program', 'Family Reunification'],
    costOfLiving: 'Moderate',
    healthcareRating: 4,
    safetyRating: 4,
    language: 'Spanish (English widely spoken)',
    climate: 'Tropical',
    popularCities: ['San José', 'Tamarindo', 'Manuel Antonio', 'Atenas'],
    keyBenefits: ['$1,000/month pension requirement', 'Universal healthcare', 'No army since 1948', 'Biodiversity hotspot']
  },
  {
    name: 'Germany',
    flag: '🇩🇪',
    rank: 5,
    image: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/germany-berlin.jpg',
    description: 'Germany represents one of the most economically robust best countries to emigrate to from USA, offering a fascinating blend of medieval heritage and cutting-edge modernity. With a history spanning over 1,000 years, Germany has been at the center of European culture, philosophy, music, and science. For US citizens moving to Germany, landmarks from the Brandenburg Gate in Berlin to the romantic Rhine Valley castles tell the story of a nation that has shaped Western civilization through figures like Beethoven, Einstein, and Gutenberg.\n\nThe country\'s cultural attractions are world-class, featuring over 40 UNESCO World Heritage sites, including the Cologne Cathedral, Neuschwanstein Castle, and the historic centers of cities like Regensburg and Bamberg. German culture celebrates precision, innovation, and quality of life, evident in everything from its renowned automotive industry to its vibrant arts scene. For those wanting to move out of the USA permanently, the country hosts world-famous events like Oktoberfest, the Berlin International Film Festival, and countless Christmas markets that attract millions of visitors annually.\n\nFor skilled Americans exploring emigrating from the US, Germany offers excellent opportunities through its EU Blue Card program and strong job market in technology, engineering, and research sectors. The country has become attractive for those seeking European citizenship, as it\'s considered one of the easiest countries to get citizenship for Americans and easier European destinations for skilled workers to obtain long-term residency. Moving to Germany from USA appeals to Americans seeking both career advancement and high quality of life in the heart of Europe, with its central location, excellent healthcare system, and strong social safety net supporting emigration from USA.',
    overallScore: 83,
    highlights: ['Strong Economy', 'Excellent Infrastructure', 'High-Quality Education', 'EU Access'],
    immigrationPaths: ['EU Blue Card', 'Job Seeker Visa', 'Self-Employment Visa', 'Student to Work Pathway'],
    costOfLiving: 'High',
    healthcareRating: 5,
    safetyRating: 5,
    language: 'German (English in business)',
    climate: 'Temperate',
    popularCities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
    keyBenefits: ['High salaries', 'Excellent social benefits', 'Central European location', 'Strong job market']
  },
  {
    name: 'Canada',
    flag: '🇨🇦',
    rank: 6,
    image: 'https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/canada-mountains.jpg',
    description: 'Canada consistently ranks among the best countries to emigrate to from USA, offering a perfect combination of natural beauty, cultural diversity, and progressive values. This vast nation, with a history shaped by French and British colonial heritage combined with rich Indigenous cultures, has evolved into one of the world\'s most multicultural societies. For US citizens moving to Canada, the cultural landscape from the historic fortress city of Quebec to the modern skylines of Toronto and Vancouver reflects both Old World charm and New World innovation.\n\nThe country\'s cultural attractions span from coast to coast, including the stunning Canadian Rockies, Niagara Falls, the historic districts of Old Montreal, and countless national parks that showcase some of the world\'s most pristine wilderness. Canadian culture emphasizes tolerance, diversity, and community, with strong Indigenous influences evident in art, festivals, and cultural celebrations. For those wanting to move out of the USA permanently, the country\'s commitment to bilingualism, multiculturalism, and environmental conservation creates a unique cultural identity that welcomes newcomers from around the world.\n\nFor Americans considering moving to Canada from USA, the country offers one of the most structured and welcoming immigration systems globally through programs like Express Entry and Provincial Nominee Programs. Canada has become particularly attractive for those retiring abroad from USA and seeking emigrating from the US while maintaining familiar cultural and linguistic connections. The country\'s universal healthcare system, excellent education opportunities, and strong social services make it an ideal choice for families and professionals. With shared borders, similar cultural values, and one of the easiest countries to get citizenship for Americans through its clear pathway programs, Canada offers a seamless transition for emigration from USA, providing progressive governance and spectacular natural beauty.',
    overallScore: 81,
    highlights: ['Express Entry System', 'Universal Healthcare', 'Multicultural Society', 'High Quality of Life'],
    immigrationPaths: ['Express Entry', 'Provincial Nominee Program', 'Start-up Visa', 'Family Sponsorship'],
    costOfLiving: 'High',
    healthcareRating: 5,
    safetyRating: 5,
    language: 'English/French',
    climate: 'Continental',
    popularCities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'],
    keyBenefits: ['Points-based immigration', 'Free healthcare', 'Strong social safety net', 'Pathway to citizenship']
  }
];

export default function BestCountries() {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-500';
    if (score >= 80) return 'from-blue-500 to-indigo-500';
    if (score >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-lg font-medium mb-6">
              <Globe className="w-4 h-4 mr-2" />
              Top Emigration Destinations 2025
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                Best Countries to Move to From USA
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
              Discover the top-ranked destinations based on immigration policies, quality of life, 
              cost of living, and overall compatibility for US citizens seeking a new home abroad.
            </p>
            
            <div className="flex flex-wrap gap-6 justify-center items-center text-lg text-gray-600">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-medium">Expert Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Current Requirements</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Proven Pathways</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countries Ranking */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Top 6 Countries for US Emigrants</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ranked by immigration accessibility, quality of life, cost of living, and overall suitability for American expats
            </p>
          </div>

          <div className="grid gap-8 max-w-6xl mx-auto">
            {bestCountries.map((country) => (
              <div key={country.name} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Country Image Header */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={country.image} 
                    alt={`${country.name} landscape`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-700">
                      #{country.rank}
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{country.flag}</div>
                      <h3 className="text-2xl font-bold text-white">{country.name}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <p className="text-lg text-gray-600 max-w-2xl">{country.description}</p>
                    </div>
                    <div className="text-center ml-6">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getScoreColor(country.overallScore)} text-white text-xl font-bold mb-2`}>
                        {country.overallScore}
                      </div>
                      <div className="text-lg font-medium text-gray-600">Overall Score</div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Key Information */}
                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-gray-900 mb-3">Key Information</h4>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Cost of Living</span>
                        <span className={`px-3 py-1 rounded-full text-lg font-medium ${getCostColor(country.costOfLiving)}`}>
                          {country.costOfLiving}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Healthcare</span>
                        {renderStars(country.healthcareRating)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Safety</span>
                        {renderStars(country.safetyRating)}
                      </div>
                      
                      <div>
                        <span className="text-gray-700 block mb-1">Language</span>
                        <span className="text-lg text-gray-600">{country.language}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-700 block mb-1">Climate</span>
                        <span className="text-lg text-gray-600">{country.climate}</span>
                      </div>
                    </div>

                    {/* Immigration Pathways */}
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-3">Immigration Pathways</h4>
                      <ul className="space-y-2">
                        {country.immigrationPaths.map((path, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700">{path}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-6">
                        <h5 className="text-lg font-medium text-gray-900 mb-2">Popular Cities</h5>
                        <div className="flex flex-wrap gap-2">
                          {country.popularCities.map((city, index) => (
                            <Link 
                              key={index} 
                              to={`/city/${encodeURIComponent(country.name)}/${encodeURIComponent(city)}`}
                              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-lg hover:bg-blue-200 transition-colors cursor-pointer"
                            >
                              {city}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Key Benefits */}
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-3">Key Benefits</h4>
                      <ul className="space-y-3">
                        {country.keyBenefits.map((benefit, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Heart className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700 text-lg">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-6">
                        <h5 className="text-lg font-medium text-gray-900 mb-2">Top Highlights</h5>
                        <div className="space-y-2">
                          {country.highlights.map((highlight, index) => (
                            <div key={index} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                              <span className="text-green-800 font-medium">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-lg text-gray-600">
                        Ready to explore {country.name} as your new home?
                      </div>
                      <Link
                        to="/assessment"
                        className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Get Assessment
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why These Countries */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Why These Countries Top Our Rankings</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Immigration Friendly</h3>
                <p className="text-gray-600">Clear pathways and welcoming policies for American emigrants</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Healthcare</h3>
                <p className="text-gray-600">Universal or affordable healthcare systems with quality care</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Economic Opportunity</h3>
                <p className="text-gray-600">Strong economies with opportunities for business and employment</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expat Communities</h3>
                <p className="text-gray-600">Established American expat communities for support and integration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Find Your Perfect Match</h2>
            <p className="text-xl text-gray-700 mb-8">
              Take our comprehensive assessment to discover which of these top countries 
              best aligns with your priorities, lifestyle, and emigration goals.
            </p>
            <Link 
              to="/assessment"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Start Your Assessment
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
