import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import SignupModal from '../components/ui/SignupModal';
import { COMPANY_INFO, STATS, SERVICES, WHY_CHOOSE_US } from '../constants';
import { getAllSettings, applyThemeColors, DEFAULT_SETTINGS } from '../services/siteSettingsService';

/**
 * 2025 DESIGN SYSTEM - Premium Healthcare Theme
 * Colors and content are managed via siteSettingsService for admin control
 * Theme: Soft blue (#2563EB) and warm orange (#F97316) with light backgrounds
 */

// Custom hook for scroll-triggered animations
const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return [ref, isVisible];
};

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollAnimation();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      const startTime = Date.now();
      const endValue = parseInt(end.replace(/\D/g, '')) || 0;
      
      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(endValue * easeOut));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isVisible, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Trust Badge Component - 2025 trend: Trust seals near hero
const TrustBadge = ({ icon, text, subtext }) => (
  <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl group-hover:bg-blue-100 transition-colors">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-slate-800 text-sm">{text}</p>
      {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
    </div>
  </div>
);

// Mini Testimonial Card - 2025 trend: Social proof near CTAs
const MiniTestimonial = ({ name, text, rating }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-slate-100 max-w-xs">
    <div className="flex gap-0.5 mb-2">
      {[...Array(rating)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
    </div>
    <p className="text-slate-600 text-sm mb-2 line-clamp-2">"{text}"</p>
    <p className="text-xs font-semibold text-slate-800">— {name}</p>
  </div>
);

// Floating Action Button for Mobile - 2025 trend: Sticky CTAs
const FloatingMobileCTA = ({ show }) => (
  <div className={`fixed bottom-20 right-4 z-40 md:hidden transition-all duration-500 ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
    <Link 
      to="/book-consultation"
      className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl shadow-blue-600/30 font-semibold text-sm hover:bg-blue-700 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Book Now
    </Link>
  </div>
);

// Premium Footer with Technology Partner - accepts settings from backend
const PremiumFooter = ({ branding, footer }) => {
  const currentYear = new Date().getFullYear();
  
  // Use backend settings or fallback to defaults
  const companyName = branding?.company_name || COMPANY_INFO.name || 'PhysioWay';
  const tagline = branding?.tagline || 'Your Health, Our Priority';
  const description = branding?.description || 'Professional physiotherapy services delivered to your doorstep.';
  const phone = branding?.phone || COMPANY_INFO.phone;
  const email = branding?.email || COMPANY_INFO.email;
  const workingHours = branding?.working_hours || 'Mon-Sat 8AM-8PM';
  const techPartnerName = branding?.tech_partner_name || 'CodingBull Technovations Pvt Ltd';
  const techPartnerUrl = branding?.tech_partner_url || 'https://www.codingbullz.com';
  const copyrightText = footer?.copyright_text || `© ${currentYear} ${companyName}. All rights reserved.`;
  const privacyUrl = footer?.privacy_policy_url || '/privacy';
  const termsUrl = footer?.terms_url || '/terms';
  
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center mb-6">
              {branding?.logo_dark_url ? (
                <img src={branding.logo_dark_url} alt={companyName} className="h-10 mr-3" />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">{companyName.charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{companyName}</h3>
                <p className="text-xs text-slate-400">{tagline}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {footer?.show_quick_links !== false && (
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {['Home', 'About Us', 'Services', 'Blog', 'Contact'].map((link) => (
                  <li key={link}>
                    <Link to={`/${link.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-white text-sm">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {footer?.show_services !== false && (
            <div>
              <h4 className="text-lg font-semibold mb-6">Services</h4>
              <ul className="space-y-3">
                {['Orthopedic Rehab', 'Sports Injury', 'Post-Surgery Care', 'Neurological Therapy'].map((s) => (
                  <li key={s}>
                    <Link to="/services" className="text-slate-400 hover:text-white text-sm">{s}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {footer?.show_contact !== false && (
            <div>
              <h4 className="text-lg font-semibold mb-6">Contact</h4>
              <div className="space-y-3 text-slate-400 text-sm">
                <p>Phone: <a href={`tel:${phone}`} className="text-white hover:text-blue-400">{phone}</a></p>
                <p>Email: <a href={`mailto:${email}`} className="text-white hover:text-blue-400">{email}</a></p>
                <p>Hours: {workingHours}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technology Partner */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              {branding?.tech_partner_logo_url ? (
                <img src={branding.tech_partner_logo_url} alt={techPartnerName} className="h-12 w-auto mr-3" />
              ) : (
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">CB</span>
                </div>
              )}
              <span className="text-slate-400 text-sm">Technology Partner</span>
            </div>
            <a 
              href={techPartnerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center bg-slate-800 hover:bg-slate-700 rounded-lg px-4 py-2 transition-colors"
            >
              <span className="text-orange-400 font-semibold">{techPartnerName}</span>
              <div className="w-6 h-6 bg-orange-500 rounded ml-2 flex items-center justify-center">
                <span className="text-white text-xs font-bold">CB</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-slate-500 text-sm">
            <p>{copyrightText.replace('{year}', currentYear.toString())}</p>
            <div className="flex gap-4">
              <Link to={privacyUrl} className="hover:text-white">Privacy</Link>
              <Link to={termsUrl} className="hover:text-white">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Landing = () => {
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  // Fetch site settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getAllSettings();
        setSiteSettings(settings);
        // Apply theme colors as CSS variables
        if (settings.theme) {
          applyThemeColors(settings.theme);
        }
        // Update page title from SEO settings
        if (settings.seo?.site_title) {
          document.title = settings.seo.site_title;
        }
      } catch (error) {
        console.warn('Using default settings:', error);
        setSiteSettings(DEFAULT_SETTINGS);
      }
    };
    fetchSettings();
  }, []);

  const handleScroll = useCallback(() => {
    setShowFloatingCTA(window.scrollY > 600);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const [heroRef, heroVisible] = useScrollAnimation();
  const [statsRef, statsVisible] = useScrollAnimation();
  const [servicesRef, servicesVisible] = useScrollAnimation();
  const [processRef, processVisible] = useScrollAnimation();
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation();
  const [whyUsRef, whyUsVisible] = useScrollAnimation();
  const [ctaRef, ctaVisible] = useScrollAnimation();

  // Use settings from backend or fallback to defaults
  const branding = siteSettings?.branding || DEFAULT_SETTINGS.branding;
  const hero = siteSettings?.hero || DEFAULT_SETTINGS.hero;
  const testimonialsList = siteSettings?.testimonials?.length > 0 
    ? siteSettings.testimonials 
    : DEFAULT_SETTINGS.testimonials;
  const statisticsList = siteSettings?.statistics?.length > 0 
    ? siteSettings.statistics 
    : DEFAULT_SETTINGS.statistics;
  const footer = siteSettings?.footer || DEFAULT_SETTINGS.footer;

  // Process steps from backend or defaults
  const defaultProcessSteps = [
    { step_number: 1, title: 'Book Consultation', description: 'Schedule online or call us', icon: '📅' },
    { step_number: 2, title: 'Assessment', description: 'Expert evaluates at home', icon: '🔍' },
    { step_number: 3, title: 'Treatment Plan', description: 'Personalized by doctors', icon: '📋' },
    { step_number: 4, title: 'Home Sessions', description: 'At your convenience', icon: '🏠' },
    { step_number: 5, title: 'Track Progress', description: 'Digital monitoring', icon: '📈' },
  ];
  const processSteps = siteSettings?.process_steps?.length > 0 
    ? siteSettings.process_steps 
    : defaultProcessSteps;

  // Services from backend or defaults
  const servicesList = siteSettings?.services?.length > 0 
    ? siteSettings.services 
    : SERVICES.main;

  // Why Choose Us from backend or defaults
  const whyChooseUsList = siteSettings?.why_choose_us?.length > 0 
    ? siteSettings.why_choose_us 
    : WHY_CHOOSE_US;

  // CTA section from backend
  const ctaSection = siteSettings?.cta || {
    headline: 'Ready to Begin Your Healing Journey?',
    subheadline: 'Join thousands who transformed their lives with PhysioWay.',
    primary_button_text: 'Book Free Consultation',
    primary_button_link: '/book-consultation',
    show_phone_button: true
  };

  // Section settings from backend
  const processSection = siteSettings?.process_section || { badge_text: 'Simple Process', title: 'How PhysioWay Works', is_visible: true };
  const servicesSection = siteSettings?.services_section || { badge_text: 'Our Expertise', title: 'Comprehensive Services', is_visible: true };
  const testimonialsSection = siteSettings?.testimonials_section || { badge_text: '4.9/5 Rating', title: 'What Our Patients Say', is_visible: true };
  const whyChooseUsSection = siteSettings?.why_choose_us_section || { title: 'The PhysioWay Difference', is_visible: true };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Floating Mobile CTA - 2025 trend */}
      <FloatingMobileCTA show={showFloatingCTA} />

      {/* Floating Desktop CTA Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 hidden sm:block ${showFloatingCTA ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
                <span className="flex gap-0.5">{[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400">★</span>)}</span>
                <span className="font-medium">4.9/5 from 2,000+ reviews</span>
              </div>
              <p className="text-slate-700 font-medium">
                <span className="text-blue-600 font-bold">Free Consultation</span> — Start your recovery journey today!
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/book-consultation" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                Book Now
              </Link>
              <a href={`tel:${branding.phone || COMPANY_INFO.phone}`} className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us
              </a>
              <a 
                href={`https://wa.me/${(branding.phone || COMPANY_INFO.phone).replace(/[\s-()]/g, '').replace('+', '')}?text=${encodeURIComponent('Hello! I would like to inquire about physiotherapy services.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ===== HERO SECTION - 2025 Premium Design ===== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 lg:pt-24 overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30"></div>
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-3xl -z-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Left Content - Content First Layout */}
            <div className={`space-y-8 ${heroVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Trust Badges Row - 2025 trend: Trust seals in hero */}
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  <span className="text-sm font-medium text-green-700">{hero.badge_text || 'Available 24/7'}</span>
                </div>
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                  <span className="text-sm font-medium text-blue-700">✓ HIPAA Compliant</span>
                </div>
              </div>

              {/* Main Heading - Clear Typography Hierarchy */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                  {hero.headline ? (
                    hero.headline.split(' ').map((word, i) => {
                      if (word.toLowerCase() === 'physiotherapy') {
                        return <span key={i} className="block text-blue-600">{word}</span>;
                      }
                      return <span key={i}>{word} </span>;
                    })
                  ) : (
                    <>
                      Expert
                      <span className="block text-blue-600">Physiotherapy</span>
                      <span className="block">At Your Doorstep</span>
                    </>
                  )}
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 max-w-xl leading-relaxed">
                  {hero.subheadline || 'Experience world-class physiotherapy in the comfort of your home. Our certified professionals combine cutting-edge technology with personalized care.'}
                </p>
              </div>

              {/* Trust Indicators with Icons - from backend or defaults */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(hero.trust_badges && hero.trust_badges.length > 0) ? (
                  hero.trust_badges.map((badge, i) => (
                    <TrustBadge key={i} icon={badge.icon} text={badge.text} subtext={badge.subtext} />
                  ))
                ) : (
                  <>
                    <TrustBadge icon="🏥" text="Licensed Therapists" subtext="Govt. Certified" />
                    <TrustBadge icon="👨‍⚕️" text="Doctor Oversight" subtext="MD Supervised" />
                    <TrustBadge icon="🛡️" text="Insurance Accepted" subtext="Cashless Claims" />
                  </>
                )}
              </div>

              {/* CTA Buttons with Social Proof */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to={hero.primary_cta_link || '/book-consultation'} 
                    className="group px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 transition-all duration-300 text-center flex items-center justify-center gap-2"
                  >
                    {hero.primary_cta_text || 'Book Free Consultation'}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link 
                    to={hero.secondary_cta_link || '/services'} 
                    className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-semibold text-lg rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 text-center"
                  >
                    {hero.secondary_cta_text || 'Explore Services'}
                  </Link>
                </div>
                
                {/* Social Proof near CTA - 2025 trend */}
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex -space-x-2">
                    {['👩', '👨', '👩‍🦱', '👨‍🦳'].map((emoji, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-sm">
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <span><strong className="text-slate-700">5,000+</strong> patients treated this year</span>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-800">Need urgent help? Call us now</p>
                  <a href={`tel:${branding.phone || COMPANY_INFO.phone}`} className="text-xl font-bold text-orange-600 hover:text-orange-700 transition-colors">
                    {branding.phone || COMPANY_INFO.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Visual */}
            <div className={`relative ${heroVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              <div className="relative">
                {/* Main Image Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                  <div className="aspect-[4/3] relative">
                    <img 
                      src={hero.hero_image_url || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
                      alt={hero.hero_image_alt || "Professional Physiotherapy Treatment"}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent"></div>
                    
                    {/* Availability Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                      <span className="text-sm font-bold text-green-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Available Now
                      </span>
                    </div>
                  </div>
                  
                  {/* Stats Bar - Using hero stats from backend */}
                  <div className="p-6 bg-blue-600">
                    <div className="grid grid-cols-3 gap-4 text-center text-white">
                      {(hero.stats || []).slice(0, 3).map((stat, i) => (
                        <div key={i}>
                          <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                          <div className="text-sm text-blue-100">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Mini Testimonial - 2025 trend: Social proof near visuals */}
                <div className="absolute -left-4 lg:-left-8 bottom-32 hidden lg:block">
                  <MiniTestimonial 
                    name="Priya S."
                    text="Recovered faster than expected! Amazing home service."
                    rating={5}
                  />
                </div>

                {/* Floating Badge */}
                <div className="absolute -right-4 lg:-right-6 top-1/3 bg-white rounded-2xl shadow-xl p-4 border border-slate-100 hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Verified</p>
                      <p className="text-sm text-slate-500">Professionals</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center text-slate-400 animate-bounce">
            <span className="text-sm mb-2">Scroll to explore</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section ref={statsRef} className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {(statisticsList.length > 0 ? statisticsList : STATS).map((stat, i) => (
              <div key={i} className={`text-center ${statsVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${i * 100}ms` }}>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-4xl lg:text-5xl mb-3">{stat.icon}</div>
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                    <AnimatedCounter end={stat.value || stat.number} suffix={(stat.value || stat.number).includes('+') ? '+' : (stat.value || stat.number).includes('%') ? '%' : ''} />
                  </div>
                  <div className="text-blue-100 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      {processSection.is_visible !== false && (
        <section ref={processRef} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 ${processVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">{processSection.badge_text}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How <span className="text-blue-600">PhysioWay</span> Works</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {processSteps.map((step, i) => (
                <div key={i} className={`relative ${processVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{step.step_number || step.step}</div>
                    <div className="text-3xl mb-3 mt-2">{step.icon}</div>
                    <h3 className="font-bold text-slate-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      {servicesSection.is_visible !== false && (
        <section ref={servicesRef} className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 ${servicesVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <span className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">{servicesSection.badge_text}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{servicesSection.title?.split(' ')[0] || 'Comprehensive'} <span className="text-blue-600">{servicesSection.title?.split(' ').slice(1).join(' ') || 'Services'}</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesList.slice(0, 6).map((service, i) => (
                <div key={service.id || i} className={`bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow ${servicesVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-4">{service.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(service.features) ? service.features : []).slice(0, 3).map((f, j) => (
                      <span key={j} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {servicesSection.show_view_all_button !== false && (
              <div className="text-center mt-10">
                <Link to={servicesSection.view_all_button_link || '/services'} className="inline-flex items-center px-6 py-3 bg-white border-2 border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50">
                  {servicesSection.view_all_button_text || 'View All Services →'}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonialsSection.is_visible !== false && (
        <section ref={testimonialsRef} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 ${testimonialsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold mb-4">{testimonialsSection.badge_text}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">{testimonialsSection.title?.split(' ').slice(0, 2).join(' ') || 'What Our'} <span className="text-blue-600">{testimonialsSection.title?.split(' ').slice(2).join(' ') || 'Patients Say'}</span></h2>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonialsList.map((t, i) => (
              <div key={t.id || i} className={`bg-white rounded-2xl p-6 shadow-lg border border-slate-100 ${testimonialsVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${i * 150}ms` }}>
                <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_, j) => <span key={j} className="text-yellow-400">★</span>)}</div>
                <p className="text-slate-700 mb-4">"{t.text}"</p>
                <div className="flex items-center">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">{t.name.charAt(0)}</div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.condition} • {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* WHY CHOOSE US - Enhanced with AI Integration */}
      {whyChooseUsSection.is_visible !== false && (
        <section ref={whyUsRef} className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <div className={`text-center mb-16 ${whyUsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <span className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-sm font-semibold text-blue-300 mb-6">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                Why Choose Us
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                The <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">PhysioWay</span> Difference
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Experience healthcare reimagined with cutting-edge technology, expert care, and personalized treatment plans
              </p>
            </div>

            {/* Main Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {whyChooseUsList.slice(0, 8).map((item, i) => (
                <div 
                  key={item.id || i} 
                  className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-orange-400/50 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/10 ${whyUsVisible ? 'animate-fade-in-up' : 'opacity-0'}`} 
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-blue-500/0 group-hover:from-orange-500/5 group-hover:to-blue-500/5 rounded-2xl transition-all duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-orange-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-orange-300 transition-colors duration-300">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Integration Feature - Coming Soon */}
            <div className={`mt-16 ${whyUsVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '800ms' }}>
              <div className="relative bg-gradient-to-r from-purple-900/50 via-blue-900/50 to-purple-900/50 rounded-3xl p-8 lg:p-12 border border-purple-400/20 overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
                
                {/* Floating particles animation */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-50"></div>
                <div className="absolute bottom-8 left-8 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                  {/* AI Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
                        <svg className="w-12 h-12 lg:w-16 lg:h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {/* Orbiting dots */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 animate-bounce">AI</div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/40 rounded-full text-xs font-bold text-purple-300 uppercase tracking-wider animate-pulse">
                        Coming Soon
                      </span>
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/40 rounded-full text-xs font-semibold text-cyan-300">
                        Under Development
                      </span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold mb-3">
                      <span className="bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                        AI-Powered Exercise Guidance
                      </span>
                    </h3>
                    <p className="text-slate-300 text-lg mb-4 max-w-2xl">
                      We're integrating advanced <strong className="text-purple-300">Artificial Intelligence</strong> to revolutionize your physiotherapy experience. 
                      Get real-time exercise corrections, personalized workout plans, and precision tracking for faster recovery.
                    </p>
                    <ul className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                      <li className="flex items-center gap-2 text-slate-300">
                        <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Real-time Posture Analysis
                      </li>
                      <li className="flex items-center gap-2 text-slate-300">
                        <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Smart Exercise Recommendations
                      </li>
                      <li className="flex items-center gap-2 text-slate-300">
                        <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Precision Movement Tracking
                      </li>
                      <li className="flex items-center gap-2 text-slate-300">
                        <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Progress Analytics
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section ref={ctaRef} className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className={`${ctaVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {ctaSection.headline?.split(' ').slice(0, 4).join(' ') || 'Ready to Begin Your'} <span className="text-blue-600">{ctaSection.headline?.split(' ').slice(4).join(' ') || 'Healing Journey?'}</span>
            </h2>
            <p className="text-slate-600 mb-8">{ctaSection.subheadline}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ctaSection.primary_button_link || '/book-consultation'} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">
                {ctaSection.primary_button_text || 'Book Free Consultation'}
              </Link>
              {ctaSection.show_phone_button !== false && (
                <a href={`tel:${branding.phone || COMPANY_INFO.phone}`} className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-blue-300">
                  📞 {branding.phone || COMPANY_INFO.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <PremiumFooter branding={branding} footer={footer} />
      <SignupModal />
    </div>
  );
};

export default Landing;
