import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { SERVICES, COMPANY_INFO, CSS_CLASSES } from '../constants';

const Services = () => {
  const [isVisible, setIsVisible] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    document.title = 'Our Services - PhysioWay | Professional Physiotherapy Treatments';
    
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

  const processSteps = [
    {
      step: '01',
      title: 'Book Consultation',
      description: 'Schedule your free consultation through our website or call us directly.',
      icon: '📅'
    },
    {
      step: '02',
      title: 'Assessment',
      description: 'Our expert physiotherapist conducts a comprehensive assessment at your home.',
      icon: '🔍'
    },
    {
      step: '03',
      title: 'Treatment Plan',
      description: 'Receive a personalized treatment plan tailored to your specific needs.',
      icon: '📋'
    },
    {
      step: '04',
      title: 'Recovery Journey',
      description: 'Begin your recovery with regular sessions and progress tracking.',
      icon: '🎯'
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
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-8">
                <span className="text-primary-500 mr-2">🏥</span>
                <span className="text-sm font-medium text-gray-700">Professional Healthcare Services</span>
              </div>
              
              <h1 className={CSS_CLASSES.heading.h1}>
                Our <span className={CSS_CLASSES.heading.gradient}>Services</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto">
                Comprehensive physiotherapy treatments delivered by certified professionals in the comfort of your home. 
                We specialize in various conditions and provide personalized care for optimal recovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Filter */}
      <section id="categories" className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${isVisible.categories ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services-grid" className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <div key={service.id} className={`${CSS_CLASSES.card.base} ${CSS_CLASSES.card.padding} group ${isVisible['services-grid'] ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-900">Key Features:</h4>
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <span className="text-primary-500 mr-2">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-900">Conditions Treated:</h4>
                  <div className="flex flex-wrap gap-2">
                    {service.conditions.slice(0, 3).map((condition, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                        {condition}
                      </span>
                    ))}
                    {service.conditions.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{service.conditions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link 
                    to={`/services/${service.id}`}
                    className={`${CSS_CLASSES.button.primary} text-center text-sm flex-1`}
                  >
                    Learn More
                  </Link>
                  <Link 
                    to="/book-consultation"
                    className={`${CSS_CLASSES.button.secondary} text-center text-sm flex-1`}
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
      <section id="process" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isVisible.process ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              How It <span className={CSS_CLASSES.heading.gradient}>Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Our streamlined process ensures you get the best care with minimal hassle
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className={`text-center ${isVisible.process ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-3xl text-white shadow-lg">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section id="additional-services" className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isVisible['additional-services'] ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              Additional <span className={CSS_CLASSES.heading.gradient}>Services</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Beyond our core physiotherapy treatments, we offer comprehensive support services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.additional.map((service, index) => (
              <div key={index} className={`${CSS_CLASSES.card.base} ${CSS_CLASSES.card.padding} text-center ${isVisible['additional-services'] ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center text-3xl">
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <span className="text-primary-500 mr-2">✓</span>
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
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your Recovery Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Book a free consultation with our expert physiotherapists and discover the best treatment plan for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation" className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-300 text-center">
              Book Free Consultation
            </Link>
            <a href={`tel:${COMPANY_INFO.phone}`} className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300 text-center">
              Call {COMPANY_INFO.phone}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
