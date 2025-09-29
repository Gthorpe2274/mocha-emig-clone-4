import { Link } from 'react-router-dom';
import { Shield, Heart, DollarSign, Users, Globe, CheckCircle } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            About <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">Emigration Pro</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            Over a decade of dedicated research helping Americans find their path to a better life abroad
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-6 text-lg text-gray-700">
                <p>
                  For over a decade, we've been deeply involved in emigration research and guidance, 
                  driven by a simple yet powerful belief: everyone deserves to live without fear, 
                  division, and financial uncertainty.
                </p>
                <p>
                  We started this journey when we witnessed too many Americans living in constant 
                  anxiety about their safety, their health, and their future. We saw families 
                  struggling with the reality that a single medical emergency could lead to bankruptcy, 
                  communities torn apart by political hatred, and people afraid to send their children 
                  to school due to gun violence.
                </p>
                <p>
                  Through extensive research across dozens of countries, we've identified destinations 
                  where life can be different – where healthcare is a right, not a privilege; where 
                  neighbors support each other regardless of politics; and where safety is not a luxury.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/image.png_8243.png" 
                alt="Family at airport beginning their emigration journey" 
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problems We Address */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            The American Challenges We Help You Escape
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Gun Violence</h3>
              <p className="text-gray-600">
                Living in constant fear for your family's safety, where school shootings and 
                mass violence have become normalized.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Political Division</h3>
              <p className="text-gray-600">
                Communities torn apart by hatred, where neighbors view each other as enemies 
                based on political beliefs.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cost of Living</h3>
              <p className="text-gray-600">
                Skyrocketing housing, education, and living costs that make basic comfort 
                unattainable for working families.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Healthcare Crisis</h3>
              <p className="text-gray-600">
                A broken system where getting sick or injured can lead to bankruptcy, 
                even with insurance coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12">
          <div className="max-w-4xl mx-auto text-center">
            <Globe className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              We believe that in 2024, no one should have to choose between their safety, their health, 
              and their financial security. Through our decade of research, we've identified countries 
              where Americans can live with dignity, peace of mind, and genuine community support.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Evidence-Based Research</h4>
                  <p className="text-gray-600">Over 10 years of data collection on immigration policies, costs, and quality of life</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Personal Experience</h4>
                  <p className="text-gray-600">Our team has lived and worked in multiple countries, understanding the real challenges</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Ongoing Support</h4>
                  <p className="text-gray-600">We stay current with changing immigration laws and provide updated guidance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Do This */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Why We Do This Work</h2>
          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
            <blockquote className="text-xl text-gray-700 italic text-center mb-6">
              "We've seen too many Americans accept that constant anxiety, political hatred, 
              and financial insecurity are just 'normal.' But they're not normal – and they 
              don't have to be your reality."
            </blockquote>
            <div className="text-lg text-gray-700 space-y-4">
              <p>
                Our research began when close friends and family members started asking us about 
                life in other countries. They were exhausted by the daily stress of American life: 
                worrying about school shootings, avoiding political conversations with neighbors, 
                and rationing medication due to costs.
              </p>
              <p>
                We realized that millions of Americans don't know that better options exist. Countries 
                where children go to school safely, where healthcare is affordable and accessible, 
                where political differences don't destroy relationships, and where a middle-class 
                lifestyle is actually achievable.
              </p>
              <p className="font-semibold text-blue-700">
                Our goal is simple: to provide you with the accurate, comprehensive information 
                you need to make an informed decision about your family's future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Explore Your Options?</h2>
          <p className="text-xl text-gray-700 mb-8">
            Take our comprehensive assessment to discover which countries align with your priorities 
            and learn about the real possibilities for your family's future.
          </p>
          <Link 
            to="/assessment"
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Your Assessment
          </Link>
        </div>
      </section>

      {/* Custom Footer for About Us with Address */}
      <footer className="bg-black py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Logo and Description Section */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <img 
                  src="https://e10922871bed0cc3848d-7d0b257190f7dc575c87f2234e91f8d7.ssl.cf5.rackcdn.com/Media/Images/logo%20only.png" 
                  alt="Emigration Pro Logo" 
                  className="h-16 w-auto mb-4"
                />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-md">
                Your trusted partner in international migration. We provide comprehensive assessments and professional services to help you make informed decisions about your future abroad.
              </p>
              <div className="flex items-center mb-6">
                <svg className="w-4 h-4 mr-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <img 
                  src="https://mocha-cdn.com/0198c152-69c8-7918-a1cb-a063f87c02df/image.png_6966.png" 
                  alt="Contact Email" 
                  className="h-7"
                />
              </div>
              
              {/* Mailing Address */}
              <div className="flex items-start mb-6">
                <svg className="w-4 h-4 mr-2 text-gray-300 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div className="text-gray-300 text-sm">
                  <p>2719 Hollywood Blvd.</p>
                  <p>Hollywood, Fl .33020</p>
                </div>
              </div>
              
              {/* Social Media Icons */}
              <div>
                <p className="text-gray-400 text-sm mb-3">Follow & Share</p>
                <div className="flex space-x-4">
                  <a 
                    href="/social-login" 
                    className="group flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 transform hover:scale-105"
                    title="LinkedIn"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a 
                    href="/social-login" 
                    className="group flex items-center justify-center w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded-lg transition-all duration-200 transform hover:scale-105"
                    title="X (Twitter)"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a 
                    href="/social-login" 
                    className="group flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-200 transform hover:scale-105"
                    title="Instagram"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a 
                    href="/social-login" 
                    className="group flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 transform hover:scale-105"
                    title="Facebook"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a 
                    href="/social-login" 
                    className="group flex items-center justify-center w-10 h-10 bg-sky-500 hover:bg-sky-600 rounded-lg transition-all duration-200 transform hover:scale-105"
                    title="Bluesky"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 2.087.139 3.073.216 5.037.216 5.037s.098 3.186 2.19 6.748c.968 1.647 2.25 2.135 2.25 2.135 2.296.043 3.29-.96 3.29-.96C7.947 12.96 12 10.8 12 10.8s4.053 2.16 4.054 2.16S17.047 14 19.344 13.96c0 0 1.282-.488 2.25-2.135 2.092-3.562 2.19-6.748 2.19-6.748s.077-1.964-.686-2.95C22.439 1.266 21.434.944 18.798 2.805 16.046 4.747 13.087 8.686 12 10.8z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Services Column */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/assessment" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Country Assessment
                  </a>
                </li>
                <li>
                  <span className="text-gray-300 text-sm">
                    Emigration Consultation
                  </span>
                </li>
                <li>
                  <span className="text-gray-300 text-sm">
                    Relocation Planning
                  </span>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-gray-300 text-sm">
                    Country Guides
                  </span>
                </li>
                <li>
                  <span className="text-gray-300 text-sm">
                    Emigration News
                  </span>
                </li>
                <li>
                  <span className="text-gray-300 text-sm">
                    Cost Calculators
                  </span>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <p className="text-gray-400 text-xs text-center">
              Copyright emigrationpro.com
            </p>
            <p className="text-gray-400 text-xs text-center mt-2">
              a Division of Clear Products, LLC. All rights reserved. This tool provides general guidance. Always consult official government sources and immigration professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
