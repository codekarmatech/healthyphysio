import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { COMPANY_INFO, NAVIGATION } from '../../constants';
import { getNavbarSettings, getBrandingSettings } from '../../services/siteSettingsService';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);
  const [navbarSettings, setNavbarSettings] = useState(null);
  const [brandingSettings, setBrandingSettings] = useState(null);
  const location = useLocation();

  // Fetch navbar and branding settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [navbar, branding] = await Promise.all([
          getNavbarSettings(),
          getBrandingSettings()
        ]);
        setNavbarSettings(navbar);
        setBrandingSettings(branding);
      } catch (error) {
        console.warn('Failed to fetch navbar settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Use backend settings or fallback to defaults
  const companyName = brandingSettings?.company_name || COMPANY_INFO.name;
  const tagline = brandingSettings?.tagline || COMPANY_INFO.tagline;
  const phone = brandingSettings?.phone || COMPANY_INFO.phone;
  const logoUrl = brandingSettings?.logo_url;
  const ctaText = navbarSettings?.cta_text || 'Book Now';
  const ctaLink = navbarSettings?.cta_link || '/book-consultation';
  const showCta = navbarSettings?.show_cta_button !== false;
  const showPhone = navbarSettings?.show_phone !== false;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
    setIsServicesDropdownOpen(false);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-primary-100' 
        : 'bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center group">
            <div className="relative">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-12 mr-3 group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl text-white">🏥</span>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {companyName}
              </h1>
              <span className="text-xs text-gray-500 font-medium hidden sm:block">
                {tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {NAVIGATION.main.map((item) => (
              <div key={item.id} className="relative group">
                {item.id === 'services' ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => {
                      if (dropdownTimeout) {
                        clearTimeout(dropdownTimeout);
                        setDropdownTimeout(null);
                      }
                      setIsServicesDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => {
                        setIsServicesDropdownOpen(false);
                      }, 150);
                      setDropdownTimeout(timeout);
                    }}
                  >
                    <Link 
                      to="/services"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center ${
                        isActive('/services') 
                          ? 'text-primary-600 bg-primary-50' 
                          : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      Services
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Link>
                    
                    {/* Services Dropdown */}
                    {isServicesDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 z-[100]">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-900">Our Services</h3>
                          <p className="text-xs text-gray-500">Specialized physiotherapy treatments</p>
                        </div>
                        <div className="grid grid-cols-1 gap-1 p-2">
                          {NAVIGATION.services.map((service) => (
                            <Link
                              key={service.href}
                              to={service.href}
                              className="flex items-center px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                              onClick={() => setIsServicesDropdownOpen(false)}
                            >
                              <span className="mr-2">🔹</span>
                              {service.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive(item.href) 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Contact & CTA - Simplified */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Emergency Contact - Compact */}
            {showPhone && (
              <a 
                href={`tel:${phone}`} 
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
              >
                <span className="text-primary-500 mr-1">📞</span>
                <span className="font-medium">{phone}</span>
              </a>
            )}
            
            <div className="w-px h-5 bg-gray-200"></div>
            
            {/* Auth Buttons - Compact */}
            <Link 
              to="/login" 
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-lg transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg transition-all duration-300"
            >
              Sign Up
            </Link>
            
            {showCta && (
              <Link to={ctaLink} className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                {ctaText}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg rounded-b-2xl">
            <div className="px-4 py-6 space-y-4">
              {/* Contact Info */}
              {showPhone && (
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="text-primary-500">📞</span>
                    <a href={`tel:${phone}`} className="hover:text-primary-600">
                      {phone}
                    </a>
                  </div>
                  <span className="text-xs text-secondary-500 font-medium">24/7 Support</span>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-2">
                {NAVIGATION.main.map((item) => (
                  <div key={item.id}>
                    {item.id === 'services' ? (
                      <div>
                        <button
                          onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                          className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-300"
                        >
                          <span className="font-medium">Services</span>
                          <svg className={`h-4 w-4 transition-transform duration-200 ${isServicesDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isServicesDropdownOpen && (
                          <div className="mt-2 ml-4 space-y-1">
                            {NAVIGATION.services.map((service) => (
                              <Link
                                key={service.href}
                                to={service.href}
                                onClick={handleMobileMenuClose}
                                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                              >
                                <span className="mr-2 text-xs">🔹</span>
                                {service.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={handleMobileMenuClose}
                        className={`block px-3 py-2 rounded-lg font-medium transition-colors duration-300 ${
                          isActive(item.href)
                            ? 'text-primary-600 bg-primary-50'
                            : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Auth Buttons */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex space-x-3">
                  <Link 
                    to="/login" 
                    onClick={handleMobileMenuClose}
                    className="flex-1 px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-300"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={handleMobileMenuClose}
                    className="flex-1 px-4 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 rounded-lg transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </div>
                {showCta && (
                  <Link 
                    to={ctaLink} 
                    onClick={handleMobileMenuClose}
                    className="w-full text-center block px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg transition-all duration-300"
                  >
                    {ctaText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
