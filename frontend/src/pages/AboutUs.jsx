import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { COMPANY_INFO, STATS, CSS_CLASSES } from '../constants';

const AboutUs = () => {
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    document.title = 'About Us - PhysioWay | Professional Home Physiotherapy Services';
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Using founder and IT partner data from constants

  const values = [
    {
      title: 'Excellence',
      description: 'We strive for the highest standards in everything we do, from treatment protocols to patient care.',
      icon: '⭐'
    },
    {
      title: 'Compassion',
      description: 'Every patient receives personalized, empathetic care tailored to their unique needs and circumstances.',
      icon: '❤️'
    },
    {
      title: 'Innovation',
      description: 'We embrace cutting-edge technology and evidence-based practices to deliver superior outcomes.',
      icon: '🚀'
    },
    {
      title: 'Integrity',
      description: 'Transparency, honesty, and ethical practices form the foundation of our patient relationships.',
      icon: '🤝'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section id="hero" className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-100/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className={`${isVisible.hero ? 'animate-fade-in' : 'opacity-0'}`}>
              <h1 className={CSS_CLASSES.heading.h1}>
                About <span className={CSS_CLASSES.heading.gradient}>PhysioWay</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
                We're revolutionizing physiotherapy by bringing world-class treatment directly to your home. 
                Our mission is to make quality healthcare accessible, convenient, and effective for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className={`${isVisible.mission ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <h2 className={CSS_CLASSES.heading.h2}>
                Our <span className={CSS_CLASSES.heading.gradient}>Mission</span>
              </h2>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                To provide exceptional physiotherapy services in the comfort of your home, combining 
                professional expertise with cutting-edge technology to deliver personalized care that 
                accelerates recovery and improves quality of life.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-primary-600">✓</span>
                  </div>
                  <span className="text-gray-700">Patient-centered care approach</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-secondary-600">✓</span>
                  </div>
                  <span className="text-gray-700">Evidence-based treatment protocols</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-primary-600">✓</span>
                  </div>
                  <span className="text-gray-700">Continuous innovation and improvement</span>
                </div>
              </div>
            </div>
            
            <div className={`mt-12 lg:mt-0 ${isVisible.mission ? 'animate-slide-in-right' : 'opacity-0'}`}>
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Our Vision</h3>
                <p className="text-lg leading-relaxed mb-6">
                  To become the leading home healthcare provider, transforming the way physiotherapy 
                  is delivered and making quality treatment accessible to every individual, regardless 
                  of their location or mobility constraints.
                </p>
                <div className="bg-white/20 rounded-2xl p-6">
                  <h4 className="font-semibold mb-2">By 2030, we aim to:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Serve 100,000+ patients nationwide</li>
                    <li>• Expand to 50+ cities across India</li>
                    <li>• Pioneer AI-driven treatment protocols</li>
                    <li>• Achieve 99% patient satisfaction rate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-gradient-to-r from-primary-600 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-primary-100">
              Making a difference, one patient at a time
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className={`text-center ${isVisible.stats ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <div className="text-5xl mb-4">{stat.icon}</div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-primary-100 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section id="founder" className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isVisible.founder ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              Meet Our <span className={CSS_CLASSES.heading.gradient}>Core Founder</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Led by a young and experienced neurological physiotherapist with a vision to revolutionize healthcare delivery.
            </p>
          </div>
          
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center mb-20">
            <div className={`${isVisible.founder ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <div className="relative">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full opacity-20 animate-pulse-slow"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-8">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-6xl shadow-lg">
                      👨‍⚕️
                    </div>
                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{COMPANY_INFO.founder.name}</h3>
                      <p className="text-primary-600 font-semibold mb-2">{COMPANY_INFO.founder.title}</p>
                      <p className="text-secondary-600 font-medium">{COMPANY_INFO.founder.experience}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`mt-12 lg:mt-0 ${isVisible.founder ? 'animate-slide-in-right' : 'opacity-0'}`}>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Visionary Leadership</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {COMPANY_INFO.founder.description}
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Qualifications</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {COMPANY_INFO.founder.qualifications.map((qualification, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-primary-600">🎓</span>
                        </div>
                        <span className="text-gray-700">{qualification}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Key Achievements</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {COMPANY_INFO.founder.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-secondary-600">🏆</span>
                        </div>
                        <span className="text-gray-700">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl text-white">
                <h4 className="text-lg font-semibold mb-3">Vision Statement</h4>
                <p className="text-primary-100 italic">"{COMPANY_INFO.founder.vision}"</p>
              </div>
            </div>
          </div>
          
          {/* IT Partner Section */}
          <div className="border-t border-gray-200 pt-20">
            <div className={`text-center mb-12 ${isVisible.founder ? 'animate-fade-in' : 'opacity-0'}`}>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Our Technology <span className={CSS_CLASSES.heading.gradient}>Partner</span>
              </h3>
              <p className="text-xl text-gray-600">
                Powered by cutting-edge technology solutions
              </p>
            </div>
            
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div className={`${isVisible.founder ? 'animate-slide-in-left' : 'opacity-0'}`}>
                <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl p-8 text-white">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                      <div className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                        CB
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold mb-2">{COMPANY_INFO.itPartner.fullName}</h4>
                    <p className="text-primary-100">Technology Excellence Partner</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">🚀</span>
                      <div>
                        <h5 className="font-semibold">Innovation</h5>
                        <p className="text-primary-100 text-sm">Cutting-edge healthcare technology</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">🔧</span>
                      <div>
                        <h5 className="font-semibold">Development</h5>
                        <p className="text-primary-100 text-sm">Custom software solutions</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">☁️</span>
                      <div>
                        <h5 className="font-semibold">Infrastructure</h5>
                        <p className="text-primary-100 text-sm">Scalable cloud architecture</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-4">🛡️</span>
                      <div>
                        <h5 className="font-semibold">Security</h5>
                        <p className="text-primary-100 text-sm">Enterprise-grade data protection</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`mt-12 lg:mt-0 ${isVisible.founder ? 'animate-slide-in-right' : 'opacity-0'}`}>
                <h4 className="text-2xl font-bold text-gray-900 mb-6">Technology Partnership</h4>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {COMPANY_INFO.itPartner.description}
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <h5 className="font-semibold text-gray-900 mb-2">🌐 Web Platform</h5>
                    <p className="text-gray-600 text-sm">Modern, responsive web application built with React and advanced UI/UX design</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <h5 className="font-semibold text-gray-900 mb-2">📱 Mobile Solutions</h5>
                    <p className="text-gray-600 text-sm">Cross-platform mobile applications for seamless patient and therapist experience</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                    <h5 className="font-semibold text-gray-900 mb-2">🔄 Integration</h5>
                    <p className="text-gray-600 text-sm">Seamless integration with healthcare systems and third-party services</p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <a 
                    href={COMPANY_INFO.itPartner.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${CSS_CLASSES.button.primary} inline-block text-center`}
                  >
                    Visit {COMPANY_INFO.itPartner.name}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isVisible.values ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              Our <span className={CSS_CLASSES.heading.gradient}>Core Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              These principles guide everything we do and shape our commitment to exceptional patient care.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className={`text-center ${isVisible.values ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center text-4xl">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Experience the PhysioWay Difference?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied patients who have chosen PhysioWay for their recovery journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation" className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-300">
              Book Free Consultation
            </Link>
            <a href={`tel:${COMPANY_INFO.phone}`} className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300">
              Call {COMPANY_INFO.phone}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
