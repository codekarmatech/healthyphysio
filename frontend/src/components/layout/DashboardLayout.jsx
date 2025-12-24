import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import DashboardFooter from './DashboardFooter';
import '../../styles/dashboard.css';

/**
 * DashboardLayout component
 *
 * This component provides a consistent layout for all pages in the application,
 * including the header, sidebar, and footer.
 * 
 * Features:
 * - Modern gradient background
 * - Glassmorphism effects
 * - Proper footer placement with min-height content area
 * - Blue & Orange theme
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render in the main area
 * @param {string} props.title - Page title to display in the header
 * @param {boolean} props.hideSidebar - Whether to hide the sidebar (default: false)
 * @param {boolean} props.hideFooter - Whether to hide the footer (default: false)
 * @param {string} props.mainClassName - Additional classes for the main content area
 */
const DashboardLayout = ({
  children,
  title,
  hideSidebar = false,
  hideFooter = false,
  mainClassName = ''
}) => {
  const { user } = useAuth();
  const userRole = user?.role || 'therapist';
  const userName = user?.firstName || '';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile or when hideSidebar is true */}
        {!hideSidebar && <Sidebar userRole={userRole} />}

        {/* Main content area */}
        <div className={`flex-1 flex flex-col ${hideSidebar ? 'w-full' : 'md:ml-64'}`}>
          {/* Header - sticky at top with glassmorphism */}
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
            <Header title={title} userName={userName} />
          </div>

          {/* Main content - with minimum height to push footer down */}
          <main className={`flex-1 ${mainClassName}`}>
            <div className="min-h-[calc(100vh-16rem)] py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>

          {/* Footer - always at bottom with proper spacing */}
          {!hideFooter && (
            <footer className="mt-auto border-t border-gray-200/60 bg-white/60 backdrop-blur-sm">
              <DashboardFooter />
            </footer>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
