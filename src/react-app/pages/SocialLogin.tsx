import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Share, ExternalLink, CheckCircle, ArrowLeft } from 'lucide-react';

interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  hoverColor: string;
  loginUrl: string;
  description: string;
}

const socialPlatforms: SocialPlatform[] = [
  {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    loginUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    description: 'Connect with professionals and share your emigration journey'
  },
  {
    name: 'X (Twitter)',
    icon: '🐦',
    color: 'bg-gray-900',
    hoverColor: 'hover:bg-gray-800',
    loginUrl: 'https://twitter.com/i/oauth2/authorize',
    description: 'Share quick updates about your relocation experience'
  },
  {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    hoverColor: 'hover:from-purple-600 hover:to-pink-600',
    loginUrl: 'https://www.instagram.com/',
    description: 'Share visual stories of your new life abroad'
  },
  {
    name: 'Facebook',
    icon: '👥',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    loginUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    description: 'Connect with emigration communities and groups'
  },
  {
    name: 'Bluesky',
    icon: '🦋',
    color: 'bg-sky-500',
    hoverColor: 'hover:bg-sky-600',
    loginUrl: 'https://bsky.app',
    description: 'Join the decentralized social conversation'
  }
];

export default function SocialLogin() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  const handleConnect = (platform: SocialPlatform) => {
    // In a real implementation, this would handle OAuth flow
    setConnectedPlatforms(prev => [...prev, platform.name]);
    
    // Simulate opening OAuth popup
    window.open(
      platform.loginUrl,
      'social-login',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  };

  const isConnected = (platformName: string) => connectedPlatforms.includes(platformName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Emigration Pro
            </Link>
            <img 
              src="https://e10922871bed0cc3848d-7d0b257190f7dc575c87f2234e91f8d7.ssl.cf5.rackcdn.com/Media/Images/logo%20only.png" 
              alt="Emigration Pro" 
              className="h-8"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Share className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connect & Share Your Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect your social media accounts to share your emigration experience and 
            inspire others considering their international move.
          </p>
        </div>

        {/* Social Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {socialPlatforms.map((platform) => (
            <div
              key={platform.name}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {platform.description}
                    </p>
                  </div>
                </div>
                {isConnected(platform.name) && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>

              <button
                onClick={() => handleConnect(platform)}
                disabled={isConnected(platform.name)}
                className={`
                  w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white transition-all duration-200
                  ${isConnected(platform.name) 
                    ? 'bg-green-500 cursor-not-allowed' 
                    : `${platform.color} ${platform.hoverColor} transform hover:scale-105`
                  }
                `}
              >
                {isConnected(platform.name) ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Connected
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Connect {platform.name}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Sharing Benefits */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Share Your Emigration Journey?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Inspire Others</h3>
              <p className="text-sm text-gray-600">
                Your story can help others take the leap towards their dream destination
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Build Community</h3>
              <p className="text-sm text-gray-600">
                Connect with fellow expats and emigrants in your network
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Share Knowledge</h3>
              <p className="text-sm text-gray-600">
                Help others learn from your emigration experience and insights
              </p>
            </div>
          </div>
        </div>

        {/* Sample Posts */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sample Posts to Get You Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Assessment Complete</h3>
              <p className="text-gray-700 text-sm italic mb-3">
                "Just completed my emigration assessment with @EmigrationPro! Discovered some amazing destination options I hadn't considered. The detailed analysis really opened my eyes to what's possible. 🌍✈️ #Emigration #NewBeginnings"
              </p>
              <span className="text-xs text-gray-500">Perfect for LinkedIn, X, Facebook</span>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Journey Update</h3>
              <p className="text-gray-700 text-sm italic mb-3">
                "Three months into my emigration planning and feeling more confident than ever! The professional guidance from EmigrationPro has been invaluable in navigating this complex process. 📍🏡 #ExpatLife #EmigrationJourney"
              </p>
              <span className="text-xs text-gray-500">Great for Instagram, Bluesky</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
