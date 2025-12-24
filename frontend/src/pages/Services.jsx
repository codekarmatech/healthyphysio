import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/common/PageHeader';
import { getAllSettings } from '../services/siteSettingsService';
import { SERVICES, COMPANY_INFO } from '../constants';

const Services = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getAllSettings();
      setSettings(data);
      document.title = `Our Services - ${data?.branding?.company_name || 'PhysioWay'}`;
    };
    fetchSettings();
  }, []);

  const branding = settings?.branding || COMPANY_INFO;
  const categories = [
    { id: 'all', name: 'All Services', icon: '🏥' },
    { id: 'orthopedic', name: 'Orthopedic', icon: '🦴' },
    { id: 'neurological', name: 'Neurological', icon: '🧠' },
    { id: 'cardiopulmonary', name: 'Cardiopulmonary', icon: '❤️' },
    { id: 'specialized', name: 'Specialized Care', icon: '⭐' }
  ];

  const filteredServices = selectedCategory === 'all'
    ? SERVICES.main
    : SERVICES.main.filter(service => {
      if (selectedCategory === 'specialized') {
        return ['pediatric', 'geriatric', 'womens-health'].includes(service.id);
      }
      return service.id === selectedCategory;
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <PageHeader
        title="Our Services"
        subtitle="Comprehensive physiotherapy treatments delivered by certified professionals in the comfort of your home."
        bgImage="https://images.unsplash.com/photo-1576091160550-2187d80aeff2?auto=format&fit=crop&q=80"
      />

      {/* Service Categories Filter */}
      <section className="py-12 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg backdrop-blur-md ${selectedCategory === category.id
                  ? 'bg-brand-blue text-white scale-105 ring-4 ring-brand-blue/20'
                  : 'bg-white/90 text-slate-600 hover:bg-white hover:scale-105 hover:text-brand-blue'
                  }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-transparent to-brand-blue/5 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <div key={service.id} className="glass-card group p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 border border-white/50 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-brand-light/50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-heading font-bold text-brand-dark mb-2 group-hover:text-brand-blue transition-colors">{service.title}</h3>
                  <p className="text-slate-600 mb-4 text-sm leading-relaxed">{service.description}</p>
                </div>

                <div className="space-y-3 mb-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100/50">
                  <h4 className="font-semibold text-brand-dark text-sm uppercase tracking-wide mb-2 border-b border-slate-100 pb-2">Key Features</h4>
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-slate-600">
                      <span className="text-brand-blue mr-2 font-bold">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-slate-100">
                  <Link
                    to={`/services/${service.id}`}
                    className="flex-1 px-4 py-2 border border-brand-blue text-brand-blue font-bold rounded-xl hover:bg-brand-blue hover:text-white transition-all text-center text-sm uppercase tracking-wider"
                  >
                    Details
                  </Link>
                  <Link
                    to="/book-consultation"
                    className="flex-1 px-4 py-2 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20 transition-all text-center text-sm uppercase tracking-wider"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-brand-dark">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">Works</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mt-4">
              Our streamlined process ensures you get the best care with minimal hassle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {[
              { step: '01', title: 'Book Consultation', description: 'Schedule your free consultation through our website or call us directly.', icon: '📅' },
              { step: '02', title: 'Assessment', description: 'Our expert physiotherapist conducts a comprehensive assessment at your home.', icon: '🔍' },
              { step: '03', title: 'Treatment Plan', description: 'Receive a personalized treatment plan tailored to your specific needs.', icon: '📋' },
              { step: '04', title: 'Recovery Journey', description: 'Begin your recovery with regular sessions and progress tracking.', icon: '🎯' }
            ].map((step, index) => (
              <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="relative mb-8 inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-brand-blue to-brand-orange rounded-3xl rotate-3 flex items-center justify-center text-3xl text-white shadow-xl hover:rotate-6 transition-transform duration-300">
                    <div className="-rotate-3">{step.icon}</div>
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-dark rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-md">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section id="additional-services" className="py-20 bg-gradient-to-br from-slate-50 to-brand-blue/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-heading font-bold text-brand-dark">
              Additional <span className="text-brand-blue">Services</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mt-4">
              Beyond our core physiotherapy treatments, we offer comprehensive support services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.additional.map((service, index) => (
              <div key={index} className="glass-panel bg-white p-8 rounded-2xl text-center hover:shadow-xl transition-all duration-300 border border-slate-100 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-brand-blue/10 to-brand-orange/10 rounded-2xl flex items-center justify-center text-3xl">
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-4">{service.title}</h3>
                <p className="text-slate-600 mb-6 text-sm">{service.description}</p>
                <ul className="space-y-2 text-left bg-slate-50 p-4 rounded-xl">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-xs text-slate-600 font-medium">
                      <span className="text-brand-orange mr-2">●</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-blue to-brand-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl lg:text-5xl font-heading font-bold mb-6">
            Ready to Start Your Recovery Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Book a free consultation with our expert physiotherapists.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation" className="px-8 py-4 bg-white text-brand-blue rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-lg">
              Book Free Consultation
            </Link>
            <a href={`tel:${branding.phone}`} className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition-colors">
              Call {branding.phone}
            </a>
          </div>
        </div>
      </section>

      <Footer branding={branding} />
    </div>
  );
};

export default Services;
