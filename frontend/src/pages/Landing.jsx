import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import FloatingActions from '../components/layout/FloatingActions';
import SignupModal from '../components/ui/SignupModal';
import { SERVICES, WHY_CHOOSE_US } from '../constants';
import { getAllSettings, applyThemeColors, DEFAULT_SETTINGS } from '../services/siteSettingsService';

/* --- Components --- */

// Trust Badge (Hero)
const TrustBadge = ({ icon, text, subtext }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 shadow-lg"
  >
    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-2xl">
      {icon}
    </div>
    <div>
      <p className="font-heading font-semibold text-brand-dark text-sm">{text}</p>
      {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
    </div>
  </motion.div>
);

// Service Card (Glassmorphism)
const ServiceCard = ({ service, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -10, boxShadow: '0 20px 40px -20px rgba(30, 64, 175, 0.15)' }}
    className="group relative glass-card glass-card-hover rounded-[2rem] p-8 overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-blue/10 to-brand-orange/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150"></div>

    <div className="relative z-10">
      <div className="w-14 h-14 bg-gradient-to-br from-brand-blue to-brand-blue/80 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-brand-blue/20 mb-6 group-hover:rotate-6 transition-transform duration-300 transform-gpu">
        {service.icon}
      </div>

      <h3 className="font-heading font-bold text-xl text-brand-dark mb-3 group-hover:text-brand-blue transition-colors">
        {service.title}
      </h3>

      <p className="text-slate-600 leading-relaxed mb-6 text-sm">
        {service.description}
      </p>

      <Link
        to="/services"
        className="inline-flex items-center text-sm font-semibold text-brand-blue group-hover:translate-x-2 transition-transform duration-300"
      >
        Learn details
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  </motion.div>
);

