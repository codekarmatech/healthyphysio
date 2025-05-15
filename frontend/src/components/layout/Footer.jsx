
/**
 * Footer component to be used across all pages
 *
 * This component displays the technology partner information,
 * contact details, and copyright information.
 * It is designed to be used at the bottom of every page.
 */
const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center">
          {/* Technology Partners */}
          <div className="text-center sm:text-left mb-2 sm:mb-0">
            
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-bold text-gray-700">I.T Partners:</span>
              <span className="text-primary-600 font-bold"> Codingbull Technovations PVT LTD</span>
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center sm:text-right">
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} PhysioWay. All rights reserved.</p>
            <p className="text-sm text-gray-500 mt-1 flex items-center justify-center sm:justify-end">
              <a href="mailto:contact@physioway.com" className="hover:text-primary-600 transition-colors">
                contact@physioway.com
              </a>
              <span className="mx-2">|</span>
              <a href="tel:+916353202177" className="hover:text-primary-600 transition-colors">
                +91 6353202177
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
