import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { SERVICES, COMPANY_INFO, CSS_CLASSES } from '../../constants';

const ServiceTemplate = () => {
  const { serviceId } = useParams();
  const [isVisible, setIsVisible] = useState({});
  
  // Find the service based on the URL parameter
  const service = SERVICES.main.find(s => s.id === serviceId);
  
  useEffect(() => {
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

  useEffect(() => {
    if (service) {
      document.title = `${service.title} - PhysioWay | Professional Physiotherapy Services`;
    }
  }, [service]);

  if (!service) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 pb-32 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Service Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">The service you're looking for doesn't exist.</p>
            <Link to="/services" className={CSS_CLASSES.button.primary}>
              View All Services
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-100/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className={`${isVisible.hero ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-6">
                <span className="text-2xl mr-2">{service.icon}</span>
                <span className="text-sm font-medium text-gray-700">Specialized Treatment</span>
              </div>
              
              <h1 className={CSS_CLASSES.heading.h1}>
                {service.title}
              </h1>
              
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                {service.description}
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/book-consultation" className={`${CSS_CLASSES.button.primary} px-8 py-4 text-lg text-center`}>
                  Book Consultation
                </Link>
                <a href={`tel:${COMPANY_INFO.phone}`} className={`${CSS_CLASSES.button.secondary} px-8 py-4 text-lg text-center`}>
                  Call Now
                </a>
              </div>
            </div>
            
            <div className={`mt-12 lg:mt-0 ${isVisible.hero ? 'animate-slide-in-right' : 'opacity-0'}`}>
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="aspect-w-4 aspect-h-3 bg-gradient-to-br from-primary-50 to-secondary-50 p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <span className="text-4xl text-white">{service.icon}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600">Professional Treatment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isVisible.features ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              Treatment <span className={CSS_CLASSES.heading.gradient}>Features</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Our comprehensive approach ensures the best possible outcomes for your recovery
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {service.features.map((feature, index) => (
              <div key={index} className={`${CSS_CLASSES.card.base} ${CSS_CLASSES.card.padding} text-center ${isVisible.features ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions Section */}
      <section id="conditions" className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isVisible.conditions ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              Conditions <span className={CSS_CLASSES.heading.gradient}>We Treat</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              We specialize in treating a wide range of conditions with proven techniques
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.conditions.map((condition, index) => (
              <div key={index} className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${isVisible.conditions ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold">•</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{condition}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your Recovery?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Book a consultation with our expert physiotherapists and take the first step towards better health.
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

export default ServiceTemplate;
