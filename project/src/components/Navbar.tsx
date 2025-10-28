import { User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface NavbarProps {
  isAdmin?: boolean;
}

export default function Navbar({ isAdmin = false }: NavbarProps) {
  const navigate = useNavigate();
  const { userName } = useUser();

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Navigate to login page
    navigate('/login');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 right-0 left-72 h-16 z-50 ${
        isAdmin 
          ? 'bg-cream-bg border-b border-light-accent' 
          : 'bg-cream-bg border-b border-light-accent'
      } shadow-soft`}
    >
      <div className="h-full px-8 flex items-center justify-between">
        {/* Left Section - Welcome Message */}
        <div>
          <h2 className={`text-xl font-semibold ${
            isAdmin ? 'text-dark-primary' : 'text-dark-primary'
          }`}>
            {isAdmin ? 'Admin Panel' : `Welcome back, ${userName}`}
          </h2>
          <p className={`text-sm ${
            isAdmin ? 'text-medium-gray' : 'text-medium-gray'
          }`}>
            {isAdmin ? 'Manage your education platform' : 'Ready to learn something new today?'}
          </p>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4">

          {/* User Profile with Logout */}
          <motion.div
            whileHover={{ scale: 1.02 }}
        className={`flex items-center gap-3 px-4 py-2 rounded-button transition-all duration-300 ${
          isAdmin 
            ? 'bg-warm-brown/10 border border-warm-brown/20' 
            : 'bg-warm-brown/10 border border-warm-brown/20'
        }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isAdmin 
                ? 'bg-warm-brown' 
                : 'bg-warm-brown'
            }`}>
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${
                isAdmin ? 'text-dark-primary' : 'text-dark-primary'
              }`}>
                {isAdmin ? 'Admin' : userName}
              </span>
              <span className={`text-xs ${
                isAdmin ? 'text-medium-gray' : 'text-medium-gray'
              }`}>
                {isAdmin ? 'Administrator' : 'Graduate Student'}
              </span>
            </div>
            
            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isAdmin 
                  ? 'bg-error/10 hover:bg-error/20 text-error' 
                  : 'bg-error/10 hover:bg-error/20 text-error'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
