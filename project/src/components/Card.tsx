import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  variant?: 'default' | 'premium' | 'glass';
}

export default function Card({ 
  children, 
  className = '', 
  hover = true, 
  gradient = false,
  variant = 'default'
}: CardProps) {
  const getCardStyles = () => {
    switch (variant) {
      case 'premium':
        return 'bg-cream-bg border border-light-accent/50 shadow-card hover:shadow-hover';
      case 'glass':
        return 'glass-effect shadow-card hover:shadow-hover';
      default:
        return 'bg-card-bg border border-light-accent/30 shadow-card hover:shadow-hover';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      } : {}}
      className={`relative ${className}`}
    >
      <div
        className={`relative rounded-card p-6 transition-all duration-300 ${getCardStyles()} ${
          hover ? 'hover-lift' : ''
        }`}
      >
        {children}
        {gradient && (
          <div className="absolute inset-0 rounded-card bg-warm-brown/5 pointer-events-none" />
        )}
      </div>
    </motion.div>
  );
}
