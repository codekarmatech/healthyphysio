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
        title={`About ${branding.company_name || 'PhysioWay'}`}
        subtitle="Revolutionizing physiotherapy by bringing world-class treatment directly to your home."
        bgImage="https://images.unsplash.com/photo-1576091160550-2187d80aeff2?auto=format&fit=crop&q=80"
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

      {/* Founder Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-heading font-bold text-brand-dark">Meet Our Founder</h2>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Led by experienced professionals committed to your health.</p>
          </div>

          <div className="glass-card p-8 lg:p-12 rounded-[3rem] max-w-5xl mx-auto animate-slide-up">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative">
                <div className="w-48 h-48 bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  {/* Placeholder for founder image */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-dark text-white text-4xl font-heading">
                    {COMPANY_INFO.founder.name.charAt(0)}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 bg-brand-orange text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">FOUNDER</div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-heading font-bold text-brand-dark mb-2">{COMPANY_INFO.founder.name}</h3>
                <p className="text-brand-blue font-medium mb-6 uppercase tracking-wider text-sm">{COMPANY_INFO.founder.title}</p>
                <p className="text-slate-600 leading-relaxed mb-6 italic">"{COMPANY_INFO.founder.description}"</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {COMPANY_INFO.founder.qualifications.map((q, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium border border-slate-200">{q}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IT Partner Section */}
      <section className="py-20 border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h3 className="text-3xl font-bold text-brand-dark mb-4">
              Our Technology <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">Partner</span>
            </h3>
            <p className="text-xl text-slate-600">
              Powered by cutting-edge technology solutions
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="animate-slide-in-left">
              <div className="bg-gradient-to-br from-brand-blue to-brand-dark rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-500">
                      <div className="text-3xl font-bold bg-gradient-to-r from-brand-blue to-brand-dark bg-clip-text text-transparent">
                        CB
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold mb-2">{COMPANY_INFO.itPartner.fullName}</h4>
                    <p className="text-blue-100">Technology Excellence Partner</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: '🚀', title: 'Innovation', desc: 'Cutting-edge healthcare technology' },
                      { icon: '🔧', title: 'Development', desc: 'Custom software solutions' },
                      { icon: '☁️', title: 'Infrastructure', desc: 'Scalable cloud architecture' },
                      { icon: '🛡️', title: 'Security', desc: 'Enterprise-grade data protection' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <span className="text-2xl mr-4">{item.icon}</span>
                        <div>
                          <h5 className="font-semibold">{item.title}</h5>
                          <p className="text-blue-100 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 animate-slide-in-right">
              <h4 className="text-2xl font-bold text-brand-dark mb-6">Technology Partnership</h4>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                {COMPANY_INFO.itPartner.description}
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Web Platform', desc: 'Modern, responsive web application built with React and advanced UI/UX design', icon: '🌐' },
                  { title: 'Mobile Solutions', desc: 'Cross-platform mobile applications for seamless patient and therapist experience', icon: '📱' },
                  { title: 'Integration', desc: 'Seamless integration with healthcare systems and third-party services', icon: '🔄' }
                ].map((item, i) => (
                  <div key={i} className="glass-panel bg-white p-4 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">{item.icon}</span>
                      <div>
                        <h5 className="font-semibold text-brand-dark mb-1">{item.title}</h5>
                        <p className="text-slate-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <a
                  href={COMPANY_INFO.itPartner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-colors shadow-lg shadow-brand-blue/20"
                >
                  Visit {COMPANY_INFO.itPartner.name}
                  <span className="ml-2">→</span>
                </a>
              </div>
            </div>
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

      <Footer branding={branding} />
    </div>
  );
};

export default AboutUs;
