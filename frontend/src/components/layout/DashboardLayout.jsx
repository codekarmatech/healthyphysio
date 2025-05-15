import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

/**
 * DashboardLayout component
 *
 * This component provides a consistent layout for all dashboard pages,
 * including the header, sidebar, and footer.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render in the main area
 * @param {string} props.title - Page title to display in the header
 */
const DashboardLayout = ({ children, title }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'therapist';
  const userName = user?.firstName || '';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile */}
        <Sidebar userRole={userRole} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Header - fixed at top */}
          <div className="sticky top-0 z-10">
            <Header title={title} userName={userName} />
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="py-4 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>

          {/* Footer - always visible */}
          <div className="sticky bottom-0 z-10">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
