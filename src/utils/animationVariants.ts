/**
 * Optimized animation variants for Framer Motion
 * These variants are designed for smooth performance and reduced jank
 */

// Page transition variants with optimized performance
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth feel
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Optimized card animations with reduced motion for better performance
export const cardVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Button animations optimized for responsiveness
export const buttonVariants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.5,
    transition: {
      duration: 0.2,
    },
  },
};

// Avatar animations with reduced frequency for better performance
export const avatarVariants = {
  initial: {
    scale: 1,
    rotate: 0,
  },
  animate: {
    scale: [1, 1.05, 1],
    rotate: [0, 2, -2, 0],
    transition: {
      duration: 4, // Increased duration to reduce frequency
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Progress bar animations with smooth easing
export const progressVariants = {
  initial: {
    width: 0,
    opacity: 0,
  },
  animate: (progress: number) => ({
    width: `${progress}%`,
    opacity: 1,
    transition: {
      width: {
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
      opacity: {
        duration: 0.3,
      },
    },
  }),
};

// Celebration animation with controlled particle count for performance
export const celebrationVariants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

// Optimized particle animation for celebration
export const particleVariants = {
  initial: {
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
  },
  animate: (i: number) => ({
    x: (Math.random() - 0.5) * 150, // Reduced range for better performance
    y: (Math.random() - 0.5) * 150,
    rotate: Math.random() * 180,
    scale: 0,
    opacity: 0,
    transition: {
      duration: 1.2,
      ease: "easeOut",
      delay: i * 0.05, // Reduced delay for faster animation
    },
  }),
};

// Navigation transition variants
export const navigationVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Content section variants with staggered children
export const contentVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Individual content item variants
export const contentItemVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

// Lesson item variants for dashboard
export const lessonItemVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      delay: index * 0.05, // Reduced delay for faster loading
      ease: "easeOut",
      type: "spring",
      stiffness: 200,
    },
  }),
  hover: {
    scale: 1.02,
    x: 5,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

// Module progress variants
export const moduleVariants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: index * 0.15, // Reduced delay
      type: "spring",
      stiffness: 100,
    },
  }),
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

// Optimized glow animation with reduced intensity
export const glowVariants = {
  initial: {
    boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
  },
  animate: {
    boxShadow: [
      "0 0 20px rgba(168, 85, 247, 0.3)",
      "0 0 30px rgba(168, 85, 247, 0.4)",
      "0 0 20px rgba(168, 85, 247, 0.3)",
    ],
    transition: {
      duration: 3, // Increased duration to reduce frequency
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Performance-optimized spring configuration
export const springConfig = {
  type: "spring" as const,
  stiffness: 100,
  damping: 15,
  mass: 1,
};

// Reduced motion variants for accessibility
export const reducedMotionVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};