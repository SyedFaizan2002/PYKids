import React from 'react';
import { motion } from 'framer-motion';

interface ProgressCardProps {
  title: string;
  value: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  className?: string;
}

const ProgressCard: React.FC<ProgressCardProps> = React.memo(({
  title,
  value,
  percentage,
  icon,
  color,
  className = ''
}) => {
  return (
    <motion.div
      className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-custom border border-white/10 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-full flex items-center justify-center`}>
          {icon}
        </div>
        <motion.div 
          className="text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-2xl font-bold text-white">{percentage}%</div>
        </motion.div>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-purple-200 text-sm mb-4">{value}</p>
      
      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`bg-gradient-to-r ${color} h-2 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 1.5, 
            delay: 0.5, 
            type: "spring", 
            stiffness: 100, 
            damping: 15 
          }}
        />
      </div>
    </motion.div>
  );
});

ProgressCard.displayName = 'ProgressCard';

export default ProgressCard;