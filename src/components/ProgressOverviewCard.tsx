import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Target } from 'lucide-react';

interface ProgressOverviewCardProps {
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  className?: string;
}

const ProgressOverviewCard: React.FC<ProgressOverviewCardProps> = React.memo(({
  totalLessons,
  completedLessons,
  completionPercentage,
  className = ''
}) => {
  const remainingLessons = totalLessons - completedLessons;

  return (
    <motion.div
      className={`bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm rounded-3xl p-8 shadow-custom border border-purple-400/30 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="text-center mb-6">
        <motion.h2 
          className="text-3xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Your Learning Progress
        </motion.h2>
        <p className="text-purple-200">Keep up the great work! 🚀</p>
      </div>

      {/* Main Progress Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-400/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Trophy className="w-8 h-8 text-green-400" />
          </motion.div>
          <motion.div 
            className="text-3xl font-bold text-white"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {completedLessons}
          </motion.div>
          <div className="text-green-200 text-sm">Completed</div>
        </motion.div>

        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-400/30"
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Target className="w-8 h-8 text-blue-400" />
          </motion.div>
          <motion.div 
            className="text-3xl font-bold text-white"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            {remainingLessons}
          </motion.div>
          <div className="text-blue-200 text-sm">Remaining</div>
        </motion.div>

        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-purple-400/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <BookOpen className="w-8 h-8 text-purple-400" />
          </motion.div>
          <motion.div 
            className="text-3xl font-bold text-white"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            {totalLessons}
          </motion.div>
          <div className="text-purple-200 text-sm">Total</div>
        </motion.div>
      </div>

      {/* Progress Bar Section */}
      <motion.div 
        className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-purple-200 font-medium">Overall Progress</span>
          <motion.span 
            className="text-white font-bold text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {completionPercentage}%
          </motion.span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-4 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ 
                duration: 1.5, 
                delay: 0.8, 
                type: "spring", 
                stiffness: 100, 
                damping: 15 
              }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
          
          {/* Milestone indicators */}
          <div className="absolute top-0 w-full h-4 flex justify-between items-center">
            {[25, 50, 75].map((milestone) => (
              <motion.div
                key={milestone}
                className={`w-2 h-6 rounded-full border-2 ${
                  completionPercentage >= milestone 
                    ? 'bg-yellow-400 border-yellow-300' 
                    : 'bg-white/20 border-white/40'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + (milestone / 100), type: "spring" }}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
        </div>
        
        {/* Milestone labels */}
        <div className="flex justify-between mt-2 text-xs text-purple-200">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </motion.div>

      {/* Completion Status Display */}
      <motion.div 
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        {completionPercentage === 100 ? (
          <motion.div
            className="text-green-400 font-bold text-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🎉 Congratulations! You've completed all lessons! 🎉
          </motion.div>
        ) : completionPercentage >= 75 ? (
          <div className="text-yellow-400 font-medium">
            🔥 Almost there! You're doing amazing!
          </div>
        ) : completionPercentage >= 50 ? (
          <div className="text-blue-400 font-medium">
            💪 Great progress! Keep it up!
          </div>
        ) : completionPercentage >= 25 ? (
          <div className="text-purple-400 font-medium">
            🚀 You're off to a great start!
          </div>
        ) : (
          <div className="text-purple-200 font-medium">
            ✨ Begin your coding journey!
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

ProgressOverviewCard.displayName = 'ProgressOverviewCard';

export default ProgressOverviewCard;