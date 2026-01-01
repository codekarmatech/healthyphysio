/**
 * Site Settings Service
 * Fetches admin-controlled site customization from backend
 * Provides theme colors, branding, content, and layout settings
 */

import api from './api';

// Default fallback settings (used when backend is unavailable)
const DEFAULT_SETTINGS = {
  theme: {
    primary_color: '#2563EB',
    primary_light: '#EFF6FF',
    primary_dark: '#1D4ED8',
    secondary_color: '#F97316',
    secondary_light: '#FFF7ED',
    secondary_dark: '#EA580C',
    text_primary: '#1E293B',
    text_secondary: '#64748B',
    text_muted: '#94A3B8',
    bg_primary: '#FFFFFF',
    bg_secondary: '#F8FAFC',
    bg_dark: '#0F172A',
    success_color: '#10B981',
    warning_color: '#F59E0B',
    error_color: '#EF4444',
    info_color: '#3B82F6',
    font_family_heading: 'Inter, system-ui, sans-serif',
    font_family_body: 'Inter, system-ui, sans-serif',
    border_radius: '0.75rem',
    border_color: '#E2E8F0',
  },
  branding: {
    company_name: 'PhysioWay',
    tagline: 'Your Health, Our Priority',
    description: 'Professional physiotherapy services delivered to your doorstep.',
    phone: '+91 63532 02177',
    email: 'contact@physioway.com',
    working_hours: 'Mon-Sat: 8AM-8PM, Sun: 10AM-6PM',
    tech_partner_name: 'CodingBull Technovations Pvt Ltd',
    tech_partner_url: 'https://www.codingbullz.com',
  },
  hero: {
    badge_text: 'Available 24/7',
    headline: 'Expert Physiotherapy At Your Doorstep',
    subheadline: 'Experience world-class physiotherapy in the comfort of your home. Our certified professionals combine cutting-edge technology with personalized care.',
    primary_cta_text: 'Book Free Consultation',
    primary_cta_link: '/book-consultation',
    secondary_cta_text: 'Explore Services',
    secondary_cta_link: '/services',
    trust_badges: [
      { icon: '🏥', text: 'Licensed Therapists', subtext: 'Govt. Certified' },
      { icon: '👨‍⚕️', text: 'Doctor Oversight', subtext: 'MD Supervised' },
      { icon: '🛡️', text: 'Insurance Accepted', subtext: 'Cashless Claims' },
    ],
    stats: [
      { value: '5000+', label: 'Patients' },
      { value: '98%', label: 'Success Rate' },
      { value: '50+', label: 'Experts' },
    ],
  },
  testimonials: [
    { id: 1, name: 'Priya Sharma', condition: 'Post-Surgery Recovery', location: 'Delhi', text: "PhysioWay's home service made all the difference. I recovered faster than expected!", rating: 5 },
    { id: 2, name: 'Rajesh Kumar', condition: 'Back Pain Relief', location: 'Mumbai', text: 'The personalized treatment plan helped me get back to my normal life. Highly recommended!', rating: 5 },
    { id: 3, name: 'Anita Patel', condition: 'Sports Injury', location: 'Bangalore', text: "PhysioWay's specialized treatment got me back on the field in record time.", rating: 5 },
  ],
  statistics: [
    { icon: '👥', value: '5000+', label: 'Happy Patients' },
    { icon: '⭐', value: '4.9', label: 'Average Rating' },
    { icon: '🏥', value: '50+', label: 'Expert Therapists' },
    { icon: '📍', value: '100+', label: 'Areas Covered' },
  ],
  partners: [
    { name: 'AIIMS' },
    { name: 'Apollo' },
    { name: 'Fortis' },
    { name: 'Max Healthcare' },
    { name: 'Medanta' },
  ],
  navbar: {
    is_sticky: true,
    is_transparent_on_hero: false,
    background_color: '#FFFFFF',
    show_cta_button: true,
    cta_text: 'Book Now',
    cta_link: '/book-consultation',
    show_phone: true,
  },
  footer: {
    show_quick_links: true,
    show_services: true,
    show_contact: true,
    show_social_links: true,
    show_newsletter: false,
    copyright_text: `© ${new Date().getFullYear()} PhysioWay. All rights reserved.`,
    privacy_policy_url: '/privacy',
    terms_url: '/terms',
  },
  seo: {
    site_title: 'PhysioWay - Professional Home Physiotherapy Services',
    site_description: 'Expert physiotherapy at your doorstep. Book a free consultation today.',
    keywords: 'physiotherapy, home physiotherapy, physical therapy, rehabilitation',
  },
};

// Cache for settings
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds (for easy admin changes)

/**
 * Check if cache is valid
 */
const isCacheValid = () => {
  if (!settingsCache || !cacheTimestamp) return false;
  return Date.now() - cacheTimestamp < CACHE_DURATION;
};

/**
 * Fetch all site settings from backend
 * @param {boolean} forceRefresh - Force refresh from backend
 * @returns {Promise<Object>} Site settings object
 */
