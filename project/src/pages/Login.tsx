import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        setError('Please fill in all fields');
        setIsEmailLoading(false);
        return;
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsEmailLoading(false);
        return;
      }

      // Use Firebase Auth for email/password login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine user role based on email
      const userRole = (email === 'admin@example.com' || email === 'aiedustudents@gmail.com') ? 'admin' : 'student';
      const userName = (email === 'admin@example.com' || email === 'aiedustudents@gmail.com') ? 'Admin User' : 'Graduate Student';

      // Store user data in localStorage
      localStorage.setItem('authToken', await user.getIdToken() || 'firebase-token');
      localStorage.setItem('userData', JSON.stringify({
        email: user.email,
        name: userName,
        role: userRole,
        rememberMe: rememberMe
      }));

      // Navigate based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
        setError('Invalid email or password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      // Use Firebase Google Auth
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Determine user role (you can customize this logic)
      const userRole = user.email === 'admin@example.com' || user.email === 'aiedustudents@gmail.com' ? 'admin' : 'student';
      const userName = user.displayName || user.email?.split('@')[0] || 'User';

      // Store user data in localStorage
      localStorage.setItem('authToken', await user.getIdToken() || 'firebase-google-token');
      localStorage.setItem('userData', JSON.stringify({
        email: user.email,
        name: userName,
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
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
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

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card-bg rounded-card shadow-card p-8 relative">
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
              AI For Graduates
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

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                      required
                      disabled={isEmailLoading || isGoogleLoading}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-button text-text-primary placeholder-text-secondary focus:outline-none focus:border-warm-brown focus:ring-2 focus:ring-warm-brown/20 transition-colors"
                      required
                      disabled={isEmailLoading || isGoogleLoading}
                    />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isEmailLoading || isGoogleLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-warm-brown border-gray-300 rounded focus:ring-warm-brown/20 focus:ring-2"
                      disabled={isEmailLoading || isGoogleLoading}
                    />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-warm-brown hover:text-warm-brown/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

             {/* Sign In Button */}
             <motion.button
               whileHover={!isEmailLoading ? { scale: 1.02 } : {}}
               whileTap={!isEmailLoading ? { scale: 0.98 } : {}}
               type="submit"
               disabled={isEmailLoading || isGoogleLoading}
               className={`w-full font-medium py-3 px-6 rounded-button flex items-center justify-center gap-2 shadow-card transition-all duration-300 ${
                 isEmailLoading || isGoogleLoading
                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                   : 'bg-warm-brown text-white hover:shadow-hover'
               }`}
             >
               {isEmailLoading ? (
                 <>
                   <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                   Signing In...
                 </>
               ) : (
                 <>
                   Sign In
                   <ArrowRight className="w-5 h-5" />
                 </>
               )}
               </motion.button>
            </motion.form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="px-4 text-sm text-text-secondary">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google Sign In Button */}
            <motion.button
              whileHover={!isGoogleLoading ? { scale: 1.02 } : {}}
              whileTap={!isGoogleLoading ? { scale: 0.98 } : {}}
              onClick={handleGoogleSignIn}
              disabled={isEmailLoading || isGoogleLoading}
              className={`w-full font-medium py-3 px-6 rounded-button flex items-center justify-center gap-3 border transition-all duration-300 ${
                isGoogleLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300' 
                  : 'bg-white border-gray-200 text-text-primary hover:bg-gray-50 hover:shadow-card'
              }`}
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </motion.button>

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6"
            >
              <p className="text-text-secondary">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-warm-brown hover:text-warm-brown/80 font-medium transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </motion.div>
        </div>
      </motion.div>
    </div>
  );
}