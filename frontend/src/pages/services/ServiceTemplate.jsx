import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { COMPANY_INFO } from '../../constants';
import { getServiceBySlug } from '../../services/servicesService';

const ServiceTemplate = () => {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const data = await getServiceBySlug(serviceId);
      setService(data);
      setLoading(false);
    };
    
    fetchService();
  }, [serviceId]);

  useEffect(() => {
    if (service) {
      document.title = `${service.title} - PhysioWay | Professional Physiotherapy Services`;
    }
  }, [service]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 pb-32 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Loading service...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20 pb-32 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Service Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">The service you're looking for doesn't exist.</p>
            <Link to="/services" className="px-8 py-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 shadow-lg transition-all">
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
      
      {/* Hero Section with Background Image */}
      <section id="hero" className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background Image or Gradient Fallback */}
        {service.hero_image_url ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${service.hero_image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/70 to-brand-dark/40" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue via-brand-blue/90 to-brand-orange/80" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          </>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <div className="animate-fade-in">
              <div className="inline-flex items-center px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full mb-8 border border-white/20">
                <span className="text-3xl mr-3">{service.icon}</span>
                <span className="text-sm font-semibold text-white uppercase tracking-wider">Specialized Treatment</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
                {service.title}
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-10 max-w-2xl">
                {service.long_description || service.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/book-consultation" className="px-8 py-4 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange/90 shadow-xl shadow-brand-orange/30 transition-all text-center text-lg">
                  Book Consultation
                </Link>
                <a href={`tel:${COMPANY_INFO.phone}`} className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white hover:text-brand-dark transition-all text-center text-lg">
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-brand-blue/10 text-brand-blue font-semibold text-sm rounded-full mb-4 uppercase tracking-wider">
              What We Offer
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4">
              Treatment <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">Features</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our comprehensive approach ensures the best possible outcomes for your recovery
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(service.features || []).map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-blue to-brand-orange transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-brand-blue to-brand-orange rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-dark group-hover:text-brand-blue transition-colors">{feature}</h3>
                    <p className="text-sm text-slate-500 mt-1">Professional treatment technique</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions Section */}
      <section id="conditions" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
            {/* Left Side - Header */}
            <div className="lg:col-span-4 mb-12 lg:mb-0 lg:sticky lg:top-24">
              <span className="inline-block px-4 py-2 bg-brand-orange/10 text-brand-orange font-semibold text-sm rounded-full mb-4 uppercase tracking-wider">
                Conditions Treated
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-4">
                Conditions <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">We Treat</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                We specialize in treating a wide range of conditions with proven, evidence-based techniques tailored to your needs.
              </p>
              <Link to="/book-consultation" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all">
                Get Treatment
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            
            {/* Right Side - Conditions Grid */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(service.conditions || []).map((condition, index) => (
                  <div 
                    key={index} 
                    className="group flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white p-5 rounded-xl border border-slate-100 hover:border-brand-blue/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-brand-blue/20 to-brand-orange/20 rounded-lg flex items-center justify-center group-hover:from-brand-blue group-hover:to-brand-orange transition-all duration-300">
                      <span className="text-brand-blue group-hover:text-white text-lg transition-colors">•</span>
                    </div>
                    <h3 className="text-base font-semibold text-brand-dark group-hover:text-brand-blue transition-colors">{condition}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-blue to-brand-orange">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your Recovery?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Book a consultation with our expert physiotherapists and take the first step towards better health.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-consultation" className="px-8 py-4 bg-white text-brand-blue rounded-xl font-bold hover:bg-slate-50 transition-colors duration-300 text-center shadow-lg">
              Book Free Consultation
            </Link>
            <a href={`tel:${COMPANY_INFO.phone}`} className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-brand-blue transition-all duration-300 text-center">
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
