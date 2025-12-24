import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { navigationConfig } from '../../config/navigationConfig';

const Sidebar = ({ userRole = 'therapist' }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Use the navigation config from the centralized configuration
  const navItems = navigationConfig[userRole] || [];

  // Get role-specific accent color
  const getRoleAccent = () => {
    switch (userRole) {
      case 'admin':
        return { gradient: 'from-red-500 to-orange-500', text: 'text-red-400', bg: 'bg-red-500/20' };
      case 'doctor':
        return { gradient: 'from-purple-500 to-indigo-500', text: 'text-purple-400', bg: 'bg-purple-500/20' };
      case 'patient':
        return { gradient: 'from-green-500 to-teal-500', text: 'text-green-400', bg: 'bg-green-500/20' };
      default:
        return { gradient: 'from-primary-500 to-secondary-500', text: 'text-primary-400', bg: 'bg-primary-500/20' };
    }
  };

  const roleAccent = getRoleAccent();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="fixed inset-y-0 left-0 flex flex-col w-64 z-30">
        {/* Modern gradient sidebar */}
        <div className="flex flex-col h-screen" style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)' }}>
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${roleAccent.gradient} shadow-lg`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">PhysioWay</h1>
              <p className="text-xs text-gray-400 capitalize">{userRole} Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto py-4">
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${roleAccent.bg} text-white border-l-4 border-primary-400`
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <svg
                      className={`flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                        isActive ? roleAccent.text : 'text-gray-400 group-hover:text-gray-300'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="font-medium text-sm">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="flex-shrink-0 border-t border-white/10 p-4">
            <Link 
              to={userRole === 'therapist' ? '/therapist/profile' : '/profile'} 
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/5 group"
            >
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${roleAccent.gradient} flex items-center justify-center text-white font-semibold shadow-lg`}>
                {userRole === 'admin'
                  ? 'RD'
                  : (user?.first_name && user?.last_name
                    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                    : (user?.first_name?.charAt(0) || user?.firstName?.charAt(0) || 'U'))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-primary-300 transition-colors">
                  {userRole === 'admin'
                    ? 'Rajavi Dixit'
                    : (user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : (user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'User Profile'))}
                </p>
                <p className="text-xs text-gray-400 capitalize">{userRole}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;