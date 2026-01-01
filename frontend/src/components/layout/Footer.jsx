import React from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO } from '../../constants';

const Footer = ({ branding, services = [] }) => {
  const companyName = branding?.company_name || COMPANY_INFO.name;
  const companyFullName = branding?.company_full_name || 'PhysioWay Active Health LLP';
  const description = branding?.description || COMPANY_INFO.description;
  const phone = branding?.phone || COMPANY_INFO.phone;
  const email = branding?.email || COMPANY_INFO.email;
  const logoDarkUrl = branding?.logo_dark_url || branding?.logo_dark || null;
  const techPartner = {
    name: branding?.tech_partner_name || COMPANY_INFO.itPartner.name,
    website: branding?.tech_partner_url || COMPANY_INFO.itPartner.website,
    fullName: branding?.tech_partner_name || COMPANY_INFO.itPartner.fullName,
    logoUrl: branding?.tech_partner_logo_url || branding?.tech_partner_logo || null,
  };
  
  // Get services for footer (limit to 6)
  const footerServices = services.slice(0, 6);

  return (
    <footer className="bg-slate-950 text-slate-300 font-sans border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="block mb-6">
              {logoDarkUrl ? (
                <div className="inline-block bg-white rounded-2xl p-4 shadow-lg shadow-white/10">
                  <img src={logoDarkUrl} alt={companyFullName} className="h-16 w-auto" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold text-2xl text-slate-900">
                    {companyName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-heading text-2xl font-bold text-white block">{companyName}</span>
                    <span className="text-sm text-slate-400">Active Health LLP</span>
                  </div>
                </div>
              )}
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {description}
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-brand-blue transition-colors flex items-center justify-center text-white cursor-pointer">✕</div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-brand-blue transition-colors flex items-center justify-center text-white cursor-pointer">in</div>
              <div className="w-8 h-8 rounded-full bg-slate-800 hover:bg-brand-blue transition-colors flex items-center justify-center text-white cursor-pointer">f</div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about-us" className="hover:text-brand-orange transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-brand-orange transition-colors">Our Services</Link></li>
              <li><Link to="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link></li>
              <li><Link to="/book-consultation" className="hover:text-brand-orange transition-colors">Book Appointment</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Services</h4>
            <ul className="space-y-3 text-sm">
              {footerServices.length > 0 ? (
                footerServices.map((service) => (
                  <li key={service.id || service.slug}>
                    <Link to={`/services/${service.slug}`} className="hover:text-brand-orange transition-colors">
                      {service.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link to="/services/orthopedic" className="hover:text-brand-orange transition-colors">Orthopedic Rehab</Link></li>
                  <li><Link to="/services/neurological" className="hover:text-brand-orange transition-colors">Neurological Rehab</Link></li>
                  <li><Link to="/services/geriatric" className="hover:text-brand-orange transition-colors">Geriatric Care</Link></li>
                  <li><Link to="/services/pediatric" className="hover:text-brand-orange transition-colors">Pediatric Care</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact & Partner */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Get in Touch</h4>
            <ul className="space-y-4 text-sm mb-8">
              <li className="flex items-start gap-3">
                <span className="text-brand-blue mt-0.5">📍</span>
                <span>Ahmedabad, India</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-brand-blue">📞</span>
                <a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-brand-blue">✉️</span>
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
              </li>
            </ul>

            {/* Tech Partner - Professional Design */}
            <div className="pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">Technology Partner</p>
              <a 
                href={techPartner.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group block bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-cyan-900/30 hover:to-slate-800/80 p-4 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="flex items-center gap-4">
                  {techPartner.logoUrl ? (
                    <div className="w-20 h-20 rounded-xl bg-slate-800 p-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <img src={techPartner.logoUrl} alt={techPartner.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold group-hover:scale-105 transition-transform duration-300">CB</div>
                  )}
                  <div className="flex-1">
                    <div className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">{techPartner.fullName}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>Digital Solutions</span>
                      <span className="text-cyan-500 group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 max-w-7xl mx-auto">
          <p>&copy; {new Date().getFullYear()} {companyFullName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
