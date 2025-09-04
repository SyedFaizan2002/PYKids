import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { shouldEnableAnimations, getAnimationVariants } from '../utils/animationUtils';
import { pageVariants, reducedMotionVariants } from '../utils/animationVariants';

interface OptimizedAnimatePresenceProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
  initial?: boolean;
  exitBeforeEnter?: boolean;
  custom?: any;
  onExitComplete?: () => void;
}

/**
 * Optimized AnimatePresence wrapper that handles performance considerations
 * and accessibility preferences automatically
 */
const OptimizedAnimatePresence: React.FC<OptimizedAnimatePresenceProps> = ({
  children,
  mode = 'wait',
  initial = true,
  exitBeforeEnter = false,
  custom,
  onExitComplete,
}) => {
  const animationsEnabled = shouldEnableAnimations();
  
  // If animations are disabled, render children without AnimatePresence
  if (!animationsEnabled) {
    return <>{children}</>;
  }
  
  return (
    <AnimatePresence
      mode={mode}
      initial={initial}
      onExitComplete={onExitComplete}
    >
      {children}
    </AnimatePresence>
  );
};

export default OptimizedAnimatePresence;

/**
 * Optimized page transition wrapper
 */
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  custom?: any;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  custom,
}) => {
  const variants = getAnimationVariants(pageVariants, reducedMotionVariants);
  
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      custom={custom}
      style={{
        // GPU acceleration
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Optimized stagger container for animating lists
 */
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  duration = 0.4,
}) => {
  const containerVariants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration,
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };
  
  const reducedVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
  };
  
  const variants = getAnimationVariants(containerVariants, reducedVariants);
  
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

/**
 * Optimized stagger item for use within StaggerContainer
 */
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  index = 0,
}) => {
  const itemVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };
  
  const reducedVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
  };
  
  const variants = getAnimationVariants(itemVariants, reducedVariants);
  
  return (
    <motion.div
      className={className}
      variants={variants}
      custom={index}
    >
      {children}
    </motion.div>
  );
};