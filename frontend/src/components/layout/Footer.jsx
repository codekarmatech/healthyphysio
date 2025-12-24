import React from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO } from '../../constants';

const Footer = ({ branding }) => {
  const companyName = branding?.company_name || COMPANY_INFO.name;
  const description = branding?.description || COMPANY_INFO.description;
  const phone = branding?.phone || COMPANY_INFO.phone;
  const email = branding?.email || COMPANY_INFO.email;
  const techPartner = {
    name: branding?.tech_partner_name || COMPANY_INFO.itPartner.name,
    website: branding?.tech_partner_url || COMPANY_INFO.itPartner.website,
    fullName: branding?.tech_partner_name || COMPANY_INFO.itPartner.fullName,
  };

  return (
    <footer className="bg-slate-950 text-slate-300 font-sans border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-xl text-slate-900">
                {companyName.charAt(0)}
              </div>
              <span className="font-heading text-2xl font-bold text-white">{companyName}</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {description} We combine advanced technology with expert care to deliver the best physiotherapy experience at home.
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
              <li><Link to="/services" className="hover:text-brand-orange transition-colors">Orthopedic Rehab</Link></li>
              <li><Link to="/services" className="hover:text-brand-orange transition-colors">Neurological Rehab</Link></li>
              <li><Link to="/services" className="hover:text-brand-orange transition-colors">Sports Injury</Link></li>
              <li><Link to="/services" className="hover:text-brand-orange transition-colors">Geriatric Care</Link></li>
            </ul>
          </div>

          {/* Contact & Partner */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Get in Touch</h4>
            <ul className="space-y-4 text-sm mb-8">
              <li className="flex items-start gap-3">
                <span className="text-brand-blue mt-0.5">📍</span>
                <span>Mumbai, India</span>
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

            {/* Tech Partner Minimal */}
            <div className="pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Technology Partner</p>
              <a href={techPartner.website} target="_blank" rel="noopener noreferrer" className="bg-slate-800/50 hover:bg-slate-800 p-3 rounded-lg flex items-center gap-3 transition-colors group">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">CB</div>
                <div>
                  <div className="text-white font-bold text-xs group-hover:text-brand-orange transition-colors">{techPartner.fullName}</div>
                  <div className="text-[10px] text-slate-500">Tech Solutions</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 max-w-7xl mx-auto">
          <p>&copy; {new Date().getFullYear()} {companyName}. All rights reserved.</p>
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
