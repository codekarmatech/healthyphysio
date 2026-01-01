import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/common/PageHeader';
import { getAllSettings } from '../services/siteSettingsService';
import { COMPANY_INFO, STATS } from '../constants';

const AboutUs = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getAllSettings();
      setSettings(data);
      document.title = `About Us - ${data?.branding?.company_name || 'PhysioWay'}`;
    };
    fetchSettings();
  }, []);

  const branding = settings?.branding || COMPANY_INFO;
  const founders = settings?.founders || [];
  const services = settings?.services || [];
  const pageSettings = settings?.page_settings?.about || {};
  const physioFounder = founders.find(f => f.founder_type === 'physio');
  const techFounder = founders.find(f => f.founder_type === 'tech');

  const values = [
    { title: 'Excellence', description: 'We strive for the highest standards in everything we do.', icon: '⭐' },
    { title: 'Compassion', description: 'Every patient receives personalized, empathetic care.', icon: '❤️' },
    { title: 'Innovation', description: 'Embracing cutting-edge technology for better outcomes.', icon: '🚀' },
    { title: 'Integrity', description: 'Transparency and honesty in all our relationships.', icon: '🤝' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <PageHeader
        title={pageSettings.hero_title || `About ${branding.company_name || 'PhysioWay'}`}
        subtitle={pageSettings.hero_subtitle || "Revolutionizing physiotherapy by bringing world-class treatment directly to your home."}
        bgImage={pageSettings.hero_background_image_url || "https://images.unsplash.com/photo-1576091160550-2187d80aeff2?auto=format&fit=crop&q=80"}
      />

      {/* Mission & Vision Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-in-left">
              <h2 className="text-3xl font-heading font-bold text-brand-dark mb-6">
                Our <span className="text-brand-blue">Mission</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                To provide exceptional physiotherapy services in the comfort of your home, combining
                professional expertise with cutting-edge technology to deliver personalized care that
                accelerates recovery and improves quality of life.
              </p>
              <div className="space-y-4">
                {['Patient-centered care approach', 'Evidence-based treatment protocols', 'Continuous innovation and improvement'].map((item, i) => (
                  <div key={i} className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue mr-4 font-bold">✓</span>
                    <span className="text-slate-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-slide-in-right">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-orange transform rotate-3 rounded-3xl opacity-20 blur-xl"></div>
              <div className="relative glass-card bg-white/80 rounded-3xl p-8 shadow-xl border border-white/50">
                <h3 className="text-2xl font-heading font-bold text-brand-dark mb-4">Our Vision</h3>
                <p className="text-slate-600 mb-6">
                  To become the leading home healthcare provider, transforming the way physiotherapy
                  is delivered and making quality treatment accessible to every individual.
                </p>
                <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                  <h4 className="font-bold text-brand-dark mb-3">By 2030, we aim to:</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center"><span className="text-brand-orange mr-2">•</span> Serve 100,000+ patients nationwide</li>
                    <li className="flex items-center"><span className="text-brand-orange mr-2">•</span> Expand to 50+ cities across India</li>
                    <li className="flex items-center"><span className="text-brand-orange mr-2">•</span> Pioneer AI-driven treatment protocols</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-brand-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-heading font-bold text-brand-dark">Meet Our <span className="text-brand-blue">Founders</span></h2>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Led by experienced professionals committed to your health and innovation.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* PhysioWay Founder */}
            {physioFounder && (
              <div className="glass-card p-8 rounded-3xl animate-slide-up bg-white border-2 border-slate-200 hover:shadow-2xl hover:border-brand-blue/30 transition-all duration-300">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-56 h-56 bg-gray-100 rounded-2xl overflow-hidden border-4 border-brand-blue/20 shadow-2xl">
                      {physioFounder.image_url ? (
                        <img src={physioFounder.image_url} alt={physioFounder.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-dark text-white text-5xl font-heading">
                          {physioFounder.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-brand-blue text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider">
                      Founder
                    </div>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-brand-dark mb-2">{physioFounder.name}</h3>
                  <p className="text-brand-blue font-medium mb-4 uppercase tracking-wider text-xs">{physioFounder.title}</p>
                  <p className="text-slate-600 leading-relaxed mb-6 text-sm italic">"{physioFounder.description}"</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(physioFounder.qualifications || []).map((q, i) => (
                      <span key={i} className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-lg text-xs font-medium">{q}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Technology Partner Founder */}
            {techFounder && (
              <div className="glass-card p-8 rounded-3xl animate-slide-up bg-white border-2 border-slate-200 hover:shadow-2xl hover:border-brand-orange/30 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-56 h-56 bg-gray-100 rounded-2xl overflow-hidden border-4 border-brand-orange/20 shadow-2xl">
                      {techFounder.image_url ? (
                        <img src={techFounder.image_url} alt={techFounder.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-orange to-brand-dark text-white text-5xl font-heading">
                          {techFounder.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-brand-orange text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider">
                      Tech Partner
                    </div>
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-brand-dark mb-2">{techFounder.name}</h3>
                  <p className="text-brand-orange font-medium mb-1 uppercase tracking-wider text-xs">{techFounder.title}</p>
                  {techFounder.company_name && (
                    <p className="text-slate-500 text-sm mb-4">{techFounder.company_name}</p>
                  )}
                  <p className="text-slate-600 leading-relaxed mb-6 text-sm italic">"{techFounder.description}"</p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {(techFounder.qualifications || []).map((q, i) => (
                      <span key={i} className="px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-lg text-xs font-medium">{q}</span>
                    ))}
                  </div>
                  {techFounder.company_website && (
                    <a 
                      href={techFounder.company_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange/90 transition-colors text-sm"
                    >
                      Visit {techFounder.company_name || 'Website'}
                      <span>→</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Values Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-heading font-bold text-brand-dark mb-4">Our Core Values</h2>
            <p className="text-slate-600">Principles that guide our commitment to your care.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="glass-card p-8 rounded-2xl text-center hover:-translate-y-2 transition-transform duration-300 border border-slate-100/50 bg-white/60 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-brand-dark mb-3">{value.title}</h3>
                <p className="text-slate-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-blue to-brand-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6">
            Ready to Experience the PhysioWay Difference?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied patients who have chosen PhysioWay for their recovery journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation" className="px-8 py-4 bg-white text-brand-blue rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-lg">
              Book Free Consultation
            </Link>
            <a href={`tel:${COMPANY_INFO.phone}`} className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-brand-blue transition-all duration-300">
              Call {COMPANY_INFO.phone}
            </a>
          </div>
        </div>
      </section>

      <Footer branding={branding} services={services} />
    </div>
  );
};

export default AboutUs;
