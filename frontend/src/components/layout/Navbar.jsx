import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { COMPANY_INFO, NAVIGATION } from '../../constants';
import { getAllSettings } from '../../services/siteSettingsService';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const allSettings = await getAllSettings();
        setSettings(allSettings);
      } catch (error) {
        console.warn('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const branding = settings?.branding || COMPANY_INFO;
  const navbar = settings?.navbar || {};

  const logoUrl = branding.logo_url || branding.logo;
  const companyName = branding.company_name || COMPANY_INFO.name;
  const companyFullName = branding.company_full_name || 'PhysioWay Active Health LLP';
  const phone = branding.phone || COMPANY_INFO.phone;
  const whatsappNumber = phone?.replace(/[^0-9]/g, '');

  const ctaText = navbar.cta_text || 'Book Now';
  const ctaLink = navbar.cta_link || '/book-consultation';
  const showPhone = navbar.show_phone !== false;

  const isActive = (path) => location.pathname === path;

  // Always show a semi-transparent background to ensure text visibility
  const navbarClasses = isScrolled
    ? 'bg-white/95 backdrop-blur-lg border-b border-slate-200/50 shadow-sm'
    : 'bg-white/80 backdrop-blur-md border-b border-transparent shadow-sm';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarClasses}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-white shadow-md border border-slate-100 p-1">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-xl rounded-lg">
                  {companyName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-brand-dark tracking-tight leading-tight">
                {companyName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide hidden sm:block">
                {companyFullName.replace(companyName, '').trim()}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAVIGATION.main.map((item) => {
              if (item.name === 'Services') {
                return (
                  <div key={item.id} className="relative group">
                    <Link
                      to={item.href}
                      className={`text-[15px] font-semibold transition-colors duration-300 flex items-center gap-1 ${isActive(item.href) ? 'text-brand-blue' : 'text-slate-700 hover:text-brand-blue'}`}
                    >
                      {item.name}
                      <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Link>
                    <div className="absolute top-full left-0 w-64 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                      <div className="bg-white rounded-2xl shadow-xl p-4 border border-slate-100/50 backdrop-blur-3xl">
                        {NAVIGATION.services.map((service) => (
                          <Link
                            key={service.name}
                            to={service.href}
                            className="block px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-brand-blue transition-colors text-sm font-medium"
                          >
                            {service.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`text-[15px] font-semibold transition-colors duration-300 relative group ${isActive(item.href) ? 'text-brand-blue' : 'text-slate-700 hover:text-brand-blue'
                    }`}
                >
                  {item.name}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-blue transition-all duration-300 rounded-full ${isActive(item.href) ? 'w-full' : 'group-hover:w-full'
                    }`} />
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Login/Signup */}
            <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
              <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-brand-blue transition-colors">
                Log In
              </Link>
              <Link to="/register" className="text-sm font-bold text-brand-blue hover:text-brand-dark transition-colors bg-brand-blue/10 px-4 py-2 rounded-full">
                Sign Up
              </Link>
            </div>

            {/* Call Button (Small) */}
            {showPhone && (
              <a
                href={`tel:${phone}`}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white transition-all duration-300 shadow-sm"
                title="Call Us"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            )}

            {/* WhatsApp Button */}
            {showPhone && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#20bd5a] transition-all duration-300 font-bold text-sm shadow-lg shadow-green-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                <span className="hidden xl:inline">WhatsApp</span>
              </a>
            )}

            <Link
              to={ctaLink}
              className="px-6 py-2.5 bg-brand-dark text-white rounded-xl shadow-lg hover:bg-brand-blue hover:shadow-brand-blue/30 transition-all duration-300 font-bold text-sm"
            >
              {ctaText}
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:text-brand-blue transition-colors"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-screen opacity-100 py-4' : 'max-h-0 opacity-0'
          }`}>
          <div className="flex flex-col gap-2 bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
            {NAVIGATION.main.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive(item.href) ? 'bg-brand-blue/5 text-brand-blue' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="h-px bg-slate-100 my-2" />

            {/* Mobile Actions */}
            <div className="flex gap-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 py-3 text-center text-slate-700 font-bold bg-slate-50 rounded-xl">Login</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 py-3 text-center text-brand-blue font-bold bg-brand-blue/10 rounded-xl">Sign Up</Link>
            </div>

            {showPhone && (
              <div className="flex gap-2 mt-2">
                <a
                  href={`tel:${phone}`}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-center text-brand-orange bg-brand-orange/10 flex items-center justify-center gap-2"
                >
                  📞 Call
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-center text-[#25D366] bg-[#25D366]/10 flex items-center justify-center gap-2"
                >
                  WhatsApp
                </a>
              </div>
            )}
            <Link
              to={ctaLink}
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-2 px-4 py-3 rounded-xl text-base font-bold text-center text-white bg-brand-blue shadow-lg shadow-brand-blue/20"
            >
              {ctaText}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
