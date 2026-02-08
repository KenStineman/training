import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import config from '../../config';

const navItems = [
  { path: '/admin', label: 'Dashboard', exact: true },
  { path: '/admin/courses', label: 'Courses' },
];

export function AdminLayout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Header */}
      <header className="bg-helix-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/admin" className="flex items-center space-x-3">
              <span className="font-display font-semibold text-xl">
                {config.appName}
              </span>
              <span className="text-helix-accent text-sm font-medium px-2 py-0.5 
                              bg-white/10 rounded">
                Admin
              </span>
            </Link>

            {/* User Menu */}
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-white/80">
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors
                    ${isActive(item.path, item.exact)
                      ? 'border-white text-white'
                      : 'border-transparent text-white/70 hover:text-white hover:border-white/50'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} {config.companyName}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AdminLayout;
