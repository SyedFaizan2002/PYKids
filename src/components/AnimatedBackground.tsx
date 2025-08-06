import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  variant?: 'landing' | 'auth' | 'dashboard';
}

function AnimatedBackground({ variant = 'landing' }: AnimatedBackgroundProps) {
  const particles = Array.from({ length: 25 }, (_, i) => i);

  const backgroundVariants = {
    landing: 'from-purple-900 via-blue-900 to-indigo-900',
    auth: 'from-pink-900 via-purple-900 to-indigo-900',
    dashboard: 'from-indigo-900 via-purple-900 to-pink-900'
  };

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${backgroundVariants[variant]}`}>
      {particles.map((particle) => {
        const size = Math.random() * 4 + 2; // 2-6px
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;
        const moveRange = Math.random() * 150 + 50; // 50-200px movement
        
        return (
          <motion.div
            key={particle}
            className="absolute bg-white rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${initialX}%`,
              top: `${initialY}%`,
            }}
            animate={{
              x: [0, moveRange * (Math.random() - 0.5), 0],
              y: [0, moveRange * (Math.random() - 0.5), 0],
              scale: [1, Math.random() * 0.8 + 0.6, 1],
              opacity: [0.1, Math.random() * 0.4 + 0.2, 0.1],
            }}
            transition={{
              duration: Math.random() * 4 + 3, // 3-7 seconds
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: Math.random() * 2, // 0-2 second delay
            }}
          />
        );
      })}
      
      {/* Additional floating elements for more dynamic feel */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`float-${i}`}
          className="absolute text-white/10 text-4xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 6 + 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 3,
          }}
        >
          {['✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
    </div>
  );
}

export default AnimatedBackground;