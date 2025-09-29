import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-start space-x-24">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="inline-block">
              <img 
                src="https://e10922871bed0cc3848d-7d0b257190f7dc575c87f2234e91f8d7.ssl.cf5.rackcdn.com/Media/Images/logo%20horiaontal.png" 
                alt="Emigration Pro" 
                className="h-14 w-auto"
              />
            </div>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden md:flex md:items-center md:space-x-8" style={{ marginLeft: '28px' }}>
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Home
            </Link>
            <Link to="/assessment" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Assessment
            </Link>
            <Link to="/best-countries" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Best Countries
            </Link>
            <Link to="/sample-report" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Sample Report
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
