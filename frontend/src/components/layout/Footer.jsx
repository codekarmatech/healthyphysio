import React from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO } from '../../constants';

const Footer = () => {
  const footerSections = {
    services: [
      'Orthopedic Physiotherapy',
      'Neurological Physiotherapy', 
      'Cardiopulmonary Physiotherapy',
      'Pediatric Physiotherapy',
      'Geriatric Physiotherapy',
      'Women\'s Health'
    ],
    company: [
      'About Us',
      'Our Team',
      'Careers',
      'Privacy Policy',
      'Terms of Service'
    ],
    support: [
      'Help Center',
      'Contact Us',
      'Book Appointment',
      'Patient Portal',
      'Insurance'
    ]
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Emergency Support Banner */}
        <div className="bg-gradient-to-r from-secondary-600 to-secondary-500 rounded-2xl p-6 pt-12 mb-16 shadow-2xl relative z-10" style={{ marginTop: '-2rem' }}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-white mb-2">Need Emergency Physiotherapy?</h3>
              <p className="text-secondary-100">24/7 emergency support available for urgent cases</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={`tel:${COMPANY_INFO.phone}`} className="px-6 py-3 bg-white text-secondary-600 rounded-lg font-semibold hover:bg-secondary-50 transition-colors duration-300 text-center">
                Call Now: {COMPANY_INFO.phone}
              </a>
              <Link to="/emergency" className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-secondary-600 transition-all duration-300 text-center">
                Emergency Booking
              </Link>
            </div>
          </div>
        </div>

        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl text-white">🏥</span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">
                  {COMPANY_INFO.name}
                </h3>
              </Link>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {COMPANY_INFO.description} We bring transparency, technology, and expert care to your doorstep.
              </p>
              <div className="flex space-x-4">
                <a href={COMPANY_INFO.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors duration-300">
                  📘
                </a>
                <a href={COMPANY_INFO.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors duration-300">
                  📱
                </a>
                <a href={`mailto:${COMPANY_INFO.email}`} className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors duration-300">
                  📧
                </a>
                <a href={COMPANY_INFO.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-primary-600 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors duration-300">
                  🔗
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-secondary-300">Our Services</h4>
              <ul className="space-y-3">
                {footerSections.services.map((item, index) => (
                  <li key={index}>
                    <Link to={`/services/${item.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}`} className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                      <span className="text-secondary-400 mr-2">▶</span>
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-secondary-300">Company</h4>
              <ul className="space-y-3">
                {footerSections.company.map((item, index) => (
                  <li key={index}>
                    <Link to={`/${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                      <span className="text-secondary-400 mr-2">▶</span>
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support & Contact */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-secondary-300">Support & Contact</h4>
              <ul className="space-y-3 mb-6">
                {footerSections.support.map((item, index) => (
                  <li key={index}>
                    <Link to={`/${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center">
                      <span className="text-secondary-400 mr-2">▶</span>
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
              
              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-300">
                  <span className="text-secondary-400 mr-2">📞</span>
                  <a href={`tel:${COMPANY_INFO.phone}`} className="hover:text-white transition-colors">
                    {COMPANY_INFO.phone}
                  </a>
                </div>
                <div className="flex items-center text-gray-300">
                  <span className="text-secondary-400 mr-2">✉️</span>
                  <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-white transition-colors">
                    {COMPANY_INFO.email}
                  </a>
                </div>
                <div className="flex items-start text-gray-300">
                  <span className="text-secondary-400 mr-2 mt-0.5">📍</span>
                  <span>{COMPANY_INFO.serviceAreas.join(', ')}</span>
                </div>
                <div className="flex items-start text-gray-300">
                  <span className="text-secondary-400 mr-2 mt-0.5">🕐</span>
                  <div>
                    <div>{COMPANY_INFO.workingHours.weekdays}</div>
                    <div>{COMPANY_INFO.workingHours.weekend}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* IT Partner Highlight Section - Premium Design */}
        <div className="border-t border-gray-700 py-10">
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-primary-900 to-slate-800 rounded-3xl p-8 shadow-2xl">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary-500/10 to-primary-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left side - Partner info */}
              <div className="flex items-center gap-6">
                {/* Logo */}
                <a 
                  href={COMPANY_INFO.itPartner.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-primary-500/30 transition-all duration-500 group-hover:scale-110">
                    <div className="text-3xl font-black text-white tracking-tight">CB</div>
                  </div>
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 -z-10"></div>
                </a>
                
                {/* Text content */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-1 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border border-primary-400/30 rounded-full text-xs font-semibold text-primary-300 uppercase tracking-wider">
                      Technology Partner
                    </span>
                  </div>
                  <a 
                    href={COMPANY_INFO.itPartner.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h4 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-secondary-200 bg-clip-text text-transparent hover:from-primary-300 hover:to-secondary-300 transition-all duration-300">
                      {COMPANY_INFO.itPartner.fullName}
                    </h4>
                  </a>
                  <p className="text-gray-400 text-sm mt-1">
                    Building innovative healthcare technology solutions
                  </p>
                </div>
              </div>
              
              {/* Right side - CTA */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-center sm:text-right">
                  <p className="text-gray-400 text-sm">Need a custom solution?</p>
                  <p className="text-white font-medium">Let's build something amazing</p>
                </div>
                <a 
                  href={COMPANY_INFO.itPartner.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300 flex items-center gap-2"
                >
                  <span>Visit Website</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Technology solutions by <a href={COMPANY_INFO.itPartner.website} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-secondary-300 transition-colors">{COMPANY_INFO.itPartner.name}</a>
              </p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">
                Terms of Service
              </Link>
              <div className="flex items-center text-gray-400">
                <span className="mr-2">🌐</span>
                <span>Serving India Nationwide</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
