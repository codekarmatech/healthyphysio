import React, { useState, useEffect } from 'react';
import { getBrandingSettings } from '../../services/siteSettingsService';
import { COMPANY_INFO } from '../../constants';

/**
 * Floating WhatsApp button that stays fixed at bottom right
 * Always visible even during scroll
 */
const WhatsAppButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [phone, setPhone] = useState(COMPANY_INFO.phone);

  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const branding = await getBrandingSettings();
        if (branding?.phone) {
          setPhone(branding.phone);
        }
      } catch (error) {
        console.warn('Failed to fetch branding settings for WhatsApp:', error);
      }
    };
    fetchPhone();
  }, []);

  // Format phone for WhatsApp link (remove spaces and special chars except +)
  const formatPhoneForWhatsApp = (phoneNumber) => {
    return phoneNumber.replace(/[\s-()]/g, '');
  };

  const whatsappLink = `https://wa.me/${formatPhoneForWhatsApp(phone).replace('+', '')}?text=${encodeURIComponent('Hello! I would like to inquire about physiotherapy services.')}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Chat on WhatsApp"
    >
      {/* Tooltip */}
      <div
        className={`absolute right-16 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-100 whitespace-nowrap transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
        }`}
      >
        <p className="text-sm font-medium text-gray-800">Chat with us!</p>
        <p className="text-xs text-gray-500">{phone}</p>
        {/* Arrow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
          <div className="border-8 border-transparent border-l-white"></div>
        </div>
      </div>

      {/* WhatsApp Button */}
      <div
        className={`relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg hover:shadow-2xl transition-all duration-300 ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}
      >
        {/* Pulse animation ring */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25"></div>
        
        {/* WhatsApp Icon */}
        <svg
          className="w-7 h-7 text-white relative z-10"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>
    </a>
  );
};

export default WhatsAppButton;
