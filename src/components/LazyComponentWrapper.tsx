import React, { Suspense } from 'react';
import { motion } from 'framer-motion';

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Loading spinner component for lazy loading fallback
const LoadingSpinner: React.FC = () => (
  <motion.div
    className="flex items-center justify-center p-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <span className="ml-3 text-purple-200">Loading...</span>
  </motion.div>
);

// Wrapper component for lazy-loaded components with proper Suspense fallbacks
const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

export default LazyComponentWrapper;
export { LoadingSpinner };