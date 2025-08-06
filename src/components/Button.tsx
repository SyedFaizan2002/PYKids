import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseClasses = 'rounded-full font-bold transition-all duration-300 shadow-custom border-2 relative overflow-hidden';
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-glow',
    secondary: 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400 text-white hover:from-blue-600 hover:to-cyan-600 hover:shadow-glow-blue',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 text-white hover:from-green-600 hover:to-emerald-600 hover:shadow-glow-green',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 border-red-400 text-white hover:from-red-600 hover:to-pink-600 hover:shadow-glow-pink'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      whileHover={disabled ? {} : { 
        scale: 1.05,
        boxShadow: variant === 'primary' ? '0 0 25px rgba(168, 85, 247, 0.4), 0 10px 30px -5px rgba(0, 0, 0, 0.2)' :
                   variant === 'secondary' ? '0 0 25px rgba(59, 130, 246, 0.4), 0 10px 30px -5px rgba(0, 0, 0, 0.2)' :
                   variant === 'success' ? '0 0 25px rgba(34, 197, 94, 0.4), 0 10px 30px -5px rgba(0, 0, 0, 0.2)' :
                   '0 0 25px rgba(236, 72, 153, 0.4), 0 10px 30px -5px rgba(0, 0, 0, 0.2)'
      }}
      whileTap={disabled ? {} : { 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      disabled={disabled}
      initial={{ scale: 1 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <motion.div
        className="absolute inset-0 bg-white opacity-0 rounded-full"
        whileHover={disabled ? {} : { opacity: 0.1 }}
        transition={{ duration: 0.3 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export default Button;