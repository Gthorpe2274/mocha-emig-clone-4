export default function Footer() {
  return (
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
  );
}