export const getAllSettings = async (forceRefresh = false) => {
  // Return cached data if valid
  if (!forceRefresh && isCacheValid()) {
    return settingsCache;
  }

  try {
    const response = await api.get('/site-settings/');
    settingsCache = response.data;
    cacheTimestamp = Date.now();
    return settingsCache;
  } catch (error) {
    console.warn('Failed to fetch site settings, using defaults:', error.message);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Fetch theme settings only
 */
export const getThemeSettings = async () => {
  try {
    const response = await api.get('/site-settings/theme/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch theme settings:', error.message);
    return DEFAULT_SETTINGS.theme;
  }
};

/**
 * Fetch branding settings only
 */
export const getBrandingSettings = async () => {
  try {
    const response = await api.get('/site-settings/branding/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch branding settings:', error.message);
    return DEFAULT_SETTINGS.branding;
  }
};

/**
 * Fetch hero section settings
 */
export const getHeroSettings = async () => {
  try {
    const response = await api.get('/site-settings/hero/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch hero settings:', error.message);
    return DEFAULT_SETTINGS.hero;
  }
};

/**
 * Fetch testimonials
 */
export const getTestimonials = async () => {
  try {
    const response = await api.get('/site-settings/testimonials/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch testimonials:', error.message);
    return DEFAULT_SETTINGS.testimonials;
  }
};

/**
 * Fetch statistics
 */
export const getStatistics = async () => {
  try {
    const response = await api.get('/site-settings/statistics/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch statistics:', error.message);
    return DEFAULT_SETTINGS.statistics;
  }
};

/**
 * Fetch trusted partners
 */
export const getPartners = async () => {
  try {
    const response = await api.get('/site-settings/partners/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch partners:', error.message);
    return DEFAULT_SETTINGS.partners;
  }
};

/**
 * Fetch navbar settings
 */
export const getNavbarSettings = async () => {
  try {
    const response = await api.get('/site-settings/navbar/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch navbar settings:', error.message);
    return DEFAULT_SETTINGS.navbar;
  }
};

/**
 * Fetch footer settings
 */
export const getFooterSettings = async () => {
  try {
    const response = await api.get('/site-settings/footer/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch footer settings:', error.message);
    return DEFAULT_SETTINGS.footer;
  }
};

/**
 * Fetch SEO settings
 */
export const getSeoSettings = async () => {
  try {
    const response = await api.get('/site-settings/seo/');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch SEO settings:', error.message);
    return DEFAULT_SETTINGS.seo;
  }
};

/**
 * Fetch page-specific content
 * @param {string} pageName - Page identifier (landing, about, services, contact)
 */
export const getPageContent = async (pageName) => {
  try {
    const response = await api.get(`/site-settings/page/${pageName}/`);
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch ${pageName} page content:`, error.message);
    return [];
  }
};

/**
 * Apply theme colors as CSS variables to document root
 * @param {Object} theme - Theme settings object
 */
export const applyThemeColors = (theme) => {
  if (!theme) return;

  const root = document.documentElement;

  // Primary colors
  root.style.setProperty('--color-primary', theme.primary_color);
  root.style.setProperty('--color-primary-light', theme.primary_light);
  root.style.setProperty('--color-primary-dark', theme.primary_dark);

  // Secondary colors
  root.style.setProperty('--color-secondary', theme.secondary_color);
  root.style.setProperty('--color-secondary-light', theme.secondary_light);
  root.style.setProperty('--color-secondary-dark', theme.secondary_dark);

  // Text colors
  root.style.setProperty('--color-text-primary', theme.text_primary);
  root.style.setProperty('--color-text-secondary', theme.text_secondary);
  root.style.setProperty('--color-text-muted', theme.text_muted);

  // Background colors
  root.style.setProperty('--color-bg-primary', theme.bg_primary);
  root.style.setProperty('--color-bg-secondary', theme.bg_secondary);
  root.style.setProperty('--color-bg-dark', theme.bg_dark);

  // Status colors
  root.style.setProperty('--color-success', theme.success_color);
  root.style.setProperty('--color-warning', theme.warning_color);
  root.style.setProperty('--color-error', theme.error_color);
  root.style.setProperty('--color-info', theme.info_color);

  // Typography
  root.style.setProperty('--font-heading', theme.font_family_heading);
  root.style.setProperty('--font-body', theme.font_family_body);

  // Borders
  root.style.setProperty('--border-radius', theme.border_radius);
  root.style.setProperty('--border-color', theme.border_color);
};

/**
 * Clear settings cache
 */
export const clearCache = () => {
  settingsCache = null;
  cacheTimestamp = null;
};

// Export default settings for reference
export { DEFAULT_SETTINGS };

const siteSettingsService = {
  getAllSettings,
  getThemeSettings,
  getBrandingSettings,
  getHeroSettings,
  getTestimonials,
  getStatistics,
  getPartners,
  getNavbarSettings,
  getFooterSettings,
  getSeoSettings,
  getPageContent,
  applyThemeColors,
  clearCache,
  DEFAULT_SETTINGS,
};

export default siteSettingsService;
