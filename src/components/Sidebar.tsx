import { Home, BookOpen, Brain, Briefcase, Newspaper, MessageCircle, User, LayoutDashboard, Briefcase as BriefcaseIcon, Users, ArrowLeft, Settings, Zap, Code, Target, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SidebarProps {
  isAdmin?: boolean;
}

const studentMenuItems = [
  { icon: Home, label: 'Home Dashboard', path: '/' },
  { icon: Zap, label: 'Prompt Engineering', path: '/prompt-engineering' },
  { icon: Code, label: 'Vibe Coding', path: '/vibe-coding' },
  { icon: BookOpen, label: 'Courses Hub', path: '/courses' },
  { icon: Brain, label: 'AI Learning Tools', path: '/ai-tools' },
  { icon: Briefcase, label: 'Career Booster', path: '/career' },
  { icon: Newspaper, label: 'AI Digest Feed', path: '/digest' },
  { icon: MessageCircle, label: 'Ask AI Mentor', path: '/mentor' },
  { icon: Brain, label: '🧠 Emotional Wellness Corner', path: '/wellness' },
  { icon: Sparkles, label: '🎨 AI Artist Corner', path: '/ai-artist-corner' },
  { icon: User, label: 'Profile & Progress', path: '/profile' },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard Overview', path: '/admin' },
  { icon: BookOpen, label: 'Manage Courses', path: '/admin/courses' },
  { icon: Zap, label: 'Manage Prompt Engineering', path: '/admin/prompt-engineering' },
  { icon: Target, label: 'Simulator Tasks', path: '/admin/simulator-tasks' },
  { icon: Code, label: 'Manage Vibe Coding', path: '/admin/vibe-coding' },
  { icon: Newspaper, label: 'Post AI News', path: '/admin/news' },
  { icon: BriefcaseIcon, label: 'Post Jobs/Internships', path: '/admin/jobs' },
  { icon: Brain, label: 'Manage AI Tools', path: '/admin/ai-tools' },
  { icon: Brain, label: '🧠 Manage Wellness Corner', path: '/admin/wellness' },
  { icon: Sparkles, label: '🎨 Manage Artist Corner', path: '/admin/ai-artist-corner' },
  { icon: Users, label: 'View Student Progress', path: '/admin/students' },
];

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const location = useLocation();
  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;
  
  // Check if current user is admin
  const isAdminUser = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      const isAdmin = user.role === 'admin' || user.email === 'admin@example.com' || user.email === 'aiedustudents@gmail.com';
      console.log('Admin check:', { user, isAdmin, isAdminProp: isAdmin });
      return isAdmin;
    }
    return false;
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed left-0 top-0 h-screen w-72 bg-cream-bg border-r border-light-accent shadow-xl flex flex-col`}
    >
      {/* Top fixed: Logo + admin panel controls */}
      <div className="p-6 pb-0 flex-none">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-12 h-12 bg-warm-brown rounded-xl flex items-center justify-center border border-warm-brown/30">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-primary">AI EDU</h1>
            <p className="text-sm text-medium-gray font-semibold">{isAdmin ? 'Admin Panel' : 'For Graduates'}</p>
          </div>
        </motion.div>

        {/* Back to Student Dashboard Button for Admin */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-3 bg-warm-brown rounded-button text-white font-medium flex items-center gap-2 shadow-card hover:shadow-hover transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Students Dashboard
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Admin Panel Button for Admin User in Student View */}
        {!isAdmin && isAdminUser() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Link to="/admin">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-3 bg-warm-brown rounded-button text-white font-medium flex items-center gap-2 shadow-card hover:shadow-hover transition-all duration-300"
              >
                <Settings className="w-5 h-5" />
                Admin Panel
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
      {/* Scrollable navigation menu BELOW (flex-1, overflow-y-auto) */}
      <nav className="space-y-1 mt-6 flex-1 overflow-y-auto custom-scrollbar px-6 pb-8">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index + 0.4 }}
            >
              <Link to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-button transition-all duration-300 ${
                    isActive
                      ? 'bg-warm-brown/20 border border-warm-brown/40'
                      : 'hover:bg-light-accent/20 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive ? 'text-warm-brown' : 'text-medium-gray'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isActive ? 'text-dark-primary' : 'text-medium-gray'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.div>
  );
}
