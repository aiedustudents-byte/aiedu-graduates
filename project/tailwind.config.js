/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // New Color Palette
        'dark-primary': '#252323',      // Dark text/headers
        'medium-gray': '#000000',       // Secondary text
        'cream-bg': '#f5f1ed',          // Main background
        'light-accent': '#dad2bc',      // Light accent/borders
        'warm-brown': '#780606',        // Primary accent/buttons
        
        // Legacy colors (keeping for compatibility)
        'primary-bg': '#f5f1ed',
        'primary-accent': '#780606',
        'secondary-accent': '#dad2bc',
        'card-bg': '#f5f1ed',
        'text-primary': '#252323',
        'text-secondary': '#000000',
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
        
        // Sidebar Colors
        'sidebar-bg-start': '#252323',
        'sidebar-bg-end': '#70798c',
        'sidebar-active': '#780606',
        
        // Button Colors
        'btn-primary-start': '#780606',
        'btn-primary-end': '#dad2bc',
        'btn-secondary': '#dad2bc',
        
        // Admin Theme Colors
        'admin-bg': '#f5f1ed',
        'admin-sidebar': '#252323',
        'admin-accent': '#780606',
      },
      fontFamily: {
        'sans': ['Times New Roman', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'card': '20px',
        'button': '12px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};
