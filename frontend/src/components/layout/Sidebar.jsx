import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { navigationConfig } from '../../config/navigationConfig';

const Sidebar = ({ userRole = 'therapist' }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Use the navigation config from the centralized configuration
  const navItems = navigationConfig[userRole] || [];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="fixed inset-y-0 left-0 flex flex-col w-56">
        <div className="flex flex-col h-screen bg-gray-800">
          <div className="flex items-center flex-shrink-0 px-4 h-16">
            <h1 className="text-xl font-bold text-white">PhysioWay</h1>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <svg
                      className={`${
                        isActive ? 'text-primary-400' : 'text-gray-400 group-hover:text-gray-300'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4 mt-auto">
            <Link to={userRole === 'therapist' ? '/therapist/profile' : '/profile'} className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-200 font-semibold">
                    {userRole === 'admin'
                      ? 'RD'
                      : (user?.first_name && user?.last_name
                        ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                        : (user?.first_name?.charAt(0) || user?.firstName?.charAt(0) || 'U'))}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-300 group-hover:text-white">
                    {userRole === 'admin'
                      ? 'Rajavi Dixit'
                      : (user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : (user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : 'User Profile'))}
                  </p>
                  <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300 capitalize">
                    {userRole}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;