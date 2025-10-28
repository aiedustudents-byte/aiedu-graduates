import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, User, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // Password validation
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Determine user role based on email
      const userRole = (formData.email === 'admin@example.com' || formData.email === 'aiedustudents@gmail.com') ? 'admin' : 'student';

      // Store user data in localStorage
      localStorage.setItem('authToken', await user.getIdToken() || 'firebase-token');
      localStorage.setItem('userData', JSON.stringify({
        email: user.email,
        name: formData.name,
        role: userRole,
        rememberMe: false
      }));

      // Navigate based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please try logging in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Account creation failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-10 w-8 h-8 text-warm-brown/20"
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-20 w-6 h-6 text-secondary-accent/20"
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-20 w-10 h-10 text-warning/20"
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
      </div>

      {/* Signup Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card-bg rounded-card shadow-card p-8 relative">
          {/* Back to Login Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.02, x: -4 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </motion.button>
            </Link>
          </motion.div>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <div className="w-8 h-8 bg-warm-brown rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">AI EDU APP</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-text-primary mb-2"
            >
              Create Account
            </motion.h1>
            
            <div className="w-16 h-1 bg-warm-brown rounded-full mx-auto"></div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
              <span className="text-sm text-error">{error}</span>
            </motion.div>
          )}

          {/* Signup Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Name Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <User className="w-4 h-4 text-warm-brown" />
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-text-secondary" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Mail className="w-4 h-4 text-warm-brown" />
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-secondary" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Lock className="w-4 h-4 text-warm-brown" />
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-secondary" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/20 transition-colors"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Lock className="w-4 h-4 text-warm-brown" />
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-secondary" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/20 transition-colors"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <motion.button
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isLoading}
              className={`w-full font-medium py-3 px-6 rounded-button flex items-center justify-center gap-2 shadow-card transition-all duration-300 ${
                isLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                   : 'bg-warm-brown text-white hover:shadow-hover'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-warm-brown hover:text-warm-brown/80 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