// Process Step
const ProcessStep = ({ step, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="relative flex flex-col items-center text-center"
  >
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-xl shadow-brand-blue/5 border-4 border-pastel-blue z-10 mb-4">
      {step.icon}
    </div>
    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/50 hover:bg-white/80 transition-colors w-full">
      <h3 className="font-heading font-bold text-lg text-brand-dark mb-2">{step.title}</h3>
      <p className="text-sm text-slate-500">{step.description}</p>
    </div>

    {/* Connector Line (Desktop) */}
    {index < 4 && (
      <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-pastel-blue to-transparent -z-0 transform translate-x-8"></div>
    )}
  </motion.div>
);

const Landing = () => {
  const [siteSettings, setSiteSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getAllSettings();
        console.log('Fetched Settings:', settings); // Debug for user/dev
        setSiteSettings(settings);
        if (settings?.theme) applyThemeColors(settings.theme);
        if (settings?.seo?.site_title) document.title = settings.seo.site_title;
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Extract heroImages early for carousel effect (must be before any returns)
  const heroImages = siteSettings?.hero_images || [];

  // Hero image carousel - auto-rotate every 5 seconds (must be called before any returns)
  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }, 5000); // 5 seconds
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pastel-gray">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-brand-dark font-medium animate-pulse">Loading Experience...</p>
        </div>
      </div>
    );
  }

  // Use fetched settings or fallbacks safely
  const branding = siteSettings?.branding || DEFAULT_SETTINGS.branding;
  const hero = siteSettings?.hero || DEFAULT_SETTINGS.hero;
  const servicesList = siteSettings?.services?.length > 0 ? siteSettings.services : SERVICES.main;
  const whyChooseUsList = siteSettings?.why_choose_us?.length > 0 ? siteSettings.why_choose_us : WHY_CHOOSE_US;
  const testimonialsList = siteSettings?.testimonials?.length > 0 ? siteSettings.testimonials : DEFAULT_SETTINGS.testimonials;
  const statisticsList = siteSettings?.statistics?.length > 0 ? siteSettings.statistics : DEFAULT_SETTINGS.statistics;
  const partnersList = siteSettings?.partners || [];
  const ctaData = siteSettings?.cta || {};

  const defaultProcessSteps = [
    { title: 'Book Online', description: 'Schedule instantly', icon: '📅' },
    { title: 'Home Visit', description: 'Expert arrives', icon: '🚗' },
    { title: 'Assessment', description: 'Thorough checkup', icon: '🩺' },
    { title: 'Therapy', description: 'Personalized care', icon: '💪' },
    { title: 'Recovery', description: 'Get back to life', icon: '🌟' },
  ];
  const processSteps = siteSettings?.process_steps?.length > 0 ? siteSettings.process_steps : defaultProcessSteps;

  // Get current hero image (carousel or fallback)
  const primaryHeroImage = heroImages.length > 0
    ? heroImages[currentImageIndex]?.image_url || heroImages[0]?.image_url
    : (hero.hero_image_url || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80");

  return (
    <div className="min-h-screen bg-pastel-gray font-sans selection:bg-brand-orange/20 selection:text-brand-dark overflow-x-hidden">
      <Navbar />
      <FloatingActions />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen lg:min-h-[90vh] flex items-center pt-28 pb-20 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div style={{ y: y1 }} className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-pastel-blue to-pastel-purple rounded-full blur-3xl opacity-60 mix-blend-multiply" />
          <motion.div style={{ y: y2 }} className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-pastel-orange to-pastel-cream rounded-full blur-3xl opacity-60 mix-blend-multiply" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-brand-blue/10 rounded-full mx-auto lg:mx-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-orange"></span>
                </span>
                <span className="text-sm font-semibold text-brand-dark tracking-wide uppercase">#1 Rated Physiotherapy</span>
              </div>

              <h1 className="font-heading text-5xl lg:text-7xl font-bold text-brand-dark leading-[1.1] tracking-tight">
                {hero.headline || (
                  <>
                    Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">Healing</span> is Here
                  </>
                )}
              </h1>

              <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                {hero.subheadline || 'Experience next-gen physiotherapy at home. Advanced techniques, expert care, and rapid recovery protocols designed just for you.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Link to="/book-consultation" className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-blue/20 hover:shadow-2xl hover:bg-brand-blue/90 transition-all transform hover:-translate-y-1">
                  Book Appointment
                </Link>
                <Link to="/services" className="px-8 py-4 bg-white/80 backdrop-blur-md text-brand-dark border border-white rounded-2xl font-bold text-lg hover:bg-white transition-all transform hover:-translate-y-1">
                  Explore Services
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-8 border-t border-slate-200/50">
                <TrustBadge icon="🏥" text="Certified" subtext="Experts" />
                <TrustBadge icon="⚡" text="Fast" subtext="Recovery" />
                <TrustBadge icon="🛡️" text="Safe" subtext="At Home" />
              </div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mx-auto w-full max-w-lg lg:max-w-none"
            >
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-brand-blue/20 border-8 border-white/50 bg-white aspect-[4/5] lg:aspect-[3/4]">
                <motion.img
                  key={currentImageIndex}
                  src={primaryHeroImage}
                  alt={heroImages[currentImageIndex]?.alt_text || hero.hero_image_alt || "Physiotherapy"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent"></div>

                {/* Carousel Indicators */}
                {heroImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {heroImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <p className="text-5xl font-bold font-heading">{statisticsList[0]?.value || '5000+'}</p>
                      <p className="text-pastel-blue text-lg font-medium">{statisticsList[0]?.label || 'Happy Patients'}</p>
                    </div>
                    <div className="hidden sm:flex -space-x-4">
                      {[
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64",
                        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64",
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64"
                      ].map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`Patient ${i + 1}`}
                          className="w-12 h-12 rounded-full border-2 border-brand-dark object-cover"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element 1 */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute top-10 -left-6 lg:-left-12 z-20 bg-white/90 backdrop-blur-xl p-4 lg:p-6 rounded-3xl shadow-xl border border-white/50 max-w-[220px]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
                  <span className="text-sm font-bold text-slate-800">Verified Pro</span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Top-rated therapists assigned for your care.</p>
              </motion.div>

              {/* Floating Element 2 */}
              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 -right-6 lg:-right-10 z-20 bg-white/90 backdrop-blur-xl p-4 lg:p-6 rounded-3xl shadow-xl border border-white/50 max-w-[200px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-bold text-slate-800">Available Now</span>
                </div>
                <p className="text-xs text-slate-500">Book a session in &lt; 2 minutes.</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- PROCESS SECTION (How It Works) --- */}
      <section className="section-padding relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-brand-blue font-bold tracking-wider uppercase text-sm mb-2 block">Workflow</span>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-brand-dark mb-6">Simple <span className="text-gradient">Healing Process</span></h2>
            <p className="text-slate-600 text-lg">Your journey to recovery is just a few steps away. We've made it effortless and patient-centric.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 bg-white/40 backdrop-blur-md rounded-[3rem] p-10 border border-white/50 shadow-xl">
            {processSteps.map((step, i) => (
              <ProcessStep key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-white/30 skew-y-3 origin-top-left scale-110 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b border-brand-dark/5 pb-8">
            <div>
              <span className="text-brand-blue font-bold tracking-wider uppercase text-sm">Our Expertise</span>
              <h2 className="font-heading text-4xl lg:text-5xl font-bold text-brand-dark mt-2">Comprehensive <span className="text-gradient">Care</span></h2>
            </div>
            <Link to="/services" className="px-8 py-4 bg-brand-dark text-white font-semibold rounded-2xl hover:bg-brand-blue transition-all shadow-lg hover:shadow-brand-blue/30 group">
              View All Services
              <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {servicesList.slice(0, 6).map((service, i) => (
              <ServiceCard key={i} service={service} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* --- WHY CHOOSE US --- */}
      <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold mb-4">Why Choose <span className="text-brand-orange">PhysioWay</span>?</h2>
            <p className="text-slate-300">We combine technology with empathy to deliver superior healthcare.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUsList.slice(0, 4).map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-brand-orange/50 transition-colors overflow-hidden"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-brand-dark">What Our Patients Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonialsList.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-xl shadow-brand-dark/5 border border-slate-100 relative group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="absolute top-6 right-8 text-6xl text-brand-blue/10 font-serif">"</div>
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(star => <span key={star} className="text-yellow-400">★</span>)}
                </div>
                <p className="text-slate-600 mb-6 italic relative z-10">{t.text}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-orange rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-brand-dark">{t.name}</p>
                    <p className="text-xs text-brand-blue font-semibold">{t.condition || 'Patient'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-r from-brand-blue to-brand-dark rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="font-heading text-4xl lg:text-5xl font-bold mb-6">{ctaData.headline || 'Ready to start your recovery?'}</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">{ctaData.subheadline || 'Join thousands of satisfied patients who have reclaimed their active lives with PhysioWay.'}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={ctaData.primary_button_link || "/book-consultation"} className="px-8 py-4 bg-white text-brand-blue font-bold rounded-2xl shadow-lg hover:bg-slate-50 transition-colors">
                  {ctaData.primary_button_text || 'Book Free Consultation'}
                </Link>
                {(ctaData.show_phone_button !== false) && (
                  <a href={`tel:${branding.phone}`} className="px-8 py-4 bg-brand-orange text-white font-bold rounded-2xl shadow-lg hover:bg-brand-orange/90 transition-colors">
                    Call Us Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TRUSTED PARTNERS SECTION --- */}
      {partnersList.length > 0 && (
        <section className="py-12 bg-white/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-slate-500 text-sm font-medium mb-8 uppercase tracking-wider">Trusted By Leading Healthcare Providers</p>
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
              {partnersList.map((partner, i) => (
                <div key={i} className="grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100">
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="h-10 object-contain" />
                  ) : (
                    <span className="text-slate-600 font-semibold text-lg">{partner.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- FAQ SECTION --- */}
      <section className="section-padding relative bg-white/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-blue font-bold tracking-wider uppercase text-sm">Common Questions</span>
            <h2 className="font-heading text-4xl font-bold text-brand-dark mt-2">Frequently Asked <span className="italic font-serif text-brand-orange">Questions</span></h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "Do I need a doctor's referral?", a: "While a referral is helpful, it is not strictly required. Our experts can perform an initial assessment." },
              { q: "How long is each session?", a: "Standard sessions typically last between 45 to 60 minutes, depending on the treatment required." },
              { q: "Is home physiotherapy as effective as a clinic?", a: "Yes! In fact, many patients recover faster in the comfort of their own home." },
              { q: "Do you accept insurance?", a: "We work with major insurance providers. Please contact us for verification." }
            ].map((faq, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl hover:border-brand-blue/30 transition-colors">
                <h3 className="font-heading font-bold text-xl text-brand-dark mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer branding={branding} services={servicesList} />
      <SignupModal />
    </div >
  );
};

export default Landing;
